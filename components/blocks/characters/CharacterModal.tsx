"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogClose, DialogTitle } from "@/components/ui/dialog";
import { X, MessageCircle, ChevronDown, Loader2 } from "lucide-react";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

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

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export default function CharacterModal({ character, isOpen, onClose }: CharacterModalProps) {
  const [showCreateOptions, setShowCreateOptions] = useState(false);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const router = useRouter();
  const { data: session } = useSession();
  
  const createConversation = useMutation(api.conversations.create);
  const ensureUser = useMutation(api.users.ensureUser);

  // 当模态框关闭时重置状态
  React.useEffect(() => {
    if (!isOpen) {
      setCreateError(null);
      setIsCreatingChat(false);
      setShowCreateOptions(false);
    }
  }, [isOpen]);

  if (!character) return null;

  const handleStartChat = async () => {
    // 重置错误状态
    setCreateError(null);

    // 检查用户是否登录
    if (!session?.user?.email) {
      // 未登录，跳转到登录页面
      window.location.href = '/api/auth/signin';
      return;
    }

    setIsCreatingChat(true);

    try {
      // 1. 确保用户在 Convex 中存在 (Sync User)
      // 使用 ensureUser 以保持与 ChatPage 逻辑一致，避免创建不同用户 ID
      const userId = await ensureUser({
        email: session.user.email,
        name: session.user.name || "User",
        avatar_url: session.user.image || "",
      });

      if (!userId) {
        throw new Error("Failed to sync user");
      }

      // 2. 使用返回的 Convex User ID 创建对话
      const conversationId = await createConversation({
        characterId: character.id as Id<"characters">,
        userId: userId,
      });

      // 跳转到新创建的对话页面
      router.push(`/chat?c=${conversationId}`);
      onClose();
    } catch (error: any) {
      console.error('Error creating conversation:', error);
      setCreateError(error.message || 'Failed to create conversation');
    } finally {
      setIsCreatingChat(false);
    }
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
                <Badge className="bg-primary hover:bg-primary/90 text-white font-semibold px-3 py-1">
                  Lovexai
                </Badge>
              </div>
            )}
          </div>

          {/* Right side - Character Details */}
          <div className="w-1/2 bg-[#0f1117] text-white flex flex-col h-full relative">


            <div className="p-6 flex-1 flex flex-col pb-2 overflow-hidden">
              {/* Header */}
              <div className="mb-6 flex-shrink-0">
                <div className="flex items-center justify-between mb-2 pr-12">
                  <h2 className="text-2xl font-bold text-white">{character.name}</h2>
                </div>

                <div className="flex items-center gap-3 text-white/60">
                  <span>@{character.username || character.name.toLowerCase()}</span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-4 w-4" />
                    {character.chatCount}
                  </span>
                </div>
              </div>

              {/* Character Description */}
              <div className="mb-6 flex-shrink-0">
                <p className="text-white/80 leading-relaxed">
                  {character.greeting}
                </p>
              </div>

              {/* Character Details - Scrollable */}
              <div className="flex-1 overflow-y-auto mb-4 pr-2 custom-scrollbar">
                <div className="space-y-6">
                  {character.personality && (
                    <div>
                      <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2">PERSONALITY & DESCRIPTION</h3>
                      <p className="text-white/70 text-sm leading-relaxed">
                        {character.personality}
                      </p>
                    </div>
                  )}

                  {character.physicalDescription && (
                    <div>
                      <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2">PHYSICAL DESCRIPTION</h3>
                      <p className="text-white/70 text-sm leading-relaxed">
                        {character.physicalDescription}
                      </p>
                    </div>
                  )}

                  {(character.age || character.location) && (
                    <div>
                      <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2">DETAILS</h3>
                      <div className="text-white/70 text-sm space-y-1">
                        {character.age && <p>Age: {character.age}</p>}
                        {character.location && <p>Location: {character.location}</p>}
                      </div>
                    </div>
                  )}

                  {character.traits && character.traits.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2">TRAITS</h3>
                      <div className="flex flex-wrap gap-2">
                        {character.traits.map((trait, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="border-white/10 text-white/70 bg-white/5 hover:bg-white/10 transition-colors"
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
            <div className="p-6 pt-0 bg-[#0f1117]">
              {/* Error Message */}
              {createError && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-red-400 text-sm">{createError}</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold py-6 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleStartChat}
                  disabled={isCreatingChat}
                >
                  {isCreatingChat ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Start Chat'
                  )}
                </Button>

                <div className="relative">
                  <Button
                    variant="outline"
                    className="border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white px-6 py-6 rounded-xl flex items-center gap-2 font-medium transition-all"
                    onClick={() => setShowCreateOptions(!showCreateOptions)}
                  >
                    Create
                    <ChevronDown className={`h-4 w-4 transition-transform ${showCreateOptions ? 'rotate-180' : ''}`} />
                  </Button>

                  {showCreateOptions && (
                    <div className="absolute bottom-full mb-2 right-0 bg-[#1a1d26] border border-white/10 rounded-xl p-1.5 min-w-[140px] shadow-xl z-50">
                      <button className="w-full text-left px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                        Remix
                      </button>
                      <button className="w-full text-left px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
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