"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  ImagePlus, 
  Sparkles, 
  Globe, 
  Lock, 
  ChevronLeft,
  ChevronRight,
  Wand2,
  MessageSquare,
  User,
  Heart,
  RefreshCw,
  Check,
  Shuffle,
  X
} from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useSession } from "next-auth/react";

// Step indicator component
const StepIndicator = ({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) => {
  const steps = [
    { num: 1, label: "Basic Info" },
    { num: 2, label: "Personality" },
    { num: 3, label: "Scenario" },
    { num: 4, label: "Confirm" },
  ];
  
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((step, index) => (
        <div key={step.num} className="flex items-center">
          <div className={cn(
            "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-all",
            currentStep === step.num 
              ? "bg-primary text-white shadow-lg shadow-primary/30" 
              : currentStep > step.num 
                ? "bg-green-500 text-white"
                : "bg-white/10 text-white/50"
          )}>
            {currentStep > step.num ? <Check className="w-4 h-4" /> : step.num}
          </div>
          <span className={cn(
            "ml-2 text-xs hidden sm:block",
            currentStep === step.num ? "text-white" : "text-white/50"
          )}>
            {step.label}
          </span>
          {index < steps.length - 1 && (
            <div className={cn(
              "w-8 sm:w-16 h-0.5 mx-2",
              currentStep > step.num ? "bg-green-500" : "bg-white/10"
            )} />
          )}
        </div>
      ))}
    </div>
  );
};

// Trait options - 15 personality types with color coding
const TRAIT_OPTIONS = [
  { id: "sweet", label: "Sweet", color: "from-pink-400 to-rose-400", desc: "Warm and affectionate" },
  { id: "teasing", label: "Teasing", color: "from-amber-400 to-orange-400", desc: "Loves to tease" },
  { id: "shy", label: "Shy", color: "from-rose-300 to-pink-300", desc: "Easily flustered" },
  { id: "mysterious", label: "Mysterious", color: "from-indigo-400 to-purple-500", desc: "Hard to read" },
  { id: "seductive", label: "Seductive", color: "from-red-400 to-rose-500", desc: "Alluring charm" },
  { id: "dominant", label: "Dominant", color: "from-violet-500 to-purple-600", desc: "Takes control" },
  { id: "submissive", label: "Submissive", color: "from-pink-300 to-rose-300", desc: "Eager to please" },
  { id: "cold", label: "Cold", color: "from-cyan-400 to-blue-400", desc: "Distant at first" },
  { id: "playful", label: "Playful", color: "from-yellow-400 to-amber-400", desc: "Fun and energetic" },
  { id: "caring", label: "Caring", color: "from-emerald-400 to-teal-400", desc: "Gentle and kind" },
  { id: "tsundere", label: "Tsundere", color: "from-orange-400 to-red-400", desc: "Hot and cold" },
  { id: "yandere", label: "Yandere", color: "from-red-500 to-pink-600", desc: "Obsessively devoted" },
  { id: "innocent", label: "Innocent", color: "from-sky-300 to-blue-300", desc: "Pure and naive" },
  { id: "mature", label: "Mature", color: "from-slate-400 to-zinc-500", desc: "Wise beyond years" },
  { id: "naughty", label: "Naughty", color: "from-fuchsia-400 to-pink-500", desc: "Mischievous streak" },
];

// Scenario templates with colors
const SCENARIO_TEMPLATES = [
  { id: "neighbor", label: "Neighbor", color: "from-green-400 to-emerald-400", desc: "The girl next door" },
  { id: "classmate", label: "Classmate", color: "from-blue-400 to-indigo-400", desc: "New transfer student" },
  { id: "coworker", label: "Coworker", color: "from-slate-400 to-gray-500", desc: "Office romance" },
  { id: "nurse", label: "Nurse", color: "from-pink-400 to-rose-400", desc: "Private clinic nurse" },
  { id: "maid", label: "Maid", color: "from-violet-400 to-purple-400", desc: "Your personal maid" },
  { id: "tutor", label: "Tutor", color: "from-amber-400 to-yellow-400", desc: "Private tutor" },
  { id: "cafe", label: "Café Staff", color: "from-orange-400 to-amber-400", desc: "Cute barista" },
  { id: "custom", label: "Custom", color: "from-primary to-purple-500", desc: "Write your own" },
];

