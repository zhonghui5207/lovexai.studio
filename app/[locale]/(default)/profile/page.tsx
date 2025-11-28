"use client";

import { useAppContext } from "@/contexts/app";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Search, Filter, Plus, User as UserIcon, Heart } from "lucide-react";
import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { ProfileSettingsDialog } from "@/components/profile/ProfileSettingsDialog";

export default function ProfilePage() {
  const { user } = useAppContext();
  const router = useRouter();
  const [isNsfw, setIsNsfw] = useState(false);

  if (!user) {
    return (
        <div className="flex items-center justify-center w-full min-h-screen text-white">
            <div className="animate-pulse text-lg">Loading user profile...</div>
        </div>
    );
  }

  return (
    <div className="flex flex-col w-full min-h-screen text-white p-6 md:p-12 space-y-10 max-w-[1920px] mx-auto">
      {/* 1. 顶部用户信息区域 */}
      <div className="flex flex-col gap-6">
        {/* Banner 区域 */}
        <div className="h-80 w-full rounded-2xl relative overflow-hidden border border-white/5 group">
           {/* Background Image */}
           <div className="absolute inset-0 bg-[url('/imgs/default_banner.png')] bg-cover bg-center transition-transform duration-700 group-hover:scale-105"></div>
           
           {/* Gradient Overlay - Stronger at bottom for text readability */}
           <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-black/40 to-transparent"></div>

           {/* Content Positioned at Bottom */}
           <div className="absolute bottom-0 left-0 right-0 p-8 flex flex-col md:flex-row items-end gap-6 z-10">
                {/* Avatar */}
                <div className="relative shrink-0">
                    <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-[#0a0a0a] shadow-2xl ring-1 ring-white/10">
                        <AvatarImage src={user.avatar_url} alt={user.nickname || "User"} className="object-cover" />
                        <AvatarFallback className="bg-primary text-primary-foreground text-5xl">
                            {user.nickname?.charAt(0)?.toUpperCase() || "U"}
                        </AvatarFallback>
                    </Avatar>
                </div>

                {/* User Info & Actions */}
                <div className="flex-1 flex flex-col md:flex-row items-end justify-between gap-4 w-full pb-2">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight drop-shadow-lg">{user.nickname || "User"}</h1>
                            <Badge variant={user.credits?.is_pro ? "default" : "secondary"} className="h-6 px-3 shadow-lg">
                                {user.credits?.is_pro ? "PRO" : "FREE"}
                            </Badge>
                        </div>
                        <p className="text-white/80 text-base font-medium drop-shadow-md">{user.email || "user@example.com"}</p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <ProfileSettingsDialog user={user} />
                    </div>
                </div>
           </div>
        </div>
      </div>

      {/* 2. 标签页导航与内容 */}
      <Tabs defaultValue="companions" className="w-full">
        <div className="border-b border-white/10 mb-8">
            <TabsList className="bg-transparent h-auto p-0 space-x-8">
                {["Companions", "Favorites", "Images", "Personas"].map((tab) => (
                    <TabsTrigger 
                        key={tab}
                        value={tab.toLowerCase()} 
                        className="bg-transparent px-0 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-muted-foreground data-[state=active]:text-white text-lg font-medium transition-all hover:text-white/80"
                    >
                        {tab}
                    </TabsTrigger>
                ))}
            </TabsList>
        </div>

        {/* Companions 内容区域 */}
        <TabsContent value="companions" className="space-y-8 animate-in fade-in-50 duration-500">
            {/* 工具栏 */}
            <div className="flex flex-col xl:flex-row gap-6 items-start xl:items-center justify-between">
                <div className="relative w-full xl:w-[500px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input 
                        placeholder="Search Companions..." 
                        className="pl-12 h-12 text-base bg-black/20 border-white/10 focus:bg-black/40 focus:border-primary/50 transition-all rounded-full"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto justify-end">
                    <Select defaultValue="newest">
                        <SelectTrigger className="w-[140px] h-12 bg-black/20 border-white/10 rounded-full">
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="newest" className="focus:bg-primary focus:text-white cursor-pointer">Newest</SelectItem>
                            <SelectItem value="popular" className="focus:bg-primary focus:text-white cursor-pointer">Popular</SelectItem>
                            <SelectItem value="oldest" className="focus:bg-primary focus:text-white cursor-pointer">Oldest</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button variant="outline" size="icon" className="h-12 w-12 bg-black/20 border-white/10 hover:bg-primary/10 hover:text-primary hover:border-primary/50 rounded-full transition-all">
                        <Filter className="w-5 h-5" />
                    </Button>

                    <div className="flex items-center gap-3 px-4 h-12 bg-black/20 rounded-full border border-white/10">
                        <span className="text-sm font-medium text-muted-foreground">NSFW</span>
                        <Switch 
                            checked={isNsfw} 
                            onCheckedChange={setIsNsfw}
                            className="data-[state=checked]:bg-primary"
                        />
                    </div>

                    <Button className="h-12 px-6 bg-primary hover:bg-primary/90 text-white gap-2 rounded-full text-base font-medium shadow-lg shadow-primary/20 transition-all hover:scale-105">
                        <Plus className="w-5 h-5" />
                        <span className="hidden sm:inline">Create Companion</span>
                    </Button>
                </div>
            </div>

            {/* 内容网格 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                {/* 示例卡片 */}
                <div className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-neutral-900 border border-white/5 transition-all duration-300 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 cursor-pointer">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/90 z-10 opacity-60 group-hover:opacity-90 transition-opacity" />
                    <img 
                        src="/generated_characters/character_street_fashion.png" 
                        alt="Jane Doe" 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        onError={(e) => {
                            e.currentTarget.src = "/placeholder.png";
                        }}
                    />
                    
                    <div className="absolute top-4 left-4 z-20">
                        <div className="px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-xs font-semibold text-white border border-white/10 flex items-center gap-1.5 shadow-lg">
                            <UserIcon className="w-3.5 h-3.5" />
                            Private
                        </div>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-6 z-20 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        <h3 className="text-xl font-bold text-white mb-2 drop-shadow-md">Jane Doe</h3>
                        <p className="text-sm text-white/70 line-clamp-2 group-hover:text-white/90 transition-colors leading-relaxed">
                            A sassy street fashion enthusiast who loves exploring neon-lit city streets and discovering hidden cafes.
                        </p>
                    </div>
                </div>
                
                {/* 空状态占位 */}
                {[1, 2, 3, 4].map((i) => (
                     <div key={i} className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-white/5 border border-white/5 flex flex-col items-center justify-center border-dashed hover:bg-white/10 hover:border-primary/30 transition-all cursor-pointer">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:scale-110 transition-all duration-300 shadow-xl">
                            <Plus className="w-8 h-8 text-white/50 group-hover:text-white" />
                        </div>
                        <p className="text-base font-medium text-muted-foreground group-hover:text-white transition-colors">Create New</p>
                    </div>
                ))}
            </div>
        </TabsContent>

        <TabsContent value="favorites">
            <div className="flex flex-col items-center justify-center py-32 text-muted-foreground bg-white/5 rounded-2xl border border-white/5 border-dashed">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                    <Heart className="w-8 h-8 opacity-50" />
                </div>
                <p className="text-lg">No favorites found yet.</p>
            </div>
        </TabsContent>

        <TabsContent value="images">
             <div className="flex flex-col items-center justify-center py-32 text-muted-foreground bg-white/5 rounded-2xl border border-white/5 border-dashed">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                     <UserIcon className="w-8 h-8 opacity-50" />
                </div>
                <p className="text-lg">No images generated yet.</p>
            </div>
        </TabsContent>

        <TabsContent value="personas">
             <div className="flex flex-col items-center justify-center py-32 text-muted-foreground bg-white/5 rounded-2xl border border-white/5 border-dashed">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                     <UserIcon className="w-8 h-8 opacity-50" />
                </div>
                <p className="text-lg">No personas created yet.</p>
            </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}


