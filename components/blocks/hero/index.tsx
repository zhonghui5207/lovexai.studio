"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import HappyUsers from "./happy-users";
import HeroBg from "./bg";
import { Hero as HeroType } from "@/types/blocks/hero";
import Icon from "@/components/icon";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useAppContext } from "@/contexts/app";

export default function Hero({ hero }: { hero: HeroType }) {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [isLoadingCredits, setIsLoadingCredits] = useState<boolean>(false);
  const [lastCreditsFetch, setLastCreditsFetch] = useState<number>(0);
  
  const { user, setShowSignModal } = useAppContext();

  // 获取用户积分余额
  useEffect(() => {
    if (user?.uuid && credits === null) {
      // 只在用户存在且credits未初始化时获取
      fetchCredits();
    } else if (!user) {
      // 用户登出时清空积分
      setCredits(null);
    }
  }, [user?.uuid]); // 只监听用户UUID变化

  const fetchCredits = async () => {
    // 防止重复请求 - 30秒内不重复获取
    const now = Date.now();
    if (now - lastCreditsFetch < 30 * 1000) {
      console.log("积分获取过于频繁，跳过");
      return;
    }

    if (isLoadingCredits) {
      console.log("积分正在获取中，跳过");
      return;
    }

    try {
      setIsLoadingCredits(true);
      setLastCreditsFetch(now);
      
      const response = await fetch('/api/get-user-credits', {
        method: 'POST'
      });
      if (response.ok) {
        const data = await response.json();
        console.log("获取积分API响应:", data); // 添加调试日志
        // API返回格式: { code: 0, data: { left_credits: number } }
        setCredits(data.data?.left_credits || 0);
      } else {
        console.error("获取积分失败:", response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching credits:', error);
    } finally {
      setIsLoadingCredits(false);
    }
  };

  // 提供手动刷新积分的方法
  const refreshCredits = async () => {
    if (!user) return;
    setLastCreditsFetch(0); // 重置时间戳，强制刷新
    await fetchCredits();
  };

  if (hero.disabled) {
    return null;
  }

  const highlightText = hero.highlight_text;
  let texts = null;
  if (highlightText) {
    texts = hero.title?.split(highlightText, 2);
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    // 检查用户是否已登录
    if (!user) {
      setShowSignModal(true);
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          aspect_ratio: "16:9"
        }),
      });

      const data = await response.json();
      console.log("生图API完整响应:", data); // 添加调试日志

      // API返回格式: { code: 0, message: "ok", data: { success: true, imageUrl: "...", remaining_credits: 179 } }
      if (response.ok && data.code === 0 && data.data?.success) {
        setGeneratedImage(data.data.imageUrl);
        // 直接使用API返回的剩余积分，避免重新请求
        if (typeof data.data.remaining_credits === 'number') {
          setCredits(data.data.remaining_credits);
        }
        console.log("Image generated successfully:", data.data.imageUrl);
      } else {
        // 处理API错误响应
        let errorMsg = "Failed to generate image";
        
        if (data.code !== 0) {
          // API返回错误码
          errorMsg = data.message || "API error";
        } else if (data.data?.error) {
          // 数据中包含错误信息
          errorMsg = data.data.error;
        } else if (!response.ok) {
          // HTTP错误
          errorMsg = `HTTP ${response.status}: ${response.statusText}`;
        }
        
        if (errorMsg.includes('Insufficient credits')) {
          // 积分不足的特殊处理
          setError(`Insufficient credits. ${errorMsg}`);
        } else {
          setError(errorMsg);
        }
        console.error("Generation failed:", errorMsg, "Full response:", data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Network error";
      setError(errorMessage);
      console.error("Generation error:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <HeroBg />
      <section className="py-24">
        <div className="container">
          {hero.show_badge && (
            <div className="flex items-center justify-center mb-8">
              <img
                src="/imgs/badges/phdaily.svg"
                alt="phdaily"
                className="h-10 object-cover"
              />
            </div>
          )}
          <div className="text-center">
            {hero.announcement && (
              <a
                href={hero.announcement.url}
                className="mx-auto mb-3 inline-flex items-center gap-3 rounded-full border px-2 py-1 text-sm"
              >
                {hero.announcement.label && (
                  <Badge>{hero.announcement.label}</Badge>
                )}
                {hero.announcement.title}
              </a>
            )}

            {texts && texts.length > 1 ? (
              <h1 className="mx-auto mb-3 mt-4 max-w-3xl text-balance text-4xl font-bold lg:mb-7 lg:text-7xl">
                {texts[0]}
                <span className="bg-gradient-to-r from-primary via-primary to-primary bg-clip-text text-transparent">
                  {highlightText}
                </span>
                {texts[1]}
              </h1>
            ) : (
              <h1 className="mx-auto mb-3 mt-4 max-w-3xl text-balance text-4xl font-bold lg:mb-7 lg:text-7xl">
                {hero.title}
              </h1>
            )}

            <p
              className="m mx-auto max-w-3xl text-muted-foreground lg:text-xl"
              dangerouslySetInnerHTML={{ __html: hero.description || "" }}
            />
            
            {/* Credits Display */}
            {user && credits !== null && (
              <div className="mt-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full">
                  <Icon name="RiCopperCoinLine" className="text-primary" />
                  <span className="text-sm font-medium">
                    Credits: <span className="font-bold text-primary">{credits}</span>
                  </span>
                </div>
              </div>
            )}
            
            {/* Prompt Input Section */}
            {hero.prompt_input && (
              <div className="mt-8 mx-auto max-w-2xl">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    type="text"
                    placeholder={hero.prompt_input.placeholder}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="flex-1 h-12 text-lg px-4"
                    onKeyPress={(e) => e.key === 'Enter' && !isGenerating && handleGenerate()}
                    disabled={isGenerating}
                  />
                  <Button
                    onClick={handleGenerate}
                    size="lg"
                    className="h-12 px-8 whitespace-nowrap"
                    disabled={!prompt.trim() || isGenerating || (user && credits !== null && credits < 10)}
                  >
                    {isGenerating ? (
                      <>
                        <Icon name="RiLoader4Line" className="mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : !user ? (
                      <>
                        Sign In to Generate
                        <Icon name="RiLoginBoxLine" className="ml-2" />
                      </>
                    ) : user && credits !== null && credits < 10 ? (
                      <>
                        Insufficient Credits
                        <Icon name="RiCopperCoinLine" className="ml-2" />
                      </>
                    ) : (
                      <>
                        {hero.prompt_input.generate_button} (10 Credits)
                        <Icon name="RiSparklingFill" className="ml-2" />
                      </>
                    )}
                  </Button>
                </div>
                {hero.prompt_input.example_text && !generatedImage && !error && (
                  <p className="mt-3 text-sm text-muted-foreground">
                    {hero.prompt_input.example_text}
                  </p>
                )}
                
                {/* Error Display */}
                {error && (
                  <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-sm text-destructive flex items-center">
                      <Icon name="RiErrorWarningLine" className="mr-2" />
                      {error}
                    </p>
                    {error.includes('Insufficient credits') && (
                      <div className="mt-2">
                        <Button variant="outline" size="sm" onClick={() => window.open('/#pricing', '_blank')}>
                          Buy Credits
                        </Button>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Generated Image Display */}
                {generatedImage && (
                  <div className="mt-6">
                    <div className="relative rounded-lg overflow-hidden border bg-muted/20">
                      <img 
                        src={generatedImage} 
                        alt={`Generated: ${prompt}`}
                        className="w-full h-auto max-h-96 object-contain"
                        onError={(e) => {
                          console.error("Image load error for URL:", generatedImage);
                          console.error("Error details:", e);
                          // 避免无限循环，先清除generatedImage再设置错误
                          const imageUrl = generatedImage;
                          setGeneratedImage(null);
                          setError(`Failed to load generated image: ${imageUrl}`);
                        }}
                        onLoad={() => {
                          console.log("Image loaded successfully:", generatedImage);
                        }}
                      />
                      <div className="absolute top-2 right-2 flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => window.open(generatedImage, '_blank')}
                          className="bg-black/50 hover:bg-black/70 text-white"
                        >
                          <Icon name="RiExternalLinkLine" className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground text-center">
                      Generated from: "{prompt}" • Cost: 10 credits
                    </p>
                  </div>
                )}
              </div>
            )}

            {hero.tip && (
              <p className="mt-8 text-md text-muted-foreground">{hero.tip}</p>
            )}
            {hero.show_happy_users && <HappyUsers />}
          </div>
        </div>
      </section>
    </>
  );
}
