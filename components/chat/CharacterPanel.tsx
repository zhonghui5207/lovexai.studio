"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ChevronDown, ChevronUp, Lightbulb, Settings, Star, MessageSquare, Image, BookOpen, Target, Heart, Bookmark } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface Character {
  id: string;
  name: string;
  username?: string;
  avatar_url: string;
  description: string;
  traits: string[];
  personality: string;
  age?: number;
  location?: string;
  scenario?: string;
  current_state?: string;
  motivation?: string;
  background?: string;
  suggestions?: string;
  like_count?: number;
  favorite_count?: number;
}

interface CharacterPanelProps {
  character: Character;
  onSuggestionClick?: (suggestion: string) => void;
  userId?: string;
}


// 解析scenario信息的辅助函数
function parseScenarioInfo(scenario?: string) {
  if (!scenario) return null;

  // 提取剧情标题
  const titleMatch = scenario.match(/"([^"]+)"/);
  const title = titleMatch ? titleMatch[1] : 'Current Scenario';

  // 提取剧情描述 (在冒号之后的内容)
  const descriptionMatch = scenario.match(/:\s*(.+)$/);
  const description = descriptionMatch ? descriptionMatch[1] : scenario;

  return { title, description };
}

// 解析角色专属建议
function parseCharacterSuggestions(suggestions?: string) {
  if (!suggestions) return [];
  try {
    return JSON.parse(suggestions);
  } catch {
    return [];
  }
}


// 优化状态点格式化
function formatStatePoints(state?: string) {
  if (!state) return [];

  return state.split(' - ').map(point => {
    const cleanPoint = point.replace(/^- /, '').trim();
    // 为每个状态点添加适当的图标
    if (cleanPoint.includes('wearing') || cleanPoint.includes('dress') || cleanPoint.includes('clothes')) {
      return { icon: '👗', text: cleanPoint };
    }
    if (cleanPoint.includes('phone') || cleanPoint.includes('died')) {
      return { icon: '📱', text: cleanPoint };
    }
    if (cleanPoint.includes('sun') || cleanPoint.includes('dark') || cleanPoint.includes('light')) {
      return { icon: '🌅', text: cleanPoint };
    }
    if (cleanPoint.includes('car') || cleanPoint.includes('vehicle')) {
      return { icon: '🚗', text: cleanPoint };
    }
    return { icon: '•', text: cleanPoint };
  });
}

