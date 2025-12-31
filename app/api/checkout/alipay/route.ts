import { getUserEmail, getUserUuid } from "@/services/user";
import { respData, respErr } from "@/lib/resp";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { getSnowId } from "@/lib/hash";
import { ZhuFuFm, ZhuFuFmPayType } from "zhifufm";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Initialize ZhuFuFm
const zhifufm = new ZhuFuFm({
  baseUrl: process.env.ZHIFUFM_BASE_URL || "",
  merchantNum: process.env.ZHIFUFM_MERCHANT_NUM || "",
  merchantKey: process.env.ZHIFUFM_MERCHANT_KEY || "",
  notifyUrl: `${process.env.NEXT_PUBLIC_WEB_URL}/api/zhifufm-webhook`,
  returnUrl: `${process.env.NEXT_PUBLIC_WEB_URL}/pay-success`,
});

export async function POST(req: Request) {
  console.log("Alipay Checkout API called");
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

    console.log("Alipay checkout params:", { product_id, amount, currency, interval });

    if (!process.env.ZHIFUFM_MERCHANT_NUM) {
      console.error("Missing ZHIFUFM configuration");
      return respErr("Server configuration error: Missing payment configuration");
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

    // Convert amount from cents to yuan (CNY)
    const price_amount = amount / 100;

    const currentDate = new Date();
    let expired_at = "";
    const is_subscription = interval === "month" || interval === "year";

    if (valid_months) {
      const timePeriod = new Date(currentDate);
      timePeriod.setMonth(currentDate.getMonth() + valid_months);

      const timePeriodMillis = timePeriod.getTime();
      let delayTimeMillis = 0;

      if (is_subscription) {
        delayTimeMillis = 24 * 60 * 60 * 1000;
      }

      const newTimeMillis = timePeriodMillis + delayTimeMillis;
      const newDate = new Date(newTimeMillis);
      expired_at = newDate.toISOString();
    }

    // Create Order in Convex first
    console.log("Creating order in Convex for Alipay payment...");
    await convex.mutation(api.orders.createOrder, {
      order_no: order_no,
      user_id: convex_user_id,
      user_email: user_email,
      amount: amount,
      currency: "cny",
      credits: credits,
      status: "pending",
      product_id: product_id,
      product_name: product_name,
      expired_at: expired_at || undefined,
      sub_interval: is_subscription ? interval : undefined,
      payment_method: "alipay",
    });
    console.log("Order created in Convex for Alipay payment");

    // Create payment order via ZhuFuFm
    const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || "https://lovexai.studio";

    const orderResult = await zhifufm.startOrder({
      orderNo: order_no,
      amount: price_amount,
      payType: ZhuFuFmPayType.AlipayQrCode, // 支付宝免签收款码
      subject: product_name || "购买商品",
      body: `${credits} Credits`,
      attch: JSON.stringify({ user_id: convex_user_id, product_id }),
      returnUrl: `${baseUrl}/pay-success?order_no=${order_no}&method=alipay`,
    }) as any;

    console.log("ZhuFuFm order created:", orderResult);

    if (orderResult.code !== 200 && orderResult.code !== 0) {
      throw new Error(orderResult.msg || "Failed to create payment order");
    }

    return respData({
      payment_url: orderResult.data?.payUrl || orderResult.payUrl,
      order_no: order_no,
    });
  } catch (e: any) {
    console.error("Alipay checkout failed:", e);
    return respErr("Alipay checkout failed: " + e.message);
  }
}
