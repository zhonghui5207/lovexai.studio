"use client";

import { createContext, useContext, useState, useEffect, ReactNode, memo } from 'react';
import { useSession } from 'next-auth/react';

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

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
  const [localCredits, setLocalCredits] = useState<number | null>(null);
  
  // Use Convex for real-time credit updates
  const convexUser = useQuery(api.users.current);
  
  useEffect(() => {
    if (convexUser) {
      setLocalCredits(convexUser.credits_balance || 0);
    }
  }, [convexUser]);

  const credits = localCredits ?? 0;
  const isLoading = convexUser === undefined;

  // 刷新积分（手动调用）
  const refreshCredits = async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch(`/api/user/credits?userId=${session.user.id}`);
      if (response.ok) {
        const data = await response.json();
        setLocalCredits(data.data?.credits_balance || 0);
      }
    } catch (error) {
      console.error('Failed to refresh credits:', error);
    }
  };

  // 直接更新积分（事件驱动）
  const updateCredits = (newCredits: number) => {
    setLocalCredits(newCredits);
  };

  // 扣除积分
  const deductCredits = (amount: number): boolean => {
    if ((localCredits ?? 0) >= amount) {
      setLocalCredits(prev => (prev ?? 0) - amount);
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