"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import ChatInterface from "@/components/chat/ChatInterface";

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

export default function ConversationPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const conversationId = params.conversationId as string;

  const [character, setCharacter] = useState<Character | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [availableCharacters, setAvailableCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load conversation data
  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user?.id || !conversationId) return;

    const loadConversationData = async () => {
      try {
        setLoading(true);

        // Load conversations, characters, and specific conversation details in parallel
        const [conversationsRes, charactersRes, conversationRes] = await Promise.all([
          fetch(`/api/conversations?userId=${session.user.id}`),
          fetch(`/api/characters?userId=${session.user.id}`),
          fetch(`/api/conversations/${conversationId}`)
        ]);

        // Handle conversations
        if (conversationsRes.ok) {
          const conversationsData = await conversationsRes.json();
          if (conversationsData.success) {
            setConversations(conversationsData.data || []);
          }
        }

        // Handle characters
        if (charactersRes.ok) {
          const charactersData = await charactersRes.json();
          if (charactersData.success) {
            setAvailableCharacters(charactersData.data || []);
          }
        }

        // Handle specific conversation
        if (conversationRes.ok) {
          const conversationData = await conversationRes.json();
          if (conversationData.success) {
            const conv = conversationData.data;

            // Find the character for this conversation
            if (charactersRes.ok) {
              const charactersData = await charactersRes.json();
              if (charactersData.success) {
                const foundCharacter = charactersData.data.find((c: Character) => c.id === conv.character_id);
                if (foundCharacter) {
                  setCharacter(foundCharacter);
                } else {
                  setError('Character not found or access denied');
                }
              }
            }
          } else {
            setError('Conversation not found');
          }
        } else {
          setError('Failed to load conversation');
        }
      } catch (err) {
        console.error('Error loading conversation:', err);
        setError('Failed to load conversation');
      } finally {
        setLoading(false);
      }
    };

    loadConversationData();
  }, [conversationId, session, status]);

  // Handle conversation switching with URL update
  const switchToConversation = useCallback((conversation: Conversation) => {
    router.push(`/chat/${conversation.id}`);
  }, [router]);

  // Handle starting new chat with character
  const startNewChatWithCharacter = useCallback(async (selectedCharacter: Character) => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch('/api/conversations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session.user.id,
          characterId: selectedCharacter.id,
          title: `Chat with ${selectedCharacter.name}`
        })
      });

      if (response.ok) {
        const data = await response.json();
        const newConversationId = data.data.conversation.id;
        router.push(`/chat/${newConversationId}`);
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  }, [session?.user?.id, router]);

  // Update conversations list
  const handleConversationsUpdate = useCallback((updatedConversations: Conversation[]) => {
    setConversations(updatedConversations);
  }, []);

  // Show loading while checking authentication
  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Show login prompt if not authenticated
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

  // Show error if conversation loading failed
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Error</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => router.push('/chat')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
          >
            Go to Chat Home
          </button>
        </div>
      </div>
    );
  }

  // Show error if character not found
  if (!character) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Character not found</h2>
          <p className="text-muted-foreground mb-4">
            The character for this conversation doesn't exist or you don't have access to it.
          </p>
          <button
            onClick={() => router.push('/chat')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
          >
            Go to Chat Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background">
      <ChatInterface
        character={character}
        conversationId={conversationId}
        conversations={conversations}
        onConversationSwitch={switchToConversation}
        onNewChatWithCharacter={startNewChatWithCharacter}
        availableCharacters={availableCharacters}
        onConversationsUpdate={handleConversationsUpdate}
      />
    </div>
  );
}