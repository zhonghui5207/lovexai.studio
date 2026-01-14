"use client";

import { useState } from "react";
import {
  X,
  User,
  Users,
  Sparkles,
  Zap,
  Brain,
  AlignLeft,
  AlignJustify,
  FileText,
  MessageSquare,
  MessageSquarePlus,
  Lock,
  Crown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAppContext } from "@/contexts/app";
import Link from "next/link";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

// Subscription tier for model access
type SubscriptionTier = 'free' | 'plus' | 'pro' | 'ultimate';

interface AIModel {
  id: string;
  name: string;
  type: "Basic" | "Balanced" | "Creative" | "Premium";
  description: string;
  credits: number;
  requiredTier: SubscriptionTier;
  performance: {
    consistency: number;
    creativity: number;
    descriptiveness: number;
    memory: number;
  };
}

// Tier hierarchy for access check
const TIER_HIERARCHY: Record<SubscriptionTier, number> = {
  free: 0,
  plus: 1,
  pro: 2,
  ultimate: 3,
};

interface GenerationSettings {
  responseLength: "short" | "default" | "long";
  selectedModel: string;
  creativity: "precise" | "balanced" | "creative";
}

interface GenerationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GenerationSettings;
  onSettingsChange: (settings: GenerationSettings) => void;
}

const AI_MODELS: AIModel[] = [
  {
    id: "nova",
    name: "Nova",
    type: "Basic",
    description: "Fast and efficient. A bright new star perfect for casual chatting.",
    credits: 2,
    requiredTier: 'free',
    performance: { consistency: 3, creativity: 2, descriptiveness: 2, memory: 2 }
  },
  {
    id: "pulsar",
    name: "Pulsar",
    type: "Balanced",
    description: "Rhythmic and precise. The perfect balance of logic and creativity.",
    credits: 4,
    requiredTier: 'plus',
    performance: { consistency: 4, creativity: 4, descriptiveness: 3, memory: 3 }
  },
  {
    id: "nebula",
    name: "Nebula",
    type: "Creative",
    description: "Vast and colorful. Designed for infinite imagination and rich descriptions.",
    credits: 6,
    requiredTier: 'pro',
    performance: { consistency: 3, creativity: 5, descriptiveness: 5, memory: 3 }
  },
  {
    id: "quasar",
    name: "Quasar",
    type: "Premium",
    description: "The brightest light. Deeply immersive, highly intelligent, and powerful.",
    credits: 10,
    requiredTier: 'ultimate',
    performance: { consistency: 5, creativity: 5, descriptiveness: 5, memory: 5 }
  }
];

function PerformanceBar({ level, total = 5 }: { level: number; total?: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`w-full h-1.5 rounded-full transition-all duration-300 ${
            i < level 
              ? "bg-gradient-to-r from-primary/80 to-primary shadow-[0_0_8px_hsl(var(--primary)/0.5)]" 
              : "bg-white/10"
          }`}
        />
      ))}
    </div>
  );
}

