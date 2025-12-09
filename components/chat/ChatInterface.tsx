"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import ChatSidebar from "./ChatSidebar";
import ChatWindow from "./ChatWindow";
import CharacterPanel from "./CharacterPanel";
import { CreditsProvider, useCredits } from "../../contexts/CreditsContext";
import { useQuery, useMutation, useAction } from "convex/react";
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
  greeting_message: string;
  chat_count: string;
  personality: string;
  age?: number;
  location?: string;
  access_level: string;
  credits_per_message: number;
  scenario?: string;
  current_state?: string;
  motivation?: string;
  background?: string;
  suggestions?: string;
  like_count?: number;
  favorite_count?: number;
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

interface ChatInterfaceProps {
  character: Character;
  conversationId?: string;
  conversations: Conversation[];
  onConversationSwitch: (conversation: Conversation) => void;
  onNewChatWithCharacter: (character: Character) => void;
  availableCharacters: Character[];
  onConversationsUpdate: (conversations: Conversation[]) => void;
  // Added for Convex
  convexUserId?: Id<"users"> | null;
}

export default function ChatInterfaceWrapper(props: ChatInterfaceProps) {
  return (
    <CreditsProvider userId={props.convexUserId}>
      <ChatInterface {...props} />
    </CreditsProvider>
  );
}

function ChatInterface({
  character,
  conversationId,
  conversations,
  onConversationSwitch,
  onNewChatWithCharacter,
  availableCharacters,
  convexUserId
}: ChatInterfaceProps) {
  const { updateCredits } = useCredits();
  // const [isTyping, setIsTyping] = useState(false); // Removed

  // Convex Hooks
  const rawMessages = useQuery(
    api.messages.list,
    conversationId && convexUserId
      ? { conversationId: conversationId as Id<"conversations">, userId: convexUserId }
      : "skip"
  );

  const sendMessage = useMutation(api.messages.send);
  const generateResponse = useAction(api.actions.generateResponse);

  // Transform messages
  const messages: Message[] = (rawMessages || []).map((m) => ({
    id: m._id,
    content: m.content,
    sender: m.sender_type as "user" | "character",
    timestamp: new Date(m._creationTime),
  }));

  // Handle Send
  const handleSendMessage = async (content: string) => {
    if (!conversationId || !convexUserId) return;

    try {
      // 1. Send User Message
      await sendMessage({
        conversationId: conversationId as Id<"conversations">,
        content,
        userId: convexUserId,
      });

      // 2. Trigger AI (Don't await to unblock UI)
      generateResponse({ conversationId: conversationId as Id<"conversations"> })
        .catch((error) => {
          console.error("Failed to generate response:", error);
        });

    } catch (error) {
      console.error("Failed to send message:", error);
      throw error; // Re-throw to prevent input clearing in ChatWindow
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <ChatSidebar
        currentCharacterId={character.id}
        currentConversationId={conversationId || null}
        conversations={conversations}
        onConversationSwitch={onConversationSwitch}
        onNewChatWithCharacter={onNewChatWithCharacter}
        availableCharacters={availableCharacters}
      />
      <div className="flex-1 flex relative">
        {/* Background */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-500"
          style={{
            backgroundImage: `url(${character.avatar_url})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            backgroundAttachment: "fixed",
            filter: "brightness(0.3)",
            zIndex: 0,
          }}
        />

        <div className="relative z-10 flex w-full">
          {/* Chat Window */}
          <div className="flex-1 min-w-0">
            <ChatWindow
              messages={messages}
              onSendMessage={handleSendMessage}
              character={character}
              // isTyping={isTyping} // Removed
              isLoading={rawMessages === undefined && !!conversationId}
              creditsPerMessage={character.credits_per_message}
              convexUserId={convexUserId}
            />
          </div>

          {/* Character Panel */}
          <div className="hidden lg:block lg:w-80 xl:w-96 z-20">
            <CharacterPanel
              character={character}
              onSuggestionClick={handleSendMessage}
              userId={convexUserId || undefined}
            />
          </div>
        </div>
      </div>
    </div>
  );
}