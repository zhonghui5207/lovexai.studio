"use client";

import { Button } from "@/components/ui/button";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import CharacterModal from "./CharacterModal";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

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

export default function HeroBanner() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  // Fetch characters from Convex
  const rawCharacters = useQuery(api.characters.list, { activeOnly: true });

  // Transform data
  const heroCharacters: Character[] = useMemo(() => {
    if (!rawCharacters) return [];
    
    return rawCharacters.slice(0, 3).map((c) => ({
      id: c._id,
      name: c.name,
      username: c.username,
      avatar: c.avatar_url || "https://cdn.lovexai.studio/Character/default_avatar.png",
      description: c.description,
      traits: c.traits || [],
      greeting: c.greeting_message,
      chatCount: c.chat_count || "0",
      isOfficial: c.is_premium || false,
      personality: c.personality,
      physicalDescription: c.description, // Fallback as physicalDescription might not be in schema
      // age: c.age, // Not in schema
      // location: c.location, // Not in schema
    }));
  }, [rawCharacters]);

  // Auto-play carousel
  useEffect(() => {
    if (heroCharacters.length === 0) return;
    
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroCharacters.length);
    }, 5000); // Slower interval for better viewing
    return () => clearInterval(timer);
  }, [heroCharacters.length]);

  const handleCharacterClick = (character: Character) => {
    setSelectedCharacter(character);
    setIsModalOpen(true);
  };

  const handleStartChat = (character: Character) => {
    setSelectedCharacter(character);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCharacter(null);
  };

  // Loading State
  if (rawCharacters === undefined) {
    return (
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden bg-transparent pt-10 lg:pt-0">
         <div className="animate-pulse flex flex-col items-center gap-4">
            <div className="h-12 w-64 bg-white/10 rounded-lg"></div>
            <div className="h-4 w-48 bg-white/5 rounded-lg"></div>
         </div>
      </section>
    );
  }

  // Empty State
  if (heroCharacters.length === 0) {
    return null; // Or show a placeholder
  }

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


            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 leading-tight">
            Craft Your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 animate-gradient-x">
              Perfect Soulmate
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
                    
                    {/* Top Badges */}
                    <div className="absolute top-4 left-4 flex flex-col gap-2 items-start z-10">
                      <span className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[10px] font-bold uppercase tracking-wider text-white/90 shadow-lg">
                        {character.traits[0]}
                      </span>
                    </div>

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90" />
                    
                    {/* Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white z-20">
                      <h3 className="font-heading text-3xl font-bold mb-2 drop-shadow-lg">{character.name}</h3>
                      <p className="text-sm text-white/80 line-clamp-2 font-sans mb-4 leading-relaxed drop-shadow-md">
                        "{character.greeting}"
                      </p>
                      
                      {offset === 0 && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center justify-between pt-4 border-t border-white/10"
                        >
                          <div className="flex items-center gap-1.5 text-xs font-medium text-white/70">
                            <span className="text-primary">🔥</span> {character.chatCount} chats
                          </div>
                          
                          <div className="flex items-center gap-2 text-xs font-bold text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-colors backdrop-blur-sm">
                            <span>Chat</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
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