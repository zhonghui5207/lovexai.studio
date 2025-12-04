"use client";

import { useState, useEffect } from "react";
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
  X
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

const MODELS = [
  { id: "flux-kontext-pro", name: "Flux Dreamer", desc: "Best for Anime & Art" },
  { id: "gpt-image-1", name: "Genesis Core", desc: "Best for Realism" },
  { id: "gemini-3-pro-image-preview", name: "Gemini Horizon", desc: "Best for Creativity" },
];

// Inspiration Gallery Data
const INSPIRATION_GALLERY = [
  {
    url: "/inspiration/window_girl.png",
    prompt: "A photorealistic portrait of a beautiful young asian woman with long black hair, wearing a white shirt and plaid skirt, sitting by a sunny window.",
    style: "Realistic"
  },
  {
    url: "/inspiration/cafe_girl.png",
    prompt: "A photorealistic portrait of a stunning woman in a cozy coffee shop, rainy window background, bokeh effect, cinematic lighting.",
    style: "Realistic"
  },
  {
    url: "/inspiration/street_girl.png",
    prompt: "A photorealistic portrait of a fashion model walking on a Tokyo street at night, neon lights, leather jacket, street photography style.",
    style: "Cyberpunk"
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
  const [prompt, setPrompt] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("anime");
  const [selectedModel, setSelectedModel] = useState("flux-kontext-pro");
  // const [aspectRatio, setAspectRatio] = useState("9:16"); // Removed, defaulting to 3:4
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  
  // UI States
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [placeholderText, setPlaceholderText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [loadingLog, setLoadingLog] = useState("Initializing...");

  // Convex Hooks
  const generateAction = useAction(api.images.generate);
  const enhanceAction = useAction(api.actions.enhancePrompt);
  const deleteAction = useMutation(api.images.remove);
  const history = useQuery(api.images.listMine);
  const [isEnhancing, setIsEnhancing] = useState(false);

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

  const handleRandomPrompt = () => {
    const random = RANDOM_PROMPTS[Math.floor(Math.random() * RANDOM_PROMPTS.length)];
    setPrompt(random);
  };

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    setGeneratedImage(null);
    
    try {
      const url = await generateAction({
        prompt: prompt,
        style: selectedStyle,
        ratio: "3:4", // Hardcoded for character cards
        model: selectedModel,
      });
      if (url) {
        setGeneratedImage(url);
        toast.success("Image generated successfully!");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate image. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: any) => {
    e.stopPropagation(); // Prevent clicking the item
    try {
        await deleteAction({ id });
        toast.success("Image deleted");
        if (generatedImage === history?.find(h => h._id === id)?.image_url) {
            setGeneratedImage(null);
        }
    } catch (error) {
        toast.error("Failed to delete image");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 font-sans selection:bg-primary/30 overflow-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse delay-1000" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
      </div>
      
      <div className="max-w-[1600px] mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-100px)]">
        
        {/* LEFT PANEL: CONTROLS */}
        <div className="lg:col-span-4 flex flex-col gap-6 h-full overflow-y-auto pr-2 custom-scrollbar">
          
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tighter bg-gradient-to-r from-white via-white to-white/50 bg-clip-text text-transparent animate-in fade-in slide-in-from-left duration-700">
              Dream Studio
            </h1>
            <p className="text-muted-foreground text-sm">
              Manifest your ideal companion from the digital void.
            </p>
          </div>

          {/* Model Selector */}
          <div className="bg-white/5 p-1 rounded-xl flex gap-1 border border-white/10 backdrop-blur-md">
            {MODELS.map((model) => (
              <button
                key={model.id}
                onClick={() => setSelectedModel(model.id)}
                className={cn(
                  "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex flex-col items-center gap-0.5 relative overflow-hidden",
                  selectedModel === model.id 
                    ? "bg-primary text-white shadow-lg" 
                    : "text-white/50 hover:text-white hover:bg-white/5"
                )}
              >
                {selectedModel === model.id && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] animate-[shimmer_2s_infinite]" />
                )}
                <span>{model.name}</span>
                <span className="text-[10px] opacity-60 font-normal">{model.desc}</span>
              </button>
            ))}
          </div>

          {/* Prompt Input */}
          <div className="space-y-3 bg-white/5 p-5 rounded-2xl border border-white/10 backdrop-blur-md group hover:border-primary/30 transition-all duration-300 shadow-lg hover:shadow-primary/5">
            <div className="flex justify-between items-center">
              <Label className="text-sm font-medium flex items-center gap-2 text-white/80">
                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                Prompt
              </Label>
              <div className="flex gap-2">
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleEnhance}
                    disabled={isEnhancing || !prompt}
                    className="h-7 text-xs text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 gap-1"
                >
                    <Wand2 className={cn("w-3 h-3", isEnhancing && "animate-spin")} />
                    {isEnhancing ? "Enhancing..." : "Enhance"}
                </Button>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleRandomPrompt}
                    className="h-7 text-xs text-primary hover:text-primary/80 hover:bg-primary/10 gap-1"
                >
                    <Dice5 className="w-3 h-3" />
                    Randomize
                </Button>
              </div>
            </div>
            <div className="relative">
                <Textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={placeholderText}
                className="bg-black/40 border-white/10 min-h-[120px] text-base focus:border-primary/50 resize-none placeholder:text-white/20 transition-all caret-primary"
                />
            </div>
            
            <div className="flex flex-wrap gap-2 pt-1">
              {["Silver Hair", "Blue Eyes", "Cyberpunk", "Maid", "Gothic"].map((tag) => (
                <Badge 
                  key={tag} 
                  variant="outline" 
                  className="cursor-pointer bg-white/5 hover:bg-white/10 border-white/10 text-white/70 hover:text-white hover:border-primary/30 px-3 py-1 rounded-full text-xs"
                  onClick={() => setPrompt(prev => prev ? `${prev}, ${tag}` : tag)}
                >
                  + {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* Style Selector (Updated to Tags) */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-white/80">Art Style</Label>
            <div className="flex flex-wrap gap-2">
              {STYLES.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all border duration-300",
                    selectedStyle === style.id
                      ? "bg-gradient-to-r from-primary/20 to-purple-500/20 border-primary/50 text-white shadow-[0_0_15px_rgba(var(--primary),0.2)]"
                      : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white hover:border-white/20"
                  )}
                >
                  {style.name}
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
                    <span>Manifesting...</span>
                </div>
                ) : (
                <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 group-hover:animate-spin" />
                    <span>Manifest Reality</span>
                    <span className="text-xs font-normal opacity-70 ml-1">(5)</span>
                </div>
                )}
            </Button>
          </div>
      </div>

      {/* RIGHT PANEL: PREVIEW */}
      <div className="lg:col-span-8 h-full bg-neutral-900/50 rounded-3xl border border-white/10 relative overflow-hidden flex flex-col backdrop-blur-sm shadow-2xl">
            
            {/* Grid Pattern Overlay */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

            {/* Main Canvas Area */}
            <div className="flex-1 relative flex items-center justify-center p-8 overflow-hidden">
                {generatedImage ? (
                    // RESULT VIEW
                    <div className="relative w-full h-full flex flex-col items-center justify-center animate-in zoom-in-95 duration-500">
                        <div className="relative max-h-full aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border border-white/10 group">
                            <img src={generatedImage} alt="Generated" className="w-full h-full object-contain bg-black/50" />
                            
                            {/* Overlay Actions */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-4 backdrop-blur-sm">
                                <Link href={`/create?image=${encodeURIComponent(generatedImage)}`}>
                                    <Button className="bg-primary hover:bg-primary/90 text-white gap-2 scale-110 shadow-xl shadow-primary/20">
                                        <UserPlus className="w-4 h-4" />
                                        Create Character with this Image
                                    </Button>
                                </Link>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="icon" className="rounded-full bg-white/10 border-white/20 hover:bg-white/20 text-white">
                                        <Download className="w-4 h-4" />
                                    </Button>
                                    <Button variant="outline" size="icon" className="rounded-full bg-white/10 border-white/20 hover:bg-white/20 text-white">
                                        <Maximize2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : isGenerating ? (
                    // GENERATING STATE
                    <div className="flex flex-col items-center gap-6 z-10">
                        <div className="relative w-32 h-32">
                            <div className="absolute inset-0 rounded-full border-t-2 border-primary animate-spin" />
                            <div className="absolute inset-2 rounded-full border-r-2 border-purple-500 animate-spin reverse duration-700" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Sparkles className="w-8 h-8 text-white animate-pulse" />
                            </div>
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-2xl font-bold text-white animate-pulse">Dreaming...</h3>
                            <p className="text-primary font-mono text-sm h-6">{loadingLog}</p>
                        </div>
                    </div>
                ) : (
                    // INSPIRATION GALLERY (STANDBY MODE)
                    <div className="absolute inset-0 z-10">
                        {INSPIRATION_GALLERY.map((item, index) => (
                            <div 
                                key={index}
                                className={cn(
                                    "absolute inset-0 transition-opacity duration-1000 ease-in-out bg-neutral-900",
                                    index === galleryIndex ? "opacity-100" : "opacity-0"
                                )}
                            >
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10" />
                                <img src={item.url} alt="Inspiration" className="w-full h-full object-cover opacity-80" />
                                
                                <div className="absolute bottom-32 left-12 right-12 z-20 space-y-4">
                                    <Badge className="bg-white/10 hover:bg-white/20 text-white border-0 backdrop-blur-md">
                                        <Sparkles className="w-3 h-3 mr-1 text-primary" />
                                        Inspiration: {item.style}
                                    </Badge>
                                    <p className="text-2xl md:text-3xl font-bold text-white leading-tight max-w-3xl drop-shadow-lg">
                                        "{item.prompt}"
                                    </p>
                                    <Button 
                                        variant="outline" 
                                        className="border-white/30 text-white hover:bg-white/10 hover:border-white/50 backdrop-blur-md"
                                        onClick={() => {
                                            setPrompt(item.prompt);
                                            setSelectedStyle(item.style.toLowerCase());
                                        }}
                                    >
                                        Try this Prompt
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* HISTORY BAR (Bottom of Right Panel) */}
            <div className="h-auto min-h-[160px] border-t border-white/5 bg-black/20 backdrop-blur-md z-20 flex flex-col justify-center p-6">
                <Label className="text-xs font-medium text-white/50 mb-2 uppercase tracking-wider px-1">Recent Creations</Label>
                <div className="flex gap-4 overflow-x-auto p-4 custom-scrollbar snap-x items-center">
                    {history === undefined ? (
                        [1,2,3,4].map(i => (
                            <div key={i} className="min-w-[70px] h-[70px] rounded-xl bg-white/5 animate-pulse border border-white/5" />
                        ))
                    ) : history.length === 0 ? (
                        <div className="text-white/30 text-xs flex items-center pl-1">
                            <History className="w-3 h-3 mr-2" />
                            No history yet
                        </div>
                    ) : (
                        history.map((item) => (
                            <div key={item._id} className="relative group flex-shrink-0">
                                <div 
                                    onClick={() => setGeneratedImage(item.image_url)}
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
                                
                                {/* Delete Button (Centered on Top-Right Corner) */}
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
