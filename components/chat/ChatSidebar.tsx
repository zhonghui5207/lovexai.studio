"use client"; // 标记为客户端组件，因为使用了 useState, useEffect 等React Hooks

// React相关导入
import { useState, useEffect } from "react"; // useState: 管理组件状态, useEffect: 处理副作用
import { useSession } from "next-auth/react"; // 获取用户认证状态
import { useTranslations } from "next-intl"; // 国际化

// 图标库导入 - lucide-react 是现代化的图标库
import { MessageCircle, Search, Plus } from "lucide-react";

// UI组件导入 - 来自项目自定义的UI组件库
import { Input } from "@/components/ui/input"; // 输入框组件
import { Badge } from "@/components/ui/badge"; // 徽章/标签组件
import { Button } from "@/components/ui/button"; // 按钮组件
import FormattedMessage from "./FormattedMessage"; // 消息格式化组件
import {
  DropdownMenu,           // 下拉菜单容器
  DropdownMenuContent,    // 下拉菜单内容区域
  DropdownMenuItem,       // 下拉菜单单个选项
  DropdownMenuTrigger,    // 触发下拉菜单的按钮/元素
} from "@/components/ui/dropdown-menu";
import Image from "next/image";

// TypeScript 接口定义 - 类型安全

/**
 * 用户对话接口
 * 定义单个对话的数据结构
 */
interface UserConversation {
  id: string;                    // 对话唯一标识符 (UUID)
  characterId: string;           // 角色ID
  characterName: string;         // 角色名称
  characterAvatar: string;       // 角色头像URL
  lastMessage?: string;          // 最后一条消息内容 (?表示可选属性)
  lastMessageTime?: string;      // 最后一条消息时间
  unreadCount: number;           // 未读消息数量
}

/**
 * 角色接口
 * 定义AI角色的完整信息
 */
interface Character {
  id: string;                    // 角色唯一标识符
  name: string;                  // 角色名称
  username?: string;             // 角色用户名 (可选)
  avatar_url: string;            // 角色头像URL
  description: string;           // 角色描述
  traits: string[];              // 角色特征数组
  greeting_message: string;      // 问候消息
  chat_count: string;            // 聊天次数统计
  personality: string;           // 性格描述
  age?: number;                  // 年龄 (可选)
  location?: string;             // 位置 (可选)
  access_level: string;          // 访问级别 (free/plus/pro/ultimate)
  credits_per_message: number;   // 每条消息消耗的积分
}

/**
 * ChatSidebar 组件属性接口
 * 定义父组件传递给ChatSidebar的参数类型
 */
interface ChatSidebarProps {
  currentCharacterId: string;                           // 当前选中的角色ID
  currentConversationId: string | null;                 // 当前对话ID (可能为null)
  conversations: UserConversation[];                    // 用户对话列表
  onConversationSwitch: (conversation: UserConversation) => void;  // 切换对话的回调函数
  onNewChatWithCharacter: (character: Character) => void;         // 开始新聊天的回调函数
  availableCharacters: Character[];                     // 可用角色列表
}

/**
 * ChatSidebar 主组件
 * 聊天界面的左侧边栏，显示对话列表和角色选择
 *
 * @param props - 组件属性，遵循ChatSidebarProps接口定义
 */
