"use client";

import { signIn } from "next-auth/react";
import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";

export default function () {
  const { data: session, status } = useSession();
  const isInitialized = useRef(false);
  const isPrompting = useRef(false);

  const oneTapLogin = async function () {
    if (typeof window === 'undefined' || !window.google || !window.google.accounts) {
      console.log("Google One Tap SDK not available");
      return;
    }

    // 防止重复初始化和提示
    if (isPrompting.current) {
      console.log("One Tap already prompting, skipping...");
      return;
    }

    try {
      // 只初始化一次
      if (!isInitialized.current) {
        window.google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_AUTH_GOOGLE_ID,
          callback: (response: any) => {
            console.log("Google One Tap response:", response);
            isPrompting.current = false;
            handleLogin(response.credential);
          },
          auto_select: false,
          cancel_on_tap_outside: false,
          context: "signin",
        });
        isInitialized.current = true;
      }

      isPrompting.current = true;
      window.google.accounts.id.prompt();
      // 注意：prompt() 方法不接受回调函数参数
      // 结果会通过 initialize 中设置的 callback 处理
    } catch (error) {
      console.error("Google One Tap error:", error);
      isPrompting.current = false;
    }
  };

  const handleLogin = async function (credentials: string) {
    const res = await signIn("google-one-tap", {
      credential: credentials,
      redirect: false,
    });
    console.log("signIn ok", res);
  };

  useEffect(() => {
    console.log("one tap login status", status, session);

    if (status === "unauthenticated") {
      // 重置状态
      isInitialized.current = false;
      isPrompting.current = false;
      
      // Wait for Google script to load
      const checkAndInitialize = () => {
        if (typeof window !== 'undefined' && window.google && window.google.accounts) {
          console.log("Google One Tap SDK loaded, initializing...");
          oneTapLogin();
        } else {
          console.log("Google One Tap SDK not ready, retrying...");
          setTimeout(checkAndInitialize, 1000);
        }
      };

      // Initial check after a short delay
      setTimeout(checkAndInitialize, 500);

      // 移除定期重试，避免重复请求
      // const intervalId = setInterval(() => {
      //   if (typeof window !== 'undefined' && window.google && window.google.accounts) {
      //     oneTapLogin();
      //   }
      // }, 10000);

      // return () => {
      //   clearInterval(intervalId);
      // };
    }
  }, [status]);

  return <></>;
}
