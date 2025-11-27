"use client";

import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { cacheGet, cacheRemove } from "@/lib/cache";

import { CacheKey } from "@/services/constant";
import { ContextValue } from "@/types/context";
import { User } from "@/types/chat"; // 使用新的User类型
import moment from "moment";
import useOneTapLogin from "@/hooks/useOneTapLogin";
import { useSession } from "next-auth/react";

const AppContext = createContext({} as ContextValue);

export const useAppContext = () => useContext(AppContext);

export const AppContextProvider = ({ children }: { children: ReactNode }) => {
  useOneTapLogin();

  const { data: session } = useSession();

  const [theme, setTheme] = useState<string>(() => {
    return process.env.NEXT_PUBLIC_DEFAULT_THEME || "";
  });

  const [showSignModal, setShowSignModal] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);

  const [showFeedback, setShowFeedback] = useState<boolean>(false);
  const [isLoadingUser, setIsLoadingUser] = useState<boolean>(false);
  const [lastUserFetch, setLastUserFetch] = useState<number>(0);

  const fetchUserInfo = async function () {
    // 防止重复请求 - 5分钟内不重复获取
    const now = Date.now();
    if (now - lastUserFetch < 5 * 60 * 1000) {
      console.log("用户信息获取过于频繁，跳过");
      return;
    }

    if (isLoadingUser) {
      console.log("用户信息正在获取中，跳过");
      return;
    }

    try {
      setIsLoadingUser(true);
      setLastUserFetch(now);
      
      console.log("开始获取用户信息...");
      const resp = await fetch("/api/get-user-info", {
        method: "GET",
      });

      console.log("用户信息API响应状态:", resp.status);
      if (!resp.ok) {
        throw new Error("fetch user info failed with status: " + resp.status);
      }

      const { code, message, data } = await resp.json();
      console.log("用户信息API响应:", { code, message, data: data ? "有数据" : "无数据" });
      
      if (code !== 0) {
        throw new Error(message);
      }

      setUser(data);
      console.log("✅ 用户信息设置成功");
      updateInvite(data);
    } catch (e) {
      console.error("❌ fetch user info failed:", e);
    } finally {
      setIsLoadingUser(false);
    }
  };

  const updateInvite = async (user: User) => {
    try {
      // 新的User类型暂时不包含invited_by字段，跳过邀请逻辑
      // 如果需要邀请功能，需要在数据库和User类型中添加相关字段
      console.log("邀请功能暂时禁用 - 新用户架构");
      return;

      // const inviteCode = cacheGet(CacheKey.InviteCode);
      // if (!inviteCode) {
      //   // no invite code
      //   return;
      // }

      // // 省略邀请逻辑...
    } catch (e) {
      console.log("update invite failed: ", e);
    }
  };

  useEffect(() => {
    console.log("🔄 AppContext useEffect 触发");
    console.log("🔄 当前session:", session?.user?.id ? "有" : "无");
    console.log("🔄 当前user:", user ? "有" : "无");

    // 直接使用会话中的用户数据，不再调用额外的API
    if (session?.user?.id && !user) {
      console.log("检测到新的session，直接使用会话数据");

      // 将session用户数据转换为User类型
      const sessionUser: User = {
        id: session.user.id,
        email: session.user.email || '',
        name: session.user.name || '',
        avatar_url: session.user.avatar_url || '',
        subscription_tier: session.user.subscription_tier || 'free',
        credits_balance: session.user.credits_balance || 0,
        total_credits_purchased: 0, // 默认值
        created_at: session.user.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(), // 默认值
      };

      setUser(sessionUser);
      console.log("✅ 用户信息从会话设置成功");
      updateInvite(sessionUser);
    } else if (!session && user) {
      // 用户登出，清空用户信息
      console.log("用户登出，清空用户信息");
      setUser(null);
    }
  }, [session?.user?.id]); // 只监听关键字段

  return (
    <AppContext.Provider
      value={{
        theme,
        setTheme,
        showSignModal,
        setShowSignModal,
        user,
        setUser,
        showFeedback,
        setShowFeedback,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
