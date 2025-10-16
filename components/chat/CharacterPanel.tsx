"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ChevronDown, ChevronUp, Lightbulb, Settings, Star, MessageSquare, Image } from "lucide-react";

interface Character {
  id: string;
  name: string;
  username?: string;
  avatar_url: string;
  description: string;
  traits: string[];
  personality: string;
  age?: number;
  location?: string;
}

interface CharacterPanelProps {
  character: Character;
}

const SUGGESTIONS = [
  "How do you want to play with my penis I want you to give me the specific steps",
  "Not sure what to say? Press the lightbulb button to generate response options.",
  "Tell me about your day",
  "What's your favorite hobby?",
  "Let's roleplay a scenario"
];

export default function CharacterPanel({ character }: CharacterPanelProps) {
  // 基于对标网站的上下折叠状态管理
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showPersona, setShowPersona] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showMemories, setShowMemories] = useState(false);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Character Header */}
      <div className="relative">
        {/* Large Character Image */}
        <div className="h-64 relative overflow-hidden">
          <img
            src={character.avatar_url}
            alt={character.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop&crop=face';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>

        {/* Character Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <h2 className="text-xl font-bold mb-1">{character.name}</h2>
          <p className="text-sm text-white/90 mb-2 line-clamp-3">
            {character.age}, {character.description}
          </p>

  
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFullDescription(!showFullDescription)}
            className="text-white hover:bg-white/20 p-0 h-auto text-xs"
          >
            {showFullDescription ? "View less" : "View more"}
            <ChevronDown className={`ml-1 h-3 w-3 transition-transform ${showFullDescription ? "rotate-180" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Extended Description */}
      {showFullDescription && (
        <div className="p-4 border-b border-border">
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
            {character.personality}
          </p>
          {character.location && (
            <p className="text-xs text-muted-foreground mt-2">
              📍 {character.location}
            </p>
          )}
        </div>
      )}

      {/* 模块化内容区域 - 基于对标网站的设计 */}
      <div className="flex-1 overflow-y-auto">

        {/* 1. Persona 模块 - 可上下折叠 */}
        <div className="border-b border-border">
          {/* 模块标题栏 - 可点击折叠 */}
          <button
            onClick={() => setShowPersona(!showPersona)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-primary" />
              <span className="font-medium text-sm">Persona</span>
              <Badge variant="outline" className="text-xs">sassy</Badge>
            </div>
            {showPersona ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {/* 模块内容 - 可折叠显示 */}
          {showPersona && (
            <div className="px-4 pb-4 space-y-3">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {character.personality}
              </p>
              {character.location && (
                <p className="text-xs text-muted-foreground">
                  📍 {character.location}
                </p>
              )}
              <div className="flex flex-wrap gap-1">
                {character.traits.slice(0, 3).map((trait, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {trait}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 2. Memories 模块 - 可上下折叠 */}
        <div className="border-b border-border">
          <button
            onClick={() => setShowMemories(!showMemories)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-500" />
              <span className="font-medium text-sm">Memories</span>
              <Badge variant="destructive" className="text-xs">New</Badge>
            </div>
            {showMemories ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showMemories && (
            <div className="px-4 pb-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                Shared memories and important moments in your conversation history.
              </p>
              <Button variant="outline" size="sm" className="w-full">
                Manage Memories
              </Button>
            </div>
          )}
        </div>

        {/* 3. Suggestions 模块 - 可上下折叠 */}
        <div className="border-b border-border">
          <button
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-yellow-500" />
              <span className="font-medium text-sm">Suggestions</span>
            </div>
            {showSuggestions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showSuggestions && (
            <div className="px-4 pb-4 space-y-3">
              <p className="text-xs text-muted-foreground">
                Not sure what to say? Generate response options.
              </p>

              <div className="space-y-2">
                {SUGGESTIONS.slice(2).map((suggestion, index) => (
                  <Card key={index} className="p-3 hover:bg-muted/50 cursor-pointer transition-colors">
                    <p className="text-sm">{suggestion}</p>
                  </Card>
                ))}
              </div>

              <Button variant="outline" size="sm" className="w-full">
                Generate More Suggestions
              </Button>
            </div>
          )}
        </div>

        {/* 4. Gallery 模块 - 可上下折叠 */}
        <div className="border-b border-border">
          <button className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2">
              <Image className="w-4 h-4 text-green-500" />
              <span className="font-medium text-sm">Gallery</span>
            </div>
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}