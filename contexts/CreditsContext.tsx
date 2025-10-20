"use client";

import { createContext, useContext, useState, useEffect, ReactNode, memo } from 'react';
import { useSession } from 'next-auth/react';

interface CreditsContextType {
  credits: number;
  isLoading: boolean;
  refreshCredits: () => Promise<void>;
  updateCredits: (newCredits: number) => void;
  deductCredits: (amount: number) => boolean;
}

const CreditsContext = createContext<CreditsContextType | undefined>(undefined);

export function useCredits() {
  const context = useContext(CreditsContext);
  if (context === undefined) {
    throw new Error('useCredits must be used within a CreditsProvider');
  }
  return context;
}

interface CreditsProviderProps {
  children: ReactNode;
}

export const CreditsProvider = memo(function CreditsProviderComponent({ children }: CreditsProviderProps) {
  const { data: session } = useSession();
  const [credits, setCredits] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 初始获取积分
  useEffect(() => {
    if (!session?.user?.id) return;

    const fetchCredits = async () => {
      try {
        const response = await fetch(`/api/user/credits?userId=${session.user.id}`);
        if (response.ok) {
          const data = await response.json();
          setCredits(data.data?.credits_balance || 0);
        }
      } catch (error) {
        console.error('Failed to fetch credits:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCredits();
  }, [session?.user?.id]);

  // 刷新积分（手动调用）
  const refreshCredits = async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch(`/api/user/credits?userId=${session.user.id}`);
      if (response.ok) {
        const data = await response.json();
        setCredits(data.data?.credits_balance || 0);
      }
    } catch (error) {
      console.error('Failed to refresh credits:', error);
    }
  };

  // 直接更新积分（事件驱动）
  const updateCredits = (newCredits: number) => {
    setCredits(newCredits);
  };

  // 扣除积分
  const deductCredits = (amount: number): boolean => {
    if (credits >= amount) {
      setCredits(prev => prev - amount);
      return true;
    }
    return false;
  };

  const value: CreditsContextType = {
    credits,
    isLoading,
    refreshCredits,
    updateCredits,
    deductCredits,
  };

  return (
    <CreditsContext.Provider value={value}>
      {children}
    </CreditsContext.Provider>
  );
});