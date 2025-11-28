"use client";

import { useState } from "react";
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
  Wand2,
  MessageSquare,
  User
} from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default function CreateCharacterPage() {
  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [greeting, setGreeting] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  return (
    <div className="min-h-screen text-white p-6 md:p-12 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/profile" className="p-2 rounded-full hover:bg-white/10 transition-colors">
            <ChevronLeft className="w-6 h-6" />
        </Link>
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Create Companion</h1>
            <p className="text-muted-foreground">Bring your imagination to life.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column: Editor (7 cols) */}
        <div className="lg:col-span-7 space-y-8">
            
            {/* 1. Avatar Section */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <ImagePlus className="w-5 h-5 text-primary" />
                    Visual Identity
                </h2>
                <div className="flex items-start gap-6">
                    <div className="relative group cursor-pointer w-32 h-32 shrink-0 rounded-xl bg-black/40 border-2 border-dashed border-white/20 flex items-center justify-center hover:border-primary/50 hover:bg-primary/5 transition-all overflow-hidden">
                        {avatarPreview ? (
                            <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                            <div className="text-center p-2">
                                <ImagePlus className="w-8 h-8 mx-auto mb-2 text-white/30 group-hover:text-primary/80" />
                                <span className="text-xs text-white/40 group-hover:text-white/60">Upload</span>
                            </div>
                        )}
                    </div>
                    <div className="flex-1 space-y-3">
                        <p className="text-sm text-muted-foreground">
                            Upload an image or let AI generate one for you based on your description.
                        </p>
                        <Button variant="outline" className="w-full sm:w-auto gap-2 border-primary/30 hover:bg-primary/10 hover:text-primary">
                            <Sparkles className="w-4 h-4" />
                            Generate with AI
                        </Button>
                    </div>
                </div>
            </div>

            {/* 2. Core Identity */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    Core Identity
                </h2>
                
                <div className="space-y-2">
                    <Label>Name</Label>
                    <Input 
                        placeholder="e.g. Seraphina" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="bg-black/20 border-white/10 h-12 text-lg focus:border-primary/50"
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label>Persona & Description</Label>
                        <Button variant="ghost" size="sm" className="h-6 text-xs text-primary hover:text-primary/80 hover:bg-primary/10 gap-1">
                            <Wand2 className="w-3 h-3" />
                            Optimize
                        </Button>
                    </div>
                    <Textarea 
                        placeholder="Describe her personality, background, and traits. The more details, the better..." 
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="bg-black/20 border-white/10 min-h-[150px] text-base focus:border-primary/50 resize-none"
                    />
                    <p className="text-xs text-muted-foreground text-right">0/500 characters</p>
                </div>
            </div>

            {/* 3. First Interaction */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    First Interaction
                </h2>
                
                <div className="space-y-2">
                    <Label>Greeting Message</Label>
                    <Textarea 
                        placeholder="What should she say when a new chat starts?" 
                        value={greeting}
                        onChange={(e) => setGreeting(e.target.value)}
                        className="bg-black/20 border-white/10 min-h-[100px] text-base focus:border-primary/50 resize-none"
                    />
                </div>
            </div>

            {/* 4. Visibility */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center justify-between">
                <div className="space-y-1">
                    <h3 className="font-medium flex items-center gap-2">
                        {isPublic ? <Globe className="w-4 h-4 text-green-400" /> : <Lock className="w-4 h-4 text-yellow-400" />}
                        {isPublic ? "Public" : "Private"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        {isPublic 
                            ? "Anyone can chat with this character." 
                            : "Only you can see and chat with this character."}
                    </p>
                </div>
                <Switch checked={isPublic} onCheckedChange={setIsPublic} className="data-[state=checked]:bg-primary" />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-4 pt-4">
                <Button variant="ghost" className="h-12 px-6 hover:bg-white/5">Cancel</Button>
                <Button className="h-12 px-8 bg-primary hover:bg-primary/90 text-white text-lg font-medium shadow-lg shadow-primary/25">
                    Create Character
                </Button>
            </div>

        </div>

        {/* Right Column: Live Preview (5 cols) */}
        <div className="hidden lg:block lg:col-span-5">
            <div className="sticky top-24 space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Live Preview</h3>
                
                {/* Card Preview */}
                <div className="w-full aspect-[3/4] rounded-3xl overflow-hidden bg-neutral-900 border border-white/10 relative shadow-2xl">
                    {/* Background Image Layer */}
                    <div className="absolute inset-0 bg-neutral-800">
                        {avatarPreview ? (
                            <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-900">
                                <User className="w-20 h-20 text-white/10" />
                            </div>
                        )}
                    </div>
                    
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/90" />

                    {/* Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-8 space-y-3">
                        <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-0 backdrop-blur-md">
                                {isPublic ? "Public" : "Private"}
                            </Badge>
                            <Badge variant="secondary" className="bg-primary/20 text-primary border-0 backdrop-blur-md">
                                New
                            </Badge>
                        </div>
                        
                        <h1 className="text-3xl font-bold text-white leading-tight">
                            {name || "Character Name"}
                        </h1>
                        
                        <p className="text-white/70 line-clamp-3 text-sm leading-relaxed">
                            {description || "Your character's description will appear here. Write something catchy to attract users!"}
                        </p>

                        <div className="pt-4 flex items-center gap-3">
                            <div className="flex -space-x-2">
                                {[1,2,3].map(i => (
                                    <div key={i} className="w-6 h-6 rounded-full bg-white/10 border border-black" />
                                ))}
                            </div>
                            <span className="text-xs text-white/40">0 chats</span>
                        </div>
                    </div>
                </div>

                {/* Chat Preview Bubble */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mt-6">
                    <div className="flex items-start gap-3">
                        <Avatar className="w-10 h-10 border border-white/10">
                            {avatarPreview ? (
                                <AvatarImage src={avatarPreview} />
                            ) : (
                                <AvatarFallback>{name?.charAt(0) || "?"}</AvatarFallback>
                            )}
                        </Avatar>
                        <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-white">{name || "Character"}</span>
                                <span className="text-xs text-muted-foreground">Just now</span>
                            </div>
                            <div className="bg-white/10 rounded-r-xl rounded-bl-xl p-3 text-sm text-white/90 leading-relaxed">
                                {greeting || "Hello! I am your new AI companion. What would you like to talk about?"}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
      </div>
    </div>
  );
}
