import { getUserEmail, getUserUuid } from "@/services/user";
import { respData, respErr } from "@/lib/resp";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { getSnowId } from "@/lib/hash";
import Stripe from "stripe";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_PRIVATE_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

export async function POST(req: Request) {
  console.log("Stripe Checkout API called");
  try {
    let {
      credits,
      currency,
      amount,
      interval,
      product_id,
      product_name,
      valid_months,
      price_id, // Optional: actual Stripe price ID
    } = await req.json();

    console.log("Stripe checkout params:", { product_id, amount, currency, interval, price_id });

    if (!process.env.STRIPE_PRIVATE_KEY) {
      console.error("Missing STRIPE_PRIVATE_KEY");
      return respErr("Server configuration error: Missing Stripe API Key");
    }

    if (!amount || !product_id) {
      return respErr("invalid params");
    }

    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respErr("no auth, please sign-in", 401);
    }

    let user_email = await getUserEmail();
    if (!user_email) {
      return respErr("invalid user");
    }

    // Get the actual Convex user ID by email
    const convexUser = await convex.query(api.users.getByEmail, { email: user_email });
    if (!convexUser) {
      return respErr("User not found in database. Please refresh and try again.");
    }
    const convex_user_id = convexUser._id;

    const order_no = getSnowId();
    const is_subscription = interval === "month" || interval === "year";

    // Calculate expiration date
    const currentDate = new Date();
    let expired_at = "";

    if (valid_months) {
      const timePeriod = new Date(currentDate);
      timePeriod.setMonth(currentDate.getMonth() + valid_months);

      const timePeriodMillis = timePeriod.getTime();
      let delayTimeMillis = 0;

      if (is_subscription) {
        delayTimeMillis = 24 * 60 * 60 * 1000; // delay 24 hours expired
      }

      const newTimeMillis = timePeriodMillis + delayTimeMillis;
      const newDate = new Date(newTimeMillis);
      expired_at = newDate.toISOString();
    }

    // Create Order in Convex first
    console.log("Creating order in Convex for Stripe payment...");
    await convex.mutation(api.orders.createOrder, {
      order_no: order_no,
      user_id: convex_user_id,
      user_email: user_email,
      amount: amount,
      currency: currency || "usd",
      credits: credits,
      status: "pending",
      product_id: product_id,
      product_name: product_name,
      expired_at: expired_at || undefined,
      sub_interval: is_subscription ? interval : undefined,
      payment_method: "card",
    });
    console.log("Order created in Convex for Stripe payment");

    // Build success/cancel URLs
    const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || "https://www.lovexai.studio";
    const successUrl = `${baseUrl}/pay-success?order_no=${order_no}&method=stripe&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/pricing?payment=canceled`;

    // Create Stripe Checkout Session
    let sessionParams: Stripe.Checkout.SessionCreateParams;

    if (is_subscription && price_id) {
      // Subscription with existing Stripe price
      sessionParams = {
        mode: "subscription",
        customer_email: user_email,
        line_items: [
          {
            price: price_id,
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          order_no: order_no,
          user_id: convex_user_id,
          credits: credits.toString(),
          product_id: product_id,
        },
      };
    } else if (price_id) {
      // One-time with existing Stripe price
      sessionParams = {
        mode: "payment",
        customer_email: user_email,
        line_items: [
          {
            price: price_id,
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          order_no: order_no,
          user_id: convex_user_id,
          credits: credits.toString(),
          product_id: product_id,
        },
      };
    } else {
      // Dynamic pricing (no pre-created Stripe price)
      sessionParams = {
        mode: "payment",
        customer_email: user_email,
        line_items: [
          {
            price_data: {
              currency: currency || "usd",
              product_data: {
                name: product_name || `${credits} Credits`,
                description: `LoveXAI ${product_name || "Credits Pack"}`,
              },
              unit_amount: amount, // Amount in cents
            },
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          order_no: order_no,
          user_id: convex_user_id,
          credits: credits.toString(),
          product_id: product_id,
        },
      };
    }

    console.log("Creating Stripe Checkout Session...");
    const session = await stripe.checkout.sessions.create(sessionParams);
    console.log("Stripe Checkout Session created:", session.id);

    // Update order with Stripe session ID
    await convex.mutation(api.orders.updateOrderSession, {
      orderNo: order_no,
      stripeSessionId: session.id,
    });

    return respData({
      payment_url: session.url,
      session_id: session.id,
      order_no: order_no,
    });
  } catch (e: any) {
    console.error("Stripe checkout failed:", e);
    return respErr("Stripe checkout failed: " + e.message);
  }
}
