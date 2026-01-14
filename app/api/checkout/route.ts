import { getUserEmail, getUserUuid } from "@/services/user";
import { respData, respErr } from "@/lib/resp";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import Stripe from "stripe";
import { getSnowId } from "@/lib/hash";
import { checkRateLimit, RateLimitPresets } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { z } from "zod";

// Zod schema for checkout request validation
const checkoutSchema = z.object({
  credits: z.number().int().min(0).max(1000000).optional(),
  currency: z.string().min(3).max(3).toLowerCase(),
  amount: z.number().int().min(100).max(100000000), // min $1, max $1M in cents
  interval: z.enum(["year", "month", "one-time"]),
  product_id: z.string().min(1).max(100),
  product_name: z.string().min(1).max(200),
  valid_months: z.number().int().min(1).max(12),
  cancel_url: z.string().url().optional(),
});

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: Request) {
  logger.info("Checkout API called");
  try {
    // Check authentication first
    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respErr("no auth, please sign-in");
    }

    // Rate limit by user
    const rateLimit = checkRateLimit(`checkout:${user_uuid}`, RateLimitPresets.CHECKOUT);
    if (!rateLimit.success) {
      return respErr("Too many checkout requests. Please try again later.");
    }

    // Parse and validate request body with Zod
    const rawBody = await req.json();
    const parseResult = checkoutSchema.safeParse(rawBody);

    if (!parseResult.success) {
      logger.warn("Checkout validation failed", {
        errors: parseResult.error.flatten().fieldErrors,
      });
      return respErr("Invalid request parameters");
    }

    let {
      credits,
      currency,
      amount,
      interval,
      product_id,
      product_name,
      valid_months,
      cancel_url,
    } = parseResult.data;

    logger.debug("Checkout params", { product_id, amount, currency, interval });

    if (!cancel_url) {
      cancel_url = `${
        process.env.NEXT_PUBLIC_PAY_CANCEL_URL ||
        process.env.NEXT_PUBLIC_WEB_URL
      }`;
    }

    const is_subscription = interval === "month" || interval === "year";

    if (interval === "year" && valid_months !== 12) {
      return respErr("invalid valid_months");
    }

    if (interval === "month" && valid_months !== 1) {
      return respErr("invalid valid_months");
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
    logger.debug("Creating order in Convex");
    await convex.mutation(api.orders.createOrder, {
      order_no: order_no,
      user_id: convex_user_id,
      user_email: user_email,
      amount: amount,
      currency: currency,
      credits: credits ?? 0,
      status: "created",
      product_id: product_id,
      product_name: product_name,
      expired_at: expired_at,
      sub_interval: is_subscription ? interval : undefined,
    });
    logger.debug("Order created", { order_no });

    const stripeKey = process.env.STRIPE_PRIVATE_KEY;
    if (!stripeKey) {
      logger.error("Missing STRIPE_PRIVATE_KEY");
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
                  interval_count: 1,
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
        credits: String(credits ?? 0),
        user_uuid: user_uuid,
      },
      mode: is_subscription ? "subscription" : "payment",
      success_url: `${process.env.NEXT_PUBLIC_WEB_URL || "http://localhost:3000"}/pay-success/{CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url.startsWith("http") ? cancel_url : `${process.env.NEXT_PUBLIC_WEB_URL || "http://localhost:3000"}${cancel_url}`,
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

    logger.debug("Creating Stripe session");
    const session = await stripe.checkout.sessions.create(options);
    logger.debug("Stripe session created", { sessionId: session.id });

    const stripe_session_id = session.id;

    // Update session in Convex
    await convex.mutation(api.orders.updateOrderSession, {
      orderNo: order_no,
      stripeSessionId: stripe_session_id,
    });

    return respData({
      public_key: process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY,
      order_no: order_no,
      session_id: stripe_session_id,
    });
  } catch (e: any) {
    logger.error("Checkout failed", e);
    return respErr("checkout failed: " + e.message);
  }
}
