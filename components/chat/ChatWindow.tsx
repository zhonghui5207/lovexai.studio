"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Send, Smile, MoreVertical, ArrowLeft, Settings, AlertTriangle, RotateCcw, Flag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import GenerationSettingsModal from "./GenerationSettingsModal";
import FormattedMessage from "./FormattedMessage";
import CreditDisplay from "./CreditDisplay";
import ErrorDisplay from "./ErrorDisplay";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import InsufficientCreditsDialog from "./InsufficientCreditsDialog";
import { useCredits } from "@/contexts/CreditsContext";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface Message {
  id: string;
  content: string;
  sender: "user" | "character";
  timestamp: Date;
}

interface Character {
  id: string;
  name: string;
  username?: string;
  avatar_url: string;
  description: string;
  traits: string[];
  chat_count: string;
  credits_per_message: number;
}

interface GenerationSettings {
  responseLength: "short" | "default" | "long";
  selectedModel: string;
  creativity: "precise" | "balanced" | "creative";
}

interface ChatWindowProps {
  character: Character;
  messages: Message[];
  onSendMessage: (content: string, settings?: GenerationSettings) => void;
  isTyping?: boolean;
  isLoading?: boolean;
  creditsPerMessage?: number;
  convexUserId?: Id<"users"> | null;
  conversationId?: Id<"conversations"> | null;
  onConversationDeleted?: () => void;
}