// Name suggestions
const NAME_SUGGESTIONS = ["Sakura", "Luna", "Yuki", "Hana", "Aria", "Mia"];

export default function CreateCharacterPage() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  
  // Step state
  const [currentStep, setCurrentStep] = useState(1);
  
  // Form data
  const [name, setName] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarPrompt, setAvatarPrompt] = useState("");
  const [selectedTraits, setSelectedTraits] = useState<string[]>([]);
  const [selectedScenario, setSelectedScenario] = useState("");
  const [customScenario, setCustomScenario] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  
  // AI generated content
  const [generatedScenario, setGeneratedScenario] = useState("");
  const [generatedCurrentState, setGeneratedCurrentState] = useState("");
  const [generatedMotivation, setGeneratedMotivation] = useState("");
  const [generatedGreeting, setGeneratedGreeting] = useState("");
  const [generatedDescription, setGeneratedDescription] = useState("");
  const [generatedBackground, setGeneratedBackground] = useState("");
  const [generatedPersonalityDesc, setGeneratedPersonalityDesc] = useState("");
  const [generatedSuggestions, setGeneratedSuggestions] = useState("");
  
  // Loading states
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
  const [isGeneratingScenario, setIsGeneratingScenario] = useState(false);
  const [isGeneratingGreeting, setIsGeneratingGreeting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Convex hooks
  const router = useRouter();
  const generateCharacterDetails = useAction(api.actions.generateCharacterDetails);
  const createCharacter = useMutation(api.characters.create);
  const ensureUser = useMutation(api.users.ensureUser);
  const createConversation = useMutation(api.conversations.create);

  // Create character function
  const handleCreateCharacter = async () => {
    if (!name) return;
    
    setIsCreating(true);
    try {
      // Build personality text from traits
      const traitLabels = selectedTraits
        .map(t => TRAIT_OPTIONS.find(o => o.id === t)?.label)
        .filter(Boolean)
        .join(", ");
      
      // 1. Check if user is logged in
      if (!session?.user?.email) {
        alert("Please log in to create a character!");
        router.push(`/api/auth/signin?callbackUrl=/create`);
        return;
      }
      
      // 2. Ensure user exists and get userId
      const userId = await ensureUser({
        email: session.user.email,
        name: session.user.name || "User",
        avatar_url: session.user.image || "",
      });
      
      // 3. Create the character with creator_id
      const characterId = await createCharacter({
        name,
        description: generatedDescription || `A ${traitLabels.toLowerCase()} companion`,
        personality: generatedPersonalityDesc || traitLabels || "friendly",
        greeting_message: generatedGreeting || `*smiles warmly* "Hi, I'm ${name}. Nice to meet you!"`,
        avatar_url: avatarPreview || undefined,
        traits: selectedTraits,
        scenario: generatedScenario || customScenario || undefined,
        current_state: generatedCurrentState || undefined,
        motivation: generatedMotivation || undefined,
        background: generatedBackground || undefined,
        suggestions: generatedSuggestions || undefined,
        is_public: isPublic,
        creator_id: userId,
      });
      
      // 4. Create a conversation with the new character
      const conversationId = await createConversation({
        characterId,
        userId,
      });
      
      // 5. Redirect to chat
      router.push(`/chat?c=${conversationId}`);
    } catch (error) {
      console.error("Failed to create character:", error);
      alert("Failed to create character. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  // Check for image param from Generate page
  useEffect(() => {
    const imageParam = searchParams.get("image");
    if (imageParam) {
      setAvatarPreview(imageParam);
    }
  }, [searchParams]);

  // No auto-generation - user must click "Generate" button manually

  const generateScenario = async () => {
    if (!name || selectedTraits.length === 0 || !selectedScenario) return;
    
    setIsGeneratingScenario(true);
    try {
      const template = SCENARIO_TEMPLATES.find(t => t.id === selectedScenario);
      const result = await generateCharacterDetails({
        name,
        traits: selectedTraits,
        scenarioTemplate: template?.label || selectedScenario,
      });
      
      setGeneratedScenario(result.scenario);
      setGeneratedCurrentState(result.current_state);
      setGeneratedMotivation(result.motivation);
      setGeneratedGreeting(result.greeting_message);
      setGeneratedDescription(result.description);
      setGeneratedBackground(result.background);
      setGeneratedPersonalityDesc(result.personality_desc);
      setGeneratedSuggestions(result.suggestions);
    } catch (error) {
      console.error("Failed to generate scenario:", error);
      // Fallback to simple template
      const template = SCENARIO_TEMPLATES.find(t => t.id === selectedScenario);
      const traitLabels = selectedTraits.map(t => TRAIT_OPTIONS.find(o => o.id === t)?.label).join(", ");
      setGeneratedScenario(
        `You are ${name}, a ${traitLabels.toLowerCase()} girl. As ${template?.desc?.toLowerCase()}, you unexpectedly cross paths with him one day...`
      );
      setGeneratedCurrentState("First time alone with him, heart racing unexpectedly");
      setGeneratedMotivation("Wanting to know him better, but too nervous to make the first move");
      setGeneratedGreeting(
        `*looks up at you shyly* "Um... hi, I'm ${name}..." *blushes slightly* "It's nice to meet you..."`
      );
    } finally {
      setIsGeneratingScenario(false);
    }
  };

  // Generate from custom scenario description
  const generateScenarioFromCustom = async () => {
    if (!name || selectedTraits.length === 0 || !customScenario) return;
    
    setIsGeneratingScenario(true);
    try {
      const result = await generateCharacterDetails({
        name,
        traits: selectedTraits,
        scenarioTemplate: customScenario, // Use the custom description
      });
      
      setGeneratedScenario(result.scenario);
      setGeneratedCurrentState(result.current_state);
      setGeneratedMotivation(result.motivation);
      setGeneratedGreeting(result.greeting_message);
      setGeneratedDescription(result.description);
      setGeneratedBackground(result.background);
      setGeneratedPersonalityDesc(result.personality_desc);
      setGeneratedSuggestions(result.suggestions);
    } catch (error) {
      console.error("Failed to generate from custom:", error);
      // Fallback
      const traitLabels = selectedTraits.map(t => TRAIT_OPTIONS.find(o => o.id === t)?.label).join(", ");
      setGeneratedScenario(
        `You are ${name}, a ${traitLabels.toLowerCase()} girl. ${customScenario}`
      );
      setGeneratedCurrentState("First time meeting, curious and slightly nervous");
      setGeneratedMotivation("Hoping to make a good impression");
      setGeneratedGreeting(
        `*looks up at you shyly* "Um... hi, I'm ${name}..." *smiles softly* "Nice to meet you..."`
      );
    } finally {
      setIsGeneratingScenario(false);
    }
  };

  const generateGreeting = async () => {
    // Re-generate using the same action
    if (selectedScenario === "custom") {
      await generateScenarioFromCustom();
    } else {
      await generateScenario();
    }
  };

  const handleTraitToggle = (traitId: string) => {
    setSelectedTraits(prev => 
      prev.includes(traitId) 
        ? prev.filter(t => t !== traitId)
        : [...prev, traitId]
    );
  };

  const randomName = () => {
    const random = NAME_SUGGESTIONS[Math.floor(Math.random() * NAME_SUGGESTIONS.length)];
    setName(random);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return name.trim().length > 0;
      case 2: return selectedTraits.length > 0;
      case 3: return selectedScenario !== "" && (selectedScenario !== "custom" || customScenario.trim().length > 0);
      case 4: return true;
      default: return false;
    }
  };

  const nextStep = () => {
    if (currentStep < 4 && canProceed()) {
      setCurrentStep(prev => prev + 1);
      // No auto-generation - user controls when to generate
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <div className="min-h-screen text-white p-4 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/discover" className="p-2 rounded-full hover:bg-white/10 transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Create Companion</h1>
          <p className="text-muted-foreground text-sm">Bring your imagination to life</p>
        </div>
      </div>

      {/* Step Indicator */}
      <StepIndicator currentStep={currentStep} totalSteps={4} />

      {/* Step Content */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 min-h-[500px] flex flex-col">
        
        {/* Step 1: Basic Info */}
        {currentStep === 1 && (
          <div className="flex-1 space-y-8 animate-in fade-in slide-in-from-right duration-300">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Let's give her a name</h2>
              <p className="text-white/60">What would you like to call her?</p>
            </div>

            {/* Name Input */}
            <div className="max-w-sm mx-auto space-y-4">
              <div className="relative">
                <Input 
                  placeholder="Enter a name..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-black/40 border-white/20 h-14 text-xl text-center focus:border-primary/50 pr-12"
                />
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={randomName}
                  className="absolute right-2 top-1/2 -translate-y-1/2 hover:bg-white/10 text-white/50 hover:text-white"
                >
                  <Shuffle className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <span className="text-xs text-white/40 mr-1">Try:</span>
                {NAME_SUGGESTIONS.map(n => (
                  <button
                    key={n}
                    onClick={() => setName(n)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm transition-all",
                      name === n 
                        ? "bg-primary text-white" 
                        : "bg-white/10 text-white/70 hover:bg-white/20"
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Avatar Section */}
            <div className="max-w-md mx-auto space-y-4">
              <div className="flex items-center justify-center gap-2 text-sm text-white/60">
                <ImagePlus className="w-4 h-4" />
                <span>Give her an image</span>
                <span className="text-white/30">(optional)</span>
              </div>
              <div className="grid grid-cols-5 gap-4">
                {/* Upload */}
                <div className="col-span-2 aspect-[3/4] relative group">
                  <div className="absolute inset-0 rounded-2xl bg-black/40 border-2 border-dashed border-white/20 flex items-center justify-center hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer overflow-hidden">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-4">
                        <ImagePlus className="w-10 h-10 mx-auto mb-2 text-white/30 group-hover:text-primary/70 transition-colors" />
                        <p className="text-sm text-white/50 group-hover:text-white/70">Upload</p>
                        <p className="text-xs text-white/30 mt-1">or drag & drop</p>
                      </div>
                    )}
                  </div>
                  {/* Delete button - outside overflow container, show on hover */}
                  {avatarPreview && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setAvatarPreview(null);
                      }}
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-black/80 flex items-center justify-center text-white/70 hover:text-white hover:bg-red-500 transition-all shadow-lg opacity-0 group-hover:opacity-100 z-10"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* AI Generate */}
                <div className="col-span-3 space-y-3 flex flex-col">
                  <Textarea 
                    placeholder="Describe her appearance... (e.g., silver hair, red eyes, maid outfit)"
                    value={avatarPrompt}
                    onChange={(e) => setAvatarPrompt(e.target.value)}
                    className="bg-black/40 border-white/10 flex-1 min-h-[100px] text-sm resize-none placeholder:text-white/30"
                  />
                  <div className="flex gap-2">
                    <Button 
                      className="flex-1 gap-2 bg-gradient-to-r from-primary to-purple-600 hover:opacity-90"
                      disabled={!avatarPrompt || isGeneratingAvatar}
                    >
                      <Sparkles className="w-4 h-4" />
                      {isGeneratingAvatar ? "Generating..." : "Quick Generate"}
                    </Button>
                    <Link href="/generate">
                      <Button 
                        variant="outline"
                        className="gap-1.5 border-white/20 text-white/70 hover:text-white hover:bg-white/10"
                      >
                        <Wand2 className="w-4 h-4" />
                        Studio
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Personality */}
        {currentStep === 2 && (
          <div className="flex-1 space-y-8 animate-in fade-in slide-in-from-right duration-300">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">What's her personality like?</h2>
              <p className="text-white/60">Pick her core traits (choose 1-3)</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 max-w-2xl mx-auto">
              {TRAIT_OPTIONS.map(trait => (
                <button
                  key={trait.id}
                  onClick={() => handleTraitToggle(trait.id)}
                  className={cn(
                    "p-4 rounded-2xl border transition-all duration-200 flex flex-col items-center gap-2 group",
                    selectedTraits.includes(trait.id)
                      ? "bg-gradient-to-br from-primary/20 to-purple-600/20 border-primary/50 shadow-lg shadow-primary/10"
                      : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                  )}
                >
                  {/* Color dot indicator */}
                  <div className={cn(
                    "w-3 h-3 rounded-full bg-gradient-to-r",
                    trait.color,
                    selectedTraits.includes(trait.id) ? "scale-125" : "group-hover:scale-110",
                    "transition-transform"
                  )} />
                  <span className="text-sm font-medium">{trait.label}</span>
                  <span className="text-xs text-white/50 text-center leading-tight">{trait.desc}</span>
                </button>
              ))}
            </div>

            {selectedTraits.length > 0 && (
              <div className="text-center space-y-2">
                <p className="text-sm text-white/60">Selected traits:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {selectedTraits.map(t => {
                    const trait = TRAIT_OPTIONS.find(o => o.id === t);
                    return (
                      <span key={t} className="px-3 py-1 rounded-full bg-primary/20 text-primary text-sm flex items-center gap-1.5">
                        <span className={cn("w-2 h-2 rounded-full bg-gradient-to-r", trait?.color)} />
                        {trait?.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Scenario */}
        {currentStep === 3 && (
          <div className="flex-1 space-y-6 animate-in fade-in slide-in-from-right duration-300">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">What's the story?</h2>
              <p className="text-white/60">Choose a scenario for your first encounter</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
              {SCENARIO_TEMPLATES.map(scenario => (
                <button
                  key={scenario.id}
                  onClick={() => setSelectedScenario(scenario.id)}
                  className={cn(
                    "p-4 rounded-2xl border transition-all duration-200 flex flex-col items-center gap-2 group",
                    selectedScenario === scenario.id
                      ? "bg-gradient-to-br from-primary/20 to-purple-600/20 border-primary/50"
                      : "bg-white/5 border-white/10 hover:bg-white/10"
                  )}
                >
                  <div className={cn(
                    "w-3 h-3 rounded-full bg-gradient-to-r",
                    scenario.color,
                    selectedScenario === scenario.id ? "scale-125" : "group-hover:scale-110",
                    "transition-transform"
                  )} />
                  <span className="text-sm font-medium">{scenario.label}</span>
                  <span className="text-[10px] text-white/50 text-center">{scenario.desc}</span>
                </button>
              ))}
            </div>

            {/* Custom Scenario Input */}
            {selectedScenario === "custom" && (
              <div className="max-w-lg mx-auto space-y-3">
                <Textarea 
                  placeholder="Describe your custom scenario... (e.g., We meet at a rooftop bar during sunset)"
                  value={customScenario}
                  onChange={(e) => setCustomScenario(e.target.value)}
                  className="bg-black/40 border-white/10 min-h-[100px] resize-none"
                />
                
                {/* Generate from custom description */}
                <div className="flex justify-end">
                  <Button 
                    onClick={() => {
                      if (customScenario) {
                        // Use custom scenario as the template
                        generateScenarioFromCustom();
                      }
                    }}
                    disabled={!customScenario || isGeneratingScenario || !name || selectedTraits.length === 0}
                    className="gap-2 bg-gradient-to-r from-primary to-purple-600 hover:opacity-90"
                  >
                    <Sparkles className="w-4 h-4" />
                    {isGeneratingScenario ? "Generating..." : "Enhance with AI"}
                  </Button>
                </div>

                {/* Show generated content if available */}
                {generatedScenario && (
                  <div className="bg-black/40 border border-white/10 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm text-white/60 flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-primary" />
                        AI Enhanced
                      </Label>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={generateScenarioFromCustom}
                        disabled={isGeneratingScenario}
                        className="h-7 text-xs gap-1 text-primary hover:text-primary hover:bg-primary/10"
                      >
                        <RefreshCw className={cn("w-3 h-3", isGeneratingScenario && "animate-spin")} />
                        Regenerate
                      </Button>
                    </div>
                    <p className="text-sm text-white/80 leading-relaxed">{generatedScenario}</p>
                    <div className="pt-2 border-t border-white/10 space-y-1">
                      <p className="text-xs text-white/50">
                        <span className="text-primary">State:</span> {generatedCurrentState}
                      </p>
                      <p className="text-xs text-white/50">
                        <span className="text-primary">Drive:</span> {generatedMotivation}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* AI Generated Scenario */}
            {selectedScenario && selectedScenario !== "custom" && (
              <div className="max-w-lg mx-auto space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-white/60 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    AI Generated Scenario
                  </Label>
                  {generatedScenario && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={generateScenario}
                      disabled={isGeneratingScenario}
                      className="h-7 text-xs gap-1 text-primary hover:text-primary hover:bg-primary/10"
                    >
                      <RefreshCw className={cn("w-3 h-3", isGeneratingScenario && "animate-spin")} />
                      Regenerate
                    </Button>
                  )}
                </div>
                
                <div className="bg-black/40 border border-white/10 rounded-xl p-4 space-y-3">
                  {isGeneratingScenario ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : generatedScenario ? (
                    <>
                      <p className="text-sm text-white/80 leading-relaxed">{generatedScenario}</p>
                      <div className="pt-2 border-t border-white/10 space-y-1">
                        <p className="text-xs text-white/50">
                          <span className="text-primary">State:</span> {generatedCurrentState}
                        </p>
                        <p className="text-xs text-white/50">
                          <span className="text-primary">Drive:</span> {generatedMotivation}
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-6 space-y-3">
                      <p className="text-sm text-white/50">Click below to generate scenario with AI</p>
                      <Button 
                        onClick={generateScenario}
                        disabled={isGeneratingScenario || !name || selectedTraits.length === 0}
                        className="gap-2 bg-gradient-to-r from-primary to-purple-600 hover:opacity-90"
                      >
                        <Sparkles className="w-4 h-4" />
                        Generate Scenario
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Preview & Confirm */}
        {currentStep === 4 && (
          <div className="flex-1 space-y-6 animate-in fade-in slide-in-from-right duration-300">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Preview Your Character</h2>
              <p className="text-white/60">Review and create your companion</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              {/* Character Card Preview */}
              <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-neutral-900 border border-white/10 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-600/20" />
                {avatarPreview && (
                  <img src={avatarPreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/90" />
                <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
                  <h3 className="text-xl font-bold">{name}</h3>
                  <div className="flex flex-wrap gap-1">
                    {selectedTraits.slice(0, 3).map(t => {
                      const trait = TRAIT_OPTIONS.find(o => o.id === t);
                      return (
                        <span key={t} className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] flex items-center gap-1">
                          <span className={cn("w-1.5 h-1.5 rounded-full bg-gradient-to-r", trait?.color)} />
                          {trait?.label}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Info & Greeting */}
              <div className="space-y-4">
                <div className="bg-black/40 border border-white/10 rounded-xl p-4 space-y-2">
                  <Label className="text-xs text-white/50">Scenario</Label>
                  <p className="text-sm text-white/80">{generatedScenario || customScenario}</p>
                </div>

                <div className="bg-black/40 border border-white/10 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-white/50">Greeting Message</Label>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={generateGreeting}
                      className="h-6 text-xs gap-1 text-primary hover:text-primary hover:bg-primary/10"
                    >
                      <RefreshCw className={cn("w-3 h-3", isGeneratingGreeting && "animate-spin")} />
                    </Button>
                  </div>
                  <div className="flex items-start gap-3">
                    <Avatar className="w-8 h-8">
                      {avatarPreview ? (
                        <AvatarImage src={avatarPreview} />
                      ) : (
                        <AvatarFallback>{name?.charAt(0) || "?"}</AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1 bg-white/10 rounded-xl p-3 text-sm">
                      {isGeneratingGreeting ? (
                        <span className="text-white/50">Generating...</span>
                      ) : (
                        generatedGreeting || "Hello! Nice to meet you..."
                      )}
                    </div>
                  </div>
                </div>

                {/* Visibility Toggle */}
                <div className="flex items-center justify-between bg-black/40 border border-white/10 rounded-xl p-4">
                  <div className="flex items-center gap-2">
                    {isPublic ? <Globe className="w-4 h-4 text-green-400" /> : <Lock className="w-4 h-4 text-yellow-400" />}
                    <span className="text-sm">{isPublic ? "Public" : "Private"}</span>
                  </div>
                  <Switch checked={isPublic} onCheckedChange={setIsPublic} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 mt-6 border-t border-white/10">
          <Button 
            variant="ghost" 
            onClick={prevStep}
            disabled={currentStep === 1}
            className="gap-2 text-white/70 hover:text-white hover:bg-white/10"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>

          {currentStep < 4 ? (
            <Button 
              onClick={nextStep}
              disabled={!canProceed()}
              className="gap-2 bg-primary hover:bg-primary/90"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button 
              onClick={handleCreateCharacter}
              disabled={isCreating}
              className="gap-2 bg-gradient-to-r from-primary to-purple-600 px-8"
            >
              {isCreating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Heart className="w-4 h-4" />
                  Create Character
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
