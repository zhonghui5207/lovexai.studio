"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import { loadStripe, StripeElementLocale } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Loader, ArrowLeft, Shield, Lock, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);

// Map website locale to Stripe locale
function getStripeLocale(locale: string): StripeElementLocale {
  const localeMap: Record<string, StripeElementLocale> = {
    "en": "en",
    "zh": "zh",
    "zh-CN": "zh",
    "zh-TW": "zh-TW",
    "ja": "ja",
    "ko": "ko",
    "es": "es",
    "fr": "fr",
    "de": "de",
  };
  return localeMap[locale] || "en";
}

// Custom appearance to match website theme
const stripeAppearance = {
  theme: "night" as const,
  variables: {
    colorPrimary: "#FF006E",
    colorBackground: "#1a1a1a",
    colorText: "#ffffff",
    colorTextSecondary: "#a1a1aa",
    colorDanger: "#ef4444",
    fontFamily: "system-ui, sans-serif",
    borderRadius: "12px",
    spacingUnit: "4px",
  },
  rules: {
    ".Input": {
      backgroundColor: "rgba(255, 255, 255, 0.05)",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      boxShadow: "none",
    },
    ".Input:focus": {
      border: "1px solid #FF006E",
      boxShadow: "0 0 0 1px #FF006E",
    },
    ".Label": {
      color: "#a1a1aa",
      fontWeight: "500",
    },
    ".Tab": {
      backgroundColor: "rgba(255, 255, 255, 0.05)",
      border: "1px solid rgba(255, 255, 255, 0.1)",
    },
    ".Tab--selected": {
      backgroundColor: "rgba(255, 0, 110, 0.1)",
      border: "1px solid #FF006E",
    },
  },
};

// Checkout Form Component
function CheckoutForm({ 
  orderNo, 
  productName, 
  price, 
  credits 
}: { 
  orderNo: string;
  productName: string;
  price: number;
  credits: number;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message || "Payment failed");
      setIsLoading(false);
      return;
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/pay-success?order_no=${orderNo}&method=stripe`,
      },
    });

    if (confirmError) {
      setError(confirmError.message || "Payment failed");
      toast.error(confirmError.message || "Payment failed");
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Element */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <PaymentElement 
          options={{
            layout: "tabs",
          }}
        />
      </div>

      {/* Error Message */}
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
        >
          {error}
        </motion.div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={!stripe || isLoading}
        className="w-full py-6 text-lg font-bold bg-gradient-to-r from-primary to-secondary hover:opacity-90 rounded-xl shadow-lg shadow-primary/25 transition-all"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <Loader className="w-5 h-5 animate-spin" />
            Processing...
          </span>
        ) : (
          <span>Pay ${(price / 100).toFixed(2)}</span>
        )}
      </Button>

      {/* Security Notice */}
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Lock className="w-4 h-4 text-green-500" />
        <span>Your payment is protected with <span className="text-green-500 font-medium">256-bit encryption</span></span>
      </div>
    </form>
  );
}

// Main Checkout Page
export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = useParams();
  
  // Get locale from URL params for Stripe localization
  const locale = (params.locale as string) || "en";
  
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderInfo, setOrderInfo] = useState<{
    orderNo: string;
    productName: string;
    price: number;
    credits: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get params from URL
  const productId = searchParams.get("product_id");
  const amount = searchParams.get("amount");
  const credits = searchParams.get("credits");
  const productName = searchParams.get("product_name");
  const interval = searchParams.get("interval");

  useEffect(() => {
    if (!productId || !amount || !credits) {
      setError("Missing payment information");
      setIsLoading(false);
      return;
    }

    // Create Payment Intent
    const createPaymentIntent = async () => {
      try {
        const response = await fetch("/api/checkout/stripe-embedded", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            product_id: productId,
            amount: parseInt(amount),
            credits: parseInt(credits),
            product_name: productName || `${credits} Credits`,
            interval: interval || "one-time",
          }),
        });

        const data = await response.json();
        
        if (data.code !== 0) {
          throw new Error(data.message || "Failed to create payment");
        }

        setClientSecret(data.data.client_secret);
        setOrderInfo({
          orderNo: data.data.order_no,
          productName: productName || `${credits} Credits`,
          price: parseInt(amount),
          credits: parseInt(credits),
        });
      } catch (err: any) {
        setError(err.message);
        toast.error(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    createPaymentIntent();
  }, [productId, amount, credits, productName, interval]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Preparing checkout...</p>
        </div>
      </div>
    );
  }

  if (error || !clientSecret || !orderInfo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Payment Error</h1>
          <p className="text-muted-foreground mb-6">{error || "Unable to process payment"}</p>
          <Button 
            onClick={() => router.push("/pricing")}
            variant="outline"
            className="border-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Pricing
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-lg mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold mb-2">Complete Your Purchase</h1>
          <p className="text-muted-foreground flex items-center justify-center gap-2">
            <Shield className="w-4 h-4 text-green-500" />
            <span>Secure & encrypted checkout</span>
          </p>
        </motion.div>

        {/* Order Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-6 border border-primary/20 mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground">You're purchasing</p>
              <h2 className="text-xl font-bold">{orderInfo.productName}</h2>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold text-primary">
                ${(orderInfo.price / 100).toFixed(2)}
              </p>
            </div>
          </div>
          
          {/* Credits Display */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black/20 border border-white/5">
            <span className="text-2xl">🪙</span>
            <span className="font-bold text-primary">{orderInfo.credits.toLocaleString()} Credits</span>
          </div>
        </motion.div>

        {/* Stripe Payment Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Elements 
            stripe={stripePromise} 
            options={{
              clientSecret,
              appearance: stripeAppearance,
              locale: getStripeLocale(locale), // Follow website language
            }}
          >
            <CheckoutForm 
              orderNo={orderInfo.orderNo}
              productName={orderInfo.productName}
              price={orderInfo.price}
              credits={orderInfo.credits}
            />
          </Elements>
        </motion.div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 flex items-center justify-center gap-6 text-muted-foreground"
        >
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span className="text-sm">Secure</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            <span className="text-sm">Encrypted</span>
          </div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            <span className="text-sm">PCI Compliant</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
