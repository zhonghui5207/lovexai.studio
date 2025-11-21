"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Wand2, Loader2 } from "lucide-react";

const PROMPTS = [
  {
    label: "Realistic Portrait",
    text: "glasses, white shirt, curly brown hair, Ultimate Asian Model, High Resolution, Upper Body Focus",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1000&auto=format&fit=crop",
  },
  {
    label: "Indie Style",
    text: "medium length blond hair, black shirt, indie rockstar vibe, Ultimate Realistic Model, High Resolution, Portrait Mode",
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=1000&auto=format&fit=crop",
  },
  {
    label: "Anime Fantasy",
    text: "Devilish aura, slim figure, two piece armor, Ultimate Anime Model, Portrait Mode",
    image: "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=1000&auto=format&fit=crop",
  }
];

export default function ImageGenSection() {
  const [activePrompt, setActivePrompt] = useState(0);
  const [customPrompt, setCustomPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => setIsGenerating(false), 2000);
  };

  return (
    <section className="py-24 bg-black relative overflow-hidden">
      {/* Seamless Gradients */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black to-transparent z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent z-10 pointer-events-none" />
      {/* Background Glows */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[120px]" />
      </div>

      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          
          {/* Left Panel: Controls */}
          <div className="space-y-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white">
                  AI Image <span className="text-primary">Generator</span>
                </h2>
              </div>
              <p className="text-white/60 text-lg leading-relaxed">
                Describe your fantasy and watch it come to life. Use our advanced models to create stunning, high-fidelity images in seconds.
              </p>
            </div>

            <div className="space-y-6">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-1">
                <Textarea 
                  value={customPrompt || PROMPTS[activePrompt].text}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className="min-h-[120px] bg-transparent border-none text-white/90 placeholder:text-white/30 resize-none focus-visible:ring-0 text-base leading-relaxed p-4"
                  placeholder="Describe what you want to see..."
                />
                <div className="flex justify-between items-center px-4 pb-3 pt-2 border-t border-white/5">
                  <span className="text-xs text-white/40 font-medium">
                    {(customPrompt || PROMPTS[activePrompt].text).length} chars
                  </span>
                  <Button 
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white shadow-lg shadow-primary/25 transition-all duration-300"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4 mr-2" />
                        Generate Image
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-semibold text-white/40 uppercase tracking-wider">Try Examples</label>
                <div className="flex flex-wrap gap-2">
                  {PROMPTS.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setActivePrompt(index);
                        setCustomPrompt("");
                      }}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 border ${
                        activePrompt === index && !customPrompt
                          ? "bg-white/10 border-primary text-white shadow-[0_0_15px_rgba(255,0,110,0.3)]"
                          : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {prompt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Image Preview */}
          <div className="relative aspect-square lg:aspect-[4/3] rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-black/50 group">
            <AnimatePresence mode="wait">
              <motion.img
                key={activePrompt}
                src={PROMPTS[activePrompt].image}
                alt="AI Generated"
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </AnimatePresence>
            
            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />

            {/* Floating Prompt Label */}
            <div className="absolute bottom-6 left-6 right-6">
              <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-4 transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                <p className="text-xs text-white/40 font-bold mb-1 uppercase tracking-wider">Generated Prompt</p>
                <p className="text-sm text-white/90 line-clamp-2 font-mono">
                  {PROMPTS[activePrompt].text}
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
