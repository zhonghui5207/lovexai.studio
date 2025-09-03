import useSWR, { SWRConfiguration } from 'swr';
import { useSession } from 'next-auth/react';

// SWR 全局配置
export const swrConfig: SWRConfiguration = {
  // 禁用焦点重新验证，避免频繁请求
  revalidateOnFocus: false,
  // 禁用网络重连时重新验证
  revalidateOnReconnect: false,
  // 重试配置
  errorRetryCount: 2,
  errorRetryInterval: 1000,
  // 缓存时间设置
  dedupingInterval: 60000, // 1分钟内相同请求去重
  focusThrottleInterval: 30000, // 焦点节流间隔30秒
};

// 通用 fetcher 函数
export const fetcher = async (url: string) => {
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.');
    // @ts-ignore
    error.info = await res.json();
    // @ts-ignore
    error.status = res.status;
    throw error;
  }

  const data = await res.json();
  
  // 检查API响应格式
  if (data.code !== 0) {
    const error = new Error(data.message || 'API Error');
    // @ts-ignore
    error.info = data;
    throw error;
  }

  return data.data;
};

// 用户信息 hook - 基于认证状态的条件请求
export function useUserInfo() {
  const { data: session, status } = useSession();
  
  // 只有在认证状态确定且用户已登录时才请求
  const shouldFetch = status === 'authenticated' && !!session?.user?.uuid;
  
  const { data, error, mutate } = useSWR(
    shouldFetch ? '/api/get-user-info' : null, // null 表示不请求
    fetcher,
    {
      ...swrConfig,
      // 用户信息缓存时间稍长一些
      dedupingInterval: 120000, // 2分钟
    }
  );

  return {
    user: data,
    isLoading: shouldFetch && !error && !data,
    isError: error,
    mutate,
    // 添加认证状态
    isAuthenticated: shouldFetch,
  };
}

// 用户图片列表 hook - 基于认证状态的条件请求
export function useUserImages(page: number = 1, limit: number = 12, search: string = '', sort: string = 'newest') {
  const { data: session, status } = useSession();
  
  // 只有在认证状态确定且用户已登录时才请求
  const shouldFetch = status === 'authenticated' && !!session?.user?.uuid;
  
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    search,
    sort,
  });

  const { data, error, mutate } = useSWR(
    shouldFetch ? `/api/my-images?${params.toString()}` : null, // null 表示不请求
    fetcher,
    {
      ...swrConfig,
      // 图片数据更新频率较高，缓存时间短一些
      dedupingInterval: 30000, // 30秒
    }
  );

  return {
    data,
    isLoading: shouldFetch && !error && !data,
    isError: error,
    mutate,
    // 添加认证状态
    isAuthenticated: shouldFetch,
  };
}