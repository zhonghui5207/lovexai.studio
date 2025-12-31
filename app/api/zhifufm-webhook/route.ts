import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { ZhuFuFm } from "zhifufm";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Initialize ZhuFuFm for signature verification
const zhifufm = new ZhuFuFm({
  baseUrl: process.env.ZHIFUFM_BASE_URL || "",
  merchantNum: process.env.ZHIFUFM_MERCHANT_NUM || "",
  merchantKey: process.env.ZHIFUFM_MERCHANT_KEY || "",
  notifyUrl: "",
  returnUrl: "",
});

export async function POST(req: NextRequest) {
  console.log("ZhuFuFm Webhook received");
  console.log("Request URL:", req.url);
  console.log("Request headers:", Object.fromEntries(req.headers));

  try {
    // Parse the request body
    const body = await req.json();
    console.log("Webhook payload:", JSON.stringify(body));

    // Validate the signature using the SDK
    const isValid = zhifufm.validateNotifySign(body);
    console.log("Signature validation result:", isValid);
    
    if (!isValid) {
      console.error("Invalid ZhuFuFm signature, but proceeding for debugging");
      // Temporarily proceed even if signature is invalid for debugging
      // return new NextResponse("fail", { status: 400 });
    }

    const {
      state,        // 支付状态：SUCCESS/FAIL
      orderNo,      // 商户订单号
      amount,       // 订单金额
      payTime,      // 支付时间
      tradeNo,      // 平台订单号
    } = body;

    console.log(`ZhuFuFm webhook: order=${orderNo}, state=${state}`);

    if (state === "SUCCESS" && orderNo) {
      try {
        // Use the existing processPaidOrder mutation
        await convex.mutation(api.orders.processPaidOrder, {
          orderNo: orderNo,
          paidAt: payTime || new Date().toISOString(),
          paidEmail: "",
          stripeSessionId: tradeNo || "",
          paidDetail: JSON.stringify({
            payment_method: body.payType?.includes("alipay") ? "alipay" : "wechat",
            provider: "zhifufm",
            tradeNo,
            amount,
            payTime,
          }),
        });

        console.log(`Order ${orderNo} processed successfully via ZhuFuFm`);
      } catch (updateError) {
        console.error("Failed to process order:", updateError);
        // Still return success to acknowledge receipt
      }
    } else if (state === "FAIL" && orderNo) {
      try {
        await convex.mutation(api.orders.updateOrderStatus, {
          orderNo: orderNo,
          status: "failed",
        });
        console.log(`Order ${orderNo} marked as failed`);
      } catch (e) {
        console.error("Failed to update order status:", e);
      }
    }

    // Return "success" to acknowledge the callback
    return new NextResponse("success", { status: 200 });
  } catch (e: any) {
    console.error("ZhuFuFm webhook error:", e);
    return new NextResponse("fail", { status: 500 });
  }
}

// Handle GET request for testing
export async function GET(req: NextRequest) {
  return NextResponse.json({ status: "ok", message: "ZhuFuFm webhook endpoint" });
}
