"use client";

import { useState } from "react";
import { X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AIModel {
  id: string;
  name: string;
  description: string;
  credits: number;
  performance: {
    consistency: number;
    creativity: number;
    descriptiveness: number;
    memory: number;
  };
  isPremium?: boolean;
}

interface GenerationSettings {
  responseLength: "short" | "default" | "long";
  includeNarrator: boolean;
  narratorVoice: string;
  selectedModel: string;
}

interface GenerationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GenerationSettings;
  onSettingsChange: (settings: GenerationSettings) => void;
}

const AI_MODELS: AIModel[] = [
  {
    id: "nectar_basic",
    name: "Nectar Basic Model",
    description: "A great starting point for immersive roleplay. Excellent for shorter to medium length...",
    credits: 0,
    performance: { consistency: 2, creativity: 2, descriptiveness: 3, memory: 1 }
  },
  {
    id: "nevoria",
    name: "Nevoria",
    description: "Designed for balance and flexibility, this model is an excellent option for all types of characters an...",
    credits: 2,
    performance: { consistency: 3, creativity: 4, descriptiveness: 4, memory: 2 }
  },
  {
    id: "fuchsia",
    name: "Fuchsia",
    description: "A premier model that excels with faster-paced roleplays. Its large memory allows for long...",
    credits: 5,
    performance: { consistency: 3, creativity: 3, descriptiveness: 5, memory: 3 }
  },
  {
    id: "deepseek_v3",
    name: "DeepSeek V3",
    description: "A state of the art model that is great for slower-paced roleplays. Responses often have a lot of...",
    credits: 5,
    performance: { consistency: 4, creativity: 3, descriptiveness: 4, memory: 4 }
  },
  {
    id: "orchid",
    name: "Orchid",
    description: "Our flagship model brings characters and fantasies to life with a vivid and natural portrayal...",
    credits: 10,
    performance: { consistency: 5, creativity: 5, descriptiveness: 5, memory: 4 }
  }
];

function PerformanceBar({ level, total = 5 }: { level: number; total?: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`w-3 h-2 rounded-sm ${
            i < level ? "bg-red-500" : "bg-gray-600"
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
      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
        isSelected
          ? "border-red-500 bg-red-500/10"
          : "border-gray-600 bg-gray-800/50 hover:border-gray-500"
      }`}
      onClick={onSelect}
    >
      <div className="mb-3">
        <h3 className="font-semibold text-white mb-2">{model.name}</h3>
        <p className="text-sm text-gray-300 leading-relaxed">
          {model.description}
        </p>
        <Button variant="ghost" className="text-gray-400 text-xs p-0 h-auto mt-1">
          View more <ChevronDown className="ml-1 h-3 w-3" />
        </Button>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-400 mb-2">MODEL PERFORMANCE</p>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-300">Consistency</span>
            <PerformanceBar level={model.performance.consistency} />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-300">Creativity</span>
            <PerformanceBar level={model.performance.creativity} />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-300">Descriptiveness</span>
            <PerformanceBar level={model.performance.descriptiveness} />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-300">Memory</span>
            <PerformanceBar level={model.performance.memory} />
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-600">
          {model.credits === 0 ? (
            <p className="text-sm text-gray-400">Based on your plan limit.</p>
          ) : (
            <p className="text-sm text-white font-medium">
              {model.credits} Credits <span className="text-red-500">✦</span> / Message
            </p>
          )}
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
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 bg-gray-900 text-white border-gray-700 overflow-hidden">
        <DialogTitle className="sr-only">Generation Settings</DialogTitle>

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold">Generation Settings</h2>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="p-6 space-y-8">

            {/* Response Length */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Response Length</h3>
              <p className="text-gray-300 text-sm mb-4">
                Choose how long or short you want your companion responses to be.
              </p>
              <div className="flex gap-2">
                {(["short", "default", "long"] as const).map((length) => (
                  <Button
                    key={length}
                    variant={localSettings.responseLength === length ? "default" : "outline"}
                    className={`capitalize ${
                      localSettings.responseLength === length
                        ? "bg-red-500 text-white hover:bg-red-600 border-red-500"
                        : "border-gray-600 text-gray-200 bg-gray-800 hover:bg-gray-700 hover:border-gray-500"
                    } ${
                      length === "long" && localSettings.responseLength !== length
                        ? "border-red-500 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                        : ""
                    }`}
                    onClick={() => updateSetting("responseLength", length)}
                  >
                    {length}
                    {length === "long" && <span className="ml-1 text-current">🔒</span>}
                  </Button>
                ))}
              </div>
            </div>

            {/* Speech Section */}
            <div className="border-t border-gray-700 pt-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    Speech
                    <Badge variant="destructive" className="text-xs">New</Badge>
                  </h3>
                </div>
                <p className="text-sm text-gray-400">Based on your plan limit.</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Include Narrator</p>
                    <p className="text-sm text-gray-300">
                      The narrator will speak the <u>actions</u> in the message.
                    </p>
                  </div>
                  <Switch
                    checked={localSettings.includeNarrator}
                    onCheckedChange={(checked) => updateSetting("includeNarrator", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <p className="font-medium">Narrator Voice</p>
                  <Select
                    value={localSettings.narratorVoice}
                    onValueChange={(value) => updateSetting("narratorVoice", value)}
                  >
                    <SelectTrigger className="w-48 bg-gray-800 border-gray-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Narrator Male</SelectItem>
                      <SelectItem value="female">Narrator Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Models Section */}
            <div className="border-t border-gray-700 pt-8">
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Models</h3>
                <p className="text-gray-300 text-sm">
                  Choose the AI model that best suits your needs.{" "}
                  <button className="text-blue-400 underline">Learn more</button>
                </p>
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
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}