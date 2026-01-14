import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import crypto from "crypto";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const NOWPAYMENTS_IPN_SECRET = process.env.NOWPAYMENTS_IPN_SECRET;

// Verify NOWPayments IPN signature
function verifySignature(payload: any, signature: string): boolean {
  if (!NOWPAYMENTS_IPN_SECRET) {
    console.error("Missing NOWPAYMENTS_IPN_SECRET");
    return false;
  }

  // Sort the payload keys and create a sorted JSON string
  const sortObject = (obj: any): any => {
    return Object.keys(obj)
      .sort()
      .reduce((result: any, key) => {
        if (obj[key] && typeof obj[key] === "object" && !Array.isArray(obj[key])) {
          result[key] = sortObject(obj[key]);
        } else {
          result[key] = obj[key];
        }
        return result;
      }, {});
  };

  const sortedPayload = sortObject(payload);
  const payloadString = JSON.stringify(sortedPayload);

  const hmac = crypto.createHmac("sha512", NOWPAYMENTS_IPN_SECRET);
  hmac.update(payloadString);
  const calculatedSignature = hmac.digest("hex");

  return calculatedSignature === signature;
}

export async function POST(req: NextRequest) {
  console.log("NOWPayments Webhook received");

  try {
    const signature = req.headers.get("x-nowpayments-sig");
    const payload = await req.json();

    console.log("Webhook payload:", JSON.stringify(payload, null, 2));

    // Always verify signature - this is critical for payment security
    if (!signature) {
      console.error("Missing NOWPayments signature header");
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    if (!verifySignature(payload, signature)) {
      console.error("Invalid NOWPayments signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const {
      payment_id,
      payment_status,
      order_id,
      order_description,
      price_amount,
      price_currency,
      pay_amount,
      pay_currency,
      actually_paid,
    } = payload;

    console.log(`Payment ${payment_id} for order ${order_id}: status = ${payment_status}`);

    // Only process finished payments
    if (order_id && payment_status === "finished") {
      try {
        // Use the existing processPaidOrder mutation which handles everything
        await convex.mutation(api.orders.processPaidOrder, {
          orderNo: order_id.toString(),
          paidAt: new Date().toISOString(),
          paidEmail: "", // NOWPayments doesn't provide email
          stripeSessionId: payment_id?.toString() || "",
          paidDetail: JSON.stringify({
            payment_method: "crypto",
            pay_amount,
            pay_currency,
            actually_paid,
            price_amount,
            price_currency,
          }),
        });

        console.log(`Order ${order_id} processed successfully`);
      } catch (updateError) {
        console.error("Failed to process order:", updateError);
        // Still return 200 to acknowledge receipt
      }
    } else if (order_id) {
      // Update order status for other statuses
      let orderStatus: string;
      switch (payment_status) {
        case "waiting":
          orderStatus = "pending";
          break;
        case "confirming":
        case "confirmed":
        case "sending":
          orderStatus = "processing";
          break;
        case "partially_paid":
          orderStatus = "partially_paid";
          break;
        case "failed":
        case "refunded":
        case "expired":
          orderStatus = "failed";
          break;
        default:
          orderStatus = "pending";
      }

      try {
        await convex.mutation(api.orders.updateOrderStatus, {
          orderNo: order_id.toString(),
          status: orderStatus,
        });
        console.log(`Order ${order_id} updated to status: ${orderStatus}`);
      } catch (e) {
        console.error("Failed to update order status:", e);
      }
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("NOWPayments webhook error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// Handle GET request for webhook verification
export async function GET(req: NextRequest) {
  return NextResponse.json({ status: "ok", message: "NOWPayments webhook endpoint" });
}
