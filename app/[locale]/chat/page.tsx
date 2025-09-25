"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
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

export default function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationId = searchParams.get('c'); // /chat?c=conversation-id

  const [characters, setCharacters] = useState<Character[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [currentCharacter, setCurrentCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 预加载所有数据
  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user?.id) return;

    const loadAllData = async () => {
      try {
        setLoading(true);

        // 并行加载所有数据
        const [conversationsRes, charactersRes] = await Promise.all([
          fetch(`/api/conversations?userId=${session.user.id}`),
          fetch(`/api/characters?userId=${session.user.id}`)
        ]);

        let loadedConversations: Conversation[] = [];
        let loadedCharacters: Character[] = [];

        // 处理对话数据
        if (conversationsRes.ok) {
          const conversationsData = await conversationsRes.json();
          if (conversationsData.success) {
            loadedConversations = conversationsData.data || [];
            setConversations(loadedConversations);
          }
        }

        // 处理角色数据
        if (charactersRes.ok) {
          const charactersData = await charactersRes.json();
          if (charactersData.success) {
            loadedCharacters = charactersData.data || [];
            setCharacters(loadedCharacters);
          }
        }

        // 根据URL参数选择当前对话
        if (conversationId && loadedConversations.length > 0) {
          const targetConversation = loadedConversations.find(c => c.id === conversationId);
          if (targetConversation) {
            setCurrentConversation(targetConversation);
            const character = loadedCharacters.find(c => c.id === targetConversation.characterId);
            if (character) {
              setCurrentCharacter(character);
            }
          } else {
            // 对话不存在，跳转到最新对话或角色选择
            if (loadedConversations.length > 0) {
              const latest = loadedConversations[0];
              router.replace(`/chat?c=${latest.id}`);
            }
          }
        } else if (loadedConversations.length > 0) {
          // 没有指定对话ID，选择最新的对话
          const latest = loadedConversations[0];
          setCurrentConversation(latest);
          const character = loadedCharacters.find(c => c.id === latest.characterId);
          if (character) {
            setCurrentCharacter(character);
          }
          // 更新URL但不刷新页面
          router.replace(`/chat?c=${latest.id}`, { shallow: true });
        }

      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load chat data');
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, [session, status]);

  // 监听URL变化，实现无延迟切换
  useEffect(() => {
    if (!conversationId || !conversations.length || !characters.length) return;

    const targetConversation = conversations.find(c => c.id === conversationId);
    if (targetConversation && targetConversation.id !== currentConversation?.id) {
      // 立即切换对话（无延迟）
      setCurrentConversation(targetConversation);
      const character = characters.find(c => c.id === targetConversation.characterId);
      if (character) {
        setCurrentCharacter(character);
      }
    }
  }, [conversationId, conversations, characters, currentConversation?.id]);

  // 切换对话的处理函数
  const switchToConversation = (conversation: Conversation) => {
    if (conversation.id === currentConversation?.id) return;

    // 立即更新状态（瞬间切换）
    setCurrentConversation(conversation);
    const character = characters.find(c => c.id === conversation.characterId);
    if (character) {
      setCurrentCharacter(character);
    }

    // 使用shallow routing更新URL，不重新渲染页面
    router.push(`/chat?c=${conversation.id}`, { shallow: true });
  };

  // 开始新聊天
  const startNewChatWithCharacter = async (character: Character) => {
    if (!session?.user?.id) return;

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
        const newConversation: Conversation = {
          id: data.data.conversation.id,
          characterId: character.id,
          characterName: character.name,
          characterAvatar: character.avatar_url,
          lastMessage: character.greeting_message,
          lastMessageTime: new Date().toISOString(),
          unreadCount: 0
        };

        // 更新对话列表
        const updatedConversations = [newConversation, ...conversations];
        setConversations(updatedConversations);

        // 切换到新对话
        setCurrentConversation(newConversation);
        setCurrentCharacter(character);

        // 更新URL
        router.push(`/chat?c=${newConversation.id}`, { shallow: true });
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  // 更新对话列表
  const handleConversationsUpdate = (updatedConversations: Conversation[]) => {
    setConversations(updatedConversations);
  };

  // Loading状态
  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // 未登录状态
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

  // 错误状态
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Error</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }

  // 角色选择界面（没有对话时）
  if (!currentCharacter && characters.length > 0) {
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
                  <img
                    src={character.avatar_url}
                    alt={character.name}
                    className="w-12 h-12 rounded-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/api/placeholder/48/48';
                    }}
                  />
                  <div>
                    <h3 className="font-semibold">{character.name}</h3>
                    <p className="text-sm text-muted-foreground">{character.chat_count}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{character.description}</p>
                <div className="flex flex-wrap gap-1">
                  {character.traits.slice(0, 3).map((trait, index) => (
                    <span key={index} className="text-xs px-2 py-1 bg-muted rounded-full">
                      {trait}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 主聊天界面
  if (!currentCharacter) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading conversation...</div>
      </div>
    );
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
      />
    </div>
  );
}