function ModelCard({ model, isSelected, onSelect, userTier, onLockedClick }: {
  model: AIModel;
  isSelected: boolean;
  onSelect: () => void;
  userTier: SubscriptionTier;
  onLockedClick: (model: AIModel) => void;
}) {
  const t = useTranslations();
  const userTierLevel = TIER_HIERARCHY[userTier];
  const requiredLevel = TIER_HIERARCHY[model.requiredTier];
  const isLocked = userTierLevel < requiredLevel;
  
  const handleClick = () => {
    if (isLocked) {
      onLockedClick(model);
      return;
    }
    onSelect();
  };
  
  return (
    <div
      className={`relative group rounded-xl border transition-all duration-300 overflow-hidden ${
        isLocked 
          ? "border-white/5 bg-white/[0.02] cursor-not-allowed opacity-60"
          : isSelected
            ? "border-primary bg-primary/10 shadow-[0_0_20px_hsl(var(--primary)/0.15)] cursor-pointer"
            : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10 cursor-pointer"
      }`}
      onClick={handleClick}
    >
      {/* Lock Overlay for locked models */}
      {isLocked && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <Lock className="w-5 h-5 text-white/60" />
            </div>
            <span className="text-xs font-medium text-white/60">
              {t('generation_settings.tier_required', { tier: t(`tiers.${model.requiredTier}`) })}
            </span>
          </div>
        </div>
      )}
      
      {/* Selection Indicator */}
      {isSelected && !isLocked && (
        <div className="absolute top-3 right-3 w-3 h-3 rounded-full bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.8)] animate-pulse z-20" />
      )}

      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className={`font-bold text-lg ${isSelected ? "text-white" : "text-gray-200"}`}>
                {model.name}
              </h3>
              <Badge
                variant={isSelected ? "default" : "secondary"}
                className={`text-[10px] px-1.5 py-0 h-5 ${
                  model.requiredTier === 'ultimate' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                  model.requiredTier === 'pro' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
                  model.requiredTier === 'plus' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                  ''
                }`}
              >
                {t(`tiers.${model.requiredTier}`)}
              </Badge>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed pr-6">
              {model.description}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
             <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
               {t('generation_settings.credits_per_msg', { credits: model.credits })}
             </Badge>
          </div>
        </div>
      </div>

      {/* Performance Section - Always Visible */}
      <div className="bg-black/20 border-t border-white/5">
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-x-8 gap-y-3">
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-400">
                <span>{t('model_stats.consistency')}</span>
                <span className="text-gray-500">{model.performance.consistency}/5</span>
              </div>
              <PerformanceBar level={model.performance.consistency} />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-400">
                <span>{t('model_stats.creativity')}</span>
                <span className="text-gray-500">{model.performance.creativity}/5</span>
              </div>
              <PerformanceBar level={model.performance.creativity} />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-400">
                <span>{t('model_stats.descriptiveness')}</span>
                <span className="text-gray-500">{model.performance.descriptiveness}/5</span>
              </div>
              <PerformanceBar level={model.performance.descriptiveness} />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-400">
                <span>{t('model_stats.memory')}</span>
                <span className="text-gray-500">{model.performance.memory}/5</span>
              </div>
              <PerformanceBar level={model.performance.memory} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GenerationSettingsModal({
  isOpen,
  onClose,
  settings,
  onSettingsChange
}: GenerationSettingsModalProps) {
  const t = useTranslations();
  const [localSettings, setLocalSettings] = useState<GenerationSettings>(settings);
  const [lockedModel, setLockedModel] = useState<AIModel | null>(null);
  const { user } = useAppContext();
  
  // Get user subscription tier from Convex
  const convexUser = useQuery(api.users.getByEmail, user?.email ? { email: user.email } : "skip");
  const userTier: SubscriptionTier = (convexUser?.subscription_tier as SubscriptionTier) || 'free';

  const updateSetting = <K extends keyof GenerationSettings>(
    key: K,
    value: GenerationSettings[K]
  ) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 bg-[#0B0E14] text-white border-white/10 shadow-2xl overflow-hidden">
        <DialogTitle className="sr-only">{t('generation_settings.title')}</DialogTitle>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">{t('generation_settings.title')}</h2>
              <p className="text-xs text-gray-400 mt-0.5">{t('generation_settings.subtitle')}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(85vh-80px)] custom-scrollbar">
          <div className="p-6 space-y-8">

            {/* Creativity Setting */}
            <section>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4" /> {t('generation_settings.creativity')}
              </h3>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">{t('generation_settings.creativity_desc')}</span>
                  <span className="text-xs text-primary font-medium capitalize">{t(`generation_settings.creativity_${localSettings.creativity}`)}</span>
                </div>

                <div className="relative flex justify-between items-center px-8 py-4 bg-black/40 rounded-lg border border-white/5 overflow-hidden">
                  {/* Precise */}
                  <div
                    className={`cursor-pointer flex flex-col items-center gap-2 transition-all ${
                      localSettings.creativity === 'precise' ? 'opacity-100' : 'opacity-40 hover:opacity-70'
                    }`}
                    onClick={() => updateSetting("creativity", "precise")}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                      localSettings.creativity === 'precise'
                        ? 'bg-blue-500/20 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.4)]'
                        : 'bg-gray-800 border-gray-700 text-gray-500'
                    }`}>
                      <Zap className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-medium">{t('generation_settings.creativity_precise')}</span>
                  </div>

                  {/* Balanced */}
                  <div
                    className={`cursor-pointer flex flex-col items-center gap-2 transition-all ${
                      localSettings.creativity === 'balanced' ? 'opacity-100' : 'opacity-40 hover:opacity-70'
                    }`}
                    onClick={() => updateSetting("creativity", "balanced")}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                      localSettings.creativity === 'balanced'
                        ? 'bg-primary/20 border-primary text-primary shadow-[0_0_15px_hsl(var(--primary)/0.4)]'
                        : 'bg-gray-800 border-gray-700 text-gray-500'
                    }`}>
                      <Brain className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-medium">{t('generation_settings.creativity_balanced')}</span>
                  </div>

                  {/* Creative */}
                  <div
                    className={`cursor-pointer flex flex-col items-center gap-2 transition-all ${
                      localSettings.creativity === 'creative' ? 'opacity-100' : 'opacity-40 hover:opacity-70'
                    }`}
                    onClick={() => updateSetting("creativity", "creative")}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                      localSettings.creativity === 'creative'
                        ? 'bg-purple-500/20 border-purple-500 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                        : 'bg-gray-800 border-gray-700 text-gray-500'
                    }`}>
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-medium">{t('generation_settings.creativity_creative')}</span>
                  </div>

                  {/* Connecting Line */}
                  <div className="absolute top-[38px] left-[72px] right-[72px] h-0.5 bg-gray-700 -z-10" />
                </div>
              </div>
            </section>

            <div className="h-px bg-white/5" />

            {/* Response Length */}
            <section>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <AlignLeft className="w-4 h-4" /> {t('generation_settings.response_length')}
              </h3>

              <div className="grid grid-cols-3 gap-3">
                {([
                  { id: "short" as const, labelKey: "response_short", icon: MessageSquare, requiredTier: 'free' as SubscriptionTier },
                  { id: "default" as const, labelKey: "response_default", icon: MessageSquarePlus, requiredTier: 'free' as SubscriptionTier },
                  { id: "long" as const, labelKey: "response_long", icon: FileText, requiredTier: 'pro' as SubscriptionTier },
                ]).map((option) => {
                  const isLongLocked = option.id === 'long' && TIER_HIERARCHY[userTier] < TIER_HIERARCHY['pro'];
                  const IconComponent = option.icon;

                  return (
                    <button
                      key={option.id}
                      onClick={() => {
                        if (isLongLocked) {
                          setLockedModel({
                            id: 'long-response',
                            name: t('generation_settings.long_response'),
                            type: 'Premium',
                            description: t('generation_settings.long_response_desc'),
                            credits: 0,
                            requiredTier: 'pro',
                            performance: { consistency: 0, creativity: 0, descriptiveness: 0, memory: 0 }
                          } as AIModel);
                          return;
                        }
                        updateSetting("responseLength", option.id);
                      }}
                      className={`relative flex flex-col items-center gap-3 p-4 rounded-xl border transition-all duration-200 ${
                        isLongLocked
                          ? "bg-white/[0.02] border-white/10 text-gray-500 cursor-pointer hover:bg-white/5"
                          : localSettings.responseLength === option.id
                            ? "bg-primary/10 border-primary text-primary shadow-[0_0_15px_hsl(var(--primary)/0.1)]"
                            : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/20"
                      }`}
                    >
                      <IconComponent className="w-6 h-6" />
                      <span className="text-xs font-medium capitalize">{t(`generation_settings.${option.labelKey}`)}</span>

                      {isLongLocked && (
                        <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 bg-purple-500/20 rounded">
                          <Lock className="w-2.5 h-2.5 text-purple-400" />
                          <span className="text-[9px] text-purple-400 font-medium">{t('tiers.pro').toUpperCase()}</span>
                        </div>
                      )}

                      {option.id === 'long' && !isLongLocked && (
                        <div className="absolute top-2 right-2">
                          <span className="text-[10px] px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded font-medium">{t('tiers.pro').toUpperCase()}</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

            <div className="h-px bg-white/5" />

            {/* Models Section */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <Brain className="w-4 h-4" /> {t('generation_settings.ai_model')}
                </h3>
                <a href="#" className="text-xs text-primary hover:underline">{t('generation_settings.compare_models')}</a>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {AI_MODELS.map((model) => (
                  <ModelCard
                    key={model.id}
                    model={model}
                    isSelected={localSettings.selectedModel === model.id}
                    onSelect={() => updateSetting("selectedModel", model.id)}
                    userTier={userTier}
                    onLockedClick={setLockedModel}
                  />
                ))}
              </div>
            </section>
          </div>
        </div>
      </DialogContent>
      
      {/* Upgrade Required Modal */}
      <Dialog open={!!lockedModel} onOpenChange={() => setLockedModel(null)}>
        <DialogContent className="max-w-sm p-0 bg-neutral-900 border-white/10 text-white overflow-hidden">
          <div className="p-6 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <DialogTitle className="text-xl font-bold text-white mb-2">
              {t('generation_settings.upgrade_title', {
                feature: lockedModel?.name || '',
                tier: t(`tiers.${lockedModel?.requiredTier || 'plus'}`)
              })}
            </DialogTitle>
            <p className="text-sm text-white/60 mb-6">
              {t('generation_settings.upgrade_desc', { feature: lockedModel?.name || '' })}
            </p>

            <div className="flex flex-col gap-3">
              <Link href="/pricing" className="w-full" onClick={() => setLockedModel(null)}>
                <Button className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 h-11">
                  <Crown className="w-4 h-4 mr-2" />
                  {t('generation_settings.upgrade_button', { tier: t(`tiers.${lockedModel?.requiredTier || 'plus'}`) })}
                </Button>
              </Link>
              <Button
                variant="ghost"
                className="w-full text-white/60 hover:text-white hover:bg-white/5"
                onClick={() => setLockedModel(null)}
              >
                {t('common.maybe_later')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}