"use client";

import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CharacterModal from "./CharacterModal";
import { CdnImage } from "@/components/ui/cdn-image";
import { Heart, User, Star } from "lucide-react";
import { useTranslations } from "next-intl";

// Import static character data
import heroGirls from "@/data/hero-girls.json";
import heroGuys from "@/data/hero-guys.json";
import heroAnime from "@/data/hero-anime.json";

// Character interface matching our static data
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

// Category type
type Category = "girls" | "guys" | "anime";

// Category configurations (without labels - will be translated)
const CATEGORIES = [
  {
    id: "girls" as Category,
    icon: Heart,
    data: heroGirls,
  },
  {
    id: "guys" as Category,
    icon: User,
    data: heroGuys,
  },
  {
    id: "anime" as Category,
    icon: Star,
    data: heroAnime,
  },
];

// Render text with *action* as styled text (remove asterisks)
function renderActionText(text: string) {
  const parts = text.split(/(\*[^*]+\*)/);
  return parts.map((part, index) => {
    if (part.startsWith('*') && part.endsWith('*')) {
      // Remove asterisks and render as subtle styled text
      return (
        <span key={index} className="text-white/60">
          {part.slice(1, -1)}
        </span>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

// Map URL gender param to category
function genderToCategory(gender: string | null): Category {
  switch (gender) {
    case "guys": return "guys";
    case "male": return "guys"; // Legacy support
    case "anime": return "anime";
    case "girls": return "girls";
    default: return "girls"; // female or null -> girls
  }
}

// Calculate card position styles based on offset
function getCardStyle(offset: number, isCompact: boolean) {
  let scale = 0.8;
  let opacity = 0;
  let x = 0;
  let rotateY = 0;
  let zIndex = 0;

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
    x = 120;
    rotateY = -15;
  } else { // Previous/Last card (Left)
    zIndex = 10;
    scale = 0.85;
    opacity = 0.6;
    x = -120;
    rotateY = 15;
  }

  if (isCompact && offset !== 0) {
    x = x * 0.55;
  }

  return {
    transform: `translateX(${x}px) scale(${scale}) rotateY(${rotateY}deg)`,
    opacity,
    zIndex,
  };
}

// Calculate mobile card position styles
function getMobileCardStyle(offset: number) {
  let scale = 0.8;
  let opacity = 0;
  let x = 0;
  let rotateY = 0;
  let zIndex = 0;

  if (offset === 0) { zIndex = 30; scale = 1; opacity = 1; x = 0; rotateY = 0; }
  else if (offset === 1) { zIndex = 20; scale = 0.85; opacity = 0.6; x = 80; rotateY = -15; }
  else { zIndex = 10; scale = 0.85; opacity = 0.6; x = -80; rotateY = 15; }

  return {
    transform: `translateX(${x}px) scale(${scale}) rotateY(${rotateY}deg)`,
    opacity,
    zIndex,
  };
}

export default function HeroBanner() {
  const t = useTranslations('hero');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Ensure client-side only to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);

    if (typeof window === "undefined") return;
    const media = window.matchMedia("(min-width: 640px)");
    const handleChange = () => setIsCompact(!media.matches);
    handleChange();
    if (media.addEventListener) {
      media.addEventListener("change", handleChange);
      return () => media.removeEventListener("change", handleChange);
    }
    media.addListener(handleChange);
    return () => media.removeListener(handleChange);
  }, []);

  // Read gender from URL and map to category
  // Default to "girls" for SSR, then update on client
  const gender = mounted ? searchParams.get("gender") : null;
  const activeCategory = genderToCategory(gender);

  // Get characters for active category - always have data (static JSON)
  const currentCategoryData = CATEGORIES.find(c => c.id === activeCategory);
  const heroCharacters = (currentCategoryData?.data || heroGirls) as Character[];

  // Reset carousel index when category changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [activeCategory]);

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

  return (
    <section className="relative min-h-[52vh] sm:min-h-[70vh] flex items-center overflow-hidden bg-transparent pt-6 sm:pt-10 lg:pt-0">
      {/* Seamless Gradient Bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent z-10 pointer-events-none" />

      {/* Dynamic Background Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-secondary/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full px-6 md:px-8 max-w-[1400px] mx-auto grid lg:grid-cols-12 gap-6 lg:gap-8 items-center relative z-10">
        {/* Left Content: Text - Static, no animation to avoid flash */}
        <div className="lg:col-span-6 text-center lg:text-left space-y-4 sm:space-y-8 pt-6 sm:pt-12 lg:pt-0 relative z-20">
          {/* Title & Description */}
          <div>
            <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold tracking-tight text-white mb-3 sm:mb-6 leading-tight">
              {t('title_line1')} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 animate-gradient-x">
                {t('title_line2')}
              </span>
            </h1>
          </div>

          <h2 className="text-sm sm:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 font-sans leading-relaxed font-normal">
            {t('description')}
          </h2>

          {/* Mobile: Card Stack between text and buttons */}
          <div className="lg:hidden relative h-[320px] flex items-center justify-center" style={{ perspective: '1000px' }}>
            {heroCharacters.map((character, index) => {
              const offset = (index - currentIndex + heroCharacters.length) % heroCharacters.length;
              if (offset > 2 && offset !== heroCharacters.length - 1) return null;

              const style = getMobileCardStyle(offset);

              return (
                <div
                  key={`mobile-${character.id}`}
                  className="absolute w-[200px] aspect-[3/4] cursor-pointer transition-all duration-500 ease-out"
                  onClick={() => { if (offset === 0) handleCharacterClick(character); else setCurrentIndex(index); }}
                  style={{
                    ...style,
                    transformStyle: 'preserve-3d',
                  }}
                >
                  <div className={`relative h-full w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl ${offset === 0 ? 'shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-1 ring-white/20' : ''}`}>
                    <CdnImage src={character.avatar} alt={character.name} fill className="object-cover" />
                    <div className="absolute top-3 left-3 z-10">
                      <span className="px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[9px] font-bold uppercase tracking-wider text-white/90">
                        {character.traits[0]}
                      </span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white z-20">
                      <h3 className="font-heading text-xl font-bold mb-1">{character.name}</h3>
                      <p className="text-xs text-white/80 line-clamp-2 mb-2">"{renderActionText(character.greeting)}"</p>
                      {offset === 0 && (
                        <div className="flex items-center justify-between pt-2 border-t border-white/10">
                          <span className="text-[10px] text-white/70"><span className="text-primary">🔥</span> {character.chatCount}</span>
                          <span className="text-[10px] font-bold text-white bg-white/10 px-2 py-1 rounded-full">{t('chat_button')} 💬</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Buttons */}
          <div className="flex flex-row sm:flex-row gap-2 sm:gap-4 justify-center lg:justify-start">
            <Button
              size="lg"
              className="relative overflow-hidden bg-primary hover:bg-primary/90 text-white font-bold px-4 sm:px-10 py-3 sm:py-6 text-sm sm:text-lg rounded-xl sm:rounded-2xl shadow-[0_0_20px_rgba(255,0,110,0.4)] transition-all sm:hover:scale-105 sm:hover:shadow-[0_0_40px_rgba(255,0,110,0.6)] flex-1 sm:flex-none"
              onClick={() => handleStartChat(heroCharacters[currentIndex])}
            >
              <span className="relative z-10">{t('button_primary')}</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] animate-[shimmer_2s_infinite]"></div>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 font-semibold px-4 sm:px-8 py-3 sm:py-6 text-sm sm:text-lg rounded-xl sm:rounded-2xl backdrop-blur-sm transition-all flex-1 sm:flex-none"
              onClick={() => router.push('/discover')}
            >
              {t('button_secondary')}
            </Button>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-6 justify-center lg:justify-start pt-2 sm:pt-4">
            <div className="flex -space-x-2 sm:-space-x-3">
              {["A", "M", "S", "K"].map((letter, i) => (
                <div
                  key={i}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 border-background flex items-center justify-center text-[10px] sm:text-xs font-bold text-white"
                  style={{
                    background: [
                      "linear-gradient(135deg, #FF006E 0%, #8338EC 100%)",
                      "linear-gradient(135deg, #3A86FF 0%, #8338EC 100%)",
                      "linear-gradient(135deg, #FF006E 0%, #FB5607 100%)",
                      "linear-gradient(135deg, #8338EC 0%, #3A86FF 100%)",
                    ][i]
                  }}
                >
                  {letter}
                </div>
              ))}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">
              <span className="text-foreground font-bold">{t('stats_count')}</span> {t('stats_label')}
            </div>
          </div>
        </div>

        {/* Desktop: Right Content - 3D Card Stack */}
        <div className="hidden lg:flex lg:col-span-6 relative h-[600px] items-center justify-center z-10" style={{ perspective: '1000px' }}>
          {heroCharacters.map((character, index) => {
            // Calculate relative position for stack effect
            const offset = (index - currentIndex + heroCharacters.length) % heroCharacters.length;

            // Only show 3 cards: current, next, and previous (as last)
            if (offset > 2 && offset !== heroCharacters.length - 1) return null;

            const style = getCardStyle(offset, isCompact);

            return (
              <div
                key={character.id}
                className="absolute w-[180px] sm:w-[280px] md:w-[320px] aspect-[3/4] cursor-pointer transition-all duration-500 ease-out"
                onClick={() => {
                  if (offset === 0) handleCharacterClick(character);
                  else setCurrentIndex(index);
                }}
                style={{
                  ...style,
                  transformStyle: 'preserve-3d',
                }}
              >
                <div className={`relative h-full w-full rounded-3xl overflow-hidden border border-white/10 shadow-2xl transition-all duration-300 ${offset === 0 ? 'shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-1 ring-white/20' : ''}`}>
                  <CdnImage
                    src={character.avatar}
                    alt={character.name}
                    fill
                    className="object-cover transition-transform duration-700 hover:scale-110"
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
                      "{renderActionText(character.greeting)}"
                    </p>

                    {offset === 0 && (
                      <div className="flex items-center justify-between pt-4 border-t border-white/10 animate-fade-in">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-white/70">
                          <span className="text-primary">🔥</span> {character.chatCount} {t('chats_suffix')}
                        </div>

                        <div className="flex items-center gap-2 text-xs font-bold text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-colors backdrop-blur-sm">
                          <span>{t('chat_button')}</span>
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
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
