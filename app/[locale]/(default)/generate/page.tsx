"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Wand2, 
  Sparkles, 
  Image as ImageIcon, 
  Download, 
  UserPlus, 
  RefreshCw, 
  Dice5,
  Layers,
  Maximize2,
  History,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider"; // Note: Slider might not be in ui folder, if not I'll use standard input range or check later. 
// Actually I didn't see slider.tsx in the list, so I'll use a custom styled input or just simple buttons for now.
// Wait, I didn't see slider.tsx. I'll check if I can use something else or just standard HTML input range styled.
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area"; // Did I see scroll-area? No. I'll use div with overflow.
import { cn } from "@/lib/utils";

// Mock Data for Styles
const STYLES = [
  { id: "anime", name: "Anime", image: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=150&h=150&fit=crop" },
  { id: "realistic", name: "Realistic", image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop" },
  { id: "cyberpunk", name: "Cyberpunk", image: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=150&h=150&fit=crop" },
  { id: "oil", name: "Oil Painting", image: "https://images.unsplash.com/photo-1579783902614-a3fb39279c15?w=150&h=150&fit=crop" },
  { id: "pixel", name: "Pixel Art", image: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=150&h=150&fit=crop" },
];

const ASPECT_RATIOS = [
  { id: "9:16", label: "Portrait", icon: "📱" },
  { id: "1:1", label: "Square", icon: "🟦" },
  { id: "16:9", label: "Landscape", icon: "💻" },
];

// Random Prompts for "Dice"
const RANDOM_PROMPTS = [
  "A futuristic cyberpunk nurse with neon glowing syringe, rain-slicked streets background.",
  "A high-fantasy elf princess with silver hair and emerald eyes, standing in a magical forest.",
  "A noir detective smoking a cigarette in a rainy alleyway, black and white style.",
  "A cute anime girl with cat ears eating a donut in a pastel café.",
  "A majestic space warrior in golden armor floating in a nebula."
];

export default function GeneratePage() {
  const [prompt, setPrompt] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("anime");
  const [aspectRatio, setAspectRatio] = useState("9:16");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const handleRandomPrompt = () => {
    const random = RANDOM_PROMPTS[Math.floor(Math.random() * RANDOM_PROMPTS.length)];
    setPrompt(random);
  };

  const handleGenerate = () => {
    if (!prompt) return;
    setIsGenerating(true);
    setGeneratedImage(null);
    
    // Simulate generation delay
    setTimeout(() => {
      setIsGenerating(false);
      // Mock result - in real app this comes from backend
      setGeneratedImage("https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=800&h=1400&fit=crop"); 
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 font-sans selection:bg-primary/30">
      {/* Background Ambient Glow */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-black to-black pointer-events-none z-0" />
      
      <div className="max-w-[1600px] mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-100px)]">
        
        {/* LEFT PANEL: CONTROLS */}
        <div className="lg:col-span-4 flex flex-col gap-6 h-full overflow-y-auto pr-2 custom-scrollbar">
          
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tighter bg-gradient-to-r from-white to-white/50 bg-clip-text text-transparent">
              Dream Studio
            </h1>
            <p className="text-muted-foreground text-sm">
              Manifest your ideal companion from the digital void.
            </p>
          </div>

          {/* Prompt Input */}
          <div className="space-y-3 bg-white/5 p-5 rounded-2xl border border-white/10 backdrop-blur-sm group hover:border-primary/30 transition-colors">
            <div className="flex justify-between items-center">
              <Label className="text-sm font-medium flex items-center gap-2 text-white/80">
                <Sparkles className="w-4 h-4 text-primary" />
                Prompt
              </Label>
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
            <Textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your dream character... (e.g. Silver hair, red eyes, cyberpunk outfit)"
              className="bg-black/40 border-white/10 min-h-[120px] text-base focus:border-primary/50 resize-none placeholder:text-white/20"
            />
            <div className="flex flex-wrap gap-2 pt-1">
              {["Silver Hair", "Blue Eyes", "Cyberpunk", "Maid", "Gothic"].map((tag) => (
                <Badge 
                  key={tag} 
                  variant="outline" 
                  className="cursor-pointer hover:bg-white/10 border-white/10 text-white/60 hover:text-white transition-colors"
                  onClick={() => setPrompt(prev => prev ? `${prev}, ${tag}` : tag)}
                >
                  + {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* Style Selector */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-white/80">Art Style</Label>
            <div className="grid grid-cols-3 gap-3">
              {STYLES.map((style) => (
                <div 
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  className={cn(
                    "relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all group",
                    selectedStyle === style.id ? "border-primary shadow-[0_0_15px_rgba(var(--primary),0.5)]" : "border-transparent hover:border-white/20"
                  )}
                >
                  <img src={style.image} alt={style.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2">
                    <span className="text-xs font-medium text-white">{style.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Settings (Aspect Ratio & More) */}
          <div className="space-y-4 bg-white/5 p-5 rounded-2xl border border-white/10">
            <div className="space-y-3">
              <Label className="text-sm font-medium text-white/80">Aspect Ratio</Label>
              <div className="grid grid-cols-3 gap-2">
                {ASPECT_RATIOS.map((ratio) => (
                  <button
                    key={ratio.id}
                    onClick={() => setAspectRatio(ratio.id)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all",
                      aspectRatio === ratio.id 
                        ? "bg-primary/20 border-primary text-white" 
                        : "bg-black/20 border-white/10 text-white/50 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <span className="text-xl">{ratio.icon}</span>
                    <span className="text-xs font-medium">{ratio.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <div className="mt-auto pt-4 pb-8">
            <Button 
              onClick={handleGenerate}
              disabled={isGenerating || !prompt}
              className="w-full h-14 text-lg font-bold bg-gradient-to-r from-primary via-purple-600 to-blue-600 hover:opacity-90 transition-all shadow-[0_0_30px_rgba(124,58,237,0.3)] disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <div className="relative flex items-center gap-2">
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Dreaming...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    Manifest <span className="text-xs font-normal opacity-80 ml-1">(5 Credits)</span>
                  </>
                )}
              </div>
            </Button>
          </div>

        </div>

        {/* RIGHT PANEL: STAGE / PREVIEW */}
        <div className="lg:col-span-8 h-full flex flex-col">
          
          <div className="flex-1 bg-black/40 rounded-3xl border border-white/10 relative overflow-hidden flex items-center justify-center backdrop-blur-sm shadow-2xl">
            
            {/* Grid Pattern Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
            
            <AnimatePresence mode="wait">
              {isGenerating ? (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-4 z-10"
                >
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                    </div>
                  </div>
                  <p className="text-lg font-medium text-white/80 animate-pulse">Weaving reality...</p>
                  <p className="text-sm text-white/40">Injecting personality traits...</p>
                </motion.div>
              ) : generatedImage ? (
                <motion.div 
                  key="result"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative w-full h-full p-8 flex items-center justify-center"
                >
                  <img 
                    src={generatedImage} 
                    alt="Generated Result" 
                    className="max-w-full max-h-full rounded-lg shadow-2xl border border-white/10"
                  />
                  
                  {/* Floating Actions */}
                  <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/80 backdrop-blur-md p-2 rounded-full border border-white/10 shadow-xl">
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10 text-white">
                      <Download className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10 text-white">
                      <Maximize2 className="w-5 h-5" />
                    </Button>
                    <div className="w-px h-6 bg-white/20 mx-1" />
                    <Button className="rounded-full bg-primary hover:bg-primary/90 px-6 gap-2">
                      <UserPlus className="w-4 h-4" />
                      Create Character
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center space-y-4 z-10 max-w-md p-6"
                >
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                    <ImageIcon className="w-10 h-10 text-white/20" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Ready to Dream?</h3>
                  <p className="text-white/50">
                    Enter a prompt on the left or roll the dice to start your creation journey.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Recent History Strip (Bottom) */}
          <div className="h-32 mt-4 flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
             {/* Mock History Items */}
             {[1,2,3,4,5].map((i) => (
               <div key={i} className="min-w-[100px] aspect-square rounded-xl bg-white/5 border border-white/10 overflow-hidden hover:border-primary/50 cursor-pointer transition-colors relative group">
                 <img src={`https://picsum.photos/seed/${i}/200`} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
               </div>
             ))}
          </div>

        </div>
      </div>
    </div>
  );
}
