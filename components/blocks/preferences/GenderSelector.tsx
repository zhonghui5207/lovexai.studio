"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";

type GenderType = 'female' | 'male' | 'anime';

export default function GenderSelector() {
  const [selectedGender, setSelectedGender] = useState<GenderType>('female');
  const [nsfwEnabled, setNsfwEnabled] = useState(false);

  const genderOptions = [
    { key: 'female' as const, label: 'Girls', icon: '👩' },
    { key: 'male' as const, label: 'Guys', icon: '👨' },
    { key: 'anime' as const, label: 'Anime', icon: '🎭' }
  ];

  return (
    <div className="border-b bg-muted/30">
      <div className="container flex items-center justify-between py-3 max-w-screen-2xl">
        {/* Gender Selection Tabs - Strict Nectar.AI Style */}
        <div className="flex items-center">
          {genderOptions.map((option) => (
            <button
              key={option.key}
              onClick={() => setSelectedGender(option.key)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all border-b-2 ${
                selectedGender === option.key 
                  ? 'border-primary text-primary bg-background/60 rounded-t-md' 
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-background/30 rounded-t-md'
              }`}
            >
              <span className="text-base">{option.icon}</span>
              {option.label}
            </button>
          ))}
        </div>
        
        {/* NSFW Toggle - Nectar.AI Style */}
        <div className="flex items-center space-x-3">
          <span className="text-sm text-muted-foreground font-medium">Allow NSFW</span>
          <Switch 
            checked={nsfwEnabled} 
            onCheckedChange={setNsfwEnabled}
            className="data-[state=checked]:bg-primary"
          />
        </div>
      </div>
    </div>
  );
}