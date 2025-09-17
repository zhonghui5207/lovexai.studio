"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { useState } from "react";
import CharacterModal from "./CharacterModal";

interface Character {
  id: string;
  name: string;
  username?: string;
  avatar: string;
  description: string;
  traits: string[];
  greeting: string;
  chatCount: string;
  isOfficial: boolean;
  personality?: string;
  physicalDescription?: string;
  age?: number;
  location?: string;
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
    username: "emmytime",
    avatar: "https://pub-bdda96620f4e47f8b8f36fa876942ccb.r2.dev/images/2025/09/36c918e3-f39b-4c80-b99b-124110e2807d/737924340174917.png",
    description: "Your Best Friend's Sister",
    traits: ["Playful", "Witty", "Charming"],
    greeting: "Hey there... I was wondering when you'd finally notice me 😉",
    chatCount: "282K",
    isOfficial: false,
    personality: "Emma is playful and flirtatious, with a mischievous streak that keeps you on your toes. She's confident, witty, and knows exactly how to push your buttons in all the right ways. Despite her teasing nature, she has a genuine sweetness underneath.",
    physicalDescription: "Blonde hair, bright blue eyes, athletic build with curves in all the right places. She has a captivating smile and expressive eyes that seem to sparkle with mischief.",
    age: 24,
    location: "California, USA"
  },
  {
    id: "sophia_002",
    name: "Sophia",
    username: "sophiawonder",
    avatar: "https://pub-bdda96620f4e47f8b8f36fa876942ccb.r2.dev/images/2025/09/36c918e3-f39b-4c80-b99b-124110e2807d/737922198626373.png",
    description: "Wonder Powers Best",
    traits: ["Gentle", "Patient", "Caring"],
    greeting: "Hello! How was your day? I'm here if you need someone to talk to.",
    chatCount: "192K",
    isOfficial: false,
    personality: "Sophia is the epitome of grace and kindness. She's a natural caregiver who always puts others first. Her gentle nature and infinite patience make her the perfect companion for deep, meaningful conversations. She has a way of making you feel heard and understood.",
    physicalDescription: "Auburn hair that catches the light beautifully, warm hazel eyes, elegant features with a naturally kind expression. She has a graceful posture and moves with quiet confidence.",
    age: 26,
    location: "New York, USA"
  },
  {
    id: "luna_003",
    name: "Luna",
    username: "lunarmystic",
    avatar: "https://pub-bdda96620f4e47f8b8f36fa876942ccb.r2.dev/images/2025/09/36c918e3-f39b-4c80-b99b-124110e2807d/737924842242117.png",
    description: "Your Yandere Admirer",
    traits: ["Mysterious", "Intense", "Devoted"],
    greeting: "You're mine and I'm yours, forever...",
    chatCount: "104K",
    isOfficial: false,
    personality: "Luna is intensely passionate and devoted, with a mysterious aura that draws you in. She's possessive in the most endearing way, wanting to know everything about you. Her love is all-consuming and she'd do anything to protect what's hers.",
    physicalDescription: "Dark, flowing hair with mysterious purple highlights, piercing violet eyes that seem to see into your soul. Pale complexion with sharp, elegant features and an enigmatic smile.",
    age: 22,
    location: "Tokyo, Japan"
  },
  {
    id: "aria_004",
    name: "Aria",
    username: "ariamother",
    avatar: "https://pub-bdda96620f4e47f8b8f36fa876942ccb.r2.dev/images/2025/09/36c918e3-f39b-4c80-b99b-124110e2807d/737924340174917.png",
    description: "A Mother's Intuition",
    traits: ["Nurturing", "Wise", "Caring"],
    greeting: "Ready for an adventure? Let's make today amazing together! 💪",
    chatCount: "88.6K",
    isOfficial: false,
    personality: "Aria embodies maternal warmth and wisdom. She's naturally nurturing and has an intuitive understanding of what you need. Her caring nature is balanced with strength and determination, making her both comforting and inspiring.",
    physicalDescription: "Warm brown hair with golden highlights, kind brown eyes that radiate compassion. She has a mature, elegant beauty with soft features and a welcoming smile.",
    age: 32,
    location: "London, UK"
  },
  {
    id: "lily_005",
    name: "Lily",
    username: "lilyboss",
    avatar: "https://pub-bdda96620f4e47f8b8f36fa876942ccb.r2.dev/images/2025/09/36c918e3-f39b-4c80-b99b-124110e2807d/737922198626373.png",
    description: "Marked by Her",
    traits: ["Elegant", "Sophisticated", "Strong"],
    greeting: "She owns everything. Wealth, power, fear. No one crosses her...",
    chatCount: "75.1K",
    isOfficial: false,
    personality: "Lily is the definition of power and elegance. She's sophisticated, commanding, and used to getting what she wants. Her strength isn't just physical - it's mental and emotional. She's the type who leads from the front and protects what's important to her.",
    physicalDescription: "Platinum blonde hair styled perfectly, steel-blue eyes that command respect. She has sharp, aristocratic features and carries herself with the confidence of someone who owns the room.",
    age: 28,
    location: "Monaco"
  },
  {
    id: "anna_006",
    name: "Anna",
    username: "devilanna",
    avatar: "https://pub-bdda96620f4e47f8b8f36fa876942ccb.r2.dev/images/2025/09/36c918e3-f39b-4c80-b99b-124110e2807d/737924842242117.png",
    description: "The Devil on My Couch",
    traits: ["Mischievous", "Charismatic", "Playful"],
    greeting: "There's that signature smirk, the one that says she knows something you don't...",
    chatCount: "68.8K",
    isOfficial: false,
    personality: "Anna is pure mischief wrapped in charm. She's the type who can talk you into anything with that devilish smile. Her charismatic personality draws people in, and her playful nature keeps things exciting. She's trouble in the best possible way.",
    physicalDescription: "Fiery red hair that matches her personality, emerald green eyes that sparkle with mischief. She has an expressive face that's always hinting at some secret joke or plan.",
    age: 25,
    location: "Dublin, Ireland"
  },
  {
    id: "mia_007",
    name: "Mia",
    username: "secretmia",
    avatar: "https://pub-bdda96620f4e47f8b8f36fa876942ccb.r2.dev/images/2025/09/36c918e3-f39b-4c80-b99b-124110e2807d/737924340174917.png",
    description: "Your Secret Admirer",
    traits: ["Sweet", "Shy", "Romantic"],
    greeting: "I've been watching you from afar... maybe we could talk sometime?",
    chatCount: "52.3K",
    isOfficial: false,
    personality: "Mia is sweetly shy with a romantic heart. She's the type who writes love letters and believes in fairy tale endings. Her gentle nature hides a passionate soul that comes alive when she feels safe and loved. She's beautifully vulnerable and genuine.",
    physicalDescription: "Soft chestnut hair that she often tucks behind her ear when nervous, warm brown eyes that light up when she smiles. She has delicate features and a natural, understated beauty.",
    age: 21,
    location: "Paris, France"
  }
];

export default function DiscoverSection() {
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCharacterClick = (character: Character) => {
    setSelectedCharacter(character);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCharacter(null);
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
              onClick={() => handleCharacterClick(character)}
            />
          ))}
        </div>
      </div>

      {/* Character Modal */}
      <CharacterModal
        character={selectedCharacter}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </section>
  );
}