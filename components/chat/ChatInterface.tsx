"use client";

import { useState, useEffect } from "react";
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
}

interface ChatInterfaceProps {
  character: Character;
  conversationId?: string;
}

export default function ChatInterface({ character, conversationId }: ChatInterfaceProps) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null); // 每次都重新初始化

  // Initialize conversation if not provided
  useEffect(() => {
    if (!session?.user?.id || !character.id) return;
    if (currentConversationId !== null) return; // 如果已有对话ID，不重新初始化

    const initializeConversation = async () => {
      // 每次都重新初始化对话
      setMessages([]); // 清空消息
      setIsTyping(false); // 重置状态

      try {
        console.log('Initializing conversation for character:', character.id);
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
          console.log('Conversation initialized:', data.data.conversation.id, 'isNew:', data.data.isNewConversation);
          setCurrentConversationId(data.data.conversation.id);

          // If it's an existing conversation, load all messages
          if (!data.data.isNewConversation) {
            // Load conversation history
            try {
              const messagesResponse = await fetch(`/api/conversations/${data.data.conversation.id}/messages`);
              if (messagesResponse.ok) {
                const messagesData = await messagesResponse.json();
                const formattedMessages = messagesData.data.map((msg: any) => ({
                  id: msg.id,
                  content: msg.content,
                  sender: msg.sender_type === 'user' ? 'user' : 'character',
                  timestamp: new Date(msg.created_at),
                }));
                console.log('Loaded', formattedMessages.length, 'existing messages');
                setMessages(formattedMessages);
              }
            } catch (error) {
              console.error('Failed to load conversation history:', error);
            }
          } else {
            // Set initial greeting message for new conversation
            setMessages([{
              id: data.data.greeting.id,
              content: data.data.greeting.content,
              sender: "character",
              timestamp: new Date(data.data.greeting.created_at),
            }]);
          }
        } else {
          console.error('Failed to create conversation:', await response.text());
        }
      } catch (error) {
        console.error('Failed to initialize conversation:', error);
      }
    };

    initializeConversation();
  }, [session?.user?.id, character.id, currentConversationId]); // 添加currentConversationId依赖

  const handleSendMessage = async (content: string, settings?: any) => {
    if (!session?.user?.id || !currentConversationId) {
      console.error('No user session or conversation ID');
      return;
    }

    console.log('Sending message with conversationId:', currentConversationId);

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId: currentConversationId,
          content,
          userId: session.user.id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        // 如果是对话不存在的错误，尝试重新初始化
        if (errorData.error === 'Conversation not found') {
          console.log('Conversation not found, reinitializing...');
          setCurrentConversationId(null); // 重置对话ID，触发重新初始化
          setMessages(prev => prev.slice(0, -1)); // 移除刚添加的用户消息
          setIsTyping(false);

          // 延迟一下再显示错误，让用户可以重新尝试
          setTimeout(() => {
            alert('Conversation expired. Please try sending your message again.');
          }, 100);
          return;
        }

        throw new Error(errorData.error || 'Failed to get response');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      let aiResponseContent = '';
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: '',
        sender: "character",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            // Stream finished, stop typing immediately
            setIsTyping(false);
            break;
          }

          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split('\n').filter(line => line.trim());

          for (const line of lines) {
            if (line.startsWith('0:')) {
              try {
                const jsonStr = line.slice(2);
                const data = JSON.parse(jsonStr);
                if (data.textDelta) {
                  aiResponseContent += data.textDelta;
                  setMessages(prev => prev.map(msg =>
                    msg.id === aiMessage.id
                      ? { ...msg, content: aiResponseContent }
                      : msg
                  ));
                }
              } catch (e) {
                console.error('Parse error:', e);
              }
            }
          }
        }
      } finally {
        // Ensure reader is properly closed
        try {
          reader.releaseLock();
        } catch (e) {
          console.error('Error releasing reader lock:', e);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      let errorMessage = "Sorry, I'm having trouble responding right now. Please try again.";

      // Handle specific error cases
      if (error instanceof Error) {
        if (error.message.includes('credits')) {
          errorMessage = "⭐ You don't have enough credits to send this message. Please purchase more credits to continue chatting.";
        } else if (error.message.includes('Access denied')) {
          errorMessage = "🔒 This character requires a higher subscription tier. Please upgrade to continue chatting.";
        } else if (error.message.includes('User not found')) {
          errorMessage = "Please log in to continue chatting.";
        }
      }

      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: errorMessage,
        sender: "character",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  // Show login prompt if no session
  if (!session) {
    return (
      <div className="flex h-screen bg-background items-center justify-center">
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

  return (
    <div className="flex h-screen bg-background relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={character.avatar_url}
          alt={character.name}
          className="w-full h-full object-cover opacity-40 blur-[1px]"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop&crop=face';
          }}
        />
        <div className="absolute inset-0 bg-background/40" />
      </div>

      {/* Left Sidebar - Chat List */}
      <div className="w-80 bg-background/90 backdrop-blur-sm border-r border-border flex-shrink-0 relative z-10">
        <ChatSidebar currentCharacterId={character.id} />
      </div>

      {/* Middle - Chat Window */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <ChatWindow
          character={character}
          messages={messages}
          onSendMessage={handleSendMessage}
          isTyping={isTyping}
        />
      </div>

      {/* Right Sidebar - Character Panel */}
      <div className="w-80 bg-background/90 backdrop-blur-sm border-l border-border flex-shrink-0 relative z-10">
        <CharacterPanel character={character} />
      </div>
    </div>
  );
}