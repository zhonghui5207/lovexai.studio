import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { getIsoTimestr } from "@/lib/time";
import Stripe from "stripe";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function handleOrderSession(session: Stripe.Checkout.Session) {
  try {
    if (
      !session ||
      !session.metadata ||
      !session.metadata.order_no ||
      session.payment_status !== "paid"
    ) {
      throw new Error("invalid session");
    }

    const order_no = session.metadata.order_no;
    const paid_email =
      session.customer_details?.email || session.customer_email || "";
    const paid_detail = JSON.stringify(session);
    const paid_at = getIsoTimestr();

    await convex.mutation(api.orders.processPaidOrder, {
      orderNo: order_no,
      paidAt: paid_at,
      paidEmail: paid_email,
      stripeSessionId: session.id,
      paidDetail: paid_detail,
    });

    console.log(
      "handle order session successed: ",
      order_no,
      paid_at,
      paid_email
    );
  } catch (e) {
    console.log("handle order session failed: ", e);
    throw e;
  }
}
