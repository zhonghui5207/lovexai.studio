"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import ChatSidebar from "./ChatSidebar";
import ChatWindow from "./ChatWindow";
import CharacterPanel from "./CharacterPanel";

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
}

export default function ChatInterface({
  character,
  conversationId,
  conversations,
  onConversationSwitch,
  onNewChatWithCharacter,
  availableCharacters,
  onConversationsUpdate
}: ChatInterfaceProps) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(conversationId || null);

  // Cache messages for each conversation to enable instant switching
  const [messageCache, setMessageCache] = useState<Record<string, Message[]>>({});
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  // Update current conversation when prop changes
  useEffect(() => {
    if (conversationId !== currentConversationId) {
      setCurrentConversationId(conversationId || null);
    }
  }, [conversationId, currentConversationId]);

  // Initialize or switch conversation
  useEffect(() => {
    if (!session?.user?.id || !character.id) return;

    const handleConversation = async () => {
      // If we have a specific conversation ID, load it
      if (conversationId) {
        // Check if we have cached messages
        if (messageCache[conversationId]) {
          setMessages(messageCache[conversationId]);
          return;
        }

        // Load messages for existing conversation
        setLoadingStates(prev => ({ ...prev, [conversationId]: true }));
        try {
          const messagesResponse = await fetch(`/api/conversations/${conversationId}/messages`);
          if (messagesResponse.ok) {
            const messagesData = await messagesResponse.json();
            const formattedMessages = messagesData.data.map((msg: any) => ({
              id: msg.id,
              content: msg.content,
              sender: msg.sender_type === 'user' ? 'user' : 'character',
              timestamp: new Date(msg.created_at),
            }));

            // Cache the messages
            setMessageCache(prev => ({ ...prev, [conversationId]: formattedMessages }));
            setMessages(formattedMessages);
          }
        } catch (error) {
          console.error('Failed to load conversation history:', error);
        } finally {
          setLoadingStates(prev => ({ ...prev, [conversationId]: false }));
        }
      } else {
        // Create new conversation
        setMessages([]);
        setIsTyping(false);

        try {
          const response = await fetch('/api/conversations/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: session.user.id,
              characterId: character.id,
              title: `Chat with ${character.name}`
            })
          });

          if (response.ok) {
            const data = await response.json();
            const newConversationId = data.data.conversation.id;
            setCurrentConversationId(newConversationId);

            if (!data.data.isNewConversation) {
              // Load existing messages
              const messagesResponse = await fetch(`/api/conversations/${newConversationId}/messages`);
              if (messagesResponse.ok) {
                const messagesData = await messagesResponse.json();
                const formattedMessages = messagesData.data.map((msg: any) => ({
                  id: msg.id,
                  content: msg.content,
                  sender: msg.sender_type === 'user' ? 'user' : 'character',
                  timestamp: new Date(msg.created_at),
                }));
                setMessages(formattedMessages);
                setMessageCache(prev => ({ ...prev, [newConversationId]: formattedMessages }));
              }
            } else {
              // Set initial greeting for new conversation
              const greetingMessage = {
                id: data.data.greeting.id,
                content: data.data.greeting.content,
                sender: "character" as const,
                timestamp: new Date(data.data.greeting.created_at),
              };
              setMessages([greetingMessage]);
              setMessageCache(prev => ({ ...prev, [newConversationId]: [greetingMessage] }));
            }

            // Update conversations list
            refreshConversations();
          }
        } catch (error) {
          console.error('Failed to initialize conversation:', error);
        }
      }
    };

    handleConversation();
  }, [character.id, conversationId, session?.user?.id, messageCache]);

  // Refresh conversations list
  const refreshConversations = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch(`/api/conversations?userId=${session.user.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          onConversationsUpdate(data.data || []);
        }
      }
    } catch (error) {
      console.error('Failed to refresh conversations:', error);
    }
  }, [session?.user?.id, onConversationsUpdate]);

  // Handle new message
  const handleSendMessage = async (content: string, settings?: any) => {
    if (!session?.user?.id || !currentConversationId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: "user",
      timestamp: new Date(),
    };

    // Update messages immediately for responsive UI
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    // Update cache
    setMessageCache(prev => ({
      ...prev,
      [currentConversationId]: newMessages
    }));

    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: currentConversationId,
          content: content,
          userId: session.user.id,
          settings: settings // 添加设置参数
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');

      let assistantResponse = '';
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: '',
        sender: 'character',
        timestamp: new Date(),
      };

      // Add assistant message placeholder
      const messagesWithAssistant = [...newMessages, assistantMessage];
      setMessages(messagesWithAssistant);

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('0:')) {
              const data = line.slice(2); // 移除 '0:' 前缀
              try {
                const parsed = JSON.parse(data);
                if (parsed.finished) {
                  // 接收到结束信号，立即停止加载动画
                  setIsTyping(false);
                  break;
                } else if (parsed.textDelta) {  // 改为 textDelta
                  assistantResponse += parsed.textDelta;

                  // Update messages with streaming content
                  const updatedMessages = messagesWithAssistant.map(msg =>
                    msg.id === assistantMessage.id
                      ? { ...msg, content: assistantResponse }
                      : msg
                  );
                  setMessages(updatedMessages);

                  // Update cache
                  setMessageCache(prev => ({
                    ...prev,
                    [currentConversationId]: updatedMessages
                  }));
                }
              } catch (e) {
                // Ignore JSON parse errors for partial chunks
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      // Refresh conversations to update last message
      refreshConversations();

    } catch (error) {
      console.error('Error sending message:', error);
      // Revert optimistic update on error
      setMessages(messages);
      setMessageCache(prev => ({
        ...prev,
        [currentConversationId]: messages
      }));
    } finally {
      setIsTyping(false);
    }
  };

  const isLoading = currentConversationId ? loadingStates[currentConversationId] || false : false;

  return (
    <div className="flex h-screen bg-background">
      <ChatSidebar
        currentCharacterId={character.id}
        currentConversationId={currentConversationId}
        conversations={conversations}
        onConversationSwitch={onConversationSwitch}
        onNewChatWithCharacter={onNewChatWithCharacter}
        availableCharacters={availableCharacters}
      />
      <div className="flex-1 flex relative">
        {/* Fixed background image for main chat area only */}
        <div
          className="absolute inset-0 opacity-50 pointer-events-none transition-opacity duration-500"
          style={{
            backgroundImage: `url(${character.avatar_url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundAttachment: 'fixed',
            filter: 'blur(5px) contrast(1.1) brightness(0.8)',
            zIndex: 0,
          }}
        />

        {/* Content layer */}
        <div className="relative z-10 flex w-full">
          <ChatWindow
            messages={messages}
            onSendMessage={handleSendMessage}
            character={character}
            isTyping={isTyping}
            isLoading={isLoading}
          />
          <CharacterPanel character={character} />
        </div>
      </div>
    </div>
  );
}