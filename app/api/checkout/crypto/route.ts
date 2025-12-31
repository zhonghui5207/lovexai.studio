import { getUserEmail, getUserUuid } from "@/services/user";
import { respData, respErr } from "@/lib/resp";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { getSnowId } from "@/lib/hash";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// NOWPayments API configuration
const NOWPAYMENTS_API_URL = "https://api.nowpayments.io/v1";
const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY;

export async function POST(req: Request) {
  console.log("Crypto Checkout API called");
  try {
    let {
      credits,
      currency,
      amount,
      interval,
      product_id,
      product_name,
      valid_months,
    } = await req.json();

    console.log("Crypto checkout params:", { product_id, amount, currency, interval });

    if (!NOWPAYMENTS_API_KEY) {
      console.error("Missing NOWPAYMENTS_API_KEY");
      return respErr("Server configuration error: Missing NOWPayments API Key");
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

    // Convert amount from cents to dollars for NOWPayments
    const price_amount = amount / 100;

    const currentDate = new Date();
    const created_at = currentDate.toISOString();

    let expired_at = "";
    const is_subscription = interval === "month" || interval === "year";

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
    console.log("Creating order in Convex for crypto payment...");
    await convex.mutation(api.orders.createOrder, {
      order_no: order_no,
      user_id: convex_user_id,
      user_email: user_email,
      amount: amount,
      currency: "usd", // NOWPayments will convert to crypto
      credits: credits,
      status: "pending",
      product_id: product_id,
      product_name: product_name,
      expired_at: expired_at || undefined,
      sub_interval: is_subscription ? interval : undefined,
      payment_method: "crypto",
    });
    console.log("Order created in Convex for crypto payment");

    // Create NOWPayments invoice
    // Use www.lovexai.studio to avoid 307 redirect
    const baseUrl = process.env.NEXT_PUBLIC_WEB_URL?.replace("://lovexai.studio", "://www.lovexai.studio") || "https://www.lovexai.studio";

    const invoiceData = {
      price_amount: price_amount,
      price_currency: "usd",
      order_id: order_no.toString(),
      order_description: product_name,
      ipn_callback_url: `${baseUrl}/api/nowpayments-webhook`,
      success_url: `${baseUrl}/pay-success?order_no=${order_no}&method=crypto`,
      cancel_url: `${baseUrl}/pricing`,
    };

    console.log("Creating NOWPayments invoice...", invoiceData);

    const invoiceResponse = await fetch(`${NOWPAYMENTS_API_URL}/invoice`, {
      method: "POST",
      headers: {
        "x-api-key": NOWPAYMENTS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(invoiceData),
    });

    if (!invoiceResponse.ok) {
      const errorText = await invoiceResponse.text();
      console.error("NOWPayments invoice creation failed:", errorText);
      return respErr("Failed to create crypto payment: " + errorText);
    }

    const invoiceResult = await invoiceResponse.json();
    console.log("NOWPayments invoice created:", invoiceResult);

    // Update order with NOWPayments invoice ID
    await convex.mutation(api.orders.updateOrderSession, {
      orderNo: order_no,
      stripeSessionId: invoiceResult.id?.toString() || invoiceResult.token_id,
    });

    return respData({
      payment_url: invoiceResult.invoice_url,
      invoice_id: invoiceResult.id,
      order_no: order_no,
    });
  } catch (e: any) {
    console.error("Crypto checkout failed:", e);
    return respErr("Crypto checkout failed: " + e.message);
  }
}
