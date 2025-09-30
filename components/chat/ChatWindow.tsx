"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Send, Smile, MoreVertical, ArrowLeft, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import GenerationSettingsModal from "./GenerationSettingsModal";
import FormattedMessage from "./FormattedMessage";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
}

interface GenerationSettings {
  responseLength: "short" | "default" | "long";
  includeNarrator: boolean;
  narratorVoice: string;
  selectedModel: string;
}

interface ChatWindowProps {
  character: Character;
  messages: Message[];
  onSendMessage: (content: string, settings?: GenerationSettings) => void;
  isTyping?: boolean;
}

export default function ChatWindow({ character, messages, onSendMessage, isTyping = false }: ChatWindowProps) {
  const [newMessage, setNewMessage] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [generationSettings, setGenerationSettings] = useState<GenerationSettings>({
    responseLength: "default",
    includeNarrator: true,
    narratorVoice: "male",
    selectedModel: "nectar_basic"
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // 预加载并缓存头像，避免重复加载
  const [avatarLoaded, setAvatarLoaded] = useState(false);
  const avatarImageRef = useRef<HTMLImageElement | null>(null);

  // 预创建头像元素
  useEffect(() => {
    const img = new Image();
    img.src = character.avatar_url;
    img.onload = () => {
      setAvatarLoaded(true);
      avatarImageRef.current = img;
    };
    img.onerror = () => {
      const fallbackImg = new Image();
      fallbackImg.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop&crop=face';
      fallbackImg.onload = () => {
        setAvatarLoaded(true);
        avatarImageRef.current = fallbackImg;
      };
    };
  }, [character.avatar_url]);

  // 渲染缓存的头像
  const renderAvatar = () => (
    <div className="relative flex-shrink-0">
      <img
        src={avatarLoaded ? (avatarImageRef.current?.src || character.avatar_url) : character.avatar_url}
        alt={character.name}
        className="w-8 h-8 rounded-full object-cover"
        style={{
          imageRendering: 'optimizeSpeed',
          transform: 'translateZ(0)',
          opacity: avatarLoaded ? 1 : 0.8
        }}
        loading="eager"
        decoding="sync"
      />
    </div>
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim(), generationSettings);
      setNewMessage("");
    }
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
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-background">
        {/* Left side - Back button and character info */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/")}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="relative">
            <img
              src={character.avatar_url}
              alt={character.name}
              className="w-10 h-10 rounded-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop&crop=face';
              }}
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
          </div>
          <div>
            <h3 className="font-semibold">{character.name}</h3>
            <p className="text-sm text-muted-foreground">
              {character.chatCount} chats • Online
            </p>
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="text-xs flex items-center gap-1 cursor-pointer hover:bg-muted"
            onClick={() => setIsSettingsOpen(true)}
          >
            <Settings className="h-3 w-3" />
            Basic Roleplay
          </Badge>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem className="text-white bg-red-500 hover:bg-red-600">
                ↑ Upgrade Experience
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                👤 Change Persona
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsSettingsOpen(true)}>
                ⚙️ Generation Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                📁 Archive Conversation
              </DropdownMenuItem>
              <DropdownMenuItem>
                🔄 Reset Conversation
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                🚩 Report
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                🗑️ Delete Conversation
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto relative">
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

            <div
              className={`max-w-[70%] ${
                message.sender === "user" ? "text-right" : ""
              }`}
            >
              <div
                className={`rounded-2xl px-4 py-2 ${
                  message.sender === "user"
                    ? "bg-primary text-primary-foreground ml-auto"
                    : "bg-muted"
                }`}
              >
                <p className="text-sm leading-relaxed">
                  <FormattedMessage content={message.content} />
                </p>
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

        {isTyping && (
          <div className="flex items-start gap-3">
            {renderAvatar()}
            <div className="bg-muted rounded-2xl px-4 py-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
        </div> {/* 闭合 Messages content div */}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-border bg-background">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Write a message..."
              className="resize-none border-0 bg-muted focus-visible:ring-1"
            />
          </div>

          <Button variant="ghost" size="icon" className="mb-2">
            <Smile className="h-4 w-4" />
          </Button>

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
        onSettingsChange={setGenerationSettings}
      />
    </div>
  );
}