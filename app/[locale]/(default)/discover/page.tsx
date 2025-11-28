"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, PanInfo, useMotionValue, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { X, Heart, MessageCircle, RefreshCw, Zap, Flame, Sparkles, MapPin, RotateCcw, Info } from "lucide-react";

// Mock Data for Swipe Cards
const SWIPE_CHARACTERS = [
  {
    id: "swipe_1",
    name: "Neon",
    age: 21,
    role: "Cyber Hacker",
    image: "https://cdn.lovexai.studio/Character/ComfyUI_00015_.png",
    tags: ["Rebellious", "Tech-savvy"],
    bio: "Looking for someone who can keep up with my encryption keys. 🗝️",
    distance: "2km away",
    color: "#ef4444" // Red
  },
  {
    id: "swipe_2",
    name: "Aria",
    age: 24,
    role: "Elven Mage",
    image: "https://cdn.lovexai.studio/Character/ComfyUI_00020_.png",
    tags: ["Gentle", "Mystical"],
    bio: "I can cast a spell on you, but I'd rather charm you with coffee. ☕",
    distance: "From another realm",
    color: "#3b82f6" // Blue
  },
  {
    id: "swipe_3",
    name: "Viper",
    age: 23,
    role: "Assassin",
    image: "https://cdn.lovexai.studio/Character/ComfyUI_00027_.png",
    tags: ["Dangerous", "Loyal"],
    bio: "Don't worry, I only bite if you ask nicely. 🐍",
    distance: "Shadows",
    color: "#a855f7" // Purple
  },
  {
    id: "swipe_4",
    name: "Luna",
    age: 20,
    role: "Street Racer",
    image: "https://cdn.lovexai.studio/Character/ComfyUI_00016_.png",
    tags: ["Fast", "Adrenaline"],
    bio: "Life in the fast lane. Catch me if you can! 🏎️",
    distance: "5km away",
    color: "#e11d48" // Pink
  },
  {
    id: "swipe_5",
    name: "Kael",
    age: 28,
    role: "Knight Commander",
    image: "https://cdn.lovexai.studio/Character/ComfyUI_00017_.png",
    tags: ["Honorable", "Protective"],
    bio: "My sword is yours, my lady. ⚔️",
    distance: "Castle Grounds",
    color: "#eab308" // Yellow
  },
  {
    id: "swipe_6",
    name: "Zara",
    age: 22,
    role: "Space Explorer",
    image: "https://cdn.lovexai.studio/Character/ComfyUI_00018_.png",
    tags: ["Curious", "Adventurous"],
    bio: "Let's explore the galaxy together. ✨",
    distance: "Light years away",
    color: "#6366f1" // Indigo
  },
  {
    id: "swipe_7",
    name: "Rogue",
    age: 25,
    role: "Mercenary",
    image: "https://cdn.lovexai.studio/Character/ComfyUI_00019_.png",
    tags: ["Mysterious", "Strong"],
    bio: "For the right price, I'll do anything. 💰",
    distance: "Unknown",
    color: "#10b981" // Emerald
  },
  {
    id: "swipe_8",
    name: "Seraphina",
    age: 1000,
    role: "Ancient Vampire",
    image: "https://cdn.lovexai.studio/Character/ComfyUI_00021_.png",
    tags: ["Elegant", "Eternal"],
    bio: "I have seen empires rise and fall. 🍷",
    distance: "Old Mansion",
    color: "#9f1239" // Rose
  },
  {
    id: "swipe_9",
    name: "Dr. X",
    age: 35,
    role: "Mad Scientist",
    image: "https://cdn.lovexai.studio/Character/ComfyUI_00022_.png",
    tags: ["Genius", "Crazy"],
    bio: "My experiments are... unconventional. 🧪",
    distance: "Underground Lab",
    color: "#14b8a6" // Teal
  },
  {
    id: "swipe_10",
    name: "Pixel",
    age: 19,
    role: "AI Streamer",
    image: "https://cdn.lovexai.studio/Character/ComfyUI_00023_.png",
    tags: ["Virtual", "Kawaii"],
    bio: "Don't forget to like and subscribe! 📺",
    distance: "The Cloud",
    color: "#ec4899" // Pink
  }
];