export default function ChatWindow({ character, messages, onSendMessage, isTyping = false, isLoading = false, creditsPerMessage = 1, convexUserId, conversationId, onConversationDeleted }: ChatWindowProps) {
  const { data: session } = useSession();
  const { credits } = useCredits();
  const [newMessage, setNewMessage] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCreditsDialogOpen, setIsCreditsDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'network' | 'server' | 'credits' | 'permission' | 'general' | 'timeout' | 'empty_message'>('general');
  
  // Conversation mutations
  const deleteConversationMutation = useMutation(api.conversations.deleteConversation);
  const resetConversationMutation = useMutation(api.conversations.resetConversation);
  const router = useRouter();
  
  // Default settings
  const defaultSettings: GenerationSettings = {
    responseLength: "default",
    selectedModel: "nova",
    creativity: "balanced"
  };
  
  // Load user settings from Convex
  const savedSettings = useQuery(
    api.users.getGenerationSettings,
    convexUserId ? { userId: convexUserId } : "skip"
  );
  const updateSettingsMutation = useMutation(api.users.updateGenerationSettings);
  
  // Use saved settings or defaults
  const [generationSettings, setGenerationSettings] = useState<GenerationSettings>(defaultSettings);
  
  // Sync with saved settings when loaded
  useEffect(() => {
    if (savedSettings) {
      setGenerationSettings(savedSettings as GenerationSettings);
    }
  }, [savedSettings]);
  
  // Handle settings change and save to backend
  const handleSettingsChange = async (newSettings: GenerationSettings) => {
    setGenerationSettings(newSettings);
    
    // Save to backend if user is logged in
    if (convexUserId) {
      try {
        await updateSettingsMutation({
          userId: convexUserId,
          settings: newSettings,
        });
      } catch (error) {
        console.error("Failed to save settings:", error);
      }
    }
  };
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 渲染头像 - 简化版本，让浏览器处理缓存
  const renderAvatar = () => {
    const fallbackUrl = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop&crop=face';

    return (
      <div className="relative flex-shrink-0">
        <img
          src={character.avatar_url}
          alt={character.name}
          className="w-8 h-8 rounded-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = fallbackUrl;
          }}
          loading="lazy"
        />
      </div>
    );
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Dropdown menu handlers
  const handleResetConversation = async () => {
    if (!conversationId || !convexUserId) {
      console.error("Missing conversationId or convexUserId");
      return;
    }
    
    // Direct execution, no confirm alert to avoid UI conflict
    try {
      await resetConversationMutation({
        conversationId,
        userId: convexUserId,
      });
      // Optional: Add a subtle toast here instead of alert if needed
    } catch (error) {
      console.error("Failed to reset conversation:", error);
      setError("Failed to reset conversation. Please try again.");
      setErrorType('general');
    }
  };

  const handleReportCharacter = () => {
    // Ideally use a Modal or Toast, avoid window.alert
    console.log("Report functionality triggered");
  };

  const handleDeleteConversation = async () => {
    if (!conversationId || !convexUserId) return;
    
    // Direct execution, no confirm alert to avoid UI conflict
    try {
      await deleteConversationMutation({
        conversationId,
        userId: convexUserId,
      });
      
      // Call the callback to handle switching to another conversation
      if (onConversationDeleted) {
        onConversationDeleted();
      }
    } catch (error) {
      console.error("[Delete] Error:", error);
      setError("Failed to delete conversation. Please try again.");
      setErrorType('general');
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim()) {
      setError("Message cannot be empty. Please type something before sending.");
      setErrorType('empty_message');
      return;
    }

    // Check credits
    if (credits < creditsPerMessage) {
      setIsCreditsDialogOpen(true);
      return;
    }

    // 清除之前的错误
    setError(null);

    // 发送消息
    try {
      await onSendMessage(newMessage.trim(), generationSettings);
      setNewMessage("");
    } catch (error: any) {
      // ... (error handling)
    }
  };

  const handleRetry = async () => {
    if (!newMessage.trim()) return;
    await handleSend();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header - Transparent blend with background */}
      <div className="flex items-center justify-between px-4 py-3 z-20">
        {/* Left side - Character info */}
        <div className="flex items-center gap-3">

          <div className="relative">
            <img
              src={character.avatar_url}
              alt={character.name}
              className="w-10 h-10 rounded-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop&crop=face';
              }}
            />
          </div>
          <div>
            <h3 className="font-semibold">{character.name}</h3>
            <p className="text-sm text-muted-foreground">
              {character.traits?.slice(0, 2).join(' • ') || 'AI Companion'}
            </p>
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          <Link href="/pricing?tab=credits">
            <div className="bg-primary px-3 py-1.5 rounded-xl flex items-center gap-1.5 hover:bg-primary/90 transition-all cursor-pointer shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-95">
              <CreditDisplay creditsPerMessage={creditsPerMessage} simpleMode={true} />
            </div>
          </Link>
          
          <Badge
            variant="outline"
            className="text-xs flex items-center gap-1 cursor-pointer hover:bg-muted px-3 py-1.5 h-9 rounded-xl border-white/10 bg-white/5 transition-all"
            onClick={() => setIsSettingsOpen(true)}
          >
            <Settings className="h-3.5 w-3.5" />
            Settings
          </Badge>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-white/10 hover:text-white rounded-xl transition-colors">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 bg-[#0B0E14]/95 backdrop-blur-xl border-white/10 text-gray-200 rounded-xl shadow-2xl p-1">
              <DropdownMenuItem 
                onClick={handleResetConversation}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 cursor-pointer focus:bg-white/5 focus:text-white transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <RotateCcw className="w-4 h-4 text-blue-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Reset Chat</span>
                  <span className="text-xs text-gray-500">Start fresh</span>
                </div>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator className="bg-white/5 my-1" />
              
              <DropdownMenuItem 
                onClick={handleReportCharacter}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 cursor-pointer focus:bg-white/5 focus:text-white transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <Flag className="w-4 h-4 text-orange-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Report</span>
                  <span className="text-xs text-gray-500">Flag this character</span>
                </div>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator className="bg-white/5 my-1" />
              
              <DropdownMenuItem 
                onClick={handleDeleteConversation}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-500/10 cursor-pointer focus:bg-red-500/10 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <Trash2 className="w-4 h-4 text-red-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-red-400 group-hover:text-red-300">Delete Chat</span>
                  <span className="text-xs text-gray-500">Remove permanently</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Error Display */}
      <ErrorDisplay
        error={error}
        type={errorType}
        onRetry={handleRetry}
        onDismiss={() => setError(null)}
      />

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto relative custom-scrollbar">
        {/* Messages content */}
        <div className="relative z-10 p-4 space-y-4 min-h-full">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start gap-3 ${
              message.sender === "user" ? "flex-row-reverse" : ""
            }`}
          >
            {/* Avatar - only show for character messages */}
            {message.sender === "character" && renderAvatar()}

            <div className="flex flex-col w-full max-w-[60%]">
              <div
                className={`rounded-2xl px-5 py-3 shadow-sm ${
                  message.sender === "user"
                    ? "bg-primary text-primary-foreground rounded-br-none ml-auto"
                    : "bg-[#1a1d26] text-foreground rounded-bl-none border border-white/5 mr-auto"
                }`}
              >
                {message.sender === "character" && !message.content ? (
                  <div className="flex space-x-1 h-6 items-center">
                    <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                    <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  </div>
                ) : (
                  <p className="text-[15px] leading-7 tracking-wide font-medium">
                    <FormattedMessage content={message.content} />
                  </p>
                )}
              </div>
              
              <div
                className={`mt-1 text-xs text-muted-foreground flex items-center gap-1 ${
                  message.sender === "user" ? "justify-end" : ""
                }`}
              >
                <span>{formatTime(message.timestamp)}</span>
                {message.sender === "character" && (
                  <Button variant="ghost" size="sm" className="h-auto p-0 text-xs">
                    ↻
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {/* Remove the separate isTyping block since we handle it in the message list now */}

        <div ref={messagesEndRef} />
        </div> {/* 闭合 Messages content div */}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-white/10 bg-background/20 backdrop-blur-md z-20">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Write a message..."
              className="resize-none border-0 bg-white/5 focus-visible:ring-1 focus-visible:ring-white/20 rounded-xl shadow-inner text-white placeholder:text-white/40 h-12"
            />
          </div>

          <Button
            onClick={handleSend}
            disabled={!newMessage.trim()}
            size="icon"
            className="mb-2"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-2 text-xs text-muted-foreground text-center">
          Press Enter to send, Shift + Enter for new line
        </div>
      </div>

      {/* Generation Settings Modal */}
      <GenerationSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={generationSettings}
        onSettingsChange={handleSettingsChange}
      />

      {/* Insufficient Credits Dialog */}
      <InsufficientCreditsDialog
        isOpen={isCreditsDialogOpen}
        onClose={() => setIsCreditsDialogOpen(false)}
      />
    </div>
  );
}