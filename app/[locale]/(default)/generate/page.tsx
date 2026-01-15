"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  Wand2,
  Sparkles,
  Image as ImageIcon,
  Download,
  UserPlus,
  RefreshCw,
  Dice5,
  Maximize2,
  AlertCircle,
  History,
  Trash2,
  X,
  Copy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAction, useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import Link from "next/link";
import { useAppContext } from "@/contexts/app";
import {
  IMAGE_MODEL_CREDITS,
  IMAGE_MODEL_INFO,
  IMAGE_MODEL_TIERS,
  SubscriptionTier,
  ImageModel,
  canUseImageModel
} from "@/lib/permissions";

// Mock Data for Styles
const STYLES = [
  { id: "anime", name: "Anime" },
  { id: "realistic", name: "Realistic" },
  { id: "cyberpunk", name: "Cyberpunk" },
  { id: "oil", name: "Oil Painting" },
  { id: "pixel", name: "Pixel Art" },
  { id: "watercolor", name: "Watercolor" },
  { id: "sketch", name: "Sketch" },
  { id: "3d-render", name: "3D Render" },
];

// Image Models - mapped to permissions system
const MODELS: { id: ImageModel; name: string; desc: string; tier: string }[] = [
  { id: "spark", name: "Spark", desc: "Fast & Efficient", tier: "FREE" },
  { id: "prism", name: "Prism", desc: "Balanced Quality", tier: "PLUS" },
  { id: "aurora", name: "Aurora", desc: "Artistic Style", tier: "PRO" },
  { id: "zenith", name: "Zenith", desc: "Ultimate Quality", tier: "ULTIMATE" },
];

// Inspiration Gallery Data - Using real character images (different from HeroBanner)
const INSPIRATION_GALLERY = [
  {
    url: "https://pub-bdda96620f4e47f8b8f36fa876942ccb.r2.dev/characters/female/sophie_neighbor.webp",
    prompt: "A beautiful girl next door in an oversized white t-shirt slipping off her shoulder, messy hair, barefoot, soft bedroom lighting, intimate casual look, photorealistic",
    style: "Realistic"
  },
  {
    url: "https://pub-bdda96620f4e47f8b8f36fa876942ccb.r2.dev/characters/female/olivia_yoga.webp",
    prompt: "A flexible yoga instructor in tight workout clothes, athletic body, stretching pose, gym studio setting, soft natural lighting, fitness aesthetic, photorealistic",
    style: "Realistic"
  },
  {
    url: "https://pub-bdda96620f4e47f8b8f36fa876942ccb.r2.dev/characters/anime/aiko_neko.webp",
    prompt: "A cute anime catgirl maid with fluffy ears and tail, maid uniform, big expressive eyes, kawaii aesthetic, soft pastel colors, anime style",
    style: "Anime"
  },
  {
    url: "https://pub-bdda96620f4e47f8b8f36fa876942ccb.r2.dev/characters/female/hannah_secretary.webp",
    prompt: "A gorgeous secretary in a fitted blouse and pencil skirt, glasses, confident seductive smile, office setting, professional but alluring, photorealistic",
    style: "Realistic"
  },
  {
    url: "https://pub-bdda96620f4e47f8b8f36fa876942ccb.r2.dev/characters/anime/yumi_yandere.webp",
    prompt: "A beautiful yandere anime girl with intense loving eyes, school uniform, cherry blossoms, dramatic anime style, captivating and mysterious",
    style: "Anime"
  }
];

// Random Prompts for "Dice"
const RANDOM_PROMPTS = [
  "A futuristic cyberpunk nurse with neon glowing syringe, rain-slicked streets background.",
  "A high-fantasy elf princess with silver hair and emerald eyes, standing in a magical forest.",
  "A noir detective smoking a cigarette in a rainy alleyway, black and white style.",
  "A cute anime girl with cat ears eating a donut in a pastel café.",
  "A majestic space warrior in golden armor floating in a nebula."
];

// Typewriter Placeholders
const PLACEHOLDERS = [
  "Describe your dream character... (e.g. Silver hair, red eyes)",
  "A cyberpunk street samurai with a neon katana...",
  "A mystical elf princess in a moonlit forest...",
  "A noir detective in a rainy city...",
];

