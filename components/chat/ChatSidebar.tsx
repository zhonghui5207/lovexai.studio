"use client"; // 标记为客户端组件，因为使用了 useState, useEffect 等React Hooks

// React相关导入
import { useState, useEffect } from "react"; // useState: 管理组件状态, useEffect: 处理副作用
import { useSession } from "next-auth/react"; // 获取用户认证状态

// 图标库导入 - lucide-react 是现代化的图标库
import { MessageCircle, Search, Plus, User } from "lucide-react";

// UI组件导入 - 来自项目自定义的UI组件库
import { Input } from "@/components/ui/input"; // 输入框组件
import { Badge } from "@/components/ui/badge"; // 徽章/标签组件
import { Button } from "@/components/ui/button"; // 按钮组件
import {
  DropdownMenu,           // 下拉菜单容器
  DropdownMenuContent,    // 下拉菜单内容区域
  DropdownMenuItem,       // 下拉菜单单个选项
  DropdownMenuTrigger,    // 触发下拉菜单的按钮/元素
} from "@/components/ui/dropdown-menu";

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
  access_level: string;          // 访问级别 (free/basic/pro/ultra)
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
    if (diffInMinutes < 1) return "Just now";        // 1分钟内
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;  // 1小时内
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;  // 1天内
    return `${Math.floor(diffInMinutes / 1440)}d ago`;      // 超过1天
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
          <p>Please log in to see your conversations</p>
        </div>
      </div>
    );
  }

  // 🎯 已登录用户的主界面渲染
  return (
    // 主容器：固定宽度320px，背景色，右边框，垂直flex布局
    <div className="w-80 bg-muted/30 border-r border-border flex flex-col">

      {/* 📋 顶部Header区域 */}
      <div className="p-4 border-b border-border">
        {/* 标题和新建按钮的横向布局 */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Conversations</h2>

          {/* 🆕 新建聊天下拉菜单 */}
          <DropdownMenu>
            {/* 触发下拉菜单的按钮 */}
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                <Plus className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            {/* 下拉菜单内容区域 */}
            <DropdownMenuContent align="end" className="w-64">
              {/* 遍历所有可用角色，为每个角色创建菜单项 */}
              {availableCharacters.map((character) => (
                <DropdownMenuItem
                  key={character.id} // React需要的唯一key
                  onClick={() => handleNewChatClick(character)} // 点击时调用处理函数
                  className="flex items-center gap-3 p-3"
                >
                  {/* 角色头像 */}
                  <img
                    src={character.avatar_url}
                    alt={character.name}
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    // 图片加载失败时的fallback处理
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      // 使用base64编码的SVG作为默认头像
                      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iMTYiIGZpbGw9IiNGM0Y0RjYiLz4KPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDE2IDE2IiBmaWxsPSIjOUNBM0FGIj48cGF0aCBkPSJNOCA4YzEuMSAwIDItLjkgMi0ycy0uOS0yLTItMi0yIC45LTIgMiAuOSAyIDIgMnoiLz48cGF0aCBkPSJNOCAxNGMtMi4yIDAtNCAxLjgtNCA0djFoOHYtMWMwLTIuMi0xLjgtNC00LTR6Ii8+PC9zdmc+Cjwvc3ZnPgo=';
                    }}
                  />

                  {/* 角色信息区域 */}
                  <div className="flex-1 min-w-0">
                    {/* 角色名和徽章 */}
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{character.name}</p>
                      {/* 如果角色是高级订阅，显示Pro徽章 */}
                      {character.access_level === 'premium' && (
                        <Badge variant="secondary" className="text-xs">Pro</Badge>
                      )}
                    </div>
                    {/* 角色描述 */}
                    <p className="text-xs text-muted-foreground truncate">
                      {character.description}
                    </p>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* 🔍 搜索框区域 */}
        <div className="relative">
          {/* 搜索图标 */}
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)} // 输入时更新搜索状态
            className="pl-9" // 左边距为图标留出空间
          />
        </div>
      </div>

      {/* 💬 对话列表区域 */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          // 空状态：没有匹配的对话
          <div className="p-6 text-center text-muted-foreground">
            {searchQuery ? (
              // 有搜索关键词但无结果
              <>
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No conversations match your search</p>
              </>
            ) : (
              // 没有任何对话
              <>
                <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="mb-2">No conversations yet</p>
                <p className="text-sm">Start a new chat with a character</p>
              </>
            )}
          </div>
        ) : (
          // 有对话内容，渲染对话列表
          <div className="space-y-1 p-2">
            {/* 遍历过滤后的对话列表 */}
            {filteredConversations.map((conversation) => (
              // 每个对话的可点击按钮
              <button
                key={conversation.id} // React需要的唯一key
                onClick={() => handleConversationClick(conversation)} // 点击切换对话
                // 动态样式：当前对话高亮显示
                className={`w-full text-left p-3 rounded-lg transition-all duration-200 hover:bg-muted/50 ${
                  conversation.id === currentConversationId
                    ? 'bg-primary/10 border border-primary/20' // 当前选中状态
                    : 'hover:bg-muted' // 悬停状态
                }`}
              >
                {/* 对话内容：头像 + 信息 */}
                <div className="flex items-start gap-3">
                  {/* 角色头像 */}
                  <img
                    src={conversation.characterAvatar}
                    alt={conversation.characterName}
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    // 图片加载失败时的fallback处理
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iMjAiIGZpbGw9IiNGM0Y0RjYiLz4KPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDIwIDIwIiBmaWxsPSIjOUNBM0FGIj48cGF0aCBkPSJNMTAgMTBjMS4xIDAgMi0uOSAyLTJzLS45LTItMi0yLTIgLjktMiAyIC45IDIgMiAyeiIvPjxwYXRoIGQ9Ik0xMCAxNmMtMi4yIDAtNCAxLjgtNCA0djFoMTB2LTFjMC0yLjItMS44LTQtNC00eiIvPjwvc3ZnPgo8L3N2Zz4K';
                    }}
                  />

                  {/* 对话信息文本区域 */}
                  <div className="flex-1 min-w-0">
                    {/* 第一行：角色名 + 徽章 + 时间 */}
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-sm truncate">
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
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {formatTimeAgo(conversation.lastMessageTime)}
                        </span>
                      </div>
                    </div>
                    {/* 第二行：最后一条消息内容 */}
                    <p className="text-sm text-muted-foreground truncate">
                      {conversation.lastMessage || "No messages yet"}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 👤 底部用户信息区域 */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3">
          {/* 用户信息文本 */}
          <div className="flex-1">
            {/* 用户名或邮箱 */}
            <p className="font-medium text-sm">{session.user?.name || session.user?.email}</p>
            {/* 对话统计 */}
            <p className="text-xs text-muted-foreground">
              {(conversations || []).length} conversation{(conversations || []).length !== 1 ? 's' : ''}
            </p>
          </div>
          {/* 用户操作按钮 */}
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
            <User className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
} // 组件结束