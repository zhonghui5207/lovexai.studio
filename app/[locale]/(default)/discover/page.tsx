"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence, PanInfo, useMotionValue, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { X, Heart, MessageCircle, RefreshCw, Flame, RotateCcw, Info, Trash2, Loader2, Lock, Crown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

// Interface for mapped character data
interface SwipeCharacter {
  id: string;
  _id: Id<"characters">;
  name: string;
  role: string;
  image: string;
  tags: string[];
  bio: string;
  color: string;
}


export default function DiscoverPage() {
  const t = useTranslations();
  const { data: session } = useSession();
  const router = useRouter();
  
  // Convex Hooks
  const rawCharacters = useQuery(api.characters.list, { activeOnly: true });
  const ensureUser = useMutation(api.users.ensureUser);
  const createConversation = useMutation(api.conversations.create);
  const useSwipeMutation = useMutation(api.users.useSwipe);
  
  // User ID for swipe tracking
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [localSwipesUsed, setLocalSwipesUsed] = useState(0);
  
  // Swipe info query (depends on userId)
  const swipeInfo = useQuery(api.users.getRemainingSwipes, userId ? { userId } : "skip");

  const [cards, setCards] = useState<SwipeCharacter[]>([]);
  const [history, setHistory] = useState<SwipeCharacter[]>([]);
  const [match, setMatch] = useState<SwipeCharacter | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [likedCharacters, setLikedCharacters] = useState<SwipeCharacter[]>([]);
  const [isCollectionBounce, setIsCollectionBounce] = useState(false);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  
  // Sync local swipes counter with server data
  useEffect(() => {
    if (swipeInfo) {
      setLocalSwipesUsed(swipeInfo.limit - swipeInfo.remaining);
    }
  }, [swipeInfo]);

  // Load characters when data is available
  useEffect(() => {
    if (rawCharacters) {
      const mapped: SwipeCharacter[] = rawCharacters.map((c, i) => ({
        id: c._id,
        _id: c._id,
        name: c.name,
        role: c.traits?.[0] || "Companion", // Use first trait as fallback role
        image: c.avatar_url || "https://placehold.co/400x600/1a1a1a/ffffff?text=Character",
        tags: c.traits || ["Friendly"],
        bio: c.description,
        background: c.background || "",
        color: ["#ef4444", "#3b82f6", "#a855f7", "#e11d48", "#eab308"][i % 5]
      }));
      setCards(mapped);
    }
  }, [rawCharacters]);
  
  // Sync user and get userId for swipe tracking
  useEffect(() => {
    if (session?.user?.email && !userId) {
      ensureUser({
        email: session.user.email,
        name: session.user.name || "User",
        avatar_url: session.user.image || "",
      }).then(setUserId).catch(console.error);
    }
  }, [session, userId, ensureUser]);

  const handleStartChat = async (characterId: Id<"characters">) => {
    if (!session?.user?.email) {
      window.location.href = '/api/auth/signin';
      return;
    }

    setIsCreatingChat(true);
    try {
      const userId = await ensureUser({
        email: session.user.email,
        name: session.user.name || "User",
        avatar_url: session.user.image || "",
      });

      if (!userId) throw new Error("Failed to sync user");

      const conversationId = await createConversation({
        characterId,
        userId,
      });

      router.push(`/chat?c=${conversationId}`);
    } catch (error) {
      console.error("Failed to create conversation:", error);
    } finally {
      setIsCreatingChat(false);
    }
  };

  // Swipe Logic - Optimistic update (no await)
  const removeCard = (id: string, direction: "left" | "right") => {
    const cardToRemove = cards.find(c => c.id === id);
    if (!cardToRemove) return;
    
    // Check limit locally first (instant check)
    const limit = swipeInfo?.limit ?? 10;
    if (localSwipesUsed >= limit) {
      setShowLimitModal(true);
      return;
    }
    
    // Update local counter immediately
    setLocalSwipesUsed(prev => prev + 1);
    
    // Track swipe in background (non-blocking)
    if (userId) {
      useSwipeMutation({ userId }).then(result => {
        if (!result.success) {
          // Server says limit reached - show modal
          setShowLimitModal(true);
        }
      }).catch(console.error);
    }

    if (direction === 'right') {
        setMatch(cardToRemove);
        setLikedCharacters(prev => {
            if (prev.find(c => c.id === cardToRemove.id)) return prev;
            return [...prev, cardToRemove];
        });
        setIsCollectionBounce(true);
        setTimeout(() => setIsCollectionBounce(false), 300);
    }

    setHistory([...history, cardToRemove]);
    setCards(cards.filter((c) => c.id !== id));
    setIsFlipped(false);
  };

  // BreadcrumbList JSON-LD for Discover page
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://lovexai.studio"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Discover",
        "item": "https://lovexai.studio/discover"
      }
    ]
  };

  return (
    <div className="min-h-screen text-white p-4 md:p-8 max-w-[1600px] mx-auto space-y-12">
      {/* BreadcrumbList JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {/* Hide scrollbar for this page */}
      <style jsx global>{`
        ::-webkit-scrollbar {
          display: none;
        }
        body {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      
      {/* Swipe Limit Reached Modal */}
      <Dialog open={showLimitModal} onOpenChange={setShowLimitModal}>
        <DialogContent className="sm:max-w-md bg-neutral-900 border-white/10 text-white">
            <DialogHeader className="text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mb-4">
                    <Lock className="w-8 h-8 text-white" />
                </div>
                <DialogTitle className="text-2xl font-bold text-white mb-2">
                    {t('discover.limit_title')}
                </DialogTitle>
                <DialogDescription className="text-neutral-400 text-base">
                    {t('discover.limit_desc')}
                </DialogDescription>
            </DialogHeader>
            
            <div className="py-6 space-y-4">
                <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                        <p className="text-2xl font-bold text-white">{t('tiers.plus')}</p>
                        <p className="text-xs text-white/60">{t('discover.swipes_per_day', { count: 30 })}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-purple-500/20 border border-purple-500/30">
                        <p className="text-2xl font-bold text-purple-400">{t('tiers.pro')}</p>
                        <p className="text-xs text-white/60">{t('discover.swipes_per_day', { count: 50 })}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-yellow-500/20 border border-yellow-500/30">
                        <p className="text-2xl font-bold text-yellow-400">{t('tiers.ultimate')}</p>
                        <p className="text-xs text-white/60">{t('discover.unlimited')}</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-3">
                <Link href="/pricing" className="w-full">
                    <Button className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 h-12 text-lg rounded-xl">
                        <Crown className="w-5 h-5 mr-2" />
                        {t('common.upgrade_now')}
                    </Button>
                </Link>
                <Button
                    variant="outline"
                    className="w-full border-white/10 hover:bg-white/5 h-12 text-lg rounded-xl"
                    onClick={() => setShowLimitModal(false)}
                >
                    {t('common.maybe_later')}
                </Button>
            </div>
        </DialogContent>
      </Dialog>

      {/* Match Modal */}
      <Dialog open={!!match} onOpenChange={(open) => !open && setMatch(null)}>
        <DialogContent className="sm:max-w-md bg-neutral-900 border-white/10 text-white">
            <DialogHeader className="text-center">
                <DialogTitle className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500 mb-2">
                    {t('discover.match_title')}
                </DialogTitle>
                <DialogDescription className="text-neutral-400 text-lg">
                    {t('discover.match_desc', { name: match?.name || '' })}
                </DialogDescription>
            </DialogHeader>
            
            <div className="flex items-center justify-center gap-6 py-8">
                <div className="relative">
                    <Avatar className="w-24 h-24 border-4 border-primary shadow-[0_0_30px_rgba(236,72,153,0.3)]">
                        <AvatarImage src={session?.user?.image || "https://github.com/shadcn.png"} />
                        <AvatarFallback>{t('discover.me')}</AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-2 -right-2 bg-neutral-900 rounded-full p-1">
                        <Heart className="w-6 h-6 text-primary fill-current" />
                    </div>
                </div>
                <div className="relative">
                    <Avatar className="w-24 h-24 border-4 border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.3)]">
                        <AvatarImage src={match?.image} />
                        <AvatarFallback>{match?.name[0]}</AvatarFallback>
                    </Avatar>
                </div>
            </div>

            <div className="flex flex-col gap-3">
                <Button 
                    className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 h-12 text-lg rounded-xl"
                    onClick={() => match && handleStartChat(match._id)}
                    disabled={isCreatingChat}
                >
                    {isCreatingChat ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <MessageCircle className="w-5 h-5 mr-2" />}
                    {t('discover.chat_with', { name: match?.name || '' })}
                </Button>
                <Button
                    variant="outline"
                    className="w-full border-white/10 hover:bg-white/5 h-12 text-lg rounded-xl"
                    onClick={() => setMatch(null)}
                >
                    {t('discover.keep_swiping')}
                </Button>
            </div>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500">{t('discover.title').split(' ')[0]}</span> {t('discover.title').split(' ').slice(1).join(' ')}
            </h1>
            <p className="text-muted-foreground text-lg">{t('discover.subtitle')}</p>
        </div>
        
        <div className="flex items-center gap-4">
            <Sheet>
                <SheetTrigger asChild>
                    <Button 
                        variant="ghost" 
                        className={cn(
                            "relative w-12 h-12 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all",
                            isCollectionBounce && "scale-110 text-primary border-primary/50"
                        )}
                    >
                        <Heart className={cn("w-6 h-6 transition-colors", likedCharacters.length > 0 ? "fill-primary text-primary" : "text-muted-foreground")} />
                        {likedCharacters.length > 0 && (
                            <Badge className="absolute -top-1 -right-1 bg-primary text-white text-xs w-5 h-5 flex items-center justify-center p-0 rounded-full animate-in zoom-in border-2 border-black">
                                {likedCharacters.length}
                            </Badge>
                        )}
                    </Button>
                </SheetTrigger>
                <SheetContent className="bg-neutral-900 border-white/10 text-white overflow-y-auto no-scrollbar sm:max-w-md w-full">
                    <SheetHeader className="mb-6">
                        <SheetTitle className="text-2xl font-bold text-white flex items-center gap-2">
                            <Heart className="w-6 h-6 fill-primary text-primary" />
                            {t('discover.my_collection')}
                        </SheetTitle>
                        <SheetDescription className="text-neutral-400">
                            {t('discover.collection_desc')}
                        </SheetDescription>
                    </SheetHeader>
                    
                    <div className="space-y-4">
                        {likedCharacters.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-neutral-500 border-2 border-dashed border-white/10 rounded-xl bg-white/5">
                                <Heart className="w-12 h-12 mb-3 opacity-20" />
                                <p className="font-medium">{t('discover.no_matches')}</p>
                                <p className="text-sm">{t('discover.swipe_hint')}</p>
                            </div>
                        ) : (
                            <AnimatePresence mode="popLayout">
                                {likedCharacters.map((char) => (
                                    <motion.div 
                                        key={char.id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: -100 }}
                                        className="flex items-center gap-4 p-3 bg-white/5 rounded-xl border border-white/5 hover:border-primary/30 transition-all group"
                                    >
                                        <Avatar className="w-14 h-14 border-2 border-white/10">
                                            <AvatarImage src={char.image} className="object-cover" />
                                            <AvatarFallback>{char.name[0]}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-lg truncate">{char.name}</h4>
                                            <p className="text-xs text-primary font-medium truncate">{char.role}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button 
                                                size="icon" 
                                                variant="ghost" 
                                                className="h-10 w-10 hover:bg-primary/20 hover:text-primary rounded-full"
                                                title={t('discover.chat_button')}
                                                onClick={() => handleStartChat(char._id)}
                                                disabled={isCreatingChat}
                                            >
                                                <MessageCircle className="w-5 h-5" />
                                            </Button>
                                            <Button 
                                                size="icon" 
                                                variant="ghost" 
                                                className="h-10 w-10 hover:bg-red-500/20 hover:text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => setLikedCharacters(prev => prev.filter(c => c.id !== char.id))}
                                                title={t('discover.remove_button')}
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </Button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        )}
                    </div>
                </SheetContent>
            </Sheet>

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
                    {t('discover.daily_picks')}
                </h2>
                <p className="text-muted-foreground">{t('discover.daily_picks_desc')}</p>
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
                            isFlipped={isFlipped}
                            setIsFlipped={setIsFlipped}
                            onStartChat={() => handleStartChat(cards[cards.length - 1]._id)}
                        />
                    )}
                </AnimatePresence>
                
                {cards.length === 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/5 rounded-3xl border border-white/10 text-center p-8 z-0 w-full h-full">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4 animate-pulse">
                            <RefreshCw className="w-10 h-10 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">{t('discover.no_more_profiles')}</h3>
                        <p className="text-muted-foreground mb-6">{t('discover.check_back')}</p>
                        <Button onClick={() => window.location.reload()} variant="outline" className="border-primary/50 text-primary hover:bg-primary/10">
                            {t('common.refresh')}
                        </Button>
                    </div>
                )}
            </div>

            {/* Swipe Controls */}
            <div className="flex items-center gap-8 mt-8 relative z-20">
                <Button 
                    size="icon" 
                    className="w-16 h-16 rounded-3xl bg-black/40 border-2 border-slate-500/50 text-slate-400 hover:bg-slate-600 hover:text-white hover:scale-110 transition-all shadow-lg shadow-slate-500/20 backdrop-blur-md"
                    onClick={() => cards.length > 0 && removeCard(cards[cards.length - 1].id, 'left')}
                >
                    <X className="w-8 h-8" />
                </Button>
                
                <Button 
                    size="icon" 
                    className="w-12 h-12 rounded-2xl bg-black/40 border border-white/20 text-white hover:bg-white/10 hover:scale-110 transition-all backdrop-blur-md"
                    onClick={() => setIsFlipped(prev => !prev)}
                >
                    <RotateCcw className="w-5 h-5 text-yellow-400" />
                </Button>

                <Button 
                    size="icon" 
                    className="w-16 h-16 rounded-3xl bg-black/40 border-2 border-rose-500/50 text-rose-500 hover:bg-rose-500 hover:text-white hover:scale-110 transition-all shadow-lg shadow-rose-500/20 backdrop-blur-md"
                    onClick={() => cards.length > 0 && removeCard(cards[cards.length - 1].id, 'right')}
                >
                    <Heart className="w-8 h-8 fill-current" />
                </Button>
            </div>
        </div>

        {/* Bottom Section: All Characters Grid */}
        <section>
            <h2 className="text-2xl font-bold mb-6">{t('discover.trending')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                 {(rawCharacters || [])
                    .slice()
                    .sort((a, b) => (b.like_count || 0) - (a.like_count || 0))
                    .map((char) => (
                    <TrendingCard
                        key={char._id}
                        character={char}
                        onClick={() => handleStartChat(char._id)}
                    />
                 ))}
            </div>
            <div className="mt-12 text-center">
                <Button variant="outline" className="border-white/10 hover:bg-white/5 px-8">{t('common.load_more')}</Button>
            </div>
        </section>

      </div>
    </div>
  );
}

// --- Sub-components ---

// Trending Character Card with video hover, badges, and effects
function TrendingCard({
  character,
  onClick
}: {
  character: any;
  onClick: () => void;
}) {
  const t = useTranslations();
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Handle video play/pause on hover
  useEffect(() => {
    if (!videoRef.current || !character.video_url) return;
    
    if (isHovered) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  }, [isHovered, character.video_url]);

  // Get access level badge color
  const getAccessLevelStyle = (level: string) => {
    switch (level) {
      case 'free': return 'bg-emerald-500/80 text-white';
      case 'plus': return 'bg-blue-500/80 text-white';
      case 'pro': return 'bg-purple-500/80 text-white';
      case 'ultimate': return 'bg-gradient-to-r from-amber-500 to-orange-500 text-white';
      default: return 'bg-white/20 text-white';
    }
  };

  return (
    <div 
      className={cn(
        "group relative aspect-[3/4] rounded-2xl overflow-hidden bg-neutral-900 cursor-pointer",
        "border border-white/5 transition-all duration-300",
        isHovered && "border-primary/50 shadow-[0_0_30px_rgba(236,72,153,0.3)]"
      )}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Layer */}
      <img 
        src={character.avatar_url || "https://placehold.co/400x600/1a1a1a/ffffff?text=Character"} 
        alt={character.name} 
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        onError={(e) => e.currentTarget.src = "https://placehold.co/400x600/1a1a1a/ffffff?text=Character"}
      />

      {/* Video Layer - Shows on Hover */}
      {character.video_url && (
        <div className={`absolute inset-0 z-10 transition-opacity duration-500 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
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

      {/* Top Left - Stats */}
      <div className="absolute top-3 left-3 z-30">
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/40 backdrop-blur-md text-white/90 text-[10px] font-medium border border-white/10">
          <Heart className="w-3 h-3 fill-current text-primary" />
          {character.like_count || 0}
        </div>
      </div>

      {/* Top Right - Access Level (hide on hover) / LIVE (show on hover) */}
      {character.access_level && (
        <div className={`absolute top-3 right-3 z-30 transition-all duration-300 ${isHovered && character.video_url ? 'opacity-0 scale-90' : 'opacity-100 scale-100'}`}>
          <div className={`px-2.5 py-1 rounded-full backdrop-blur-md text-[10px] font-bold uppercase tracking-wide ${getAccessLevelStyle(character.access_level)}`}>
            {character.access_level}
          </div>
        </div>
      )}

      {/* LIVE Badge - Show when hovering with video */}
      {character.video_url && (
        <div className={`absolute top-3 right-3 z-30 transition-all duration-300 ${isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/80 backdrop-blur-md text-white text-[10px] font-medium">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            {t('discover.live')}
          </div>
        </div>
      )}

      {/* Bottom Info */}
      <div className="absolute bottom-0 left-0 right-0 p-4 z-30 transform transition-transform duration-300 group-hover:-translate-y-1">
        <h3 className="font-bold text-white text-lg mb-1">{character.name}</h3>
        <p className="text-xs text-white/60 line-clamp-1">{character.description}</p>
        
        <div className="mt-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-xs text-primary font-medium">{t('discover.chat_now')}</span>
          <MessageCircle className="w-4 h-4 text-primary" />
        </div>
      </div>
    </div>
  );
}

function SwipeCard({
    data,
    position,
    onSwipe,
    isFlipped = false,
    setIsFlipped,
    onStartChat
}: {
    data: any,
    position: 'left' | 'center' | 'right',
    onSwipe: (dir: "left" | "right") => void,
    isFlipped?: boolean,
    setIsFlipped?: React.Dispatch<React.SetStateAction<boolean>>,
    onStartChat?: () => void
}) {
    const t = useTranslations();
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-15, 15]);
    
    // Color overlays based on drag
    const likeOpacity = useTransform(x, [0, 150], [0, 1]);
    const nopeOpacity = useTransform(x, [-150, 0], [1, 0]);

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
        if (!isDragging.current && setIsFlipped) {
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
                    {/* Image - position at 25% from top (between top and center) */}
                    <img 
                      src={data.image || "https://placehold.co/400x600/1a1a1a/ffffff?text=Character"} 
                      alt={data.name} 
                      className="w-full h-full object-cover pointer-events-none" 
                      style={{ objectPosition: 'center 25%' }}
                      onError={(e) => e.currentTarget.src = "https://placehold.co/400x600/1a1a1a/ffffff?text=Character"}
                    />
                    
                    {/* Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none" />

                    {/* Overlays (Only visible when dragging center card) */}
                    {position === 'center' && (
                        <>
                            <motion.div style={{ opacity: likeOpacity }} className="absolute top-8 left-8 border-4 border-rose-500 rounded-lg px-4 py-2 -rotate-12 pointer-events-none z-20">
                                <span className="text-rose-500 font-bold text-4xl uppercase tracking-widest">{t('discover.like')}</span>
                            </motion.div>
                            <motion.div style={{ opacity: nopeOpacity }} className="absolute top-8 right-8 border-4 border-slate-500 rounded-lg px-4 py-2 rotate-12 pointer-events-none z-20">
                                <span className="text-slate-500 font-bold text-4xl uppercase tracking-widest">{t('discover.nope')}</span>
                            </motion.div>
                        </>
                    )}

                    {/* Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-8 pointer-events-none">
                        <div className="flex items-end justify-between mb-2">
                            <div>
                                <h2 className="text-4xl font-bold text-white drop-shadow-md">
                                    {data.name}
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

                        </div>
                    </div>
                </div>

                {/* Back Face (Details) */}
                <div 
                    className="absolute inset-0 w-full h-full bg-neutral-900 p-8 flex flex-col overflow-y-auto rounded-3xl border border-white/10 shadow-2xl cursor-pointer"
                    style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                    onClick={() => setIsFlipped && setIsFlipped(false)}
                >
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-3xl font-bold text-white">{data.name}</h2>
                    </div>

                    <div className="space-y-6 text-white/80">
                        {data.background && (
                        <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                            <h3 className="text-sm font-bold text-primary uppercase tracking-wider mb-2 flex items-center gap-2">
                                <Info className="w-4 h-4" /> {t('discover.background_story')}
                            </h3>
                            <p className="leading-relaxed">
                                {data.background}
                            </p>
                        </div>
                        )}

                        <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                            <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider mb-2">
                                {t('discover.description')}
                            </h3>
                            <p className="leading-relaxed text-white/80">
                                {data.bio}
                            </p>
                        </div>

                        <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                            <h3 className="text-sm font-bold text-primary uppercase tracking-wider mb-2">
                                {t('discover.personality_traits')}
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {data.tags.map((tag: string) => (
                                    <Badge key={tag} variant="secondary" className="bg-purple-500/20 text-purple-300 border-0">
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-auto pt-6">
                        <Button
                            className="w-full bg-primary hover:bg-primary/90 text-white py-6 text-lg rounded-xl shadow-lg shadow-primary/20"
                            onClick={(e) => {
                                e.stopPropagation();
                                onStartChat?.();
                            }}
                        >
                            {t('discover.start_chatting', { name: data.name })}
                        </Button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
