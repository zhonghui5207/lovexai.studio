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
  
  const { user, setShowSignModal, setUser } = useAppContext();

  // 直接从user对象中获取积分，无需单独API调用
  const credits = user?.credits?.left_credits ?? null;

  // 刷新积分的方法 - 重新获取用户资料
  const refreshCredits = async () => {
    if (!user) return;
    
    try {
      const resp = await fetch("/api/get-user-info");
      if (resp.ok) {
        const { code, data } = await resp.json();
        if (code === 0) {
          setUser(data); // 更新用户信息，包括积分
        }
      }
    } catch (error) {
      console.error('Error refreshing credits:', error);
    }
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
        // 更新用户积分信息
        if (typeof data.data.remaining_credits === 'number' && user) {
          setUser({
            ...user,
            credits: {
              ...user.credits,
              left_credits: data.data.remaining_credits
            }
          });
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
          setError(`💳 Insufficient credits. You need at least 10 credits to generate an image.`);
        } else if (errorMsg.includes('fetch failed') || errorMsg.includes('Network error')) {
          // 网络错误的用户友好提示
          setError('🌐 Network connection failed. Please check your internet and try again.');
        } else if (errorMsg.includes('API error') || errorMsg.includes('Failed to generate')) {
          // API错误的用户友好提示
          setError('⚠️ Image generation temporarily unavailable. Please try again in a moment.');
        } else {
          setError(`❌ ${errorMsg}`);
        }
        
        // 只在开发环境下输出详细错误日志
        if (process.env.NODE_ENV === 'development') {
          console.error("Generation failed:", errorMsg, "Full response:", data);
        }
      }
    } catch (err) {
      // 统一处理网络错误和其他异常
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('🌐 Network connection failed. Please check your internet and try again.');
      } else if (err instanceof Error) {
        setError(`⚠️ Something went wrong: ${err.message}`);
      } else {
        setError('⚠️ An unexpected error occurred. Please try again.');
      }
      
      // 只在开发环境下输出详细错误日志
      if (process.env.NODE_ENV === 'development') {
        console.error("Generation error:", err);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <HeroBg />
      <section className="py-16 lg:py-24">
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
          <div className="text-center max-w-5xl mx-auto">
            {hero.announcement && (
              <div className="mb-8">
                <a
                  href={hero.announcement.url}
                  className="inline-flex items-center gap-3 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium transition-colors hover:bg-primary/10"
                >
                  {hero.announcement.label && (
                    <Badge variant="secondary">{hero.announcement.label}</Badge>
                  )}
                  {hero.announcement.title}
                  <Icon name="RiArrowRightLine" className="h-3 w-3" />
                </a>
              </div>
            )}

            {texts && texts.length > 1 ? (
              <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl">
                <span className="block">{texts[0]}</span>
                <span className="block bg-gradient-to-r from-primary via-green-500 to-primary bg-clip-text text-transparent">
                  {highlightText}
                </span>
                <span className="block text-foreground">{texts[1]}</span>
              </h1>
            ) : (
              <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl">
                {hero.title}
              </h1>
            )}

            <p
              className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground lg:text-xl"
              dangerouslySetInnerHTML={{ __html: hero.description || "" }}
            />
            
            {/* Credits Display - Redesigned */}
            {user && credits !== null && (
              <div className="mb-8">
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-primary/10 to-green-500/10 border border-primary/20 rounded-full shadow-lg backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-primary font-semibold">
                    <Icon name="RiCopperCoinLine" className="h-5 w-5" />
                    <span className="text-lg">{credits}</span>
                  </div>
                  <div className="h-4 w-px bg-primary/20" />
                  <span className="text-sm text-muted-foreground">Credits Available</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={refreshCredits}
                    className="h-6 w-6 p-0 hover:bg-primary/20 rounded-full"
                  >
                    <Icon name="RiRefreshLine" className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
            
            {/* Prompt Input Section - Redesigned */}
            {hero.prompt_input && (
              <div className="mx-auto max-w-4xl">
                <div className="relative">
                  <div className="flex flex-col lg:flex-row gap-4 p-2 bg-background/60 backdrop-blur-sm border border-border/50 rounded-2xl shadow-2xl">
                    <div className="flex-1">
                      <Input
                        type="text"
                        placeholder={hero.prompt_input.placeholder}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="h-14 text-base px-6 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/70"
                        onKeyPress={(e) => e.key === 'Enter' && !isGenerating && handleGenerate()}
                        disabled={isGenerating}
                      />
                    </div>
                    <Button
                      onClick={handleGenerate}
                      size="lg"
                      className="h-14 px-8 bg-gradient-to-r from-primary to-green-500 hover:from-primary/90 hover:to-green-500/90 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl transform hover:-translate-y-0.5"
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
                          <Icon name="RiSparklingFill" className="mr-2" />
                          Generate Now
                          <span className="ml-1 text-xs opacity-80">(10 Credits)</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                
                {hero.prompt_input.example_text && !generatedImage && !error && (
                  <p className="mt-4 text-sm text-muted-foreground/80">
                    💡 {hero.prompt_input.example_text}
                  </p>
                )}
                
                {/* Error Display - Enhanced */}
                {error && (
                  <div className="mt-6 p-4 bg-destructive/5 border border-destructive/20 rounded-xl backdrop-blur-sm">
                    <div className="flex items-start gap-3">
                      <Icon name="RiErrorWarningLine" className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm text-destructive font-medium mb-2">{error}</p>
                        <div className="flex flex-wrap gap-2">
                          {error.includes('Insufficient credits') && (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => window.open('/#pricing', '_blank')}
                                className="border-primary/20 text-primary hover:bg-primary/10"
                              >
                                💎 Buy Credits
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={refreshCredits}
                                className="border-muted-foreground/20"
                              >
                                🔄 Refresh Balance
                              </Button>
                            </>
                          )}
                          {(error.includes('Network connection failed') || error.includes('temporarily unavailable') || error.includes('Something went wrong')) && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={handleGenerate}
                              className="border-muted-foreground/20"
                            >
                              🔄 Try Again
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Generated Image Display - Enhanced */}
                {generatedImage && (
                  <div className="mt-8 p-2 bg-background/60 backdrop-blur-sm border border-border/50 rounded-2xl shadow-2xl">
                    <div className="relative rounded-xl overflow-hidden bg-muted/20">
                      <img 
                        src={generatedImage} 
                        alt={`Generated: ${prompt}`}
                        className="w-full h-auto max-h-[600px] object-contain"
                        onError={(e) => {
                          console.error("Image load error for URL:", generatedImage);
                          const imageUrl = generatedImage;
                          setGeneratedImage(null);
                          setError(`Failed to load generated image: ${imageUrl}`);
                        }}
                        onLoad={() => {
                          console.log("Image loaded successfully:", generatedImage);
                        }}
                      />
                      <div className="absolute top-4 right-4 flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => window.open(generatedImage, '_blank')}
                          className="bg-black/60 hover:bg-black/80 text-white border-0 backdrop-blur-sm"
                        >
                          <Icon name="RiExternalLinkLine" className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            const a = document.createElement('a');
                            a.href = generatedImage;
                            a.download = `lovexai-${prompt.slice(0, 30)}.png`;
                            a.click();
                          }}
                          className="bg-black/60 hover:bg-black/80 text-white border-0 backdrop-blur-sm"
                        >
                          <Icon name="RiDownloadLine" className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="p-4 text-center">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">"{prompt}"</span> • 
                        <span className="text-primary font-semibold"> Cost: 10 credits</span>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {hero.tip && (
              <p className="mt-12 text-sm text-muted-foreground/70 max-w-2xl mx-auto">{hero.tip}</p>
            )}
            {hero.show_happy_users && <HappyUsers />}
          </div>
        </div>
      </section>
    </>
  );
}