export default function ChatSidebar({
  currentCharacterId,        // 当前选中的角色ID
  currentConversationId,     // 当前对话ID
  conversations,             // 对话列表
  onConversationSwitch,      // 切换对话的回调函数
  onNewChatWithCharacter,    // 开始新聊天的回调函数
  availableCharacters        // 可用角色列表
}: ChatSidebarProps) {

  // 🎣 使用自定义Hook获取用户认证状态
  // session 包含用户信息，如果用户未登录则为 null
  const { data: session } = useSession();

  // 🌐 国际化翻译函数
  const t = useTranslations();

  // 📝 状态管理：搜索框的输入值
  // useState 返回 [当前值, 设置函数]
  const [searchQuery, setSearchQuery] = useState("");

  // 🔍 过滤对话列表的逻辑
  // 根据搜索关键词筛选对话，支持按角色名和消息内容搜索
  const filteredConversations = (conversations || []).filter(conv =>
    // 搜索角色名 (不区分大小写)
    conv.characterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    // 搜索最后一条消息内容 (如果不为空)
    (conv.lastMessage && conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // ⏰ 时间格式化工具函数
  // 将时间戳转换为相对时间显示 (如 "2h ago", "3d ago")
  const formatTimeAgo = (timeString?: string) => {
    if (!timeString) return ""; // 如果没有时间字符串，返回空

    const date = new Date(timeString);  // 解析时间字符串
    const now = new Date();             // 获取当前时间
    // 计算时间差 (分钟)
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    // 根据时间差返回不同的格式
    if (diffInMinutes < 1) return t('chat.just_now');        // 1分钟内
    if (diffInMinutes < 60) return t('chat.minutes_ago', { count: diffInMinutes });  // 1小时内
    if (diffInMinutes < 1440) return t('chat.hours_ago', { count: Math.floor(diffInMinutes / 60) });  // 1天内
    return t('chat.days_ago', { count: Math.floor(diffInMinutes / 1440) });      // 超过1天
  };

  // 💬 处理对话点击事件
  // 当用户点击某个对话时，调用父组件传入的回调函数
  const handleConversationClick = (conversation: UserConversation) => {
    onConversationSwitch(conversation);
  };

  // 🆕 处理新聊天点击事件
  // 当用户选择某个角色开始新聊天时调用
  const handleNewChatClick = (character: Character) => {
    onNewChatWithCharacter(character);
  };

  // 🔐 未登录状态的处理
  // 如果用户未登录，显示登录提示界面
  if (!session) {
    return (
      <div className="w-80 bg-muted/30 border-r border-border flex items-center justify-center p-6">
        {/* 未登录提示内容 */}
        <div className="text-center text-muted-foreground">
          {/* 聊天图标，降低透明度表示不可用状态 */}
          <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
          {/* 提示用户登录的文字 */}
          <p>{t('chat.login_prompt')}</p>
        </div>
      </div>
    );
  }

  // 🎯 已登录用户的主界面渲染
  return (
    // 主容器：固定宽度320px，背景色，右边框，垂直flex布局
    <div className="w-80 bg-background/20 border-r-2 border-border shadow-md flex flex-col">

      {/* 📋 顶部Header区域 */}
      <div className="p-5 pt-6 border-b border-white/5 bg-transparent">
        {/* 标题和新建按钮的横向布局 */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white tracking-tight">{t('chat.title')}</h2>

          <div className="flex items-center gap-1">
            {/* 🆕 新建聊天下拉菜单 */}
            <DropdownMenu>
              {/* 触发下拉菜单的按钮 */}
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors">
                  <Plus className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>

              {/* 下拉菜单内容区域 */}
              <DropdownMenuContent align="end" className="w-64 bg-[#1a1d26] border-white/10 text-white">
                {/* 遍历所有可用角色，为每个角色创建菜单项 */}
                {availableCharacters.map((character) => (
                  <DropdownMenuItem
                    key={character.id} // React需要的唯一key
                    onClick={() => handleNewChatClick(character)} // 点击时调用处理函数
                    className="flex items-center gap-3 p-3 hover:bg-white/5 focus:bg-white/5 cursor-pointer"
                  >
                    {/* 角色头像 */}
                    <div className="relative w-8 h-8 flex-shrink-0">
                      <Image
                        src={character.avatar_url}
                        alt={character.name}
                        fill
                        className="rounded-lg object-cover"
                        sizes="32px"
                      />
                    </div>

                    {/* 角色信息区域 */}
                    <div className="flex-1 min-w-0">
                      {/* 角色名和徽章 */}
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate text-white/90">{character.name}</p>
                        {/* 如果角色是高级订阅，显示Pro徽章 */}
                        {character.access_level === 'premium' && (
                          <Badge variant="secondary" className="text-[10px] h-4 px-1 bg-primary/20 text-primary border-primary/20">Pro</Badge>
                        )}
                      </div>
                      {/* 角色描述 */}
                      <p className="text-xs text-white/50 truncate">
                        {character.description}
                      </p>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* 💬 对话列表区域 */}
      <div className="flex-1 overflow-y-auto bg-transparent custom-scrollbar">
        {filteredConversations.length === 0 ? (
          // 空状态：没有匹配的对话
          <div className="p-6 text-center text-muted-foreground">
            {searchQuery ? (
              // 有搜索关键词但无结果
              <>
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>{t('chat.no_search_results')}</p>
              </>
            ) : (
              // 没有任何对话
              <>
                <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="mb-2">{t('chat.no_conversations')}</p>
                <p className="text-sm">{t('chat.start_new_chat')}</p>
              </>
            )}
          </div>
        ) : (
          // 有对话内容，渲染对话列表
          <div className="space-y-2 p-3">
            {/* 遍历过滤后的对话列表 */}
            {filteredConversations.map((conversation) => (
              // 每个对话的可点击按钮
              <button
                key={conversation.id} // React需要的唯一key
                onClick={() => handleConversationClick(conversation)} // 点击切换对话
                // 动态样式：当前对话高亮显示
                className={`w-full text-left p-3 rounded-xl transition-all duration-200 group ${
                  conversation.id === currentConversationId
                    ? 'bg-white/10 shadow-lg shadow-black/20' // 当前选中状态
                    : 'hover:bg-white/5' // 悬停状态
                }`}
              >
                {/* 对话内容：头像 + 信息 */}
                <div className="flex items-start gap-4">
                  {/* 角色头像 */}
                  <div className="relative w-12 h-12 flex-shrink-0">
                    {conversation.characterAvatar ? (
                      <Image
                        src={conversation.characterAvatar}
                        alt={conversation.characterName}
                        fill
                        className="rounded-xl object-cover shadow-sm"
                        sizes="48px"
                      />
                    ) : (
                      <div className="w-full h-full rounded-xl bg-gradient-to-br from-primary/30 to-purple-500/30 flex items-center justify-center shadow-sm">
                        <span className="text-lg font-bold text-white/80">
                          {conversation.characterName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 对话信息文本区域 */}
                  <div className="flex-1 min-w-0 py-0.5">
                    {/* 第一行：角色名 + 徽章 + 时间 */}
                    <div className="flex items-center justify-between mb-1">
                      <h3 className={`font-semibold text-sm truncate ${
                        conversation.id === currentConversationId ? 'text-white' : 'text-white/90'
                      }`}>
                        {conversation.characterName}
                      </h3>
                      <div className="flex items-center gap-1">
                        {/* 未读消息数量徽章 */}
                        {conversation.unreadCount > 0 && (
                          <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                            {conversation.unreadCount}
                          </Badge>
                        )}
                        {/* 相对时间显示 */}
                        <span className="text-[10px] text-white/40 flex-shrink-0">
                          {formatTimeAgo(conversation.lastMessageTime)}
                        </span>
                      </div>
                    </div>
                    {/* 第二行：最后一条消息内容 */}
                    <p className={`text-sm truncate italic ${
                      conversation.id === currentConversationId ? 'text-white/70' : 'text-white/50'
                    }`}>
                      {(conversation.lastMessage || t('chat.no_messages')).replace(/\*/g, '')}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

    </div>
  );
} // 组件结束