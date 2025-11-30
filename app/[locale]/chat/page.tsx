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
  // Added fields for CharacterPanel
  suggestions?: string;
  background?: string;
  scenario?: string;
  current_state?: string;
  motivation?: string;
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
  const conversationIdParam = searchParams.get('c') as Id<"conversations"> | null;

  const [convexUserId, setConvexUserId] = useState<Id<"users"> | null>(null);
  const ensureUser = useMutation(api.users.ensureUser);
  const createConversation = useMutation(api.conversations.create);

  // 1. Sync User with Convex
  useEffect(() => {
    if (session?.user?.id && !convexUserId) {
      ensureUser({
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

  // Fetch specific conversation directly (handles race conditions where list isn't updated yet)
  // Skip if convexUserId is not yet available to avoid unauthorized error
  const directConversation = useQuery(api.conversations.get, 
    conversationIdParam && convexUserId ? { id: conversationIdParam, userId: convexUserId } : "skip"
  );

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
      suggestions: c.suggestions,
      background: c.background,
      scenario: c.scenario,
      current_state: c.current_state,
      motivation: c.motivation,
    }));
  }, [rawCharacters]);

  const conversations: Conversation[] = useMemo(() => {
    return (rawConversations || []).map((c: any) => ({
      id: c._id,
      characterId: c.character_id,
      characterName: c.character?.name || "Unknown",
      characterAvatar: c.character?.avatar_url || "",
      lastMessage: "Click to view messages",
      lastMessageTime: c.last_message_at,
      unreadCount: 0,
    }));
  }, [rawConversations]);

  // 4. Determine Current State
  const currentConversation = useMemo(() => {
    if (!conversationIdParam) return conversations[0] || null;
    
    // Try to find in list first
    const foundInList = conversations.find((c) => c.id === conversationIdParam);
    if (foundInList) return foundInList;

    // If not in list, try direct fetch result
    if (directConversation) {
      return {
        id: directConversation._id,
        characterId: directConversation.character_id,
        characterName: directConversation.character?.name || "Unknown",
        characterAvatar: directConversation.character?.avatar_url || "",
        lastMessage: "Click to view messages",
        lastMessageTime: directConversation.last_message_at,
        unreadCount: 0,
      };
    }
    
    return null;
  }, [conversations, conversationIdParam, directConversation]);

  const currentCharacter = useMemo(() => {
    if (!currentConversation) return null;
    // Try to find in loaded characters list
    const foundChar = characters.find((c) => c.id === currentConversation.characterId);
    if (foundChar) return foundChar;
    
    // If not in list but we have direct conversation with character data
    if (directConversation && directConversation.character && directConversation.character._id === currentConversation.characterId) {
       const c = directConversation.character;
       return {
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
          suggestions: c.suggestions,
          background: c.background,
          scenario: c.scenario,
          current_state: c.current_state,
          motivation: c.motivation,
       };
    }
    
    return null;
  }, [currentConversation, characters, directConversation]);
  
  // 5. Redirect Logic
  const isConversationNotFound = conversationIdParam && rawConversations !== undefined && directConversation === null;
  const noActiveConversation = !currentConversation && !conversationIdParam && characters.length > 0;

  useEffect(() => {
    // Only redirect if we are NOT loading
    // We need to check loading state here because these variables depend on data being loaded
    const isLoading = status === "loading" || (session && !convexUserId) || rawConversations === undefined || rawCharacters === undefined;
    
    if (!isLoading && (isConversationNotFound || noActiveConversation)) {
      router.push('/discover');
    }
  }, [isConversationNotFound, noActiveConversation, router, status, session, convexUserId, rawConversations, rawCharacters]);

  // 6. Handlers
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