import { getUserEmail, getUserUuid } from "@/services/user";
import { respData, respErr } from "@/lib/resp";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import Stripe from "stripe";
import { getSnowId } from "@/lib/hash";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: Request) {
  try {
    let {
      credits,
      currency,
      amount,
      interval,
      product_id,
      product_name,
      valid_months,
      cancel_url,
    } = await req.json();

    if (!cancel_url) {
      cancel_url = `${
        process.env.NEXT_PUBLIC_PAY_CANCEL_URL ||
        process.env.NEXT_PUBLIC_WEB_URL
      }`;
    }

    if (!amount || !interval || !currency || !product_id) {
      return respErr("invalid params");
    }

    if (!["year", "month", "one-time"].includes(interval)) {
      return respErr("invalid interval");
    }

    const is_subscription = interval === "month" || interval === "year";

    if (interval === "year" && valid_months !== 12) {
      return respErr("invalid valid_months");
    }

    if (interval === "month" && valid_months !== 1) {
      return respErr("invalid valid_months");
    }

    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respErr("no auth, please sign-in");
    }

    let user_email = await getUserEmail();
    if (!user_email) {
      return respErr("invalid user");
    }

    const order_no = getSnowId();

    const currentDate = new Date();
    const created_at = currentDate.toISOString();

    let expired_at = "";

    const timePeriod = new Date(currentDate);
    timePeriod.setMonth(currentDate.getMonth() + valid_months);

    const timePeriodMillis = timePeriod.getTime();
    let delayTimeMillis = 0;

    // subscription
    if (is_subscription) {
      delayTimeMillis = 24 * 60 * 60 * 1000; // delay 24 hours expired
    }

    const newTimeMillis = timePeriodMillis + delayTimeMillis;
    const newDate = new Date(newTimeMillis);

    expired_at = newDate.toISOString();

    // Create Order in Convex
    await convex.mutation(api.orders.createOrder, {
      order_no: order_no,
      user_id: user_uuid,
      user_email: user_email,
      amount: amount,
      currency: currency,
      credits: credits,
      status: "created",
      product_id: product_id,
      product_name: product_name,
      expired_at: expired_at,
      sub_interval: is_subscription ? interval : undefined,
    });

    const stripeKey = process.env.STRIPE_PRIVATE_KEY;
    if (!stripeKey) {
      console.error("Missing STRIPE_PRIVATE_KEY");
      return respErr("Server configuration error: Missing Stripe API Key");
    }

    const stripe = new Stripe(stripeKey);

    let options: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: currency,
            product_data: {
              name: product_name,
            },
            unit_amount: amount,
            recurring: is_subscription
              ? {
                  interval: interval,
                }
              : undefined,
          },
          quantity: 1,
        },
      ],
      allow_promotion_codes: true,
      metadata: {
        project: process.env.NEXT_PUBLIC_PROJECT_NAME || "",
        product_name: product_name,
        order_no: order_no.toString(),
        user_email: user_email,
        credits: credits,
        user_uuid: user_uuid,
      },
      mode: is_subscription ? "subscription" : "payment",
      success_url: `${process.env.NEXT_PUBLIC_WEB_URL}/pay-success/{CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url,
    };

    if (user_email) {
      options.customer_email = user_email;
    }

    if (is_subscription) {
      options.subscription_data = {
        metadata: options.metadata,
      };
    }

    if (currency === "cny") {
      options.payment_method_types = ["wechat_pay", "alipay", "card"];
      options.payment_method_options = {
        wechat_pay: {
          client: "web",
        },
        alipay: {},
      };
    }

    const order_detail = JSON.stringify(options);

    const session = await stripe.checkout.sessions.create(options);

    const stripe_session_id = session.id;

    // Update session in Convex
    await convex.mutation(api.orders.updateOrderSession, {
      orderNo: order_no,
      stripeSessionId: stripe_session_id,
    });

    return respData({
      public_key: process.env.STRIPE_PUBLIC_KEY,
      order_no: order_no,
      session_id: stripe_session_id,
    });
  } catch (e: any) {
    console.log("checkout failed: ", e);
    return respErr("checkout failed: " + e.message);
  }
}
