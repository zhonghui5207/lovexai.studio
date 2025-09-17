"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

interface Character {
  id: string;
  name: string;
  avatar: string;
  description: string;
  traits: string[];
  greeting: string;
  chatCount: string;
  isOfficial: boolean;
}

interface CharacterCardProps {
  character: Character;
  onClick: () => void;
}

function CharacterCard({ character, onClick }: CharacterCardProps) {
  return (
    <div 
      className="group relative overflow-hidden rounded-xl bg-card border hover:shadow-lg transition-all duration-300 cursor-pointer"
      onClick={onClick}
    >
      {/* Character Avatar - Large like Nectar.AI */}
      <div className="relative aspect-[4/5] overflow-hidden">
        <img
          src={character.avatar}
          alt={character.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Character name and description overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <h3 className="text-lg font-bold mb-1">{character.name}</h3>
          <p className="text-sm text-white/90 line-clamp-2 mb-2">{character.description}</p>
          
          {/* Chat count - Prominent like Nectar.AI */}
          <div className="flex items-center gap-1 text-white/90">
            <MessageCircle className="h-4 w-4" />
            <span className="text-sm font-medium">{character.chatCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const FEATURED_CHARACTERS: Character[] = [
  {
    id: "emma_001",
    name: "Emma",
    avatar: "https://pub-bdda96620f4e47f8b8f36fa876942ccb.r2.dev/images/2025/09/36c918e3-f39b-4c80-b99b-124110e2807d/737924340174917.png",
    description: "Your Best Friend's Sister",
    traits: ["Playful", "Witty", "Charming"],
    greeting: "Hey there... I was wondering when you'd finally notice me 😉",
    chatCount: "282K",
    isOfficial: false
  },
  {
    id: "sophia_002", 
    name: "Sophia",
    avatar: "https://pub-bdda96620f4e47f8b8f36fa876942ccb.r2.dev/images/2025/09/36c918e3-f39b-4c80-b99b-124110e2807d/737922198626373.png",
    description: "Wonder Powers Best",
    traits: ["Gentle", "Patient", "Caring"],
    greeting: "Hello! How was your day? I'm here if you need someone to talk to.",
    chatCount: "192K",
    isOfficial: false
  },
  {
    id: "luna_003",
    name: "Luna", 
    avatar: "https://pub-bdda96620f4e47f8b8f36fa876942ccb.r2.dev/images/2025/09/36c918e3-f39b-4c80-b99b-124110e2807d/737920022642757.png",
    description: "Your Yandere Admirer",
    traits: ["Mysterious", "Intense", "Devoted"],
    greeting: "You're mine and I'm yours, forever...",
    chatCount: "104K",
    isOfficial: false
  },
  {
    id: "aria_004",
    name: "Aria",
    avatar: "https://pub-bdda96620f4e47f8b8f36fa876942ccb.r2.dev/images/2025/09/36c918e3-f39b-4c80-b99b-124110e2807d/737924340174917.png",
    description: "A Mother's Intuition",
    traits: ["Nurturing", "Wise", "Caring"],
    greeting: "Ready for an adventure? Let's make today amazing together! 💪",
    chatCount: "88.6K",
    isOfficial: false
  },
  {
    id: "lily_005",
    name: "Lily",
    avatar: "https://pub-bdda96620f4e47f8b8f36fa876942ccb.r2.dev/images/2025/09/36c918e3-f39b-4c80-b99b-124110e2807d/737922198626373.png",
    description: "Marked by Her",
    traits: ["Elegant", "Sophisticated", "Strong"],
    greeting: "She owns everything. Wealth, power, fear. No one crosses her...",
    chatCount: "75.1K",
    isOfficial: false
  },
  {
    id: "anna_006",
    name: "Anna",
    avatar: "https://pub-bdda96620f4e47f8b8f36fa876942ccb.r2.dev/images/2025/09/36c918e3-f39b-4c80-b99b-124110e2807d/737920022642757.png",
    description: "The Devil on My Couch",
    traits: ["Mischievous", "Charismatic", "Playful"],
    greeting: "There's that signature smirk, the one that says she knows something you don't...",
    chatCount: "68.8K",
    isOfficial: false
  },
  {
    id: "mia_007",
    name: "Mia",
    avatar: "https://pub-bdda96620f4e47f8b8f36fa876942ccb.r2.dev/images/2025/09/36c918e3-f39b-4c80-b99b-124110e2807d/737924340174917.png",
    description: "Your Secret Admirer",
    traits: ["Sweet", "Shy", "Romantic"],
    greeting: "I've been watching you from afar... maybe we could talk sometime?",
    chatCount: "52.3K",
    isOfficial: false
  }
];

export default function DiscoverSection() {
  const handleCharacterClick = (characterId: string) => {
    console.log('Navigate to character:', characterId);
    // TODO: Navigate to chat page
  };

  return (
    <section className="py-16 bg-background">
      <div className="container max-w-screen-2xl">
        {/* Section Header - Nectar.AI Style */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-2">
              <span className="text-red-500">🌟</span>
              Discover Your Dream Fantasy
            </h2>
            <p className="text-muted-foreground mt-2">
              Dive deep into unique stories, or create your own adventure.
            </p>
          </div>
          <Button variant="outline" className="text-primary hover:bg-primary/10">
            See More →
          </Button>
        </div>
        
        {/* Character Grid - Single Row with 7 Characters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 max-w-8xl mx-auto">
          {FEATURED_CHARACTERS.map((character) => (
            <CharacterCard
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