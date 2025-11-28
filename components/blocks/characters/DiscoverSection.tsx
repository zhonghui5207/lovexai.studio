"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CharacterModal from "./CharacterModal";
import { useSearchParams } from "next/navigation";
import { MessageCircle } from "lucide-react";

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
  access_level?: string;
  tags?: string[]; // Add tags for filtering
}

interface CharacterCardProps {
  character: Character;
  onClick: () => void;
}

function CharacterCard({ character, onClick }: CharacterCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className="group relative aspect-[3/4] overflow-hidden rounded-2xl bg-card cursor-pointer"
      onClick={onClick}
    >
      {/* Image with Zoom Effect */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          src={character.avatar}
          alt={character.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'https://placehold.co/400x600/1a1a1a/ffffff?text=No+Image';
          }}
        />
      </div>

      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-90" />
      <div className="absolute inset-0 bg-primary/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100 mix-blend-overlay" />

      {/* Top Badges */}
      <div className="absolute top-3 left-3">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md text-white/90 text-xs font-medium border border-white/10">
          <MessageCircle className="w-3.5 h-3.5 fill-current" />
          {character.chatCount.replace(' chats', '')}
        </div>
      </div>
      
      {character.isOfficial && (
        <div className="absolute top-3 right-3">
          <Badge variant="secondary" className="bg-primary/80 text-white backdrop-blur-md border-none px-3 py-1 rounded-full">
            Lovexai
          </Badge>
        </div>
      )}

      {/* Bottom Info */}
      <div className="absolute bottom-0 left-0 right-0 p-5 transform transition-transform duration-300 group-hover:-translate-y-2">
        <h3 className="font-heading text-2xl font-bold text-white mb-1 drop-shadow-lg">
          {character.name}
        </h3>
        <p className="text-sm text-white/80 line-clamp-2 mb-3 font-sans">
          {character.greeting}
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
      <div className="absolute inset-0 border-2 border-transparent group-hover:border-primary/50 rounded-2xl transition-colors duration-300 pointer-events-none" />
    </motion.div>
  );
}

const generateMockChatCount = (index: number): string => {
  const counts = ["282K", "192K", "104K", "89.2K", "134K", "156K", "78.9K", "95K", "68K", "43K"];
  return counts[index % counts.length];
};

const FILTERS = ["All", "Trending", "New", "Roleplay", "Anime", "Realistic"];

export default function DiscoverSection() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [displayCharacters, setDisplayCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");

  const searchParams = useSearchParams();
  const activeGender = searchParams.get("gender") || "female";
  const nsfwEnabled = searchParams.get("nsfw") === "true";

  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        const response = await fetch('/api/characters');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            const transformedCharacters = data.data.map((char: any, index: number) => ({
              id: char.id,
              name: char.name,
              username: char.username,
              avatar: char.avatar_url,
              description: char.description,
              traits: char.traits || [],
              greeting: char.greeting_message || "Hello! Nice to meet you.",
              chatCount: char.chat_count || generateMockChatCount(index),
              isOfficial: true,
              personality: char.personality,
              physicalDescription: char.personality,
              age: char.age,
              location: char.location,
              access_level: char.access_level,
              tags: ["Trending", "Roleplay"] // Mock tags for demo
            }));

            setCharacters(transformedCharacters);
            setDisplayCharacters(transformedCharacters.slice(0, 12));
          }
        }
      } catch (error) {
        console.error('Failed to fetch characters:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCharacters();
  }, [activeGender, nsfwEnabled]); // Re-fetch when filters change (mock behavior)

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    if (filter === "All") {
      setDisplayCharacters(characters.slice(0, 12));
    } else {
      // Simple mock filtering logic - in real app, check character tags
      const filtered = characters.filter(c => 
        c.traits.some(t => t.toLowerCase().includes(filter.toLowerCase())) || 
        Math.random() > 0.5 // Randomly show some for demo purposes if tags don't match
      );
      setDisplayCharacters(filtered.slice(0, 12));
    }
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

        <div className="mt-16 text-center">
          <Button 
            variant="outline" 
            size="lg"
            className="border-white/10 bg-white/5 hover:bg-white/10 text-lg px-8 py-6 rounded-2xl backdrop-blur-sm"
          >
            Load More Characters
          </Button>
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