export default function CharacterPanel({ character, onSuggestionClick, userId }: CharacterPanelProps) {
  // 基于对标网站的上下折叠状态管理
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showPersona, setShowPersona] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showMemories, setShowMemories] = useState(false);
  const [showScenario, setShowScenario] = useState(true);

  // 建议点击状态管理
  const [clickedSuggestion, setClickedSuggestion] = useState<string | null>(null);

  // 点赞收藏状态
  const interactions = useQuery(
    api.interactions.getUserInteractions, 
    userId ? { characterId: character.id as Id<"characters">, userId } : "skip"
  );
  const toggleLike = useMutation(api.interactions.toggleLike);
  const toggleFavorite = useMutation(api.interactions.toggleFavorite);
  const [isLiking, setIsLiking] = useState(false);
  const [isFavoriting, setIsFavoriting] = useState(false);

  // 乐观更新状态
  const [optimisticLiked, setOptimisticLiked] = useState<boolean | null>(null);
  const [optimisticFavorited, setOptimisticFavorited] = useState<boolean | null>(null);
  const [optimisticLikeCount, setOptimisticLikeCount] = useState<number | null>(null);
  const [optimisticFavoriteCount, setOptimisticFavoriteCount] = useState<number | null>(null);

  // 计算当前显示值
  const isLiked = optimisticLiked ?? interactions?.liked ?? false;
  const isFavorited = optimisticFavorited ?? interactions?.favorited ?? false;
  const likeCount = optimisticLikeCount ?? character.like_count ?? 0;
  const favoriteCount = optimisticFavoriteCount ?? character.favorite_count ?? 0;

  // 重置乐观状态当服务器数据更新时
  useEffect(() => {
    if (interactions !== undefined) {
      setOptimisticLiked(null);
      setOptimisticFavorited(null);
    }
  }, [interactions]);

  useEffect(() => {
    setOptimisticLikeCount(null);
    setOptimisticFavoriteCount(null);
  }, [character.like_count, character.favorite_count]);

  // 解析剧情信息
  const scenarioInfo = parseScenarioInfo(character.scenario);
  const statePoints = formatStatePoints(character.current_state);
  const characterSuggestions = parseCharacterSuggestions(character.suggestions);

  // 处理点赞
  const handleLike = async () => {
    if (!userId || isLiking) return;
    setIsLiking(true);
    
    // 乐观更新
    const newLiked = !isLiked;
    setOptimisticLiked(newLiked);
    setOptimisticLikeCount(newLiked ? likeCount + 1 : Math.max(0, likeCount - 1));
    
    try {
      await toggleLike({ characterId: character.id as Id<"characters">, userId });
    } catch (e) {
      console.error("Failed to like:", e);
      // 回滚
      setOptimisticLiked(null);
      setOptimisticLikeCount(null);
    } finally {
      setIsLiking(false);
    }
  };

  // 处理收藏
  const handleFavorite = async () => {
    if (!userId || isFavoriting) return;
    setIsFavoriting(true);
    
    // 乐观更新
    const newFavorited = !isFavorited;
    setOptimisticFavorited(newFavorited);
    setOptimisticFavoriteCount(newFavorited ? favoriteCount + 1 : Math.max(0, favoriteCount - 1));
    
    try {
      await toggleFavorite({ characterId: character.id as Id<"characters">, userId });
    } catch (e) {
      console.error("Failed to favorite:", e);
      // 回滚
      setOptimisticFavorited(null);
      setOptimisticFavoriteCount(null);
    } finally {
      setIsFavoriting(false);
    }
  };

  // 处理建议点击
  const handleSuggestionClick = (suggestion: string) => {
    // 设置点击状态，提供视觉反馈
    setClickedSuggestion(suggestion);

    // 调用父组件传入的回调函数
    onSuggestionClick?.(suggestion);

    // 500ms后清除高亮状态
    setTimeout(() => setClickedSuggestion(null), 500);
  };

  return (
    <div className="flex flex-col h-full bg-background/80 backdrop-blur-xl border-l border-border/50 shadow-2xl">
      {/* Character Header */}
      <div className="relative group">
        {/* Large Character Image */}
        <div className="h-72 relative overflow-hidden">
          <img
            src={character.avatar_url}
            alt={character.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            style={{ objectPosition: 'center 25%' }}
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop&crop=face';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent opacity-60" />
        </div>

        {/* Character Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-5 pt-12 text-foreground">
          <h2 className="text-2xl font-bold mb-1 text-white drop-shadow-md">{character.name}</h2>
          <p className="text-sm text-white/90 mb-3 line-clamp-2 font-medium drop-shadow-sm">
            {character.age ? `${character.age}, ` : ''}{character.description}
          </p>
          
          {/* Like & Favorite Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleLike}
              disabled={!userId || isLiking}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                isLiked 
                  ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30' 
                  : 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/10'
              } ${isLiking ? 'opacity-50' : ''}`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              <span>{likeCount}</span>
            </button>
            
            <button
              onClick={handleFavorite}
              disabled={!userId || isFavoriting}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                isFavorited 
                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' 
                  : 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/10'
              } ${isFavoriting ? 'opacity-50' : ''}`}
            >
              <Bookmark className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
              <span>{favoriteCount}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 模块化内容区域 - 基于对标网站的设计 */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-2 py-2 space-y-2">

        {/* 1. Background 模块 - 角色背景展示 */}
        {character.background && (
          <div className="rounded-xl overflow-hidden bg-card/30 border border-border/40 transition-all hover:bg-card/50">
            {/* 模块标题栏 - 可点击折叠 */}
            <button
              onClick={() => setShowScenario(!showScenario)}
              className="w-full px-4 py-3 flex items-center justify-between transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-md bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 transition-colors">
                  <BookOpen className="w-4 h-4" />
                </div>
                <span className="font-semibold text-sm text-foreground/90">Background</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${showScenario ? 'rotate-180' : ''}`} />
            </button>

            {/* 模块内容 - 数据库背景介绍 */}
            <div className={`grid transition-all duration-300 ease-in-out ${showScenario ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
              <div className="overflow-hidden">
                <div className="px-4 pb-4 pt-1">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {character.background}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. Persona 模块 - 可上下折叠 */}
        <div className="rounded-xl overflow-hidden bg-card/30 border border-border/40 transition-all hover:bg-card/50">
          {/* 模块标题栏 - 可点击折叠 */}
          <button
            onClick={() => setShowPersona(!showPersona)}
            className="w-full px-4 py-3 flex flex-col gap-3 transition-colors group"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-md bg-pink-500/10 text-pink-400 group-hover:bg-pink-500/20 transition-colors">
                  <Star className="w-4 h-4" />
                </div>
                <span className="font-semibold text-sm text-foreground/90">Persona</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${showPersona ? 'rotate-180' : ''}`} />
            </div>
            
            <div className="flex flex-wrap gap-1.5 w-full">
              {character.traits.map((trait, index) => (
                <Badge key={index} variant="secondary" className="text-[10px] h-5 px-2 bg-secondary/50 text-secondary-foreground/80 border-0">
                  {trait}
                </Badge>
              ))}
            </div>
          </button>

          {/* 模块内容 - 可折叠显示 */}
          <div className={`grid transition-all duration-300 ease-in-out ${showPersona ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
            <div className="overflow-hidden">
              <div className="px-4 pb-4 pt-1 space-y-3">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {character.personality}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Suggestions 模块 - 可上下折叠 */}
        <div className="rounded-xl overflow-hidden bg-card/30 border border-border/40 transition-all hover:bg-card/50">
          <button
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="w-full px-4 py-3 flex items-center justify-between transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-md bg-yellow-500/10 text-yellow-400 group-hover:bg-yellow-500/20 transition-colors">
                <Lightbulb className="w-4 h-4" />
              </div>
              <span className="font-semibold text-sm text-foreground/90">Suggestions</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${showSuggestions ? 'rotate-180' : ''}`} />
          </button>

          <div className={`grid transition-all duration-300 ease-in-out ${showSuggestions && characterSuggestions.length > 0 ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
            <div className="overflow-hidden">
              <div className="px-4 pb-4 pt-1 space-y-3">
                <p className="text-xs text-muted-foreground/80 font-medium uppercase tracking-wider">
                  Quick conversation starters
                </p>

                <div className="space-y-2.5">
                  {characterSuggestions.map((suggestion: string, index: number) => (
                    <div
                      key={index}
                      className={`group relative p-3.5 rounded-xl border transition-all duration-300 cursor-pointer overflow-hidden ${
                        clickedSuggestion === suggestion
                          ? 'bg-primary/10 border-primary/30 shadow-[0_0_15px_rgba(var(--primary),0.2)]'
                          : 'bg-background/40 border-white/5 hover:bg-background/60 hover:border-white/10 hover:shadow-md'
                      }`}
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      <div className="relative z-10 flex items-start justify-between gap-3">
                        <p className="text-sm text-foreground/90 leading-snug group-hover:text-primary/90 transition-colors">
                          {suggestion}
                        </p>
                        {clickedSuggestion === suggestion ? (
                          <div className="flex items-center gap-1.5 text-xs text-primary font-medium animate-in fade-in duration-200">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                            </span>
                            Sent
                          </div>
                        ) : (
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity text-primary/50">
                            <MessageSquare className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      
                      {/* Hover Gradient Effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 translate-x-[-100%] group-hover:translate-x-[100%]" style={{ transitionDuration: '1s' }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}