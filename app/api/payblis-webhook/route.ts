import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import crypto from "crypto";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const PAYBLIS_SECRET_KEY = process.env.PAYBLIS_SECRET_KEY;

// Verify Payblis IPN signature
function verifySignature(payload: string, signature: string): boolean {
  if (!PAYBLIS_SECRET_KEY) {
    console.error("Missing PAYBLIS_SECRET_KEY");
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", PAYBLIS_SECRET_KEY)
    .update(payload)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(signature)
  );
}

export async function POST(req: NextRequest) {
  console.log("Payblis Webhook received");

  try {
    const signature = req.headers.get("x-payblis-signature") || "";
    const rawPayload = await req.text();

    console.log("Webhook raw payload:", rawPayload);

    // Parse JSON payload
    let payload;
    try {
      payload = JSON.parse(rawPayload);
    } catch (e) {
      console.error("Failed to parse webhook payload:", e);
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    console.log("Webhook payload:", payload);

    // Always verify signature - this is critical for payment security
    if (!signature) {
      console.error("Missing Payblis signature header");
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    if (!verifySignature(rawPayload, signature)) {
      console.error("Invalid Payblis signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const {
      event,
      merchant_reference,
      transaction_id,
      amount,
      status,
    } = payload;

    console.log(`Payblis webhook: event=${event}, order=${merchant_reference}, status=${status}`);

    if (!merchant_reference) {
      console.error("Missing merchant_reference in webhook");
      return NextResponse.json({ error: "Missing merchant_reference" }, { status: 400 });
    }

    // Handle payment events
    if (event === "payment.success" && status === "SUCCESS") {
      try {
        // Use the existing processPaidOrder mutation which handles everything
        await convex.mutation(api.orders.processPaidOrder, {
          orderNo: merchant_reference,
          paidAt: new Date().toISOString(),
          paidEmail: "",
          stripeSessionId: transaction_id || "",
          paidDetail: JSON.stringify({
            payment_method: "card",
            provider: "payblis",
            transaction_id,
            amount,
          }),
        });

        console.log(`Order ${merchant_reference} processed successfully via Payblis`);
      } catch (updateError) {
        console.error("Failed to process order:", updateError);
        // Still return 200 to acknowledge receipt
      }
    } else if (event === "payment.failed" && status === "FAILED") {
      try {
        await convex.mutation(api.orders.updateOrderStatus, {
          orderNo: merchant_reference,
          status: "failed",
        });
        console.log(`Order ${merchant_reference} marked as failed`);
      } catch (e) {
        console.error("Failed to update order status:", e);
      }
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("Payblis webhook error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// Handle GET request for webhook verification
export async function GET(req: NextRequest) {
  return NextResponse.json({ status: "ok", message: "Payblis webhook endpoint" });
}
