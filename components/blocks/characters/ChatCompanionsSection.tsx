"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface CompanionCharacter {
  id: string;
  name: string;
  avatar: string;
  description: string;
  chatCount: string;
  isOfficial: boolean;
}

interface CompanionCardProps {
  character: CompanionCharacter;
  onClick: () => void;
}

function CompanionCard({ character, onClick }: CompanionCardProps) {
  return (
    <div 
      className="group relative overflow-hidden rounded-xl bg-card border hover:shadow-lg transition-all duration-300 cursor-pointer p-4"
      onClick={onClick}
    >
      {/* Chat count at top - Nectar.AI Style */}
      <div className="text-center mb-3">
        <span className="text-2xl font-bold text-primary">{character.chatCount}</span>
      </div>
      
      {/* Character Avatar - Circular */}
      <div className="relative w-20 h-20 mx-auto mb-4">
        <img
          src={character.avatar}
          alt={character.name}
          className="w-full h-full object-cover rounded-full border-2 border-primary/20 transition-transform duration-300 group-hover:scale-105"
        />
        {/* Online indicator */}
        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-background"></div>
      </div>
      
      {/* Character Info */}
      <div className="text-center">
        <h3 className="font-bold text-lg mb-2">{character.name}</h3>
        <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
          {character.description}
        </p>
      </div>
    </div>
  );
}

const COMPANION_CHARACTERS: CompanionCharacter[] = [
  {
    id: "emma_001",
    name: "Emma",
    avatar: "https://cdn.lovexai.studio/Character/ComfyUI_00015_.png",
    description: "Your Best Friend's Sister - Playful and flirtatious, with a mischievous streak that keeps you on your toes.",
    chatCount: "287K",
    isOfficial: false
  },
  {
    id: "sophia_002",
    name: "Sophia",
    avatar: "https://cdn.lovexai.studio/Character/ComfyUI_00020_.png",
    description: "Wonder Powers Best - The epitome of grace and kindness, perfect for deep, meaningful conversations.",
    chatCount: "262K",
    isOfficial: false
  },
  {
    id: "luna_003",
    name: "Luna",
    avatar: "https://cdn.lovexai.studio/Character/ComfyUI_00027_.png",
    description: "Your Yandere Admirer - Intensely passionate with a mysterious aura that draws you in completely.",
    chatCount: "189K",
    isOfficial: false
  },
  {
    id: "aria_004",
    name: "Aria",
    avatar: "https://cdn.lovexai.studio/Character/ComfyUI_00029_.png",
    description: "A Mother's Intuition - Naturally nurturing with wisdom that makes her both comforting and inspiring.",
    chatCount: "169K",
    isOfficial: false
  },
  {
    id: "zoe_005",
    name: "Zoe",
    avatar: "https://cdn.lovexai.studio/Character/flux_krea_00004_.png",
    description: "The Artist's Soul - Creative and passionate, she sees beauty in everything and lives authentically.",
    chatCount: "132K",
    isOfficial: false
  }
];

export default function ChatCompanionsSection() {
  const handleCharacterClick = (characterId: string) => {
    console.log('Navigate to companion:', characterId);
    // TODO: Navigate to chat page
  };

  return (
    <section className="py-16 bg-muted/30">
      <div className="container max-w-screen-2xl">
        {/* Section Header - Nectar.AI Style */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-2">
              <span className="text-red-500">💬</span>
              Chat with Immersive AI Companions
            </h2>
            <p className="text-muted-foreground mt-2">
              Chat now or create whoever, however. Adaptable and Unique.
            </p>
          </div>
          <Button variant="outline" className="text-primary hover:bg-primary/10">
            See More →
          </Button>
        </div>
        
        {/* Companion Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {COMPANION_CHARACTERS.map((character) => (
            <CompanionCard
              key={character.id}
              character={character}
              onClick={() => handleCharacterClick(character.id)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}