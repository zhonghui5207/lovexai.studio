"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import ChatInterface from "@/components/chat/ChatInterface";
import LoadingHeartbeat from "@/components/ui/LoadingHeartbeat";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Image from "next/image";

// Types expected by ChatInterface
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

interface Conversation {
  id: string;
  characterId: string;
  characterName: string;
  characterAvatar: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
}

export default function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationIdParam = searchParams.get('c');

  const [convexUserId, setConvexUserId] = useState<Id<"users"> | null>(null);
  const ensureUser = useMutation(api.users.ensureUser);
  const createConversation = useMutation(api.conversations.create);

  // 1. Sync User with Convex
  useEffect(() => {
    if (session?.user?.id && !convexUserId) {
      ensureUser({
        legacyId: session.user.id,
        email: session.user.email || "",
        name: session.user.name || "User",
        avatar_url: session.user.image || "",
      })
        .then((id) => setConvexUserId(id))
        .catch((err) => console.error("Failed to sync user:", err));
    }
  }, [session, convexUserId, ensureUser]);

  // 2. Fetch Data
  const rawCharacters = useQuery(api.characters.list, { activeOnly: true });
  const rawConversations = useQuery(api.conversations.list, { userId: convexUserId ?? undefined });

  // 3. Transform Data
  const characters: Character[] = useMemo(() => {
    return (rawCharacters || []).map((c) => ({
      id: c._id,
      name: c.name,
      username: c.username,
      avatar_url: c.avatar_url || "",
      description: c.description,
      traits: c.traits || [],
      greeting_message: c.greeting_message,
      chat_count: c.chat_count,
      personality: c.personality,
      access_level: c.access_level,
      credits_per_message: c.credits_per_message,
    }));
  }, [rawCharacters]);

  const conversations: Conversation[] = useMemo(() => {
    return (rawConversations || []).map((c: any) => ({
      id: c._id,
      characterId: c.character_id,
      characterName: c.character?.name || "Unknown",
      characterAvatar: c.character?.avatar_url || "",
      lastMessage: "Click to view messages", // We could fetch last message content if needed
      lastMessageTime: c.last_message_at,
      unreadCount: 0,
    }));
  }, [rawConversations]);

  // 4. Determine Current State
  const currentConversation = useMemo(() => {
    if (!conversationIdParam) return conversations[0] || null;
    return conversations.find((c) => c.id === conversationIdParam) || null;
  }, [conversations, conversationIdParam]);

  const currentCharacter = useMemo(() => {
    if (!currentConversation) return null;
    return characters.find((c) => c.id === currentConversation.characterId) || null;
  }, [currentConversation, characters]);

  // 5. Handlers
  const switchToConversation = (conversation: Conversation) => {
    router.push(`/chat?c=${conversation.id}`);
  };

  const startNewChatWithCharacter = async (character: Character) => {
    if (!convexUserId) return;
    try {
      const conversationId = await createConversation({
        characterId: character.id as Id<"characters">,
        userId: convexUserId,
      });
      router.push(`/chat?c=${conversationId}`);
    } catch (error) {
      console.error("Failed to create conversation:", error);
    }
  };

  const handleConversationsUpdate = () => {
    // No-op: Convex updates automatically
  };

  // 6. Render States
  if (status === "loading" || (session && !convexUserId) || rawConversations === undefined || rawCharacters === undefined) {
    return <LoadingHeartbeat />;
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Please log in to start chatting</h2>
          <button
            onClick={() => window.location.href = '/api/auth/signin'}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  // Character Selection (No active conversation)
  if (!currentConversation && characters.length > 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-2xl mx-auto p-6">
          <h1 className="text-3xl font-bold mb-4">Welcome to LoveXAI Studio</h1>
          <p className="text-muted-foreground mb-8">
            Choose a character to start your first conversation
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {characters.map((character) => (
              <button
                key={character.id}
                onClick={() => startNewChatWithCharacter(character)}
                className="p-6 rounded-lg border border-border hover:border-primary/50 transition-all duration-200 text-left"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden">
                    <Image
                      src={character.avatar_url}
                      alt={character.name}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold">{character.name}</h3>
                    <p className="text-sm text-muted-foreground">{character.chat_count}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{character.description}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!currentCharacter) {
    return <LoadingHeartbeat />;
  }

  return (
    <div className="h-screen bg-background">
      <ChatInterface
        character={currentCharacter}
        conversationId={currentConversation?.id}
        conversations={conversations}
        onConversationSwitch={switchToConversation}
        onNewChatWithCharacter={startNewChatWithCharacter}
        availableCharacters={characters}
        onConversationsUpdate={handleConversationsUpdate}
        convexUserId={convexUserId}
      />
    </div>
  );
}