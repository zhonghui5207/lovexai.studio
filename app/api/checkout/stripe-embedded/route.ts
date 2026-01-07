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
  console.log("Stripe Embedded Checkout API called");
  try {
    let {
      credits,
      amount,
      product_id,
      product_name,
      interval,
      valid_months,
    } = await req.json();

    console.log("Stripe embedded checkout params:", { product_id, amount, credits });

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
      let delayTimeMillis = is_subscription ? 24 * 60 * 60 * 1000 : 0;
      const newDate = new Date(timePeriodMillis + delayTimeMillis);
      expired_at = newDate.toISOString();
    }

    // Create Order in Convex first
    console.log("Creating order in Convex for embedded Stripe payment...");
    await convex.mutation(api.orders.createOrder, {
      order_no: order_no,
      user_id: convex_user_id,
      user_email: user_email,
      amount: amount,
      currency: "usd",
      credits: credits,
      status: "pending",
      product_id: product_id,
      product_name: product_name,
      expired_at: expired_at || undefined,
      sub_interval: is_subscription ? interval : undefined,
      payment_method: "card",
    });
    console.log("Order created in Convex");

    // Create Payment Intent
    console.log("Creating Stripe Payment Intent...");
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // Amount in cents
      currency: "usd",
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        order_no: order_no,
        user_id: convex_user_id,
        user_email: user_email,
        credits: credits.toString(),
        product_id: product_id,
        product_name: product_name,
      },
      receipt_email: user_email,
      description: `LoveXAI - ${product_name}`,
    });

    console.log("Payment Intent created:", paymentIntent.id);

    // Update order with Payment Intent ID
    await convex.mutation(api.orders.updateOrderSession, {
      orderNo: order_no,
      stripeSessionId: paymentIntent.id,
    });

    return respData({
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id,
      order_no: order_no,
    });
  } catch (e: any) {
    console.error("Stripe embedded checkout failed:", e);
    return respErr("Stripe checkout failed: " + e.message);
  }
}
