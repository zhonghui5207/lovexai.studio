"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import ChatInterface from "@/components/chat/ChatInterface";

export default function ChatPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const characterId = params.characterId as string;
  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return; // Still loading session
    if (!session?.user?.id) return; // No session

    const fetchCharacter = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/characters?userId=${session.user.id}`);

        if (!response.ok) {
          throw new Error('Failed to fetch characters');
        }

        const data = await response.json();
        if (data.success) {
          // 支持通过ID或username查找角色，以及旧的硬编码ID映射
          const foundCharacter = data.data.find((c: any) =>
            c.id === characterId ||
            c.username === characterId ||
            // 支持旧的硬编码ID格式映射
            (characterId === 'emma_001' && c.username === 'emmytime') ||
            (characterId === 'sophia_002' && c.username === 'sophiawonder') ||
            (characterId === 'luna_003' && c.username === 'lunarmystic') ||
            (characterId === 'zoe_008' && c.username === 'zoevibe') ||
            (characterId === 'ivy_009' && c.username === 'ivytech') ||
            (characterId === 'nova_011' && c.username === 'novastorm') ||
            (characterId === 'sage_012' && c.username === 'sagewisom')
          );

          if (foundCharacter) {
            setCharacter(foundCharacter);
          } else {
            setError('Character not found or access denied');
          }
        } else {
          setError(data.error || 'Failed to load character');
        }
      } catch (err) {
        console.error('Error fetching character:', err);
        setError('Failed to load character');
      } finally {
        setLoading(false);
      }
    };

    fetchCharacter();
  }, [characterId, session, status]);

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

  // Show error if character fetch failed
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Error</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
          >
            Go Home
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
            The character you're looking for doesn't exist or you don't have access to it.
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background">
      <ChatInterface character={character} />
    </div>
  );
}