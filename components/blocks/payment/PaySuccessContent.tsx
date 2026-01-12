"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, Loader, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PaySuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  const orderNo = searchParams.get("order_no");

  useEffect(() => {
    // For card payments, the IPN will handle the order processing
    // We just show a success message here
    if (orderNo) {
      setStatus("success");
      setMessage("Your payment is being processed. Credits will be added to your account shortly.");
    } else {
      setStatus("error");
      setMessage("Invalid payment confirmation.");
    }
  }, [orderNo]);

  return (
    <div className="max-w-md w-full text-center">
      {status === "loading" && (
        <div className="space-y-4">
          <Loader className="w-16 h-16 text-primary animate-spin mx-auto" />
          <h1 className="text-2xl font-bold">Processing Payment...</h1>
          <p className="text-muted-foreground">Please wait while we confirm your payment.</p>
        </div>
      )}

      {status === "success" && (
        <div className="space-y-6">
          <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-white">Payment Successful!</h1>
          <p className="text-muted-foreground">{message}</p>

          {orderNo && (
            <div className="bg-white/5 rounded-lg p-4 text-sm">
              <div className="text-muted-foreground">Order Number</div>
              <div className="text-white font-mono">{orderNo}</div>
            </div>
          )}

          <div className="flex flex-col gap-3 pt-4">
            <Button
              onClick={() => router.push("/discover")}
              className="w-full bg-primary hover:bg-primary/90"
            >
              Start Chatting
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/pricing")}
              className="w-full"
            >
              Back to Pricing
            </Button>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="space-y-6">
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
            <XCircle className="w-12 h-12 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold text-white">Payment Error</h1>
          <p className="text-muted-foreground">{message}</p>

          <Button
            onClick={() => router.push("/pricing")}
            className="w-full bg-primary hover:bg-primary/90"
          >
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
}
