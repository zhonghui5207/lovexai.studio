"use client";

import { useState } from "react";
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
  History
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAction, useQuery } from "convex/react";
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
  const [selectedModel, setSelectedModel] = useState("flux-kontext-pro");
  // const [aspectRatio, setAspectRatio] = useState("9:16"); // Removed, defaulting to 3:4
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  // Convex Hooks
  const generateAction = useAction(api.images.generate);
  const history = useQuery(api.images.listMine);

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
      setGeneratedImage(url);
      toast.success("Image generated successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate image. Please try again.");
    } finally {
      setIsGenerating(false);
    }
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

          {/* Model Selector */}
          <div className="bg-white/5 p-1 rounded-xl flex gap-1 border border-white/10">
            {MODELS.map((model) => (
              <button
                key={model.id}
                onClick={() => setSelectedModel(model.id)}
                className={cn(
                  "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex flex-col items-center gap-0.5",
                  selectedModel === model.id 
                    ? "bg-primary text-white shadow-lg" 
                    : "text-white/50 hover:text-white hover:bg-white/5"
                )}
              >
                <span>{model.name}</span>
                <span className="text-[10px] opacity-60 font-normal">{model.desc}</span>
              </button>
            ))}
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

          {/* Style Selector (Updated to Tags) */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-white/80">Art Style</Label>
            <div className="flex flex-wrap gap-2">
              {STYLES.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all border",
                    selectedStyle === style.id
                      ? "bg-primary/20 border-primary text-primary shadow-[0_0_15px_rgba(var(--primary),0.3)]"
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
          
          <div className="flex-1 bg-black/40 rounded-3xl border border-white/10 relative overflow-hidden flex items-center justify-center backdrop-blur-sm shadow-2xl p-8">
            
            {/* Grid Pattern Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
            
            {isGenerating ? (
              <div 
                key="loading"
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
              </div>
            ) : generatedImage ? (
              <div 
                key="result"
                className="relative w-full h-full flex flex-col items-center justify-center gap-6"
              >
                {/* Image Container - Constrained Height */}
                <div className="relative max-h-[60vh] aspect-[3/4] rounded-xl overflow-hidden shadow-2xl border border-white/10 group">
                    <img 
                    src={generatedImage} 
                    alt="Generated Result" 
                    className="w-full h-full object-cover"
                    />
                    {/* Hover Overlay Actions */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                        <Button variant="secondary" size="icon" className="rounded-full">
                            <Maximize2 className="w-5 h-5" />
                        </Button>
                        <Button variant="secondary" size="icon" className="rounded-full">
                            <Download className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
                
                {/* Primary Action Button */}
                <Link href={`/create?image=${encodeURIComponent(generatedImage)}`}>
                    <Button className="rounded-full bg-primary hover:bg-primary/90 px-8 py-6 text-lg gap-2 shadow-lg hover:shadow-primary/25 transition-all">
                    <UserPlus className="w-5 h-5" />
                    Create Character with this Image
                    </Button>
                </Link>
              </div>
            ) : (
              <div 
                key="empty"
                className="text-center space-y-4 z-10 max-w-md p-6"
              >
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                  <ImageIcon className="w-10 h-10 text-white/20" />
                </div>
                <h3 className="text-2xl font-bold text-white">Ready to Dream?</h3>
                <p className="text-white/50">
                  Enter a prompt on the left or roll the dice to start your creation journey.
                </p>
              </div>
            )}
          </div>

          {/* Recent History Strip (Bottom) */}
          <div className="h-32 mt-4 flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
             {history === undefined ? (
               // Loading State
               [1,2,3].map(i => (
                 <div key={i} className="min-w-[100px] aspect-square rounded-xl bg-white/5 animate-pulse" />
               ))
             ) : history.length === 0 ? (
               // Empty State
               <div className="flex items-center justify-center w-full text-white/30 text-sm">
                 <History className="w-4 h-4 mr-2" />
                 No history yet
               </div>
             ) : (
               // History Items
               history.map((item) => (
                 <div 
                    key={item._id} 
                    onClick={() => setGeneratedImage(item.image_url)}
                    className={cn(
                        "min-w-[100px] aspect-square rounded-xl bg-white/5 border border-white/10 overflow-hidden hover:border-primary/50 cursor-pointer transition-colors relative group",
                        generatedImage === item.image_url && "border-primary ring-2 ring-primary/30"
                    )}
                 >
                   <img src={item.image_url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                   {item.status === 'failed' && (
                       <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                           <AlertCircle className="w-6 h-6 text-red-500" />
                       </div>
                   )}
                 </div>
               ))
             )}
          </div>

        </div>
      </div>
    </div>
  );
}
