"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Loader, Zap, Sparkles, Crown, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { loadStripe } from "@stripe/stripe-js";
import { toast } from "sonner";
import { useAppContext } from "@/contexts/app";

// Mock Data for Subscriptions
const SUBSCRIPTION_PLANS = [
  {
    id: "free",
    name: "FREE",
    description: "All the Basics",
    price: { monthly: 0, yearly: 0 },
    features: [
      "10 Generations / Day",
      "4 customizations",
      "15 Messages / Day",
      "15 Messages in Memory",
      "1 Photo Message"
    ],
    highlight: false,
    buttonText: "Current Plan",
    disabled: true
  },
  {
    id: "premium",
    name: "PREMIUM",
    description: "Create Your Dreams",
    price: { monthly: 9.99, yearly: 6.99 },
    originalPrice: { monthly: 9.99, yearly: 9.99 },
    save: "$36/year",
    features: [
      "100 Generations / Day",
      "45+ addt'l customizations",
      "6000 Messages/Mo",
      "25 Messages in Memory",
      "Faster Messaging Time"
    ],
    highlight: false,
    buttonText: "Subscribe",
    product_id: "price_premium_id" // Replace with real Stripe ID
  },
  {
    id: "pro",
    name: "PRO",
    description: "Fuel Your Fantasy",
    price: { monthly: 19.99, yearly: 13.99 },
    originalPrice: { monthly: 19.99, yearly: 19.99 },
    save: "$72/year",
    features: [
      "Unlimited Generations",
      "95+ addt'l customizations",
      "HD Generations",
      "9000 Messages/Mo",
      "35 Messages in Memory"
    ],
    highlight: false,
    buttonText: "Subscribe",
    product_id: "price_pro_id"
  },
  {
    id: "ultimate",
    name: "ULTIMATE",
    description: "Limitless Creativity",
    price: { monthly: 29.99, yearly: 20.99 },
    originalPrice: { monthly: 29.99, yearly: 29.99 },
    save: "$108/year",
    features: [
      "Unlimited HD Generations",
      "Create Unlimited Photos of Custom Girls",
      "Best models & all 350+ customizations",
      "Landscape and portrait modes",
      "Unlimited messaging (incl photos)"
    ],
    highlight: true,
    buttonText: "Subscribe",
    product_id: "price_ultimate_id"
  }
];

// Mock Data for Credits
const CREDIT_PACKS = [
  {
    credits: 2500,
    price: 4.99,
    bonus: 0,
    product_id: "credits_2500"
  },
  {
    credits: 5500,
    price: 10.99,
    bonus: 100,
    product_id: "credits_5500"
  },
  {
    credits: 11000,
    price: 21.99,
    bonus: 600,
    product_id: "credits_11000"
  },
  {
    credits: 18000,
    price: 35.99,
    bonus: 2000,
    product_id: "credits_18000"
  },
  {
    credits: 25000,
    price: 49.99,
    bonus: 5000,
    product_id: "credits_25000"
  },
  {
    credits: 50000,
    price: 99.99,
    bonus: 15000,
    product_id: "credits_50000"
  }
];

import { useSearchParams } from "next/navigation";

// ...

export default function PricingPage() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'credits' ? 'credits' : 'subscriptions';
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'credits'>(initialTab);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('ultimate');
  const { user, setShowSignModal } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleCheckout = async (productId: string, price: number) => {
    if (!user) {
      setShowSignModal(true);
      return;
    }

    setIsLoading(true);
    setProcessingId(productId);

    try {
      // Mock checkout API call - replace with real implementation
      // For now, we just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Real implementation would look like this:
      /*
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId, amount: price })
      });
      const data = await response.json();
      // Redirect to Stripe...
      */
      
      toast.info("Checkout integration required with backend");
      
    } catch (error) {
      toast.error("Checkout failed");
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
                <h1 className="text-4xl font-bold mb-4">Upgrade Your Experience.</h1>
                <p className="text-muted-foreground max-w-2xl">
                  Join 500,000+ users and take your journey to the next level by creating unlimited fantasies, characters, and images.
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
                    Yearly <span className="text-primary text-xs ml-1">30% off</span>
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
                      } ${plan.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isSelected && (
                        <div className="absolute -top-3 right-6 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                          SELECTED
                        </div>
                      )}

                      <div className="mb-6">
                        <h3 className={`text-lg font-bold mb-1 ${isSelected ? 'text-primary' : 'text-white'}`}>{plan.name}</h3>
                        <p className="text-sm text-white/60 mb-4">{plan.description}</p>
                        
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-bold text-white">
                            ${plan.price[billingCycle]}
                          </span>
                          <span className="text-white/40 text-sm">/mo</span>
                        </div>
                        
                        {billingCycle === 'yearly' && plan.price.yearly > 0 && (
                          <div className="text-xs mt-1 space-y-1">
                            <div className="text-white/40">Billed annually at ${(plan.price.yearly * 12).toFixed(2)}</div>
                            {plan.originalPrice && (
                              <div className="text-primary font-medium">
                                <span className="line-through text-white/30 mr-2">${(plan.originalPrice.yearly * 12).toFixed(2)}</span>
                                Save ${((plan.originalPrice.yearly - plan.price.yearly) * 12).toFixed(2)}/year
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex-grow space-y-3 mb-8">
                        {plan.features.map((feature, i) => (
                          <div key={i} className="flex items-start gap-3 text-sm text-white/80">
                            <Check className={`w-4 h-4 shrink-0 mt-0.5 ${isSelected ? 'text-primary' : 'text-white/40'}`} />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>

                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (plan.product_id) handleCheckout(plan.product_id, plan.price[billingCycle]);
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
                <h1 className="text-4xl font-bold mb-4 text-primary">Credits</h1>
                <h2 className="text-2xl font-bold mb-2">Enhance Your Journey.</h2>
                <p className="text-muted-foreground max-w-2xl">
                  Credits unlock significant roleplay upgrades including improved storytelling and contextual memory.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {CREDIT_PACKS.map((pack, index) => (
                  <div
                    key={index}
                    className="group relative overflow-hidden rounded-2xl bg-card border border-white/5 p-6 hover:border-primary/50 transition-all duration-300 cursor-pointer"
                    onClick={() => handleCheckout(pack.product_id, pack.price)}
                  >
                    <div className="flex justify-between items-start relative z-10">
                      <div>
                        <div className="text-2xl font-bold text-white mb-1">
                          {pack.credits.toLocaleString()} Credits
                        </div>
                        {pack.bonus > 0 && (
                          <div className="text-primary font-bold text-sm mb-6">
                            +{pack.bonus.toLocaleString()} Credits FREE!
                          </div>
                        )}
                        {!pack.bonus && <div className="h-5 mb-6"></div>}
                        
                        <div className="text-xl font-bold text-white">
                          ${pack.price}
                        </div>
                      </div>
                      
                      {/* Coin Icon Visual */}
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg shadow-yellow-500/20 group-hover:scale-110 transition-transform duration-300">
                        <span className="text-3xl">🪙</span>
                      </div>
                    </div>

                    {/* Background Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <div className="absolute bottom-4 right-4 text-white/20 group-hover:text-primary transition-colors">
                      →
                    </div>
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
