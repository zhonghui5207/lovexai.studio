"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogClose, DialogTitle } from "@/components/ui/dialog";
import { X, MessageCircle, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface CharacterModalProps {
  character: {
    id: string;
    name: string;
    username?: string;
    avatar: string;
    description: string;
    greeting: string;
    chatCount: string;
    isOfficial: boolean;
    personality?: string;
    physicalDescription?: string;
    age?: number;
    location?: string;
    traits?: string[];
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function CharacterModal({ character, isOpen, onClose }: CharacterModalProps) {
  const [showCreateOptions, setShowCreateOptions] = useState(false);
  const router = useRouter();

  if (!character) return null;

  const handleStartChat = () => {
    router.push(`/chat/${character.id}`);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] p-0 bg-background border-border overflow-hidden">
        <DialogTitle className="sr-only">
          {character.name} - Character Details
        </DialogTitle>
        <div className="flex h-full">
          {/* Left side - Character Image */}
          <div className="relative w-1/2 bg-gradient-to-br from-muted/50 to-muted/80">
            <img
              src={character.avatar}
              alt={character.name}
              className="w-full h-full object-cover"
            />

            {/* Official Badge */}
            {character.isOfficial && (
              <div className="absolute top-4 left-4">
                <Badge className="bg-red-500 hover:bg-red-600 text-white font-semibold px-3 py-1">
                  Official
                </Badge>
              </div>
            )}
          </div>

          {/* Right side - Character Details */}
          <div className="w-1/2 bg-gray-900 text-white flex flex-col h-full relative">
            {/* Close Button - Top Right */}
            <DialogClose className="absolute top-4 right-4 p-2 rounded-full bg-gray-800/50 hover:bg-gray-700 text-white backdrop-blur-sm transition-all z-10">
              <X className="h-5 w-5" />
            </DialogClose>

            <div className="p-6 flex-1 flex flex-col pb-2">
              {/* Header */}
              <div className="mb-6 flex-shrink-0">
                <div className="flex items-center justify-between mb-2 pr-12">
                  <h2 className="text-2xl font-bold">{character.name}</h2>
                </div>

                <div className="flex items-center gap-3 text-gray-300">
                  <span>@{character.username || character.name.toLowerCase()}</span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-4 w-4" />
                    {character.chatCount}
                  </span>
                </div>
              </div>

              {/* Character Description */}
              <div className="mb-6 flex-shrink-0">
                <p className="text-gray-200 leading-relaxed">
                  {character.greeting}
                </p>
              </div>

              {/* Character Details - Scrollable */}
              <div className="flex-1 overflow-y-auto mb-4 pr-2">
                <div className="space-y-4">
                  {character.personality && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-400 mb-2">PERSONALITY & DESCRIPTION</h3>
                      <p className="text-gray-200 text-sm leading-relaxed">
                        {character.personality}
                      </p>
                    </div>
                  )}

                  {character.physicalDescription && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-400 mb-2">PHYSICAL DESCRIPTION</h3>
                      <p className="text-gray-200 text-sm leading-relaxed">
                        {character.physicalDescription}
                      </p>
                    </div>
                  )}

                  {(character.age || character.location) && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-400 mb-2">DETAILS</h3>
                      <div className="text-gray-200 text-sm space-y-1">
                        {character.age && <p>Age: {character.age}</p>}
                        {character.location && <p>Location: {character.location}</p>}
                      </div>
                    </div>
                  )}

                  {character.traits && character.traits.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-400 mb-2">TRAITS</h3>
                      <div className="flex flex-wrap gap-2">
                        {character.traits.map((trait, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="border-gray-600 text-gray-300 bg-gray-800/50"
                          >
                            {trait}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons - Fixed at bottom */}
            <div className="p-6 pt-0 bg-gray-900">
              <div className="flex gap-3">
                <Button
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-lg"
                  onClick={handleStartChat}
                >
                  Start Chat
                </Button>

                <div className="relative">
                  <Button
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-800 px-6 py-3 rounded-lg flex items-center gap-2"
                    onClick={() => setShowCreateOptions(!showCreateOptions)}
                  >
                    Create
                    <ChevronDown className={`h-4 w-4 transition-transform ${showCreateOptions ? 'rotate-180' : ''}`} />
                  </Button>

                  {showCreateOptions && (
                    <div className="absolute bottom-full mb-2 right-0 bg-gray-800 border border-gray-600 rounded-lg p-2 min-w-[120px]">
                      <button className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded">
                        Remix
                      </button>
                      <button className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded">
                        Similar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}