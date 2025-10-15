"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { useState, useEffect } from "react";
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
  access_level?: string;
}

interface CharacterCardProps {
  character: Character;
  onClick: () => void;
}

function CharacterCard({ character, onClick }: CharacterCardProps) {
  return (
    <div
      className="group relative overflow-hidden rounded-xl bg-card border hover:border-primary/50 hover:shadow-lg transition-all duration-300 cursor-pointer"
      onClick={onClick}
    >
      {/* Vertical Layout - Image on Top, Info on Bottom */}
      <div className="w-full">
        {/* Character Avatar - Top Section */}
        <div className="relative aspect-[2/3] overflow-hidden">
          <img
            src={character.avatar}
            alt={character.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              console.log('Image error triggered for:', character.name, e.target);
              const target = e.target as HTMLImageElement;
              target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjI2NyIgdmlld0JveD0iMCAwIDIwMCAyNjciIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjY3IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgMTMwQzEwMC4zMTUgMTMwIDEwMC41IDEyOS42ODUgMTAwLjUgMTI5LjVDMTAwLjUgMTI5LjMxNSAxMDAuMzE1IDEyOSAxMDAgMTI5Qzk5LjY4NDUgMTI5IDk5LjUgMTI5LjMxNSA5OS41IDEyOS41Qzk5LjUgMTI5LjY4NSA5OS42ODQ1IDEzMCAxMDAgMTMwWiIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNMTA1IDEyNUwxMDAgMTM1TDk1IDEyNVoiIGZpbGw9IiM5Q0EzQUYiLz4KPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjY3IiB2aWV3Qm94PSIwIDAgMjAwIDI2NyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyNjciIGZpbGw9IiNGM0Y0RjYiLz48cGF0aCBkPSJNMTAwIDEzMGMwLjMxNSAwIDAuNS0wLjMxNSAwLjUtMC41cy0wLjE4NS0wLjUtMC41LTAuNVM5OS41IDEyOS4zMTUgOTkuNSAxMjkuNXMwLjE4NSAwLjUgMC41IDAuNXoiIGZpbGw9IiM5Q0EzQUYiLz48cGF0aCBkPSJNMTA1IDEyNWwtNSAxMCA1LTEweiIgZmlsbD0iIzlDQTNBRiIvPjwvc3ZnPgo8L3N2Zz4K';
            }}
          />
          {/* Gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

          {/* Character name and description overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            <h3 className="text-base font-bold mb-1 text-center">{character.name}</h3>
            <p className="text-xs text-white/90 text-center line-clamp-1">
              {character.description}
            </p>
          </div>
        </div>
      </div>

      {/* Hover effect overlay */}
      <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  );
}

// Mock chat counts for display - could be replaced with real data later
const generateMockChatCount = (index: number): string => {
  const counts = ["282K", "192K", "104K", "89.2K", "134K", "156K", "78.9K", "95K", "68K", "43K"];
  return counts[index % counts.length];
};

export default function DiscoverSection() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [displayCharacters, setDisplayCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 按sort_order排序选择前12个角色
  const getOrderedCharacters = (allCharacters: Character[], count: number = 12) => {
    const sorted = [...allCharacters].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    return sorted.slice(0, count);
  };

  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        const response = await fetch('/api/characters');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            // Transform database data to match interface
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
              physicalDescription: char.personality, // Using personality as physical description
              age: char.age,
              location: char.location,
              access_level: char.access_level
            }));

            setCharacters(transformedCharacters);

            // 按排序选择前12个角色显示
            const orderedCharacters = getOrderedCharacters(transformedCharacters, 12);
            setDisplayCharacters(orderedCharacters);
          }
        }
      } catch (error) {
        console.error('Failed to fetch characters:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCharacters();
  }, []);

  const generateMockChatCount = (index: number): string => {
    const counts = ["282K", "192K", "104K", "89.2K", "134K", "156K", "78.9K", "95K", "68K", "43K"];
    return counts[index % counts.length];
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
        
        {/* Character Cards - 12 Cards Grid Layout */}
        <div className="w-full">
          {loading ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="aspect-[2/3] bg-gray-200 rounded-xl"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
              {displayCharacters.map((character) => (
                <CharacterCard
                  key={character.id}
                  character={character}
                  onClick={() => handleCharacterClick(character)}
                />
              ))}
            </div>
          )}
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