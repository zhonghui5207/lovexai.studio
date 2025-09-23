"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { MessageCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface UserConversation {
  id: string;
  characterId: string;
  characterName: string;
  characterAvatar: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
}

interface ChatSidebarProps {
  currentCharacterId: string;
}

export default function ChatSidebar({ currentCharacterId }: ChatSidebarProps) {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [conversations, setConversations] = useState<UserConversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.id) {
      setConversations([]);
      setLoading(false);
      return;
    }

    const fetchUserConversations = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/conversations?userId=${session.user.id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setConversations(data.data || []);
          }
        }
      } catch (error) {
        console.error('Failed to fetch conversations:', error);
        setConversations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUserConversations();
  }, [session?.user?.id]);

  const filteredChats = conversations.filter(chat =>
    chat.characterName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTimeAgo = (dateString?: string) => {
    if (!dateString) return '';
    const now = new Date();
    const messageTime = new Date(dateString);
    const diffMs = now.getTime() - messageTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return diffMins < 1 ? 'now' : `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${diffDays}d`;
  };

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
        {loading ? (
          <div className="p-4 text-center text-muted-foreground">
            Loading conversations...
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            {searchQuery ? 'No conversations match your search.' : 'No conversations yet. Start a chat with a character!'}
          </div>
        ) : (
          filteredChats.map((chat) => (
            <Link
              key={chat.id}
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
                      src={chat.characterAvatar}
                      alt={chat.characterName}
                      className="w-12 h-12 rounded-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop&crop=face';
                      }}
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-background"></div>
                  </div>

                  {/* Chat Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-sm truncate">{chat.characterName}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {formatTimeAgo(chat.lastMessageTime)}
                        </span>
                        {chat.unreadCount > 0 && (
                          <Badge variant="destructive" className="h-5 min-w-5 text-xs flex items-center justify-center px-1">
                            {chat.unreadCount > 9 ? "9+" : chat.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-tight">
                      {chat.lastMessage || 'No messages yet'}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}