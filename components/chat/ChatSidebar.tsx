"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { MessageCircle, Search, Plus, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserConversation {
  id: string;
  characterId: string;
  characterName: string;
  characterAvatar: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
}

interface Character {
  id: string;
  name: string;
  username?: string;
  avatar_url: string;
  description: string;
  traits: string[];
  greeting_message: string;
  chat_count: string;
  personality: string;
  age?: number;
  location?: string;
  access_level: string;
  credits_per_message: number;
}

interface ChatSidebarProps {
  currentCharacterId: string;
  currentConversationId: string | null;
  conversations: UserConversation[];
  onConversationSwitch: (conversation: UserConversation) => void;
  onNewChatWithCharacter: (character: Character) => void;
  availableCharacters: Character[];
}

export default function ChatSidebar({
  currentCharacterId,
  currentConversationId,
  conversations,
  onConversationSwitch,
  onNewChatWithCharacter,
  availableCharacters
}: ChatSidebarProps) {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredConversations = (conversations || []).filter(conv =>
    conv.characterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (conv.lastMessage && conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatTimeAgo = (timeString?: string) => {
    if (!timeString) return "";

    const date = new Date(timeString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const handleConversationClick = (conversation: UserConversation) => {
    onConversationSwitch(conversation);
  };

  const handleNewChatClick = (character: Character) => {
    onNewChatWithCharacter(character);
  };

  if (!session) {
    return (
      <div className="w-80 bg-muted/30 border-r border-border flex items-center justify-center p-6">
        <div className="text-center text-muted-foreground">
          <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Please log in to see your conversations</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-muted/30 border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Conversations</h2>

          {/* New Chat Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                <Plus className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              {availableCharacters.map((character) => (
                <DropdownMenuItem
                  key={character.id}
                  onClick={() => handleNewChatClick(character)}
                  className="flex items-center gap-3 p-3"
                >
                  <img
                    src={character.avatar_url}
                    alt={character.name}
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iMTYiIGZpbGw9IiNGM0Y0RjYiLz4KPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDE2IDE2IiBmaWxsPSIjOUNBM0FGIj48cGF0aCBkPSJNOCA4YzEuMSAwIDItLjkgMi0ycy0uOS0yLTItMi0yIC45LTIgMiAuOSAyIDIgMnoiLz48cGF0aCBkPSJNOCAxNGMtMi4yIDAtNCAxLjgtNCA0djFoOHYtMWMwLTIuMi0xLjgtNC00LTR6Ii8+PC9zdmc+Cjwvc3ZnPgo=';
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{character.name}</p>
                      {character.access_level === 'premium' && (
                        <Badge variant="secondary" className="text-xs">Pro</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {character.description}
                    </p>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            {searchQuery ? (
              <>
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No conversations match your search</p>
              </>
            ) : (
              <>
                <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="mb-2">No conversations yet</p>
                <p className="text-sm">Start a new chat with a character</p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredConversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => handleConversationClick(conversation)}
                className={`w-full text-left p-3 rounded-lg transition-all duration-200 hover:bg-muted/50 ${
                  conversation.id === currentConversationId
                    ? 'bg-primary/10 border border-primary/20'
                    : 'hover:bg-muted'
                }`}
              >
                <div className="flex items-start gap-3">
                  <img
                    src={conversation.characterAvatar}
                    alt={conversation.characterName}
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iMjAiIGZpbGw9IiNGM0Y0RjYiLz4KPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDIwIDIwIiBmaWxsPSIjOUNBM0FGIj48cGF0aCBkPSJNMTAgMTBjMS4xIDAgMi0uOSAyLTJzLS45LTItMi0yLTIgLjktMiAyIC45IDIgMiAyeiIvPjxwYXRoIGQ9Ik0xMCAxNmMtMi4yIDAtNCAxLjgtNCA0djFoMTB2LTFjMC0yLjItMS44LTQtNC00eiIvPjwvc3ZnPgo8L3N2Zz4K';
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-sm truncate">
                        {conversation.characterName}
                      </h3>
                      <div className="flex items-center gap-1">
                        {conversation.unreadCount > 0 && (
                          <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                            {conversation.unreadCount}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {formatTimeAgo(conversation.lastMessageTime)}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {conversation.lastMessage || "No messages yet"}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="font-medium text-sm">{session.user?.name || session.user?.email}</p>
            <p className="text-xs text-muted-foreground">
              {(conversations || []).length} conversation{(conversations || []).length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
            <User className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}