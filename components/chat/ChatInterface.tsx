"use client";

import { useState } from "react";
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
  avatar: string;
  description: string;
  traits: string[];
  greeting: string;
  chatCount: string;
  personality: string;
  age?: number;
  location?: string;
}

interface ChatInterfaceProps {
  character: Character;
}

export default function ChatInterface({ character }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: character.greeting,
      sender: "character",
      timestamp: new Date(),
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = async (content: string, settings?: any) => {
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
          messages: [...messages, userMessage],
          character,
          settings: settings || {
            responseLength: "default",
            includeNarrator: false,
            selectedModel: "nectar_basic"
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
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
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I'm having trouble responding right now. Please try again.",
        sender: "character",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex h-screen bg-background relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={character.avatar}
          alt={character.name}
          className="w-full h-full object-cover opacity-10 blur-sm"
        />
        <div className="absolute inset-0 bg-background/80" />
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