export default function GeneratePage() {
  const t = useTranslations();
  const [prompt, setPrompt] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("anime");
  const [selectedModel, setSelectedModel] = useState<ImageModel>("spark");
  // const [aspectRatio, setAspectRatio] = useState("9:16"); // Removed, defaulting to 3:4
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState<string | null>(null); // Track prompt for current image
  
  // UI States
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [placeholderText, setPlaceholderText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [loadingLog, setLoadingLog] = useState("Initializing...");
  const [isGalleryCompact, setIsGalleryCompact] = useState(false);

  // Scroll state for showing scrollbar only when scrolling
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const handleScroll = useCallback(() => {
    setIsScrolling(true);
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 1000); // Hide scrollbar 1 second after scrolling stops
  }, []);

  // Get current user from AppContext
  const { user, setShowSignModal } = useAppContext();
  
  // Sync user with Convex and get unified userId
  const ensureUser = useMutation(api.users.ensureUser);
  const [convexUserId, setConvexUserId] = useState<string | null>(null);
  
  useEffect(() => {
    if (user?.email && !convexUserId) {
      ensureUser({
        email: user.email,
        name: user.name || "User",
        avatar_url: user.avatar_url || "",
      }).then((id) => {
        setConvexUserId(id);
      }).catch((err) => {
        console.error("Failed to sync user:", err);
      });
    }
  }, [user, convexUserId, ensureUser]);

  // Convex Hooks - use unified convexUserId
  const generateAction = useAction(api.images.generate);
  const enhanceAction = useAction(api.actions.enhancePrompt);
  const deleteAction = useMutation(api.images.remove);
  // Pass convexUserId to query for history
  const history = useQuery(api.images.listMine, convexUserId ? { userId: convexUserId } : "skip");
  const [isEnhancing, setIsEnhancing] = useState(false);

  // Get user data for credits and tier - use getByEmail since we use NextAuth not Convex auth
  const convexUser = useQuery(api.users.getByEmail, user?.email ? { email: user.email } : "skip");
  const userCredits = convexUser?.credits_balance ?? 0;
  const userTier = (convexUser?.subscription_tier || 'free') as SubscriptionTier;
  const imageCreditsCost = IMAGE_MODEL_CREDITS[selectedModel] || 10;

  // Typewriter Effect
  useEffect(() => {
    const currentText = PLACEHOLDERS[placeholderIndex];
    const speed = isDeleting ? 30 : 50;
    
    const timer = setTimeout(() => {
      if (!isDeleting && placeholderText === currentText) {
        setTimeout(() => setIsDeleting(true), 2000); // Wait before deleting
      } else if (isDeleting && placeholderText === "") {
        setIsDeleting(false);
        setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
      } else {
        setPlaceholderText(
          isDeleting 
            ? currentText.substring(0, placeholderText.length - 1) 
            : currentText.substring(0, placeholderText.length + 1)
        );
      }
    }, speed);

    return () => clearTimeout(timer);
  }, [placeholderText, isDeleting, placeholderIndex]);

  // Gallery Slideshow
  useEffect(() => {
    if (generatedImage || isGenerating) return;
    const timer = setInterval(() => {
      setGalleryIndex((prev) => (prev + 1) % INSPIRATION_GALLERY.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [generatedImage, isGenerating]);

  // Compact gallery layout for ultra-narrow screens
  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(max-width: 419px)");
    const handleChange = () => setIsGalleryCompact(media.matches);
    handleChange();
    if (media.addEventListener) {
      media.addEventListener("change", handleChange);
      return () => media.removeEventListener("change", handleChange);
    }
    media.addListener(handleChange);
    return () => media.removeListener(handleChange);
  }, []);

  // Loading Logs Simulation
  useEffect(() => {
    if (!isGenerating) return;
    const logs = [
      "Parsing semantic requirements...",
      "Constructing skeletal structure...",
      "Rendering light and shadow...",
      "Injecting soul...",
      "Finalizing details..."
    ];
    let i = 0;
    const timer = setInterval(() => {
      setLoadingLog(logs[i % logs.length]);
      i++;
    }, 1500);
    return () => clearInterval(timer);
  }, [isGenerating]);

  const handleEnhance = async () => {
    if (!prompt) return;
    setIsEnhancing(true);
    try {
      const enhanced = await enhanceAction({ prompt });
      if (enhanced) setPrompt(enhanced); // Fix lint: ensure enhanced is not null
      toast.success("Prompt enhanced!");
    } catch (error) {
      toast.error("Failed to enhance prompt");
      console.error(error);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedImage) return;
    try {
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `generated-image-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Image downloaded!");
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Failed to download image");
    }
  };

  const handleRandomPrompt = () => {
    const random = RANDOM_PROMPTS[Math.floor(Math.random() * RANDOM_PROMPTS.length)];
    setPrompt(random);
  };

  const handleGenerate = async () => {
    if (!prompt) return;
    
    // Check if user is logged in
    if (!convexUserId) {
      setShowSignModal(true);
      toast.error(t('common.please_login'));
      return;
    }
    
    setIsGenerating(true);
    setGeneratedImage(null);
    
    try {
      const url = await generateAction({
        prompt: prompt,
        style: selectedStyle,
        ratio: "3:4", // Hardcoded for character cards
        model: selectedModel,
        userId: convexUserId, // Pass unified convexUserId
      });
      if (url) {
        setGeneratedImage(url);
        setCurrentPrompt(prompt); // Save the prompt used for this image
        toast.success(t('common.success'));
      }
    } catch (error: any) {
      console.error(error);
      const errorMessage = error?.message || "Failed to generate image. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: any) => {
    e.stopPropagation(); // Prevent clicking the item
    try {
        // Find the index of the item being deleted
        const deletedIndex = history?.findIndex(h => h._id === id) ?? -1;
        const deletedImageUrl = history?.find(h => h._id === id)?.image_url;
        
        await deleteAction({ id });
        toast.success(t('common.success'));
        
        // If the deleted image was the currently displayed one, show the next available image
        if (generatedImage === deletedImageUrl && history) {
            // After deletion, history will be re-fetched, so we need to calculate what the next item would be
            const remainingImages = history.filter(h => h._id !== id);
            if (remainingImages.length > 0) {
                // Show the next image (or the previous one if we deleted the last item)
                const nextIndex = Math.min(deletedIndex, remainingImages.length - 1);
                const nextImage = remainingImages[nextIndex];
                setGeneratedImage(nextImage.image_url);
                setCurrentPrompt(nextImage.prompt);
            } else {
                // No more images left
                setGeneratedImage(null);
                setCurrentPrompt(null);
            }
        }
    } catch (error) {
        toast.error("Failed to delete image");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 font-sans selection:bg-primary/30">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse delay-1000" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
      </div>
      
      <div className="max-w-[1600px] mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:h-[calc(100vh-100px)]">
        
        {/* LEFT PANEL: CONTROLS */}
        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className={cn(
            "lg:col-span-4 flex flex-col gap-6 sm:gap-8 pr-2 custom-scrollbar relative lg:h-full lg:overflow-y-auto",
            isScrolling && "is-scrolling"
          )}
        >
          
          {/* Background glow for left panel */}
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
          
          {/* Header */}
          <div className="space-y-2 relative">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tighter bg-gradient-to-r from-white via-white to-white/50 bg-clip-text text-transparent animate-in fade-in slide-in-from-left duration-700">
              {t('generate.title')}
            </h1>
            <p className="text-muted-foreground text-sm">
              {t('generate.subtitle')}
            </p>
          </div>

          {/* Model Selector - Card Style */}
          <div className="space-y-3">
            <Label className="text-xs font-medium text-white/50 uppercase tracking-wider flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              AI Model
            </Label>
            <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-2">
              {MODELS.map((model, index) => {
                const isLocked = !canUseImageModel(userTier, model.id);
                const isSelected = selectedModel === model.id;
                const credits = IMAGE_MODEL_CREDITS[model.id];
                const icons = [
                  // Spark - Lightning bolt (fast)
                  <svg key="spark" viewBox="0 0 24 24" className="w-4 h-4" fill="none">
                    <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>,
                  // Prism - Diamond/crystal
                  <svg key="prism" viewBox="0 0 24 24" className="w-4 h-4" fill="none">
                    <path d="M12 2L2 12L12 22L22 12L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 2L12 22M2 12L22 12" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
                  </svg>,
                  // Aurora - Northern lights waves
                  <svg key="aurora" viewBox="0 0 24 24" className="w-4 h-4" fill="none">
                    <path d="M2 12c2-3 4-5 7-5s5 4 7 4 4-3 6-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M2 16c2-2 4-3 6-3s4 2 6 2 4-2 8-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
                    <path d="M2 8c3-2 5-4 8-4s6 3 8 3 3-1 4-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
                  </svg>,
                  // Zenith - Crown/peak
                  <svg key="zenith" viewBox="0 0 24 24" className="w-4 h-4" fill="none">
                    <path d="M12 2l3 6 6 1-4 4 1 6-6-3-6 3 1-6-4-4 6-1 3-6z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>,
                ];
                return (
                  <button
                    key={model.id}
                    onClick={() => {
                      if (isLocked) {
                        toast.error(t('generate.upgrade_model', { tier: model.tier, model: model.name }));
                        return;
                      }
                      setSelectedModel(model.id);
                    }}
                    className={cn(
                      "relative p-3 rounded-xl transition-all duration-200 flex items-center gap-3 group",
                      isLocked
                        ? "bg-white/[0.02] border border-white/5 opacity-50 cursor-not-allowed"
                        : isSelected
                          ? "bg-gradient-to-br from-primary/20 to-purple-600/20 border border-primary/50 shadow-[0_0_15px_rgba(236,72,153,0.2)]"
                          : "bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20"
                    )}
                  >
                    {isSelected && !isLocked && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] animate-[shimmer_2s_infinite] rounded-xl pointer-events-none" />
                    )}

                    {/* Lock icon for locked models */}
                    {isLocked && (
                      <div className="absolute top-1.5 right-1.5 z-10">
                        <svg viewBox="0 0 24 24" className="w-3 h-3 text-white/40" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                          <path d="M7 11V7a5 5 0 0110 0v4"/>
                        </svg>
                      </div>
                    )}

                    <div className={cn(
                      "transition-colors flex-shrink-0",
                      isLocked ? "text-white/30" : isSelected ? "text-primary" : "text-white/50 group-hover:text-white/70"
                    )}>
                      {icons[index]}
                    </div>
                    <div className="flex flex-col items-start min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 w-full">
                        <span className={cn(
                          "text-xs font-medium transition-colors truncate",
                          isLocked ? "text-white/40" : isSelected ? "text-white" : "text-white/70"
                        )}>
                          {model.name}
                        </span>
                        {model.tier !== "FREE" && (
                          <span className={cn(
                            "text-[8px] px-1 py-0.5 rounded font-medium shrink-0",
                            model.tier === "PLUS" ? "bg-blue-500/20 text-blue-400" :
                            model.tier === "PRO" ? "bg-purple-500/20 text-purple-400" :
                            "bg-amber-500/20 text-amber-400"
                          )}>
                            {model.tier}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between w-full">
                        <span className={cn(
                          "text-[10px] transition-colors truncate",
                          isLocked ? "text-white/30" : isSelected ? "text-white/60" : "text-white/40"
                        )}>
                          {model.desc}
                        </span>
                        <span className={cn(
                          "text-[9px] shrink-0 ml-1",
                          isLocked ? "text-white/30" : "text-primary/70"
                        )}>
                          {credits}cr
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Prompt Input - Enhanced Card */}
          <div className="space-y-4 bg-gradient-to-br from-white/[0.07] to-white/[0.03] p-4 sm:p-5 rounded-2xl border border-white/10 backdrop-blur-md group hover:border-primary/30 transition-all duration-300 shadow-lg hover:shadow-primary/5">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <Label className="text-sm font-medium flex items-center gap-2 text-white/80">
                {/* Custom Prompt Icon - Thought Bubble */}
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
                  <defs>
                    <linearGradient id="prompt-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ec4899" />
                      <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                  </defs>
                  <path d="M12 3C7.03 3 3 6.58 3 11c0 2.52 1.29 4.76 3.32 6.22L5 21l4.5-2.25c.79.16 1.63.25 2.5.25 4.97 0 9-3.58 9-8s-4.03-8-9-8z" stroke="url(#prompt-grad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="8" cy="11" r="1" fill="url(#prompt-grad)"/>
                  <circle cx="12" cy="11" r="1" fill="url(#prompt-grad)"/>
                  <circle cx="16" cy="11" r="1" fill="url(#prompt-grad)"/>
                </svg>
                Your Vision
              </Label>
              <div className="flex flex-wrap gap-2">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleEnhance}
                    disabled={isEnhancing || !prompt}
                    className="h-7 text-xs text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 gap-1"
                >
                    {/* Custom Enhance Icon - Lightning Bolt */}
                    <svg viewBox="0 0 24 24" className={cn("w-3 h-3", isEnhancing && "animate-spin")} fill="none">
                      <defs>
                        <linearGradient id="enhance-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#c084fc" />
                          <stop offset="100%" stopColor="#818cf8" />
                        </linearGradient>
                      </defs>
                      <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" stroke="url(#enhance-grad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {isEnhancing ? t('generate.enhancing') : t('generate.enhance')}
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRandomPrompt}
                    className="h-7 text-xs text-primary hover:text-primary/80 hover:bg-primary/10 gap-1"
                >
                    <Dice5 className="w-3 h-3" />
                    {t('generate.randomize')}
                </Button>
              </div>
            </div>
            <div className="relative">
                <Textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={placeholderText}
                className="bg-black/40 border-white/10 min-h-[120px] text-base focus:border-primary/50 resize-none placeholder:text-white/30 transition-all caret-primary [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
                />
            </div>
            
            {/* Quick Tags - Categorized & Lightweight */}
            <div className="space-y-3 pt-2">
              <p className="text-[10px] text-white/40 uppercase tracking-wider">{t('generate.quick_add')}</p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { tag: "Big Breasts", color: "from-pink-400/20 to-rose-500/20" },
                  { tag: "Curvy", color: "from-rose-400/20 to-pink-500/20" },
                  { tag: "Petite", color: "from-purple-400/20 to-pink-500/20" },
                  { tag: "Lingerie", color: "from-red-400/20 to-rose-500/20" },
                  { tag: "Bunny Girl", color: "from-pink-400/20 to-purple-500/20" },
                  { tag: "Maid Outfit", color: "from-slate-400/20 to-pink-500/20" },
                  { tag: "Seductive", color: "from-red-400/20 to-orange-500/20" },
                  { tag: "Shy", color: "from-pink-300/20 to-rose-400/20" },
                  { tag: "Bedroom", color: "from-purple-400/20 to-indigo-500/20" },
                ].map(({ tag, color }) => (
                  <button 
                    key={tag} 
                    className={cn(
                      "px-2.5 py-1 rounded-md text-[11px] font-medium border border-white/10 text-white/50",
                      "hover:text-white hover:border-white/30 transition-all duration-200",
                      "active:scale-95",
                      prompt.toLowerCase().includes(tag.toLowerCase()) && `bg-gradient-to-r ${color} border-white/30 text-white`
                    )}
                    onClick={() => setPrompt(prev => prev ? `${prev}, ${tag}` : tag)}
                  >
                    <span className="opacity-60">+</span> {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Art Style - Card Grid with Icons */}
          <div className="space-y-4">
            <Label className="text-xs font-medium text-white/50 uppercase tracking-wider flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none">
                <path d="M12 2l2 5h5l-4 3 2 5-5-3-5 3 2-5-4-3h5l2-5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {t('generate.art_style')}
              <span className="text-[10px] text-white/30 font-normal normal-case ml-1">{t('generate.choose_one')}</span>
            </Label>
            <div className="grid grid-cols-2 min-[420px]:grid-cols-3 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {[
                { id: "anime", name: "Anime", icon: "M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zM9 9h.01M15 9h.01M9 15c1 1 2.5 1.5 3 1.5s2-.5 3-1.5" },
                { id: "realistic", name: "Realistic", icon: "M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zM12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z" },
                { id: "hentai", name: "Hentai", icon: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" },
                { id: "pinup", name: "Pin-up", icon: "M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8zM12 6a1 1 0 0 0-1 1v5a1 1 0 0 0 2 0V7a1 1 0 0 0-1-1zm0 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" },
                { id: "fantasy", name: "Fantasy", icon: "M12 3l1.5 4.5H18l-3.5 3 1 4.5L12 12.5 8.5 15l1-4.5-3.5-3h4.5L12 3z" },
                { id: "ecchi", name: "Ecchi", icon: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" },
                { id: "soft", name: "Soft", icon: "M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9z" },
                { id: "glamour", name: "Glamour", icon: "M12 2L15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2z" },
              ].map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  className={cn(
                    "relative p-3 rounded-xl transition-all duration-200 flex flex-col items-center gap-1.5 group",
                    selectedStyle === style.id 
                      ? "bg-gradient-to-br from-primary/20 to-purple-600/20 border border-primary/50 shadow-[0_0_15px_rgba(236,72,153,0.2)]" 
                      : "bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20"
                  )}
                >
                  {selectedStyle === style.id && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] animate-[shimmer_2s_infinite] rounded-xl pointer-events-none" />
                  )}
                  <svg viewBox="0 0 24 24" className={cn(
                    "w-5 h-5 transition-colors",
                    selectedStyle === style.id ? "text-primary" : "text-white/40 group-hover:text-white/60"
                  )} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d={style.icon} />
                  </svg>
                  <span className={cn(
                    "text-[10px] font-medium transition-colors",
                    selectedStyle === style.id ? "text-white" : "text-white/50 group-hover:text-white/70"
                  )}>
                    {style.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <div className="mt-auto pt-4 pb-8">
            <Button 
                onClick={handleGenerate}
                disabled={isGenerating || !prompt}
                className={cn(
                "w-full h-12 text-base font-semibold shadow-xl transition-all duration-500 relative overflow-hidden group rounded-xl",
                isGenerating 
                    ? "bg-neutral-800 cursor-not-allowed" 
                    : "bg-gradient-to-r from-primary via-purple-600 to-primary bg-[length:200%_100%] hover:bg-[100%_0] animate-gradient"
                )}
            >
                {isGenerating ? (
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{t('generate.manifesting')}</span>
                </div>
                ) : (
                <div className="flex items-center gap-2">
                    {/* Custom Manifest Icon - Orbital Ring */}
                    <svg viewBox="0 0 24 24" className="w-5 h-5 group-hover:animate-spin" fill="none">
                      <defs>
                        <linearGradient id="manifest-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#ffffff" />
                          <stop offset="50%" stopColor="#f0abfc" />
                          <stop offset="100%" stopColor="#c084fc" />
                        </linearGradient>
                      </defs>
                      <circle cx="12" cy="12" r="3" fill="url(#manifest-grad)"/>
                      <ellipse cx="12" cy="12" rx="9" ry="4" stroke="url(#manifest-grad)" strokeWidth="1.5" transform="rotate(-30 12 12)"/>
                      <ellipse cx="12" cy="12" rx="9" ry="4" stroke="url(#manifest-grad)" strokeWidth="1" opacity="0.5" transform="rotate(30 12 12)"/>
                    </svg>
                    <span>{t('generate.manifest', { cost: imageCreditsCost })}</span>
                </div>
                )}
            </Button>
          </div>
      </div>

      {/* RIGHT PANEL: PREVIEW */}
      <div className="lg:col-span-8 lg:h-full bg-neutral-950 rounded-3xl border border-white/10 relative overflow-hidden flex flex-col shadow-2xl min-h-[520px] sm:min-h-[640px]">
            
            {/* Premium Background Effects */}
            {/* 1. Subtle noise texture */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.04] pointer-events-none" />
            
            {/* 2. Ambient glow effects - more visible */}
            <div className="absolute -top-20 -left-20 w-80 h-80 bg-purple-500/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-pink-500/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
            
            {/* 3. Subtle center highlight */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/[0.02] rounded-full blur-[60px] pointer-events-none" />

            {/* Main Canvas Area */}
            <div className="flex-1 relative flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden">
                {generatedImage ? (
                    // RESULT VIEW
                    <div className="relative w-full h-full flex flex-col items-center justify-center animate-in zoom-in-95 duration-500 gap-3">
                        {/* Image Container */}
                        <div className="relative w-full max-w-[280px] min-[420px]:max-w-[320px] sm:max-w-[360px] max-h-[70%] sm:max-h-[75%] aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                            <img src={generatedImage} alt="Generated" className="w-full h-full object-cover" />
                        </div>
                        
                        {/* Compact Action Bar with Prompt */}
                        <div className="w-full max-w-sm bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-3">
                            {/* Prompt Text */}
                            {currentPrompt && (
                                <p className="text-[11px] sm:text-xs text-white/60 line-clamp-2 mb-3 leading-relaxed">
                                    {currentPrompt}
                                </p>
                            )}
                            
                            {/* Action Buttons Row */}
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex gap-2">
                                    {/* Copy Prompt */}
                                    {currentPrompt && (
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(currentPrompt);
                                                toast.success("Copied!");
                                            }}
                                            className="h-8 w-8 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors flex items-center justify-center"
                                            title={t('generate.copy_prompt')}
                                        >
                                            <Copy className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                    
                                    {/* Download */}
                                    <button
                                        onClick={handleDownload}
                                        className="h-8 w-8 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors flex items-center justify-center"
                                        title={t('common.download')}
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                                
                                {/* Create Character */}
                                <Link href={`/create?image=${encodeURIComponent(generatedImage)}`} className="shrink-0">
                                    <Button size="sm" className="h-8 bg-primary hover:bg-primary/90 text-white gap-1.5 shadow-lg shadow-primary/20 rounded-lg px-3 text-[11px] sm:text-xs font-medium">
                                        <UserPlus className="w-3.5 h-3.5" />
                                        {t('generate.create_character')}
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                ) : isGenerating ? (
                    // GENERATING STATE - Premium 3D Floating Card
                    <div className="flex flex-col items-center justify-center gap-8 z-10">
                        
                        {/* 3D Floating Card Container */}
                        <div className="relative perspective-1000">
                            
                            {/* Ambient Glow Behind Card */}
                            <div className="absolute -inset-8 bg-gradient-to-r from-purple-600/30 via-pink-500/20 to-blue-600/30 rounded-[3rem] blur-3xl animate-pulse" />
                            
                            {/* Floating Card */}
                            <div
                                className="relative w-full max-w-[280px] min-[420px]:max-w-[320px] h-[240px] sm:h-[360px] lg:h-[420px] rounded-3xl overflow-hidden shadow-2xl animate-float"
                                style={{
                                    transform: 'translateZ(50px) rotateX(5deg)',
                                    transformStyle: 'preserve-3d',
                                }}
                            >
                                {/* Glass Border */}
                                <div className="absolute inset-0 rounded-3xl border border-white/20 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm z-20 pointer-events-none" />
                                
                                {/* Glow Border Effect */}
                                <div className="absolute inset-0 rounded-3xl z-30 pointer-events-none animate-border-glow">
                                    <div className="absolute inset-0 rounded-3xl border-2 border-transparent" 
                                         style={{
                                             background: 'linear-gradient(135deg, rgba(168,85,247,0.5), rgba(236,72,153,0.5), rgba(59,130,246,0.5)) border-box',
                                             mask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
                                             maskComposite: 'exclude',
                                             WebkitMaskComposite: 'xor',
                                         }}
                                    />
                                </div>

                                {/* Inner Nebula/Galaxy Content */}
                                <div className="absolute inset-0 bg-black/80">
                                    {/* Animated Nebula Layers */}
                                    <div className="absolute inset-0 opacity-80">
                                        {/* Layer 1 - Slow rotating purple */}
                                        <div 
                                            className="absolute inset-0 animate-nebula-1"
                                            style={{
                                                background: 'radial-gradient(ellipse at 30% 40%, rgba(168,85,247,0.6) 0%, transparent 50%)',
                                            }}
                                        />
                                        {/* Layer 2 - Pink center */}
                                        <div 
                                            className="absolute inset-0 animate-nebula-2"
                                            style={{
                                                background: 'radial-gradient(ellipse at 60% 50%, rgba(236,72,153,0.5) 0%, transparent 45%)',
                                            }}
                                        />
                                        {/* Layer 3 - Blue accent */}
                                        <div 
                                            className="absolute inset-0 animate-nebula-3"
                                            style={{
                                                background: 'radial-gradient(ellipse at 70% 70%, rgba(59,130,246,0.5) 0%, transparent 40%)',
                                            }}
                                        />
                                        {/* Layer 4 - Bright core */}
                                        <div 
                                            className="absolute inset-0 animate-pulse"
                                            style={{
                                                background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.15) 0%, transparent 30%)',
                                            }}
                                        />
                                    </div>

                                    {/* Particle Stars */}
                                    <div className="absolute inset-0 overflow-hidden">
                                        {[...Array(20)].map((_, i) => (
                                            <div
                                                key={i}
                                                className="absolute w-1 h-1 bg-white rounded-full animate-twinkle"
                                                style={{
                                                    left: `${Math.random() * 100}%`,
                                                    top: `${Math.random() * 100}%`,
                                                    animationDelay: `${Math.random() * 3}s`,
                                                    animationDuration: `${2 + Math.random() * 2}s`,
                                                    opacity: 0.3 + Math.random() * 0.7,
                                                }}
                                            />
                                        ))}
                                    </div>

                                    {/* Light Rays from center */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-32 h-32 animate-spin-slow">
                                            {[...Array(6)].map((_, i) => (
                                                <div
                                                    key={i}
                                                    className="absolute left-1/2 top-1/2 w-1 h-24 -ml-0.5 origin-bottom"
                                                    style={{
                                                        transform: `rotate(${i * 60}deg) translateY(-100%)`,
                                                        background: 'linear-gradient(to top, rgba(255,255,255,0.3), transparent)',
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Center Icon/Symbol */}
                                <div className="absolute inset-0 flex items-center justify-center z-10">
                                    <div className="relative">
                                        {/* Pulsing ring */}
                                        <div className="absolute inset-0 w-16 h-16 -m-2 rounded-full border-2 border-white/30 animate-ping" />
                                        {/* Inner glow */}
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                                            <Sparkles className="w-6 h-6 text-white animate-pulse" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Shadow beneath card */}
                            <div 
                                className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-48 h-8 bg-purple-500/30 rounded-full blur-2xl animate-shadow-pulse"
                            />
                        </div>

                        {/* Text Section */}
                        <div className="text-center space-y-3 sm:space-y-4 mt-3 sm:mt-4">
                            <h3 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent animate-gradient-x">
                                {t('generate.dreaming')}
                            </h3>
                            <div className="flex items-center justify-center gap-3">
                                {/* Animated dots */}
                                <div className="flex gap-1.5">
                                    {[0, 1, 2].map((i) => (
                                        <div
                                            key={i}
                                            className="w-2 h-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-500"
                                            style={{
                                                animation: `bounce 1s ease-in-out infinite`,
                                                animationDelay: `${i * 0.15}s`,
                                            }}
                                        />
                                    ))}
                                </div>
                                <p className="text-white/50 font-mono text-sm">
                                    {loadingLog}
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    // INSPIRATION GALLERY (STANDBY MODE) - 3D Card Stack
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
                        {/* 3D Card Stack Container */}
                        <div className="relative h-[220px] min-[420px]:h-[260px] sm:h-[360px] lg:h-[420px] w-full flex items-center justify-center" style={{ perspective: '1000px' }}>
                            {INSPIRATION_GALLERY.map((item, index) => {
                                // Calculate relative position for stack effect
                                const offset = (index - galleryIndex + INSPIRATION_GALLERY.length) % INSPIRATION_GALLERY.length;

                                let zIndex = 0;
                                let scale = 0.8;
                                let opacity = 0;
                                let x = 0;
                                let rotateY = 0;

                                if (offset === 0) { // Active card (center)
                                    zIndex = 30;
                                    scale = 1;
                                    opacity = 1;
                                    x = 0;
                                    rotateY = 0;
                                } else if (offset === 1) { // Next card (Right)
                                    zIndex = 20;
                                    scale = 0.85;
                                    opacity = 0.6;
                                    x = 200;
                                    rotateY = -15;
                                } else if (offset === INSPIRATION_GALLERY.length - 1) { // Previous card (Left)
                                    zIndex = 20;
                                    scale = 0.85;
                                    opacity = 0.6;
                                    x = -200;
                                    rotateY = 15;
                                } else {
                                    // Hidden cards
                                    opacity = 0;
                                }

                                if (isGalleryCompact && offset !== 0) {
                                    x = x * 0.6;
                                }

                                return (
                                    <div
                                        key={index}
                                        className="absolute w-[180px] min-[420px]:w-[200px] sm:w-[240px] md:w-[280px] aspect-[3/4] cursor-pointer transition-all duration-500 ease-out"
                                        style={{
                                            transform: `translateX(${x}px) scale(${scale}) rotateY(${rotateY}deg)`,
                                            opacity,
                                            zIndex,
                                            transformStyle: 'preserve-3d',
                                        }}
                                        onClick={() => {
                                            if (offset === 0) {
                                                // Center card - use this prompt
                                                setPrompt(item.prompt);
                                                setSelectedStyle(item.style.toLowerCase());
                                            } else {
                                                // Side card - switch to this card
                                                setGalleryIndex(index);
                                            }
                                        }}
                                    >
                                        <div className={cn(
                                            "relative h-full w-full rounded-3xl overflow-hidden border shadow-2xl transition-all duration-300",
                                            offset === 0
                                                ? "border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-1 ring-white/10"
                                                : "border-white/10"
                                        )}>
                                            {/* Image */}
                                            <img
                                                src={item.url}
                                                alt={`Inspiration ${index + 1}`}
                                                className="w-full h-full object-cover"
                                            />

                                            {/* Gradient Overlay */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                                            {/* Style Badge */}
                                            <div className="absolute top-4 left-4 z-10">
                                                <Badge className="bg-black/40 hover:bg-black/50 text-white border-0 backdrop-blur-md text-[10px]">
                                                    <Sparkles className="w-3 h-3 mr-1 text-primary" />
                                                    {item.style}
                                                </Badge>
                                            </div>

                                            {/* Bottom Content - Only show on active card */}
                                            {offset === 0 && (
                                                <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
                                                    <p className="text-sm text-white/80 line-clamp-2 mb-3 leading-relaxed">
                                                        "{item.prompt}"
                                                    </p>
                                                    <Button
                                                        size="sm"
                                                        className="w-full bg-primary hover:bg-primary/90 text-white font-medium shadow-lg shadow-primary/20"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setPrompt(item.prompt);
                                                            setSelectedStyle(item.style.toLowerCase());
                                                        }}
                                                    >
                                                        <Wand2 className="w-4 h-4 mr-2" />
                                                        {t('generate.try_prompt')}
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Dots Indicator */}
                        <div className="flex gap-2 mt-6">
                            {INSPIRATION_GALLERY.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setGalleryIndex(index)}
                                    className={cn(
                                        "w-2 h-2 rounded-full transition-all duration-300",
                                        index === galleryIndex
                                            ? "bg-primary w-6"
                                            : "bg-white/30 hover:bg-white/50"
                                    )}
                                />
                            ))}
                        </div>

                        {/* Title */}
                        <div className="text-center mt-6">
                            <h3 className="text-xl font-bold text-white/90 mb-1">{t('discover.get_inspired')}</h3>
                            <p className="text-sm text-white/50">{t('discover.click_to_use')}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* HISTORY BAR (Bottom of Right Panel) */}
            <div className="h-auto min-h-[120px] sm:min-h-[160px] border-t border-white/5 bg-black/20 backdrop-blur-md z-20 flex flex-col justify-center p-4 sm:p-6">
                <Label className="text-xs font-medium text-white/50 mb-2 uppercase tracking-wider px-1">{t('generate.recent_creations')}</Label>
                <div className="flex gap-4 overflow-x-auto p-4 custom-scrollbar snap-x items-center">
                    {history === undefined ? (
                        [1,2,3,4].map(i => (
                            <div key={i} className="min-w-[70px] h-[70px] rounded-xl bg-white/5 animate-pulse border border-white/5" />
                        ))
                    ) : history.length === 0 ? (
                        <div className="text-white/30 text-xs flex items-center pl-1">
                            <History className="w-3 h-3 mr-2" />
                            {t('generate.no_history')}
                        </div>
                    ) : (
                        history.map((item) => (
                            <div key={item._id} className="relative group flex-shrink-0">
                                <div 
                                    onClick={() => {
                                        setGeneratedImage(item.image_url);
                                        setCurrentPrompt(item.prompt);
                                    }}
                                    className={cn(
                                        "w-[70px] h-[70px] rounded-xl overflow-hidden border cursor-pointer transition-all duration-300 relative",
                                        generatedImage === item.image_url 
                                            ? "border-primary ring-2 ring-primary/50 shadow-[0_0_20px_rgba(var(--primary),0.4)] scale-110 z-10" 
                                            : "border-white/10 hover:border-white/30 hover:scale-105 hover:shadow-lg opacity-70 hover:opacity-100"
                                    )}
                                >
                                    <img src={item.image_url} alt="History" className="w-full h-full object-cover" />
                                    {item.status === 'failed' && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                            <AlertCircle className="w-4 h-4 text-red-500" />
                                        </div>
                                    )}
                                </div>
                                
                                {/* Delete Button */}
                                <button 
                                    className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity z-30 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 hover:scale-110"
                                    onClick={(e) => handleDelete(e, item._id)}
                                    title="Delete"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
      </div>
      </div>
    </div>
  );
}
