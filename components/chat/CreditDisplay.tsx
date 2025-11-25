"use client";

import { AlertTriangle, Sparkles } from "lucide-react";
import { useCredits } from "../../contexts/CreditsContext";

export default function CreditDisplay({ 
  creditsPerMessage, 
  simpleMode = false 
}: { 
  creditsPerMessage: number;
  simpleMode?: boolean;
}) {
  const { credits, isLoading } = useCredits();

  const isLowCredits = credits < creditsPerMessage * 3;
  const cannotAffordMessage = credits < creditsPerMessage;

  if (simpleMode) {
    return (
      <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
        <Sparkles className="w-3.5 h-3.5 fill-current" />
        <span>{isLoading ? "..." : credits}</span>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Loading credits...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3 ${
      cannotAffordMessage ? 'bg-red-50/80 border-red-200' :
      isLowCredits ? 'bg-yellow-50/80 border-yellow-200' : ''
    }`}>
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* 积分余额显示 */}
          <div className="flex items-center gap-2">
            <Coins className={`w-4 h-4 ${
              cannotAffordMessage ? 'text-red-600' :
              isLowCredits ? 'text-yellow-600' : 'text-green-600'
            }`} />
            <span className={`text-sm font-medium ${
              cannotAffordMessage ? 'text-red-700' :
              isLowCredits ? 'text-yellow-700' : 'text-foreground'
            }`}>
              {credits} Credits
            </span>
          </div>

          {/* 每条消息消耗 */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">
              {creditsPerMessage} credits/message
            </span>
          </div>

          {/* 剩余消息数量 */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">
              (~{Math.floor(credits / creditsPerMessage)} messages left)
            </span>
          </div>
        </div>

        {/* 警告信息 */}
        {cannotAffordMessage && (
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">
              Insufficient credits! Please top up.
            </span>
          </div>
        )}

        {isLowCredits && !cannotAffordMessage && (
          <div className="flex items-center gap-2 text-yellow-600">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">
              Low credits - consider topping up soon!
            </span>
          </div>
        )}
      </div>
    </div>
  );
}