// Mock Data for Categories
const CATEGORIES = [
  { id: "cyber", name: "Cyber City", image: "/generated_characters/character_street_fashion.png", count: "1.2k" },
  { id: "fantasy", name: "Fantasy Realm", image: "https://cdn.lovexai.studio/Character/ComfyUI_00020_.png", count: "850" },
  { id: "campus", name: "Campus Life", image: "https://cdn.lovexai.studio/Character/ComfyUI_00015_.png", count: "2.1k" },
  { id: "office", name: "Office Romance", image: "https://cdn.lovexai.studio/Character/ComfyUI_00027_.png", count: "500+" },
];

export default function DiscoverPage() {
  const [cards, setCards] = useState(SWIPE_CHARACTERS);
  const [history, setHistory] = useState<typeof SWIPE_CHARACTERS>([]);

  // Swipe Logic
  const removeCard = (id: string, direction: "left" | "right") => {
    const cardToRemove = cards.find(c => c.id === id);
    if (!cardToRemove) return;

    setHistory([...history, cardToRemove]);
    setCards(cards.filter((c) => c.id !== id));
    
    // TODO: Trigger API for Like/Pass
    console.log(`Swiped ${direction} on ${cardToRemove.name}`);
  };

  return (
    <div className="min-h-screen text-white p-4 md:p-8 max-w-[1600px] mx-auto space-y-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500">Discover</span> Your Destiny
            </h1>
            <p className="text-muted-foreground text-lg">Swipe to match, chat to connect.</p>
        </div>
        <div className="flex items-center gap-3 bg-white/5 p-2 rounded-full border border-white/10">
            <Badge variant="secondary" className="bg-primary/20 text-primary hover:bg-primary/30 px-4 py-2 rounded-full text-sm cursor-pointer transition-colors">
                <Flame className="w-4 h-4 mr-1.5" /> Trending
            </Badge>
            <Badge variant="outline" className="text-muted-foreground hover:text-white px-4 py-2 rounded-full text-sm cursor-pointer transition-colors border-transparent hover:border-white/10">
                <Sparkles className="w-4 h-4 mr-1.5" /> New Arrivals
            </Badge>
            <Badge variant="outline" className="text-muted-foreground hover:text-white px-4 py-2 rounded-full text-sm cursor-pointer transition-colors border-transparent hover:border-white/10">
                <MapPin className="w-4 h-4 mr-1.5" /> Nearby
            </Badge>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="flex flex-col gap-16">
        
        {/* Top Section: Daily Picks (Swipe Deck) */}
        <div className="flex flex-col items-center justify-center w-full max-w-3xl mx-auto relative">
            
            {/* Dynamic Background Atmosphere */}
            <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
                <motion.div 
                    animate={{ 
                        backgroundColor: cards.length > 0 ? cards[cards.length - 1].color : "#000000"
                    }}
                    transition={{ duration: 0.8 }}
                    className="w-[120%] h-[120%] opacity-20 blur-[120px] rounded-full"
                />
            </div>

            <div className="text-center mb-8 relative z-10">
                <h2 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
                    <Flame className="w-6 h-6 text-primary" />
                    Daily Picks
                </h2>
                <p className="text-muted-foreground">Swipe to find your perfect match for today.</p>
            </div>

            <div className="relative w-full h-[550px] flex items-center justify-center perspective-1000 z-10">
                <AnimatePresence mode="popLayout">
                    {/* Left Card (History) */}
                    {history.length > 0 && (
                        <SwipeCard 
                            key={history[history.length - 1].id}
                            data={history[history.length - 1]}
                            position="left"
                            onSwipe={() => {}} 
                        />
                    )}

                    {/* Right Card (Next in Queue) */}
                    {cards.length > 1 && (
                        <SwipeCard 
                            key={cards[cards.length - 2].id}
                            data={cards[cards.length - 2]}
                            position="right"
                            onSwipe={() => {}} 
                        />
                    )}

                    {/* Center Card (Active) */}
                    {cards.length > 0 && (
                        <SwipeCard 
                            key={cards[cards.length - 1].id}
                            data={cards[cards.length - 1]}
                            position="center"
                            onSwipe={(dir) => removeCard(cards[cards.length - 1].id, dir)}
                        />
                    )}
                </AnimatePresence>
                
                {cards.length === 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/5 rounded-3xl border border-white/10 text-center p-8 z-0 w-full h-full">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4 animate-pulse">
                            <RefreshCw className="w-10 h-10 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">No more profiles</h3>
                        <p className="text-muted-foreground mb-6">Check back later for new companions!</p>
                        <Button onClick={() => setCards(SWIPE_CHARACTERS)} variant="outline" className="border-primary/50 text-primary hover:bg-primary/10">
                            Reset Demo
                        </Button>
                    </div>
                )}
            </div>

            {/* Swipe Controls */}
            <div className="flex items-center gap-8 mt-8 relative z-20">
                <Button 
                    size="icon" 
                    className="w-16 h-16 rounded-full bg-black/40 border-2 border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white hover:scale-110 transition-all shadow-lg shadow-red-500/20 backdrop-blur-md"
                    onClick={() => cards.length > 0 && removeCard(cards[cards.length - 1].id, 'left')}
                >
                    <X className="w-8 h-8" />
                </Button>
                
                <Button 
                    size="icon" 
                    className="w-12 h-12 rounded-full bg-black/40 border border-white/20 text-white hover:bg-white/10 hover:scale-110 transition-all backdrop-blur-md"
                    onClick={() => {
                        // Trigger flip on the active card
                        const activeCard = document.querySelector(`[data-card-id="${cards[cards.length - 1].id}"]`);
                        if (activeCard) {
                            const event = new CustomEvent('flipCard');
                            activeCard.dispatchEvent(event);
                        }
                    }}
                >
                    <RotateCcw className="w-5 h-5 text-yellow-400" />
                </Button>

                <Button 
                    size="icon" 
                    className="w-16 h-16 rounded-full bg-black/40 border-2 border-green-500/50 text-green-500 hover:bg-green-500 hover:text-white hover:scale-110 transition-all shadow-lg shadow-green-500/20 backdrop-blur-md"
                    onClick={() => cards.length > 0 && removeCard(cards[cards.length - 1].id, 'right')}
                >
                    <Heart className="w-8 h-8 fill-current" />
                </Button>
            </div>
        </div>

        {/* Middle Section: Categories */}
        <section>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Explore Worlds</h2>
                <Button variant="link" className="text-primary">View All</Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {CATEGORIES.map((cat) => (
                    <div key={cat.id} className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer">
                        <img src={cat.image} alt={cat.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                        <div className="absolute bottom-0 left-0 p-4">
                            <h3 className="font-bold text-white group-hover:text-primary transition-colors">{cat.name}</h3>
                            <p className="text-xs text-white/60">{cat.count} characters</p>
                        </div>
                    </div>
                ))}
            </div>
        </section>

        {/* Bottom Section: All Characters Grid */}
        <section>
            <h2 className="text-2xl font-bold mb-6">Trending Characters</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                 {/* Reusing a simplified card structure for the grid */}
                 {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                    <div key={i} className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-neutral-900 cursor-pointer border border-white/5 hover:border-primary/50 transition-all">
                        <img 
                            src={`https://cdn.lovexai.studio/Character/ComfyUI_000${15 + i}_.png`} 
                            alt="Character" 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            onError={(e) => e.currentTarget.src = "https://placehold.co/400x600/1a1a1a/ffffff?text=Character"}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-80" />
                        
                        <div className="absolute bottom-0 left-0 right-0 p-4 transform transition-transform duration-300 group-hover:-translate-y-1">
                            <h3 className="font-bold text-white text-lg mb-1">Character {i}</h3>
                            <p className="text-xs text-white/60 line-clamp-1">A mysterious character waiting to meet you.</p>
                            
                            <div className="mt-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-xs text-primary font-medium">Chat Now</span>
                                <MessageCircle className="w-4 h-4 text-primary" />
                            </div>
                        </div>
                    </div>
                 ))}
            </div>
            <div className="mt-12 text-center">
                <Button variant="outline" className="border-white/10 hover:bg-white/5 px-8">Load More</Button>
            </div>
        </section>

      </div>
    </div>
  );
}

