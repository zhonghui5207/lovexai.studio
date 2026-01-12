"use client";

import React, { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import CharacterModal from "./CharacterModal";
import { useSearchParams } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { CdnImage } from "@/components/ui/cdn-image";

interface Character {
  id: string;
  name: string;
  username?: string;
  avatar: string;
  video_url?: string; // Video URL for hover preview
  description: string;
  traits: string[];
  greeting: string;
  chatCount: string;
  isOfficial: boolean;
  personality?: string;
  physicalDescription?: string;
  age?: number;
  location?: string;
  access_level?: string;
  tags?: string[]; // Add tags for filtering
}

interface CharacterCardProps {
  character: Character;
  onClick: () => void;
}

interface DiscoverSectionProps {
  characters?: any[]; // Simplified: Accept raw Convex query result
  activeCategory?: "girls" | "guys" | "anime";
  onCategoryChange?: (category: "girls" | "guys" | "anime") => void;
}

// Render text with *action* as italic
function renderActionText(text: string) {
  const parts = text.split(/(\*[^*]+\*)/);
  return parts.map((part, index) => {
    if (part.startsWith('*') && part.endsWith('*')) {
      // Remove asterisks and render as italic
      return (
        <em key={index} className="text-white/60 not-italic">
          {part.slice(1, -1)}
        </em>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

function CharacterCard({ character, onClick }: CharacterCardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Handle video play/pause on hover
  useEffect(() => {
    if (!videoRef.current || !character.video_url) return;
    
    if (isHovered) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {
        // Video play failed, possibly due to autoplay restrictions
      });
    } else {
      videoRef.current.pause();
    }
  }, [isHovered, character.video_url]);

  return (
    <motion.div
      layout
      // Removed initial animation to show cards instantly
      className="group relative aspect-[3/4] overflow-hidden rounded-2xl bg-white/5 cursor-pointer"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Layer */}
      <div className={`absolute inset-0 overflow-hidden transition-all duration-700 ${isLoading ? 'scale-110 blur-xl grayscale' : 'scale-100 blur-0 grayscale-0'}`}>
        <CdnImage
          src={character.avatar}
          alt={character.name}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          onLoad={() => setIsLoading(false)}
        />
      </div>

      {/* Video Layer - Shows on Hover */}
      {character.video_url && (
        <div 
          className={`absolute inset-0 z-10 transition-opacity duration-500 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <video
            ref={videoRef}
            src={character.video_url}
            muted
            loop
            playsInline
            preload="none"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Gradient Overlays */}
      <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-90" />
      <div className="absolute inset-0 z-20 bg-primary/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100 mix-blend-overlay" />

      {/* Top Badges */}
      <div className="absolute top-3 left-3 z-30">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md text-white/90 text-xs font-medium border border-white/10">
          <MessageCircle className="w-3.5 h-3.5 fill-current" />
          {character.chatCount.replace(' chats', '')}
        </div>
      </div>

      {/* Access Level Badge - Hide when hovering (video playing) */}
      {character.access_level && (
        <div className={`absolute top-3 right-3 z-30 transition-all duration-300 ${isHovered ? 'opacity-0 scale-90' : 'opacity-100 scale-100'}`}>
          <div className={`px-2.5 py-1 rounded-full backdrop-blur-md text-[10px] font-bold uppercase tracking-wide ${
            character.access_level === 'free' 
              ? 'bg-emerald-500/80 text-white' 
              : character.access_level === 'plus'
              ? 'bg-blue-500/80 text-white'
              : character.access_level === 'pro'
              ? 'bg-purple-500/80 text-white'
              : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
          }`}>
            {character.access_level}
          </div>
        </div>
      )}

      {/* Video Indicator - Show when hovering */}
      {character.video_url && (
        <div className={`absolute top-3 right-3 z-30 transition-all duration-300 ${isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/80 backdrop-blur-md text-white text-[10px] font-medium">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            LIVE
          </div>
        </div>
      )}

      {/* Bottom Info */}
      <div className="absolute bottom-0 left-0 right-0 p-5 z-30 transform transition-transform duration-300 group-hover:-translate-y-2">
        <h3 className="font-heading text-2xl font-bold text-white mb-1 drop-shadow-lg">
          {character.name}
        </h3>
        <p className="text-sm text-white/80 line-clamp-2 mb-3 font-sans">
          {renderActionText(character.greeting)}
        </p>
        
        {/* Tags - Visible on Hover */}
        <div className="flex flex-wrap gap-1 opacity-0 h-0 group-hover:opacity-100 group-hover:h-auto transition-all duration-300 delay-100">
          {character.traits?.slice(0, 2).map((trait, i) => (
            <span key={i} className="text-[10px] px-2 py-1 rounded-full bg-white/20 text-white backdrop-blur-sm">
              {trait}
            </span>
          ))}
        </div>

        {/* Chat Button - Visible on Hover */}
        <div className="mt-4 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 delay-75">
          <Button className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white font-bold shadow-lg shadow-primary/20">
            Chat Now
          </Button>
        </div>
      </div>

      {/* Border Glow */}
      <div className="absolute inset-0 z-40 border-2 border-transparent group-hover:border-primary/50 rounded-2xl transition-colors duration-300 pointer-events-none" />
    </motion.div>
  );
}

const generateMockChatCount = (index: number): string => {
  const counts = ["282K", "192K", "104K", "89.2K", "134K", "156K", "78.9K", "95K", "68K", "43K"];
  return counts[index % counts.length];
};

const FILTERS = ["All", "Trending", "New", "Free"] as const;
type FilterType = typeof FILTERS[number];

export default function DiscoverSection({ characters: rawCharacters }: DiscoverSectionProps) {
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>("All");
  const [visibleCount, setVisibleCount] = useState(12); // Initial: 12 characters

  const searchParams = useSearchParams();
  const activeGender = searchParams.get("gender") || "girls";
  const nsfwEnabled = searchParams.get("nsfw") === "true";

  // Map URL gender to database category
  const genderToCategoryMap: Record<string, string> = {
    'girls': 'female',
    'guys': 'male',
    'anime': 'anime',
  };
  const activeCategory = genderToCategoryMap[activeGender] || 'female';

  const loading = rawCharacters === undefined;

  const allCharacters = (rawCharacters || []).map((char, index) => ({
    id: char._id,
    name: char.name,
    username: char.username,
    avatar: char.avatar_url || "",
    video_url: char.video_url, // Video URL for hover preview
    description: char.description,
    traits: char.traits || [],
    greeting: char.greeting_message || "Hello! Nice to meet you.",
    chatCount: char.chat_count || generateMockChatCount(index),
    chatCountNum: parseChatCount(char.chat_count || generateMockChatCount(index)), // For sorting
    isOfficial: char.is_premium,
    personality: char.personality,
    physicalDescription: char.personality,
    age: undefined,
    location: undefined,
    access_level: char.access_level,
    category: char.category || "female",
    createdAt: char._creationTime || 0, // For "New" sorting
  }));

  // Helper function to parse chat count string to number for sorting
  function parseChatCount(count: string): number {
    const num = parseFloat(count.replace(/[^0-9.]/g, ''));
    if (count.includes('K')) return num * 1000;
    if (count.includes('M')) return num * 1000000;
    return num;
  }

  // Filter by gender from URL, then apply filter/sort logic
  const filteredCharacters = allCharacters
    .filter(c => c.category === activeCategory) // Filter by mapped category
    .filter(c => {
      if (activeFilter === "Free") return c.access_level === "free";
      return true; // All, Trending, New show all characters
    })
    .sort((a, b) => {
      if (activeFilter === "Trending") return b.chatCountNum - a.chatCountNum; // Most chats first
      if (activeFilter === "New") return b.createdAt - a.createdAt; // Newest first
      return 0; // Default order
    });

  const displayCharacters = filteredCharacters.slice(0, visibleCount);
  const hasMore = filteredCharacters.length > visibleCount;

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 8); // Load 8 more each time
  };

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
    setVisibleCount(12); // Reset to initial count when filter changes
  };

  const handleCharacterClick = (character: Character) => {
    setSelectedCharacter(character);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCharacter(null);
  };

  return (
    <section className="py-6 md:py-10 bg-black relative">
      {/* Seamless Gradient Top */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black to-transparent z-10 pointer-events-none" />
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-primary/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full px-6 md:px-8 max-w-[1400px] mx-auto relative z-10">
        {/* Section Header */}
        <div className="flex flex-col xl:flex-row items-start xl:items-end justify-between mb-8 gap-6">
          <div className="w-full xl:w-auto max-w-3xl">
            <h2 className="font-heading text-4xl md:text-5xl font-bold mb-4">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                Discover
              </span> Your Match
            </h2>
            <p className="text-xl text-muted-foreground font-sans mb-0">
              Explore a universe of unique personalities waiting to meet you.
            </p>
          </div>
          
          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2 justify-start xl:justify-end w-full xl:w-auto">
            {FILTERS.map((filter) => (
              <button
                key={filter}
                onClick={() => handleFilterChange(filter)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 border ${
                  activeFilter === filter
                    ? "bg-primary text-white border-primary shadow-[0_0_15px_rgba(255,0,110,0.4)]"
                    : "bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10 hover:text-white"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
        
        {/* Character Grid */}
        <motion.div 
          layout
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full"
        >
          <AnimatePresence mode="popLayout">
            {loading ? (
              Array.from({ length: 10 }).map((_, index) => (
                <motion.div 
                  key={`skeleton-${index}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="aspect-[3/4] bg-white/5 rounded-2xl animate-pulse"
                />
              ))
            ) : (
              displayCharacters.map((character) => (
                <CharacterCard
                  key={character.id}
                  character={character}
                  onClick={() => handleCharacterClick(character)}
                />
              ))
            )}
          </AnimatePresence>
        </motion.div>

        {hasMore && (
          <div className="mt-16 text-center">
            <Button
              variant="outline"
              size="lg"
              onClick={handleLoadMore}
              className="border-white/10 bg-white/5 hover:bg-white/10 text-lg px-8 py-6 rounded-2xl backdrop-blur-sm"
            >
              Load More Characters
            </Button>
          </div>
        )}
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