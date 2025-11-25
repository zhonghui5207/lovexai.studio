"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Send, Smile, MoreVertical, ArrowLeft, Settings, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
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
  includeNarrator: boolean;
  narratorVoice: string;
  selectedModel: string;
}

interface ChatWindowProps {
  character: Character;
  messages: Message[];
  onSendMessage: (content: string, settings?: GenerationSettings) => void;
  isTyping?: boolean;
  isLoading?: boolean;
  creditsPerMessage?: number;
}

export default function ChatWindow({ character, messages, onSendMessage, isTyping = false, isLoading = false, creditsPerMessage = 1 }: ChatWindowProps) {
  const { data: session } = useSession();
  const [newMessage, setNewMessage] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'network' | 'server' | 'credits' | 'permission' | 'general' | 'timeout' | 'empty_message'>('general');
  const [generationSettings, setGenerationSettings] = useState<GenerationSettings>({
    responseLength: "default",
    includeNarrator: true,
    narratorVoice: "male",
    selectedModel: "nectar_basic"
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

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

  const handleSend = async () => {
    if (!newMessage.trim()) {
      setError("Message cannot be empty. Please type something before sending.");
      setErrorType('empty_message');
      return;
    }

    // 清除之前的错误
    setError(null);

    // 发送消息
    try {
      await onSendMessage(newMessage.trim(), generationSettings);
      setNewMessage("");
    } catch (error: any) {
      console.error('Error sending message:', error);

      // 解析错误类型
      if (error.status === 402) {
        setError('Insufficient credits! Please top up your account to continue chatting.');
        setErrorType('credits');
      } else if (error.status === 403) {
        setError('Access denied. Please upgrade your subscription to chat with this character.');
        setErrorType('permission');
      } else if (error.status >= 500) {
        setError('Server error occurred. Please try again in a moment.');
        setErrorType('server');
      } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setError('Network connection failed. Please check your internet connection.');
        setErrorType('network');
      } else if (error.name === 'AbortError') {
        setError('Request timeout. Please try again.');
        setErrorType('timeout');
      } else {
        setError('Failed to send message. Please try again.');
        setErrorType('general');
      }
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
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/20 backdrop-blur-md z-20">
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
              {character.chat_count} chats • Online
            </p>
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          <div className="bg-secondary/50 px-3 py-1 rounded-md flex items-center gap-1">
            <CreditDisplay creditsPerMessage={creditsPerMessage} simpleMode={true} />
          </div>
          
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

  
      {/* Credit Display (Old - Removed) */}
      {/* <CreditDisplay creditsPerMessage={creditsPerMessage} /> */}

      {/* Error Display */}
      <ErrorDisplay
        error={error}
        type={errorType}
        onRetry={handleRetry}
        onDismiss={() => setError(null)}
      />

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
                className={`rounded-2xl px-4 py-3 shadow-sm backdrop-blur-sm ${
                  message.sender === "user"
                    ? "bg-primary/80 text-white ml-auto border border-primary/20"
                    : "bg-black/40 border border-white/5 text-white/90"
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
            <div className="bg-black/40 backdrop-blur-sm border border-white/5 rounded-2xl px-4 py-3 shadow-sm">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
        </div> {/* 闭合 Messages content div */}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-white/10 bg-black/20 backdrop-blur-md z-20">
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