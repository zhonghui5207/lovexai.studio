"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

// Mock chat data - replace with real data later
const CHAT_LIST = [
  {
    characterId: "emma_001",
    name: "Emma",
    avatar: "https://cdn.lovexai.studio/Character/ComfyUI_00015_.png",
    lastMessage: "Hey there... I was wondering when you'd finally notice me 😉",
    timestamp: "2m",
    unreadCount: 2,
    isOnline: true
  },
  {
    characterId: "sophia_002",
    name: "Sophia",
    avatar: "https://cdn.lovexai.studio/Character/ComfyUI_00020_.png",
    lastMessage: "Hello! How was your day? I'm here if you need someone to talk to.",
    timestamp: "1h",
    unreadCount: 0,
    isOnline: true
  },
  {
    characterId: "luna_003",
    name: "Luna",
    avatar: "https://cdn.lovexai.studio/Character/ComfyUI_00027_.png",
    lastMessage: "You're mine and I'm yours, forever...",
    timestamp: "3h",
    unreadCount: 5,
    isOnline: false
  },
  {
    characterId: "zoe_008",
    name: "Zoe",
    avatar: "https://cdn.lovexai.studio/Character/flux_krea_00004_.png",
    lastMessage: "Art speaks what words cannot... want to create something beautiful together?",
    timestamp: "1d",
    unreadCount: 0,
    isOnline: true
  },
];

interface ChatSidebarProps {
  currentCharacterId: string;
}

export default function ChatSidebar({ currentCharacterId }: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredChats = CHAT_LIST.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Chats</h2>
          <MessageCircle className="h-5 w-5 text-muted-foreground" />
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.map((chat) => (
          <Link
            key={chat.characterId}
            href={`/chat/${chat.characterId}`}
            className={`block border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors ${
              currentCharacterId === chat.characterId ? "bg-muted" : ""
            }`}
          >
            <div className="p-4">
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <img
                    src={chat.avatar}
                    alt={chat.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  {chat.isOnline && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-background"></div>
                  )}
                </div>

                {/* Chat Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-sm truncate">{chat.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{chat.timestamp}</span>
                      {chat.unreadCount > 0 && (
                        <Badge variant="destructive" className="h-5 min-w-5 text-xs flex items-center justify-center px-1">
                          {chat.unreadCount > 9 ? "9+" : chat.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 leading-tight">
                    {chat.lastMessage}
                  </p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}