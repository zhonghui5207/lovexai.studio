import { getUserEmail, getUserUuid } from "@/services/user";
import { respData, respErr } from "@/lib/resp";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { getSnowId } from "@/lib/hash";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Payblis API configuration
const PAYBLIS_API_KEY = process.env.PAYBLIS_API_KEY;
const PAYBLIS_PAYMENT_URL = "https://pay.payblis.com/api/payment_gateway.php";

// PHP serialize function for JavaScript
function phpSerialize(obj: Record<string, any>): string {
  const entries = Object.entries(obj);
  let result = `a:${entries.length}:{`;
  
  for (const [key, value] of entries) {
    // Serialize key
    result += `s:${key.length}:"${key}";`;
    
    // Serialize value
    if (typeof value === 'string') {
      result += `s:${value.length}:"${value}";`;
    } else if (typeof value === 'number') {
      if (Number.isInteger(value)) {
        result += `i:${value};`;
      } else {
        result += `d:${value};`;
      }
    } else if (typeof value === 'boolean') {
      result += `b:${value ? 1 : 0};`;
    } else if (value === null) {
      result += `N;`;
    } else {
      result += `s:${String(value).length}:"${String(value)}";`;
    }
  }
  
  result += '}';
  return result;
}

export async function POST(req: Request) {
  console.log("Payblis Card Checkout API called");
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

    console.log("Card checkout params:", { product_id, amount, currency, interval });

    if (!PAYBLIS_API_KEY) {
      console.error("Missing PAYBLIS_API_KEY");
      return respErr("Server configuration error: Missing Payblis API Key");
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

    // Convert amount from cents to dollars
    const price_amount = (amount / 100).toFixed(2);

    const currentDate = new Date();
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
    console.log("Creating order in Convex for card payment...");
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
    console.log("Order created in Convex for card payment");

    // Get client IP (for Payblis)
    const forwarded = req.headers.get("x-forwarded-for");
    const clientIP = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";

    // Build Payblis payment parameters
    // Use www.lovexai.studio to avoid 307 redirect
    const baseUrl = process.env.NEXT_PUBLIC_WEB_URL?.replace("://lovexai.studio", "://www.lovexai.studio") || "https://www.lovexai.studio";
    
    const paymentParams: Record<string, string> = {
      MerchantKey: PAYBLIS_API_KEY,
      amount: price_amount,
      currency: (currency || "usd").toUpperCase(),
      product_name: product_name,
      method: "credit_cards",
      RefOrder: order_no,
      Customer_Email: user_email,
      Customer_Name: convexUser.name?.split(" ").slice(1).join(" ") || "Customer",
      Customer_FirstName: convexUser.name?.split(" ")[0] || "User",
      country: "US",
      userIP: clientIP,
      lang: "en",
      store_name: "LoveXAI Studio",
      urlOK: `${baseUrl}/pay-success?order_no=${order_no}&method=card`,
      urlKO: `${baseUrl}/pricing?payment=failed`,
      ipnURL: `${baseUrl}/api/payblis-webhook`,
    };

    // Note: Remove sandbox flag to use real payment flow
    // For testing with test cards, you can manually add sandbox=true in .env
    if (process.env.PAYBLIS_SANDBOX === "true") {
      paymentParams.sandbox = "true";
    }

    console.log("Payblis payment params:", { ...paymentParams, MerchantKey: "***" });

    // Serialize and encode the parameters (PHP-style)
    const serializedData = phpSerialize(paymentParams);
    const encodedToken = Buffer.from(serializedData).toString("base64");

    // Generate payment URL
    const paymentUrl = `${PAYBLIS_PAYMENT_URL}?token=${encodedToken}`;

    console.log("Generated Payblis payment URL");

    // Update order with session info
    await convex.mutation(api.orders.updateOrderSession, {
      orderNo: order_no,
      stripeSessionId: `payblis_${order_no}`,
    });

    return respData({
      payment_url: paymentUrl,
      order_no: order_no,
    });
  } catch (e: any) {
    console.error("Card checkout failed:", e);
    return respErr("Card checkout failed: " + e.message);
  }
}
