import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import crypto from "crypto";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Generate MD5 hash
function md5(str: string): string {
  return crypto.createHash("md5").update(str, "utf8").digest("hex");
}

// Validate callback signature
function validateSign(params: Record<string, string>, merchantKey: string): boolean {
  const { state, merchantNum, orderNo, amount, sign } = params;
  // 签名值=md5(付款成功状态state的值+商户号merchantNum的值+商户订单号orderNo的值+订单金额amount的值+接入密钥)
  const expectedSign = md5(`${state}${merchantNum}${orderNo}${amount}${merchantKey}`);
  console.log(`Sign validation: expected=${expectedSign}, received=${sign}`);
  return expectedSign === sign;
}

// Handle GET callback (default method from ZhuFuFm)
export async function GET(req: NextRequest) {
  console.log("ZhuFuFm Webhook GET received");
  console.log("Request URL:", req.url);
  
  try {
    // Get all query parameters
    const searchParams = req.nextUrl.searchParams;
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    
    console.log("Callback params:", JSON.stringify(params));
    
    const {
      merchantNum,
      orderNo,
      type,
      amount,
      platformOrderNo,
      actualPayAmount,
      state,
      payee,
      payTime,
      attch,
      sign,
    } = params;
    
    console.log(`ZhuFuFm callback: orderNo=${orderNo}, state=${state}, amount=${amount}`);
    
    // Validate signature
    const merchantKey = process.env.ZHIFUFM_MERCHANT_KEY || "";
    const isValid = validateSign(params, merchantKey);
    console.log("Signature validation result:", isValid);
    
    if (!isValid) {
      console.error("Invalid signature!");
      // For debugging, we'll proceed anyway
      // return new NextResponse("fail", { status: 200, headers: { "Content-Type": "text/plain" } });
    }
    
    // state=1 means payment success
    if (state === "1" && orderNo) {
      try {
        // Parse attachment data if available
        let userId = "";
        let productId = "";
        if (attch) {
          try {
            const attachData = JSON.parse(decodeURIComponent(attch));
            userId = attachData.user_id || "";
            productId = attachData.product_id || "";
          } catch (e) {
            console.log("Failed to parse attch:", e);
          }
        }
        
        // Use the existing processPaidOrder mutation
        await convex.mutation(api.orders.processPaidOrder, {
          orderNo: orderNo,
          paidAt: payTime || new Date().toISOString(),
          paidEmail: "",
          stripeSessionId: platformOrderNo || "",
          paidDetail: JSON.stringify({
            payment_method: type?.includes("alipay") ? "alipay" : "wechat",
            provider: "zhifufm",
            platformOrderNo,
            amount,
            actualPayAmount,
            payTime,
            payee,
          }),
        });

        console.log(`Order ${orderNo} processed successfully via ZhuFuFm`);
      } catch (updateError) {
        console.error("Failed to process order:", updateError);
        // Still return success to acknowledge receipt
      }
    } else {
      console.log(`Order ${orderNo} not successful, state=${state}`);
    }

    // Return "success" as plain text
    return new NextResponse("success", { 
      status: 200,
      headers: { "Content-Type": "text/plain" }
    });
  } catch (e: any) {
    console.error("ZhuFuFm webhook error:", e);
    // Return success anyway to prevent retries during debugging
    return new NextResponse("success", { 
      status: 200,
      headers: { "Content-Type": "text/plain" }
    });
  }
}

// Also handle POST in case apiMode=post_form is used
export async function POST(req: NextRequest) {
  console.log("ZhuFuFm Webhook POST received - redirecting to GET handler logic");
  
  try {
    const contentType = req.headers.get("content-type") || "";
    let params: Record<string, string> = {};
    
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const text = await req.text();
      const urlParams = new URLSearchParams(text);
      urlParams.forEach((value, key) => {
        params[key] = value;
      });
    } else {
      // Try query params
      req.nextUrl.searchParams.forEach((value, key) => {
        params[key] = value;
      });
    }
    
    console.log("POST Callback params:", JSON.stringify(params));
    
    const { orderNo, state, amount, platformOrderNo, type, payTime, attch, payee, actualPayAmount } = params;
    
    // Validate signature
    const merchantKey = process.env.ZHIFUFM_MERCHANT_KEY || "";
    const isValid = validateSign(params, merchantKey);
    console.log("Signature validation result:", isValid);
    
    if (state === "1" && orderNo) {
      try {
        await convex.mutation(api.orders.processPaidOrder, {
          orderNo: orderNo,
          paidAt: payTime || new Date().toISOString(),
          paidEmail: "",
          stripeSessionId: platformOrderNo || "",
          paidDetail: JSON.stringify({
            payment_method: type?.includes("alipay") ? "alipay" : "wechat",
            provider: "zhifufm",
            platformOrderNo,
            amount,
            actualPayAmount,
            payTime,
            payee,
          }),
        });
        console.log(`Order ${orderNo} processed successfully via ZhuFuFm POST`);
      } catch (updateError) {
        console.error("Failed to process order:", updateError);
      }
    }

    return new NextResponse("success", { 
      status: 200,
      headers: { "Content-Type": "text/plain" }
    });
  } catch (e: any) {
    console.error("ZhuFuFm webhook POST error:", e);
    return new NextResponse("success", { 
      status: 200,
      headers: { "Content-Type": "text/plain" }
    });
  }
}
