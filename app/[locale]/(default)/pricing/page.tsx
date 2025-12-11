"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Loader } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { loadStripe } from "@stripe/stripe-js";
import { toast } from "sonner";
import { useAppContext } from "@/contexts/app";
import { useSearchParams } from "next/navigation";

// ========================================
// Subscription Plans Configuration
// ========================================
const SUBSCRIPTION_PLANS = [
  {
    id: "free",
    name: "FREE",
    description: "Experience the Basics",
    price: { monthly: 0, yearly: 0 },
    credits: 150,
    creditsNote: "one-time",
    features: [
      "150 Credits (one-time)",
      "10 Discover swipes/day",
      "10 messages in memory",
      "Nova basic model",
      "Free characters",
    ],
    highlight: false,
    buttonText: "Current Plan",
    disabled: true
  },
  {
    id: "plus",
    name: "PLUS",
    description: "Unlock More Possibilities",
    price: { monthly: 9.99, yearly: 6.99 },
    credits: 500,
    creditsNote: "per month",
    originalPrice: { monthly: 9.99, yearly: 9.99 },
    features: [
      "500 Credits/month",
      "30 Discover swipes/day",
      "20 messages in memory",
      "Nova + Pulsar models",
      "Free + Plus characters",
      "5 custom characters",
    ],
    highlight: false,
    buttonText: "Subscribe",
    product_id: "price_plus"
  },
  {
    id: "pro",
    name: "PRO",
    description: "Professional Experience",
    price: { monthly: 19.99, yearly: 13.99 },
    credits: 2000,
    creditsNote: "per month",
    originalPrice: { monthly: 19.99, yearly: 19.99 },
    features: [
      "2,000 Credits/month",
      "50 Discover swipes/day",
      "30 messages in memory",
      "Nova + Pulsar + Nebula",
      "All Pro & below characters",
      "15 custom characters",
      "Advanced image model",
    ],
    highlight: false,
    buttonText: "Subscribe",
    product_id: "price_pro"
  },
  {
    id: "ultimate",
    name: "ULTIMATE",
    description: "Unlimited Creative Freedom",
    price: { monthly: 29.99, yearly: 20.99 },
    credits: 5000,
    creditsNote: "per month",
    originalPrice: { monthly: 29.99, yearly: 29.99 },
    features: [
      "5,000 Credits/month",
      "Unlimited Discover swipes",
      "50 messages in memory",
      "All AI models (incl. Quasar)",
      "All characters (incl. exclusive)",
      "Unlimited custom characters",
      "Best image model",
    ],
    highlight: true,
    buttonText: "Subscribe",
    product_id: "price_ultimate"
  }
];

// ========================================
// Credit Packs Configuration
// ========================================
const CREDIT_PACKS = [
  {
    credits: 500,
    price: 2.99,
    bonus: 0,
    product_id: "credits_500"
  },
  {
    credits: 1500,
    price: 7.99,
    bonus: 100,
    popular: false,
    product_id: "credits_1500"
  },
  {
    credits: 3000,
    price: 14.99,
    bonus: 300,
    popular: true,
    product_id: "credits_3000"
  },
  {
    credits: 6000,
    price: 27.99,
    bonus: 800,
    product_id: "credits_6000"
  },
  {
    credits: 12000,
    price: 49.99,
    bonus: 2000,
    product_id: "credits_12000"
  },
  {
    credits: 30000,
    price: 99.99,
    bonus: 7500,
    product_id: "credits_30000"
  }
];

// ========================================
// Credits Usage Reference
// ========================================
const CREDITS_USAGE = [
  { action: "Chat (Nova)", cost: "2 credits/msg" },
  { action: "Chat (Pulsar)", cost: "4 credits/msg" },
  { action: "Chat (Nebula)", cost: "6 credits/msg" },
  { action: "Chat (Quasar)", cost: "10 credits/msg" },
  { action: "Image Generation", cost: "10-20 credits" },
  { action: "Prompt Enhance", cost: "2 credits" },
];

