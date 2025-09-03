"use client";

import { SessionProvider } from "next-auth/react";

export function NextAuthSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider
      refetchInterval={0} // 完全禁用自动刷新
      refetchOnWindowFocus={false} // 窗口聚焦时不刷新
      refetchWhenOffline={false} // 离线重连时不刷新
    >
      {children}
    </SessionProvider>
  );
}
