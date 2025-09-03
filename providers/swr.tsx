"use client";

import { SWRConfig } from 'swr';
import { swrConfig, fetcher } from '@/lib/swr';
import { ReactNode } from 'react';

export function SWRProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig 
      value={{
        ...swrConfig,
        fetcher,
        // 可以在这里添加全局错误处理
        onError: (error, key) => {
          // 只在开发环境输出详细错误信息
          if (process.env.NODE_ENV === 'development') {
            console.error('SWR Error:', error, 'Key:', key);
          }
          
          // 可以在这里添加错误上报逻辑
          // analytics.track('API Error', { error: error.message, key });
        }
      }}
    >
      {children}
    </SWRConfig>
  );
}