export default function PricingPage() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'credits' ? 'credits' : 'subscriptions';
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'credits'>(initialTab);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('ultimate');
  const { user, setShowSignModal } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleCheckout = async (productId: string, price: number, credits: number, interval?: 'month' | 'year' | 'one-time', productName?: string) => {
    if (!user) {
      setShowSignModal(true);
      return;
    }

    setIsLoading(true);
    setProcessingId(productId);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: productId,
          product_name: productName || (productId.includes("credits") ? `${credits} Credits` : "Subscription"),
          amount: Math.round(price * 100),
          currency: "usd",
          interval: interval || "one-time",
          valid_months: interval === "year" ? 12 : 1,
          credits: credits,
        })
      });

      const data = await response.json();
      
      if (data.code !== 0) {
        throw new Error(data.message || "Checkout failed");
      }

      const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);
      if (!stripe) throw new Error("Stripe failed to load");

      const { error } = await stripe.redirectToCheckout({
        sessionId: data.data.session_id
      });

      if (error) throw error;
      
    } catch (error: unknown) {
      console.error("Checkout error:", error);
      const errorMessage = error instanceof Error ? error.message : "Checkout failed";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-8 pb-20 px-4">
      <div className="container max-w-screen-xl mx-auto">
        
        {/* Page Header */}
        <div className="mb-12">
          <div className="flex items-center gap-8 border-b border-white/10 pb-0 mb-8">
            <button
              onClick={() => setActiveTab('subscriptions')}
              className={`pb-4 text-lg font-medium transition-all relative ${
                activeTab === 'subscriptions' ? 'text-white' : 'text-white/40 hover:text-white/70'
              }`}
            >
              Subscriptions
              {activeTab === 'subscriptions' && (
                <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('credits')}
              className={`pb-4 text-lg font-medium transition-all relative ${
                activeTab === 'credits' ? 'text-white' : 'text-white/40 hover:text-white/70'
              }`}
            >
              Credits
              {activeTab === 'credits' && (
                <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'subscriptions' ? (
            <motion.div
              key="subscriptions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-10">
                <h1 className="text-4xl font-bold mb-4">Unlock Unlimited Creativity</h1>
                <p className="text-muted-foreground max-w-2xl">
                  Choose the plan that suits you best and embark on an amazing journey with your AI companions.
                </p>
              </div>

              {/* Billing Toggle */}
              <div className="flex items-center gap-4 mb-12">
                <div className="bg-white/5 p-1 rounded-full inline-flex border border-white/10">
                  <button
                    onClick={() => setBillingCycle('yearly')}
                    className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                      billingCycle === 'yearly' ? 'bg-white/10 text-white shadow-sm' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    Yearly <span className="text-primary text-xs ml-1">Save 30%</span>
                  </button>
                  <button
                    onClick={() => setBillingCycle('monthly')}
                    className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                      billingCycle === 'monthly' ? 'bg-white/10 text-white shadow-sm' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    Monthly
                  </button>
                </div>
              </div>

              {/* Subscription Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {SUBSCRIPTION_PLANS.map((plan) => {
                  const isSelected = selectedPlanId === plan.id;
                  
                  return (
                    <div
                      key={plan.id}
                      onClick={() => !plan.disabled && setSelectedPlanId(plan.id)}
                      className={`relative p-6 rounded-3xl border transition-all duration-300 flex flex-col cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-b from-primary/10 to-background border-primary shadow-[0_0_30px_rgba(255,0,110,0.15)] scale-[1.02]'
                          : 'bg-card border-white/5 hover:border-white/10 hover:bg-white/5'
                      } ${plan.disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      {plan.highlight && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-secondary text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg">
                          RECOMMENDED
                        </div>
                      )}

                      {isSelected && !plan.highlight && (
                        <div className="absolute -top-3 right-6 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                          SELECTED
                        </div>
                      )}

                      <div className="mb-6">
                        <h3 className={`text-lg font-bold mb-1 ${isSelected ? 'text-primary' : 'text-white'}`}>{plan.name}</h3>
                        <p className="text-sm text-white/60 mb-4">{plan.description}</p>
                        
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-bold text-white">
                            ${plan.price[billingCycle].toFixed(2)}
                          </span>
                          <span className="text-white/40 text-sm">/mo</span>
                        </div>
                        
                        {billingCycle === 'yearly' && plan.price.yearly > 0 && plan.originalPrice && (
                          <div className="text-xs mt-2 space-y-1">
                            <div className="text-white/40">Billed annually at ${(plan.price.yearly * 12).toFixed(2)}</div>
                            <div className="text-primary font-medium">
                              <span className="line-through text-white/30 mr-2">${(plan.originalPrice.yearly * 12).toFixed(2)}</span>
                              Save ${((plan.originalPrice.yearly - plan.price.yearly) * 12).toFixed(0)}/year
                            </div>
                          </div>
                        )}

                        {/* Credits Badge */}
                        <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                          <span className="text-2xl">🪙</span>
                          <span className="text-sm font-bold text-primary">{plan.credits.toLocaleString()} Credits</span>
                          <span className="text-xs text-white/50">{plan.creditsNote}</span>
                        </div>
                      </div>

                      <div className="flex-grow space-y-3 mb-8">
                        {plan.features.map((feature, i) => (
                          <div key={i} className="flex items-start gap-3 text-sm text-white/80">
                            <Check className={`w-4 h-4 shrink-0 mt-0.5 ${isSelected ? 'text-primary' : 'text-green-500'}`} />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>

                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (plan.product_id) {
                            handleCheckout(
                              plan.product_id, 
                              billingCycle === 'yearly' ? plan.price.yearly * 12 : plan.price[billingCycle],
                              plan.credits,
                              billingCycle === 'monthly' ? 'month' : 'year',
                              `${plan.name} ${billingCycle === 'yearly' ? 'Annual' : 'Monthly'}`
                            );
                          }
                        }}
                        disabled={plan.disabled || isLoading}
                        className={`w-full py-6 rounded-xl font-bold text-base transition-all ${
                          isSelected
                            ? 'bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25'
                            : 'bg-white/10 hover:bg-white/20 text-white'
                        }`}
                      >
                        {isLoading && processingId === plan.product_id ? (
                          <Loader className="w-5 h-5 animate-spin" />
                        ) : (
                          plan.buttonText
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="credits"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-10">
                <h1 className="text-4xl font-bold mb-4">
                  <span className="text-primary">Credits</span>
                </h1>
                <h2 className="text-2xl font-bold mb-2">Pay As You Go</h2>
                <p className="text-muted-foreground max-w-2xl">
                  Use credits for chat, image generation, and prompt enhancement. Buy more, get more bonus credits!
                </p>
              </div>

              {/* Credits Usage Info */}
              <div className="mb-8 p-4 rounded-2xl bg-white/5 border border-white/10">
                <h3 className="text-sm font-bold text-white/60 mb-3">Credits Usage Reference</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {CREDITS_USAGE.map((item, i) => (
                    <div key={i} className="text-center">
                      <div className="text-white font-medium text-sm">{item.action}</div>
                      <div className="text-primary text-xs">{item.cost}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {CREDIT_PACKS.map((pack, index) => (
                  <div
                    key={index}
                    className={`group relative overflow-hidden rounded-2xl bg-card border p-6 hover:border-primary/50 transition-all duration-300 cursor-pointer ${
                      pack.popular ? 'border-primary/30 shadow-[0_0_20px_rgba(255,0,110,0.1)]' : 'border-white/5'
                    }`}
                    onClick={() => handleCheckout(pack.product_id, pack.price, pack.credits + (pack.bonus || 0), 'one-time', `${pack.credits} Credits`)}
                  >
                    {pack.popular && (
                      <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-3 py-1 rounded-bl-xl">
                        POPULAR
                      </div>
                    )}

                    <div className="flex justify-between items-start relative z-10">
                      <div>
                        <div className="text-2xl font-bold text-white mb-1">
                          {pack.credits.toLocaleString()} Credits
                        </div>
                        {pack.bonus > 0 && (
                          <div className="text-primary font-bold text-sm mb-4">
                            +{pack.bonus.toLocaleString()} Bonus Credits!
                          </div>
                        )}
                        {!pack.bonus && <div className="h-5 mb-4"></div>}
                        
                        <div className="text-2xl font-bold text-white">
                          ${pack.price}
                        </div>
                        <div className="text-xs text-white/40 mt-1">
                          ${(pack.price / (pack.credits + (pack.bonus || 0)) * 100).toFixed(2)} per 100 credits
                        </div>
                      </div>
                      
                      {/* Coin Icon Visual */}
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg shadow-yellow-500/20 group-hover:scale-110 transition-transform duration-300">
                        <span className="text-3xl">🪙</span>
                      </div>
                    </div>

                    {/* Background Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    {isLoading && processingId === pack.product_id ? (
                      <div className="absolute bottom-4 right-4">
                        <Loader className="w-5 h-5 animate-spin text-primary" />
                      </div>
                    ) : (
                      <div className="absolute bottom-4 right-4 text-white/20 group-hover:text-primary transition-colors">
                        →
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
