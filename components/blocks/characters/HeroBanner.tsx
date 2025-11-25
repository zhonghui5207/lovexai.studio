"use client";

import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
  const [selectedGender, setSelectedGender] = useState<'female' | 'male' | 'anime'>('female');
  const [nsfwEnabled, setNsfwEnabled] = useState(false);
  const router = useRouter();

  // Auto-play carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroCharacters.length);
    }, 5000); // Slower interval for better viewing
    return () => clearInterval(timer);
  }, []);

  const handleCharacterClick = (character: Character) => {
    setSelectedCharacter(character);
    setIsModalOpen(true);
  };

  const handleStartChat = (character: Character) => {
    router.push(`/chat`);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCharacter(null);
  };

  const genderOptions = [
    { key: 'female' as const, label: 'Girls', icon: '👩' },
    { key: 'male' as const, label: 'Guys', icon: '👨' },
    { key: 'anime' as const, label: 'Anime', icon: '🎭' }
  ];

  return (
    <section className="relative min-h-[70vh] flex items-center overflow-hidden bg-transparent pt-10 lg:pt-0">
      {/* Seamless Gradient Bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent z-10 pointer-events-none" />

      {/* Dynamic Background Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-secondary/20 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="w-full px-6 md:px-8 max-w-[1400px] mx-auto grid lg:grid-cols-12 gap-8 items-center relative z-10">
        {/* Left Content: Text */}
        <div className="lg:col-span-6 text-center lg:text-left space-y-8 pt-12 lg:pt-0 relative z-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >


            <h1 className="font-heading text-5xl lg:text-7xl font-bold leading-tight text-foreground tracking-tight">
              Craft Your <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-secondary drop-shadow-[0_0_25px_rgba(255,0,110,0.4)]">
                Perfect Fantasy
              </span>
            </h1>
          </motion.div>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 font-sans leading-relaxed"
          >
            Dive into a world where AI characters feel alive. Create, chat, and connect with companions that understand your deepest desires.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
          >
            <Button
              size="lg"
              className="relative overflow-hidden bg-primary hover:bg-primary/90 text-white font-bold px-10 py-6 text-lg rounded-2xl shadow-[0_0_20px_rgba(255,0,110,0.4)] transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(255,0,110,0.6)]"
              onClick={() => handleStartChat(heroCharacters[currentIndex])}
            >
              <span className="relative z-10">Start Chatting Now</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] animate-[shimmer_2s_infinite]"></div>
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-2 border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 font-semibold px-8 py-6 text-lg rounded-2xl backdrop-blur-sm transition-all"
            >
              Explore Characters
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex items-center gap-6 justify-center lg:justify-start pt-4"
          >
            <div className="flex -space-x-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-background bg-muted overflow-hidden">
                  <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <div className="text-sm text-muted-foreground">
              <span className="text-foreground font-bold">10,000+</span> users online
            </div>
          </motion.div>
        </div>
        
        {/* Right Content: 3D Card Stack */}
        <div className="lg:col-span-6 relative h-[500px] lg:h-[600px] flex items-center justify-center perspective-1000 z-10">
          <AnimatePresence mode="popLayout">
            {heroCharacters.map((character, index) => {
              // Calculate relative position for stack effect
              const offset = (index - currentIndex + heroCharacters.length) % heroCharacters.length;
              
              // Only show 3 cards: current, next, and previous (as last)
              if (offset > 2 && offset !== heroCharacters.length - 1) return null;

              let zIndex = 0;
              let scale = 0.8;
              let opacity = 0;
              let x = 0;
              let rotateY = 0;

              if (offset === 0) { // Active card
                zIndex = 30;
                scale = 1;
                opacity = 1;
                x = 0;
                rotateY = 0;
              } else if (offset === 1) { // Next card (Right)
                zIndex = 20;
                scale = 0.85;
                opacity = 0.6;
                x = 180; // px
                rotateY = -15; // deg
              } else { // Previous/Last card (Left)
                zIndex = 10;
                scale = 0.85;
                opacity = 0.6;
                x = -180; // px
                rotateY = 15; // deg
              }

              return (
                <motion.div
                  key={character.id}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ 
                    scale, 
                    opacity, 
                    x, 
                    rotateY,
                    zIndex 
                  }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="absolute w-[280px] sm:w-[320px] aspect-[3/4] cursor-pointer"
                  onClick={() => {
                    if (offset === 0) handleCharacterClick(character);
                    else setCurrentIndex(index);
                  }}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  <div className={`relative h-full w-full rounded-3xl overflow-hidden border border-white/10 shadow-2xl transition-all duration-300 ${offset === 0 ? 'shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-1 ring-white/20' : ''}`}>
                    <img
                      src={character.avatar}
                      alt={character.name}
                      className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                    />
                    
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                    
                    {/* Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 rounded-md bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider">
                          {character.traits[0]}
                        </span>
                        {character.isOfficial && (
                          <span className="px-2 py-1 rounded-md bg-primary/80 backdrop-blur-md text-xs font-bold uppercase tracking-wider">
                            Official
                          </span>
                        )}
                      </div>
                      
                      <h3 className="font-heading text-3xl font-bold mb-1">{character.name}</h3>
                      <p className="text-sm text-white/80 line-clamp-2 font-sans mb-4">
                        {character.greeting}
                      </p>
                      
                      {offset === 0 && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="flex items-center justify-between pt-4 border-t border-white/10"
                        >
                          <div className="flex items-center gap-1 text-xs text-white/60">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            Online Now
                          </div>
                          <div className="flex items-center gap-1 text-xs font-mono text-primary-foreground">
                            <span>❤</span> {character.chatCount}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
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