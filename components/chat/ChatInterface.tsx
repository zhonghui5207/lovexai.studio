"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ChatSidebar from "./ChatSidebar";
import ChatWindow from "./ChatWindow";
import CharacterPanel from "./CharacterPanel";
import { CreditsProvider, useCredits } from "../../contexts/CreditsContext";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import Header from "@/components/blocks/header";

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
  const router = useRouter();
  const { updateCredits } = useCredits();

  // Mobile drawer states
  const [isConversationsOpen, setIsConversationsOpen] = useState(false);
  const [isCharacterPanelOpen, setIsCharacterPanelOpen] = useState(false);

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
  const handleSendMessage = async (content: string, settings?: {
    creativity: string;
    responseLength: string;
    selectedModel: string;
  }) => {
    if (!conversationId || !convexUserId) return;

    try {
      // 1. Send User Message
      await sendMessage({
        conversationId: conversationId as Id<"conversations">,
        content,
        userId: convexUserId,
      });

      // 2. Trigger AI with user settings (Don't await to unblock UI)
      generateResponse({ 
        conversationId: conversationId as Id<"conversations">,
        settings: settings,
      })
        .catch((error) => {
          console.error("Failed to generate response:", error);
        });

    } catch (error) {
      console.error("Failed to send message:", error);
      throw error; // Re-throw to prevent input clearing in ChatWindow
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Mobile Header - Same as homepage */}
      <div className="md:hidden">
        <Header header={{
          brand: { title: "LOVEXAI", url: "/" },
          show_sign: true,
          show_locale: false,
          disabled: false
        }} />
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="hidden md:flex">
          <ChatSidebar
            currentCharacterId={character.id}
            currentConversationId={conversationId || null}
            conversations={conversations}
            onConversationSwitch={onConversationSwitch}
            onNewChatWithCharacter={onNewChatWithCharacter}
            availableCharacters={availableCharacters}
          />
        </div>
        <div className="flex-1 flex relative">
        {/* Background */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-500"
          style={{
            backgroundImage: `url(${character.avatar_url})`,
            backgroundSize: "cover",
            backgroundPosition: "center 25%",
            backgroundRepeat: "no-repeat",
            backgroundAttachment: "fixed",
            filter: "brightness(0.15) blur(8px)",
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
              isLoading={rawMessages === undefined && !!conversationId}
              creditsPerMessage={character.credits_per_message}
              convexUserId={convexUserId}
              conversationId={conversationId as any}
              onConversationDeleted={() => {
                console.log("[Delete Callback] Current conversationId:", conversationId);
                console.log("[Delete Callback] All conversations:", conversations);

                // Find another conversation to switch to
                const otherConversation = conversations.find(c => c.id !== conversationId);
                console.log("[Delete Callback] Found other conversation:", otherConversation);

                if (otherConversation) {
                  console.log("[Delete Callback] Switching to:", otherConversation.id);
                  onConversationSwitch(otherConversation);
                } else {
                  console.log("[Delete Callback] No other conversations, going to discover");
                  // No other conversations, go to discover
                  router.push('/discover');
                }
              }}
              onOpenConversations={() => setIsConversationsOpen(true)}
              onOpenCharacterPanel={() => setIsCharacterPanelOpen(true)}
            />
          </div>

          {/* Character Panel - Desktop */}
          <div className="hidden lg:block lg:w-80 xl:w-96 z-20">
            <CharacterPanel
              character={character}
              onSuggestionClick={handleSendMessage}
              userId={convexUserId || undefined}
            />
          </div>
        </div>

        {/* Mobile Conversations Drawer */}
        <Sheet open={isConversationsOpen} onOpenChange={setIsConversationsOpen}>
          <SheetContent side="left" className="w-full max-w-none p-0 bg-background/98 backdrop-blur-xl border-r border-white/10">
            <SheetTitle className="sr-only">Conversations</SheetTitle>
            <ChatSidebar
              currentCharacterId={character.id}
              currentConversationId={conversationId || null}
              conversations={conversations}
              onConversationSwitch={(conv) => {
                setIsConversationsOpen(false);
                onConversationSwitch(conv);
              }}
              onNewChatWithCharacter={(char) => {
                setIsConversationsOpen(false);
                onNewChatWithCharacter(char);
              }}
              availableCharacters={availableCharacters}
            />
          </SheetContent>
        </Sheet>

        {/* Mobile Character Panel Drawer */}
        <Sheet open={isCharacterPanelOpen} onOpenChange={setIsCharacterPanelOpen}>
          <SheetContent side="right" className="w-full max-w-[320px] p-0 bg-background/98 backdrop-blur-xl border-l border-white/10">
            <SheetTitle className="sr-only">Character Info</SheetTitle>
            <CharacterPanel
              character={character}
              onSuggestionClick={(content) => {
                setIsCharacterPanelOpen(false);
                handleSendMessage(content);
              }}
              userId={convexUserId || undefined}
            />
          </SheetContent>
        </Sheet>
        </div>
      </div>
    </div>
  );
}