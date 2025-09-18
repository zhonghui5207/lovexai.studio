"use client";

import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import CharacterModal from "./CharacterModal";

// Import the same character data structure from DiscoverSection
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

// Use the first 3 characters from the same data set
const heroCharacters: Character[] = [
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
    greeting: "Ready for an adventure? Let's explore together! ✨",
    chatCount: "198K",
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
    greeting: "I've been waiting for someone like you... 🌙",
    chatCount: "156K",
    isOfficial: false,
    personality: "Luna is intensely passionate and devoted, with a mysterious aura that draws you in. She's possessive in the most endearing way, wanting to know everything about you. Her love is all-consuming and she'd do anything to protect what's hers.",
    physicalDescription: "Dark, flowing hair with mysterious purple highlights, piercing violet eyes that seem to see into your soul. Pale complexion with sharp, elegant features and an enigmatic smile.",
    age: 22,
    location: "Tokyo, Japan"
  }
];

export default function HeroBanner() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  // Auto-play carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroCharacters.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleCharacterClick = (character: Character) => {
    setSelectedCharacter(character);
    setIsModalOpen(true);
  };

  const handleStartChat = (character: Character) => {
    router.push(`/chat/${character.id}`);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCharacter(null);
  };

  return (
    <section className="relative py-16 lg:py-24 overflow-hidden bg-background">
      {/* Background with subtle gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/20"></div>
      
      <div className="container relative z-10 max-w-screen-2xl">
        <div className="rounded-3xl bg-muted/30 border border-border/50 backdrop-blur-sm p-8 lg:p-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold mb-6 leading-tight text-foreground">
                Craft Your Perfect
                <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent">
                  AI Companion
                </span>
              </h1>
              
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Create intelligent, engaging, and personalized AI characters 
                that understand you and grow with every conversation.
              </p>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 hover:from-purple-600 hover:via-pink-600 hover:to-red-600 text-white font-semibold px-8 py-4 text-base shadow-lg"
                  onClick={() => handleStartChat(heroCharacters[currentIndex])}
                >
                  Start Chatting
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-2 border-border hover:bg-muted font-semibold px-8 py-4 text-base"
                >
                  Discover More
                </Button>
              </div>
            </div>
            
            {/* Right Content - Character Carousel */}
            <div className="relative w-full max-w-lg mx-auto">
              {/* Fixed container to prevent shaking */}
              <div className="relative w-full h-[480px] overflow-hidden rounded-2xl">
                {heroCharacters.map((character, index) => {
                  const isActive = index === currentIndex;
                  const isNext = index === (currentIndex + 1) % heroCharacters.length;
                  const isPrev = index === (currentIndex - 1 + heroCharacters.length) % heroCharacters.length;

                  let translateX = '100%'; // Default: off-screen right
                  let opacity = 0;
                  let scale = 0.9;

                  if (isActive) {
                    translateX = '0%';
                    opacity = 1;
                    scale = 1;
                  } else if (isNext) {
                    translateX = '50%';
                    opacity = 0.6;
                    scale = 0.95;
                  } else if (isPrev) {
                    translateX = '-50%';
                    opacity = 0.6;
                    scale = 0.95;
                  }

                  return (
                    <div
                      key={character.id}
                      className="absolute inset-0 w-full transition-all duration-700 ease-in-out cursor-pointer"
                      style={{
                        transform: `translateX(${translateX}) scale(${scale})`,
                        opacity: opacity,
                        zIndex: isActive ? 10 : isPrev || isNext ? 5 : 0
                      }}
                      onClick={() => handleCharacterClick(character)}
                    >
                      <div className="relative w-full h-full rounded-2xl overflow-hidden bg-gradient-to-br from-muted/50 to-muted/80 border border-border backdrop-blur-sm shadow-2xl">
                        <img
                          src={character.avatar}
                          alt={character.name}
                          className="w-full h-full object-cover"
                        />
                        {/* Overlay gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>

                        {/* Character info overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                          <h3 className="text-xl font-bold mb-2">{character.name}</h3>
                          <p className="text-sm text-white/90 mb-4 line-clamp-2">
                            {character.greeting}
                          </p>

                          <div className="flex items-center justify-between">
                            <Button
                              size="sm"
                              className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 hover:from-purple-600 hover:via-pink-600 hover:to-red-600 text-white font-semibold px-4 py-2 rounded-lg"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartChat(character);
                              }}
                            >
                              Chat
                            </Button>
                            <div className="flex items-center gap-1 text-sm text-white/80">
                              <span className="text-white/60">💬</span>
                              <span>{character.chatCount}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Navigation arrows */}
              <div className="absolute top-1/2 -translate-y-1/2 left-4 z-20">
                <button
                  onClick={() => setCurrentIndex((prev) => (prev - 1 + heroCharacters.length) % heroCharacters.length)}
                  className="p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-all backdrop-blur-sm"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              </div>

              <div className="absolute top-1/2 -translate-y-1/2 right-4 z-20">
                <button
                  onClick={() => setCurrentIndex((prev) => (prev + 1) % heroCharacters.length)}
                  className="p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-all backdrop-blur-sm"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Dots indicator */}
              <div className="flex justify-center mt-6 gap-2">
                {heroCharacters.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentIndex ? 'bg-gradient-to-r from-purple-400 to-pink-400' : 'bg-muted-foreground/40'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
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