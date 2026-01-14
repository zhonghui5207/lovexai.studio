import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import crypto from "crypto";
import { logger } from "@/lib/logger";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const PAYBLIS_SECRET_KEY = process.env.PAYBLIS_SECRET_KEY;

// Verify Payblis IPN signature
function verifySignature(payload: string, signature: string): boolean {
  if (!PAYBLIS_SECRET_KEY) {
    logger.error("Missing PAYBLIS_SECRET_KEY");
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
  logger.info("Payblis Webhook received");

  try {
    const signature = req.headers.get("x-payblis-signature") || "";
    const rawPayload = await req.text();

    // Parse JSON payload
    let payload;
    try {
      payload = JSON.parse(rawPayload);
    } catch (e) {
      logger.error("Failed to parse webhook payload", e);
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    // Always verify signature - this is critical for payment security
    if (!signature) {
      logger.error("Missing Payblis signature header");
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    if (!verifySignature(rawPayload, signature)) {
      logger.error("Invalid Payblis signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const {
      event,
      merchant_reference,
      transaction_id,
      amount,
      status,
    } = payload;

    logger.info("Payblis webhook event", { event, order: merchant_reference, status });

    if (!merchant_reference) {
      logger.error("Missing merchant_reference in webhook");
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

        logger.info("Order processed successfully via Payblis", { order: merchant_reference });
      } catch (updateError) {
        logger.error("Failed to process order", updateError, { order: merchant_reference });
        // Still return 200 to acknowledge receipt
      }
    } else if (event === "payment.failed" && status === "FAILED") {
      try {
        await convex.mutation(api.orders.updateOrderStatus, {
          orderNo: merchant_reference,
          status: "failed",
        });
        logger.info("Order marked as failed", { order: merchant_reference });
      } catch (e) {
        logger.error("Failed to update order status", e, { order: merchant_reference });
      }
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    logger.error("Payblis webhook error", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// Handle GET request for webhook verification
export async function GET(req: NextRequest) {
  return NextResponse.json({ status: "ok", message: "Payblis webhook endpoint" });
}