// --- Sub-components ---

function SwipeCard({ data, position, onSwipe }: { data: any, position: 'left' | 'center' | 'right', onSwipe: (dir: "left" | "right") => void }) {
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-15, 15]);
    
    // Color overlays based on drag
    const likeOpacity = useTransform(x, [0, 150], [0, 1]);
    const nopeOpacity = useTransform(x, [-150, 0], [1, 0]);

    // Flip State
    const [isFlipped, setIsFlipped] = useState(false);

    // Listen for flip event
    useEffect(() => {
        const handleFlip = () => setIsFlipped(prev => !prev);
        const element = document.querySelector(`[data-card-id="${data.id}"]`);
        
        if (element) {
            element.addEventListener('flipCard', handleFlip);
            return () => element.removeEventListener('flipCard', handleFlip);
        }
    }, [data.id]);

    // Track drag state to distinguish between click and drag
    const isDragging = useRef(false);

    const handleDragStart = () => {
        isDragging.current = true;
    };

    const handleDragEnd = (event: any, info: PanInfo) => {
        // Small delay to reset drag state to allow click handler to check it
        setTimeout(() => {
            isDragging.current = false;
        }, 100);

        if (info.offset.x > 100) {
            onSwipe("right");
        } else if (info.offset.x < -100) {
            onSwipe("left");
        }
    };

    const handleCardClick = () => {
        if (!isDragging.current) {
            setIsFlipped(true);
        }
    };

    const variants = {
        center: { 
            x: 0, 
            y: 0,
            scale: [1.05, 1], 
            rotate: 0, 
            opacity: 1, 
            filter: "blur(0px)",
            zIndex: 10,
            transition: { duration: 0.4, ease: [0.32, 0.72, 0, 1] } 
        },
        left: { 
            x: -360, 
            y: 0,
            scale: 0.85, 
            rotate: -6, 
            opacity: 0.5, 
            filter: "blur(3px)",
            zIndex: 5,
            transition: { duration: 0.4, ease: [0.32, 0.72, 0, 1] }
        },
        right: { 
            x: 360, 
            y: 0,
            scale: 0.85, 
            rotate: 6, 
            opacity: 0.5, 
            filter: "blur(3px)",
            zIndex: 5,
            transition: { duration: 0.4, ease: [0.32, 0.72, 0, 1] }
        },
        exit: (custom: number) => ({
            x: custom > 0 ? 1000 : -1000,
            opacity: 0,
            transition: { duration: 0.6, ease: "easeIn" }
        })
    };

    return (
        <motion.div
            data-card-id={data.id}
            variants={variants}
            initial={position === 'center' ? 'right' : false} 
            animate={position}
            exit="exit"
            custom={x.get()}
            style={{ 
                x: position === 'center' ? x : 0, 
                rotate: position === 'center' ? rotate : (variants[position] as any).rotate || 0,
                zIndex: (variants[position] as any).zIndex || 0,
                transformStyle: "preserve-3d", // Crucial for 3D flip
            }}
            drag={position === 'center' && !isFlipped ? "x" : false} // Disable drag when flipped
            dragConstraints={{ left: 0, right: 0 }}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing perspective-1000"
        >
            <motion.div 
                className="relative w-full h-full"
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                style={{ transformStyle: "preserve-3d" }}
            >
                {/* Front Face */}
                <div 
                    className="absolute inset-0 w-full h-full rounded-3xl overflow-hidden bg-neutral-900 shadow-2xl border border-white/10 cursor-pointer" 
                    style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                    onClick={handleCardClick}
                >
                    {/* Image */}
                    <img src={data.image} alt={data.name} className="w-full h-full object-cover pointer-events-none" />
                    
                    {/* Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none" />

                    {/* Overlays (Only visible when dragging center card) */}
                    {position === 'center' && (
                        <>
                            <motion.div style={{ opacity: likeOpacity }} className="absolute top-8 left-8 border-4 border-green-500 rounded-lg px-4 py-2 -rotate-12 pointer-events-none z-20">
                                <span className="text-green-500 font-bold text-4xl uppercase tracking-widest">LIKE</span>
                            </motion.div>
                            <motion.div style={{ opacity: nopeOpacity }} className="absolute top-8 right-8 border-4 border-red-500 rounded-lg px-4 py-2 rotate-12 pointer-events-none z-20">
                                <span className="text-red-500 font-bold text-4xl uppercase tracking-widest">NOPE</span>
                            </motion.div>
                        </>
                    )}

                    {/* Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-8 pointer-events-none">
                        <div className="flex items-end justify-between mb-2">
                            <div>
                                <h2 className="text-4xl font-bold text-white drop-shadow-md">
                                    {data.name}, <span className="text-2xl font-medium text-white/80">{data.age}</span>
                                </h2>
                                <p className="text-lg text-primary font-medium flex items-center gap-1">
                                    {data.role}
                                </p>
                            </div>
                            <Button size="icon" className="rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30">
                                <MessageCircle className="w-6 h-6" />
                            </Button>
                        </div>
                        
                        <p className="text-white/90 text-lg leading-relaxed mb-4 line-clamp-2">
                            {data.bio}
                        </p>

                        <div className="flex flex-wrap gap-2">
                            {data.tags.map((tag: string) => (
                                <Badge key={tag} variant="secondary" className="bg-white/10 text-white backdrop-blur-md border-0">
                                    {tag}
                                </Badge>
                            ))}
                            <Badge variant="outline" className="text-white/60 border-white/20 gap-1">
                                <MapPin className="w-3 h-3" /> {data.distance}
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* Back Face (Details) */}
                <div 
                    className="absolute inset-0 w-full h-full bg-neutral-900 p-8 flex flex-col overflow-y-auto rounded-3xl border border-white/10 shadow-2xl cursor-pointer"
                    style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                    onClick={() => setIsFlipped(false)}
                >
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-3xl font-bold text-white">{data.name}</h2>
                    </div>

                    <div className="space-y-6 text-white/80">
                        <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                            <h3 className="text-sm font-bold text-primary uppercase tracking-wider mb-2 flex items-center gap-2">
                                <Info className="w-4 h-4" /> Background Story
                            </h3>
                            <p className="leading-relaxed">
                                Born in the neon-lit streets of Sector 7, {data.name} learned to survive by hacking into corporate mainframes. 
                                (This is a placeholder story for {data.role}). Known for being {data.tags.join(" and ")}.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                             <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                                <h3 className="text-xs font-bold text-white/50 uppercase mb-1">Role</h3>
                                <p className="font-medium">{data.role}</p>
                             </div>
                             <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                                <h3 className="text-xs font-bold text-white/50 uppercase mb-1">Distance</h3>
                                <p className="font-medium">{data.distance}</p>
                             </div>
                        </div>

                        <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                            <h3 className="text-sm font-bold text-primary uppercase tracking-wider mb-2">
                                Personality Traits
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {data.tags.map((tag: string) => (
                                    <Badge key={tag} variant="secondary" className="bg-primary/20 text-primary border-0">
                                        {tag}
                                    </Badge>
                                ))}
                                <Badge variant="outline">Intelligent</Badge>
                                <Badge variant="outline">Secretive</Badge>
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-auto pt-6">
                        <Button className="w-full bg-primary hover:bg-primary/90 text-white py-6 text-lg rounded-xl shadow-lg shadow-primary/20">
                            Start Chatting with {data.name}
                        </Button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
