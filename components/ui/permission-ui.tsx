"use client";

import { Button } from "@/components/ui/button";
import { Lock, Sparkles, Zap, Crown } from "lucide-react";
import Link from "next/link";
import { SubscriptionTier } from "@/lib/permissions";

interface UpgradePromptProps {
  requiredTier: SubscriptionTier;
  feature?: string;
  className?: string;
}

const TIER_INFO: Record<SubscriptionTier, { name: string; icon: React.ReactNode; color: string }> = {
  free: { name: "FREE", icon: null, color: "text-white/60" },
  plus: { name: "PLUS", icon: <Zap className="w-4 h-4" />, color: "text-blue-400" },
  pro: { name: "PRO", icon: <Sparkles className="w-4 h-4" />, color: "text-purple-400" },
  ultimate: { name: "ULTIMATE", icon: <Crown className="w-4 h-4" />, color: "text-yellow-400" },
};

/**
 * Shows an upgrade prompt when a feature requires a higher subscription tier
 */
export function UpgradePrompt({ requiredTier, feature, className }: UpgradePromptProps) {
  const tierInfo = TIER_INFO[requiredTier];
  
  return (
    <div className={`flex flex-col items-center justify-center p-6 text-center ${className}`}>
      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
        <Lock className="w-6 h-6 text-white/40" />
      </div>
      
      <h3 className="text-lg font-semibold mb-2">
        {feature ? `${feature} requires` : "Requires"}{" "}
        <span className={tierInfo.color}>{tierInfo.name}</span>
      </h3>
      
      <p className="text-sm text-white/60 mb-4 max-w-xs">
        Upgrade your subscription to unlock this feature and enhance your experience.
      </p>
      
      <Link href="/pricing">
        <Button className="bg-primary hover:bg-primary/90">
          {tierInfo.icon}
          <span className="ml-2">Upgrade to {tierInfo.name}</span>
        </Button>
      </Link>
    </div>
  );
}

/**
 * Shows a low credits warning
 */
export function LowCreditsWarning({ credits, cost }: { credits: number; cost: number }) {
  if (credits >= cost) return null;
  
  return (
    <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm">
      <div className="text-red-400">
        Insufficient credits ({credits}/{cost})
      </div>
      <Link href="/pricing?tab=credits">
        <Button size="sm" variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10">
          Buy Credits
        </Button>
      </Link>
    </div>
  );
}

/**
 * Badge showing subscription tier
 */
export function TierBadge({ tier }: { tier: SubscriptionTier }) {
  const tierInfo = TIER_INFO[tier];
  
  if (tier === "free") return null;
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${tierInfo.color} bg-white/5`}>
      {tierInfo.icon}
      {tierInfo.name}
    </span>
  );
}

/**
 * Locked overlay for features that require upgrade
 */
export function LockedOverlay({ 
  requiredTier, 
  show,
  children 
}: { 
  requiredTier: SubscriptionTier;
  show: boolean;
  children: React.ReactNode;
}) {
  if (!show) return <>{children}</>;
  
  return (
    <div className="relative">
      <div className="opacity-50 pointer-events-none blur-[1px]">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
        <UpgradePrompt requiredTier={requiredTier} />
      </div>
    </div>
  );
}

/**
 * Credits display with buy button
 */
export function CreditsDisplay({ credits }: { credits: number }) {
  return (
    <Link href="/pricing?tab=credits" className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
      <span className="text-lg">🪙</span>
      <span className="font-medium">{credits.toLocaleString()}</span>
    </Link>
  );
}
