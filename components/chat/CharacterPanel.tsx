"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ChevronDown, Lightbulb, User, Settings, Images } from "lucide-react";

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
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [activeTab, setActiveTab] = useState<"suggestions" | "persona" | "gallery">("suggestions");

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
          <p className="text-sm text-white/90 mb-2">
            {character.age} years old. {character.description}
          </p>

          {/* Traits */}
          <div className="flex flex-wrap gap-1 mb-2">
            {character.traits.map((trait, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="text-xs bg-white/20 text-white border-white/30"
              >
                {trait}
              </Badge>
            ))}
          </div>

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
          <p className="text-sm text-muted-foreground leading-relaxed">
            {character.personality}
          </p>
          {character.location && (
            <p className="text-xs text-muted-foreground mt-2">
              📍 {character.location}
            </p>
          )}
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {/* Tab Navigation */}
        <div className="p-4 border-b border-border">
          <div className="flex gap-2">
            <Button
              variant={activeTab === "suggestions" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("suggestions")}
              className="text-xs"
            >
              <Lightbulb className="w-3 h-3 mr-1" />
              Suggestions
              <Badge variant="destructive" className="ml-1 text-xs">New</Badge>
            </Button>
            <Button
              variant={activeTab === "persona" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("persona")}
              className="text-xs"
            >
              <User className="w-3 h-3 mr-1" />
              Persona
            </Button>
            <Button
              variant={activeTab === "gallery" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("gallery")}
              className="text-xs"
            >
              <Images className="w-3 h-3 mr-1" />
              Gallery
            </Button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-4">
          {activeTab === "suggestions" && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                Suggestions
                <Badge variant="destructive" className="text-xs">New</Badge>
              </h3>
              <p className="text-xs text-muted-foreground">
                Not sure what to say? Press the lightbulb button to generate response options.
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

          {activeTab === "persona" && (
            <div className="space-y-4">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <User className="w-4 h-4" />
                Persona
                <Settings className="w-3 h-3 ml-auto" />
              </h3>

              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium mb-2">Character</h4>
                  <div className="flex items-center gap-3 p-2 bg-muted rounded-lg">
                    <img
                      src={character.avatar_url}
                      alt={character.name}
                      className="w-8 h-8 rounded-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop&crop=face';
                      }}
                    />
                    <span className="text-sm font-medium">{character.name}</span>
                    <Button variant="ghost" size="sm" className="ml-auto text-xs">
                      •••
                    </Button>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Mode</h4>
                  <div className="space-y-2">
                    <Badge variant="outline" className="text-xs">Male</Badge>
                    <Badge variant="default" className="text-xs ml-2">Default</Badge>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "gallery" && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Images className="w-4 h-4" />
                Gallery
              </h3>

              <div className="grid grid-cols-2 gap-2">
                <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                  <Images className="w-8 h-8 text-muted-foreground" />
                </div>
                <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                  <Images className="w-8 h-8 text-muted-foreground" />
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full bg-red-500 hover:bg-red-600 text-white border-red-500"
              >
                🎨 Generate
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}