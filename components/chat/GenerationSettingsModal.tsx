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
  MessageSquarePlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface AIModel {
  id: string;
  name: string;
  type: "Basic" | "Balanced" | "Creative" | "Premium";
  description: string;
  credits: number;
  performance: {
    consistency: number;
    creativity: number;
    descriptiveness: number;
    memory: number;
  };
}

interface GenerationSettings {
  responseLength: "short" | "default" | "long";
  selectedModel: string;
  pov: "first_person" | "third_person";
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
    credits: 0,
    performance: { consistency: 3, creativity: 2, descriptiveness: 2, memory: 2 }
  },
  {
    id: "pulsar",
    name: "Pulsar",
    type: "Balanced",
    description: "Rhythmic and precise. The perfect balance of logic and creativity.",
    credits: 2,
    performance: { consistency: 4, creativity: 4, descriptiveness: 3, memory: 3 }
  },
  {
    id: "nebula",
    name: "Nebula",
    type: "Creative",
    description: "Vast and colorful. Designed for infinite imagination and rich descriptions.",
    credits: 4,
    performance: { consistency: 3, creativity: 5, descriptiveness: 5, memory: 3 }
  },
  {
    id: "quasar",
    name: "Quasar",
    type: "Premium",
    description: "The brightest light. Deeply immersive, highly intelligent, and powerful.",
    credits: 10,
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

function ModelCard({ model, isSelected, onSelect }: {
  model: AIModel;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      className={`relative group rounded-xl border transition-all duration-300 cursor-pointer overflow-hidden ${
        isSelected
          ? "border-primary bg-primary/10 shadow-[0_0_20px_hsl(var(--primary)/0.15)]"
          : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
      }`}
      onClick={onSelect}
    >
      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute top-3 right-3 w-3 h-3 rounded-full bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.8)] animate-pulse" />
      )}

      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className={`font-bold text-lg ${isSelected ? "text-white" : "text-gray-200"}`}>
                {model.name}
              </h3>
              <Badge variant={isSelected ? "default" : "secondary"} className="text-[10px] px-1.5 py-0 h-5">
                {model.type}
              </Badge>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed pr-6">
              {model.description}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
             {model.credits === 0 ? (
               <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">Free</Badge>
             ) : (
               <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                 {model.credits} Credits
               </Badge>
             )}
          </div>
        </div>
      </div>

      {/* Performance Section - Always Visible */}
      <div className="bg-black/20 border-t border-white/5">
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-x-8 gap-y-3">
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-400">
                <span>Consistency</span>
                <span className="text-gray-500">{model.performance.consistency}/5</span>
              </div>
              <PerformanceBar level={model.performance.consistency} />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-400">
                <span>Creativity</span>
                <span className="text-gray-500">{model.performance.creativity}/5</span>
              </div>
              <PerformanceBar level={model.performance.creativity} />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-400">
                <span>Descriptiveness</span>
                <span className="text-gray-500">{model.performance.descriptiveness}/5</span>
              </div>
              <PerformanceBar level={model.performance.descriptiveness} />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-400">
                <span>Memory</span>
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
  const [localSettings, setLocalSettings] = useState<GenerationSettings>(settings);

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
        <DialogTitle className="sr-only">Generation Settings</DialogTitle>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Generation Settings</h2>
              <p className="text-xs text-gray-400 mt-0.5">Customize your AI companion's behavior</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(85vh-80px)] custom-scrollbar">
          <div className="p-6 space-y-8">

            {/* Roleplay Preferences (New) */}
            <section>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <User className="w-4 h-4" /> Roleplay Preferences
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* POV Setting */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-200">Point of View</label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-black/40 rounded-lg border border-white/5">
                    <button
                      onClick={() => updateSetting("pov", "first_person")}
                      className={`flex flex-col items-center justify-center py-3 px-2 rounded-md text-xs transition-all border ${
                        localSettings.pov === "first_person"
                          ? "bg-primary/20 text-primary border-primary/20 shadow-sm"
                          : "text-gray-400 hover:bg-white/5 hover:text-gray-200 border-transparent"
                      }`}
                    >
                      <User className="w-4 h-4 mb-1.5" />
                      <span className="font-medium">First Person</span>
                      <span className="text-[10px] opacity-60 mt-0.5">"I look at you..."</span>
                    </button>
                    <button
                      onClick={() => updateSetting("pov", "third_person")}
                      className={`flex flex-col items-center justify-center py-3 px-2 rounded-md text-xs transition-all border ${
                        localSettings.pov === "third_person"
                          ? "bg-primary/20 text-primary border-primary/20 shadow-sm"
                          : "text-gray-400 hover:bg-white/5 hover:text-gray-200 border-transparent"
                      }`}
                    >
                      <Users className="w-4 h-4 mb-1.5" />
                      <span className="font-medium">Third Person</span>
                      <span className="text-[10px] opacity-60 mt-0.5">"She looks at you..."</span>
                    </button>
                  </div>
                </div>

                {/* Creativity Setting */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-gray-200">Creativity</label>
                    <span className="text-xs text-primary font-medium capitalize">{localSettings.creativity}</span>
                  </div>
                  <div className="pt-2 px-1">
                    <div className="relative flex justify-between mb-2">
                      <div 
                        className={`cursor-pointer flex flex-col items-center gap-2 transition-all ${localSettings.creativity === 'precise' ? 'opacity-100 scale-105' : 'opacity-40 hover:opacity-70'}`}
                        onClick={() => updateSetting("creativity", "precise")}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${localSettings.creativity === 'precise' ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-gray-800 border-gray-700'}`}>
                          <Zap className="w-4 h-4" />
                        </div>
                        <span className="text-[10px]">Precise</span>
                      </div>
                      
                      <div 
                        className={`cursor-pointer flex flex-col items-center gap-2 transition-all ${localSettings.creativity === 'balanced' ? 'opacity-100 scale-105' : 'opacity-40 hover:opacity-70'}`}
                        onClick={() => updateSetting("creativity", "balanced")}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${localSettings.creativity === 'balanced' ? 'bg-primary/20 border-primary text-primary' : 'bg-gray-800 border-gray-700'}`}>
                          <Brain className="w-4 h-4" />
                        </div>
                        <span className="text-[10px]">Balanced</span>
                      </div>

                      <div 
                        className={`cursor-pointer flex flex-col items-center gap-2 transition-all ${localSettings.creativity === 'creative' ? 'opacity-100 scale-105' : 'opacity-40 hover:opacity-70'}`}
                        onClick={() => updateSetting("creativity", "creative")}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${localSettings.creativity === 'creative' ? 'bg-purple-500/20 border-purple-500 text-purple-400' : 'bg-gray-800 border-gray-700'}`}>
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <span className="text-[10px]">Creative</span>
                      </div>
                      
                      {/* Connecting Line */}
                      <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-800 -z-10" />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <div className="h-px bg-white/5" />

            {/* Response Length */}
            <section>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <AlignLeft className="w-4 h-4" /> Response Length
              </h3>
              
              <div className="grid grid-cols-3 gap-3">
                {(["short", "default", "long"] as const).map((length) => (
                  <button
                    key={length}
                    onClick={() => updateSetting("responseLength", length)}
                    className={`relative flex flex-col items-center gap-3 p-4 rounded-xl border transition-all duration-200 ${
                      localSettings.responseLength === length
                        ? "bg-primary/10 border-primary text-primary shadow-[0_0_15px_hsl(var(--primary)/0.1)]"
                        : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/20"
                    }`}
                  >
                    {length === "short" && <MessageSquare className="w-6 h-6" />}
                    {length === "default" && <MessageSquarePlus className="w-6 h-6" />}
                    {length === "long" && <FileText className="w-6 h-6" />}
                    
                    <span className="text-xs font-medium capitalize">{length}</span>
                    
                    {length === "long" && localSettings.responseLength !== "long" && (
                      <div className="absolute top-2 right-2">
                        <span className="text-[10px] opacity-50">🔒</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </section>

            <div className="h-px bg-white/5" />

            {/* Models Section */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <Brain className="w-4 h-4" /> AI Model
                </h3>
                <a href="#" className="text-xs text-primary hover:underline">Compare models</a>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {AI_MODELS.map((model) => (
                  <ModelCard
                    key={model.id}
                    model={model}
                    isSelected={localSettings.selectedModel === model.id}
                    onSelect={() => updateSetting("selectedModel", model.id)}
                  />
                ))}
              </div>
            </section>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}