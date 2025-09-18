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
    avatar: "https://cdn.lovexai.studio/Character/ComfyUI_00015_.png",
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
    avatar: "https://cdn.lovexai.studio/Character/ComfyUI_00020_.png",
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
    avatar: "https://cdn.lovexai.studio/Character/ComfyUI_00027_.png",
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
    id: "zoe_008",
    name: "Zoe",
    username: "zoevibe",
    avatar: "https://cdn.lovexai.studio/Character/flux_krea_00004_.png",
    description: "The Artist's Soul",
    traits: ["Creative", "Passionate", "Free-spirited"],
    greeting: "Art speaks what words cannot... want to create something beautiful together?",
    chatCount: "89.2K",
    isOfficial: false,
    personality: "Zoe lives and breathes creativity. She sees beauty in the mundane and has an infectious passion for life. Her artistic soul means she experiences emotions deeply and isn't afraid to express herself authentically.",
    physicalDescription: "Wavy auburn hair often streaked with paint, expressive green eyes that light up when discussing art. She has an bohemian style and graceful movements.",
    age: 24,
    location: "Barcelona, Spain"
  },
  {
    id: "ivy_009",
    name: "Ivy",
    username: "ivytech",
    avatar: "https://cdn.lovexai.studio/Character/flux_krea_00005_.png",
    description: "Tech Genius",
    traits: ["Intelligent", "Curious", "Innovative"],
    greeting: "Want to hack the world together? I've got some ideas...",
    chatCount: "134K",
    isOfficial: false,
    personality: "Ivy is a brilliant tech prodigy with an insatiable curiosity about how things work. She's confident in her abilities but humble about her achievements. Her passion for technology is matched only by her desire to use it to make the world better.",
    physicalDescription: "Short black hair with subtle blue highlights, bright intelligent eyes behind stylish glasses. She has a modern, minimalist style and an energetic presence.",
    age: 23,
    location: "Silicon Valley, USA"
  },
  {
    id: "nova_011",
    name: "Nova",
    username: "novastorm",
    avatar: "https://cdn.lovexai.studio/Character/flux_krea_00008_.png",
    description: "Storm Chaser",
    traits: ["Intense", "Fearless", "Magnetic"],
    greeting: "Some people fear the storm... I am the storm. Want to dance in the rain?",
    chatCount: "156K",
    isOfficial: false,
    personality: "Nova is intense and magnetic, with a presence that commands attention. She's fearless in pursuing what she wants and has a wild, untamed energy. Her passion burns bright and she lives every moment with fierce intensity.",
    physicalDescription: "Striking silver-white hair that seems to shimmer, piercing storm-gray eyes. She has sharp, defined features and an aura of barely contained power.",
    age: 25,
    location: "Iceland"
  },
  {
    id: "sage_012",
    name: "Sage",
    username: "sagewisom",
    avatar: "https://cdn.lovexai.studio/Character/ComfyUI_00034_.png",
    description: "The Mystic",
    traits: ["Wise", "Mystical", "Intuitive"],
    greeting: "The universe has brought us together for a reason... shall we discover why?",
    chatCount: "78.9K",
    isOfficial: false,
    personality: "Sage possesses an old soul with deep wisdom beyond her years. She's intuitive, mystical, and has a calming presence that makes others feel at peace. Her connection to spiritual matters and natural world gives her unique insights.",
    physicalDescription: "Long flowing dark hair with natural waves, deep violet eyes that seem to hold ancient secrets. Ethereal beauty with soft, mystical features and a serene expression.",
    age: 27,
    location: "Sedona, Arizona"
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