"use client";

import { useAppContext } from "@/contexts/app";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Search, Filter, Plus, User as UserIcon, Heart, Bookmark, MessageCircle, Lock, Globe, X, ImageIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { ProfileSettingsDialog } from "@/components/profile/ProfileSettingsDialog";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export default function ProfilePage() {
  const { user } = useAppContext();
  const router = useRouter();
  const [isNsfw, setIsNsfw] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Convex hooks
  const ensureUser = useMutation(api.users.ensureUser);
  const [convexUserId, setConvexUserId] = useState<Id<"users"> | null>(null);
  
  // Get real user data from Convex by email
  const convexUser = useQuery(api.users.getByEmail, user?.email ? { email: user.email } : "skip");
  const subscriptionTier = convexUser?.subscription_tier || 'free';
  
  // Sync user with Convex
  useEffect(() => {
    if (user?.email && !convexUserId) {
      ensureUser({
        email: user.email,
        name: user.nickname || "User",
        avatar_url: user.avatar_url || "",
      }).then((id) => {
        setConvexUserId(id);
      }).catch((err) => {
        console.error("Failed to sync user:", err);
      });
    }
  }, [user, convexUserId, ensureUser]);

  // Fetch user's created characters (creator_id is stored as string)
  const myCharacters = useQuery(
    api.characters.getByCreator,
    convexUserId ? { creatorId: convexUserId as string } : "skip"
  );

  // Fetch user's favorite characters
  const myFavorites = useQuery(
    api.interactions.getUserFavorites,
    convexUserId ? { userId: convexUserId as string } : "skip"
  );

  // Fetch user's generated images (now using unified convexUserId)
  const myImages = useQuery(
    api.images.listMine,
    convexUserId ? { userId: convexUserId as string } : "skip"
  );

  // Delete character mutation
  const deleteCharacter = useMutation(api.characters.remove);
  const [deletingId, setDeletingId] = useState<Id<"characters"> | null>(null);

  // Delete image mutation
  const deleteImage = useMutation(api.images.remove);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);

  const handleDelete = async (characterId: Id<"characters">, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!convexUserId) return;
    if (!confirm("Are you sure you want to delete this character? This cannot be undone.")) return;
    
    setDeletingId(characterId);
    try {
      await deleteCharacter({ id: characterId, creatorId: convexUserId as string });
    } catch (err) {
      console.error("Failed to delete:", err);
      alert("Failed to delete character");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteImage = async (imageId: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm("Are you sure you want to delete this image?")) return;
    
    setDeletingImageId(imageId);
    try {
      await deleteImage({ id: imageId });
    } catch (err) {
      console.error("Failed to delete image:", err);
      alert("Failed to delete image");
    } finally {
      setDeletingImageId(null);
    }
  };

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
                            <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight drop-shadow-lg">{convexUser?.name || user.nickname || "User"}</h1>
                            <Badge 
                              variant={subscriptionTier !== 'free' ? "default" : "secondary"} 
                              className={`h-6 px-3 shadow-lg ${subscriptionTier === 'ultimate' ? 'bg-yellow-500' : subscriptionTier === 'pro' ? 'bg-purple-500' : subscriptionTier === 'plus' ? 'bg-blue-500' : ''}`}
                            >
                                {subscriptionTier.toUpperCase()}
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
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
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

                    <Link href="/create">
                        <Button className="h-12 px-6 bg-primary hover:bg-primary/90 text-white gap-2 rounded-full text-base font-medium shadow-lg shadow-primary/20 transition-all hover:scale-105">
                            <Plus className="w-5 h-5" />
                            <span className="hidden sm:inline">Create Companion</span>
                        </Button>
                    </Link>
                </div>
            </div>

            {/* 内容网格 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                {myCharacters === undefined ? (
                    // Loading state
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="aspect-[3/4] rounded-2xl bg-neutral-900 animate-pulse border border-white/5" />
                    ))
                ) : myCharacters.length === 0 ? (
                    // Empty state
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-muted-foreground">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                            <Plus className="w-8 h-8 opacity-50" />
                        </div>
                        <p className="text-lg mb-4">No companions created yet</p>
                        <Link href="/create">
                            <Button className="gap-2">
                                <Plus className="w-4 h-4" />
                                Create Your First Companion
                            </Button>
                        </Link>
                    </div>
                ) : (
                    // Character cards
                    myCharacters
                        .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((character) => (
                        <Link href={`/chat?characterId=${character._id}`} key={character._id}>
                            <div className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-neutral-900 border border-white/5 transition-all duration-300 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 cursor-pointer">
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/90 z-10 opacity-60 group-hover:opacity-90 transition-opacity" />
                                <img 
                                    src={character.avatar_url || "/generated_characters/character_street_fashion.png"} 
                                    alt={character.name} 
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    onError={(e) => {
                                        e.currentTarget.src = "/placeholder.png";
                                    }}
                                />
                                
                                {/* Status Badge - Left */}
                                <div className="absolute top-4 left-4 z-20">
                                    <div className={`px-3 py-1.5 rounded-full backdrop-blur-md text-xs font-semibold border shadow-lg flex items-center gap-1.5 ${
                                        character.access_level === "free" 
                                            ? "bg-green-500/20 text-green-400 border-green-500/30" 
                                            : "bg-black/60 text-white border-white/10"
                                    }`}>
                                        {character.access_level === "free" ? (
                                            <><Globe className="w-3.5 h-3.5" /> Public</>
                                        ) : (
                                            <><Lock className="w-3.5 h-3.5" /> Private</>
                                        )}
                                    </div>
                                </div>

                                {/* Stats + Delete */}
                                <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
                                    <div className="px-2 py-1 rounded-full bg-black/60 backdrop-blur-md text-xs text-white/80 flex items-center gap-1">
                                        <Heart className="w-3 h-3" />
                                        {character.like_count || 0}
                                    </div>
                                    <div className="px-2 py-1 rounded-full bg-black/60 backdrop-blur-md text-xs text-white/80 flex items-center gap-1">
                                        <MessageCircle className="w-3 h-3" />
                                        {character.chat_count || "0"}
                                    </div>
                                    <button
                                        onClick={(e) => handleDelete(character._id, e)}
                                        disabled={deletingId === character._id}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-500/80 hover:bg-red-500 text-white rounded-full p-1 shadow-md"
                                        title="Delete"
                                    >
                                        <X className={`w-3 h-3 ${deletingId === character._id ? 'animate-spin' : ''}`} />
                                    </button>
                                </div>

                                <div className="absolute bottom-0 left-0 right-0 p-6 z-20 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                    <h3 className="text-xl font-bold text-white mb-2 drop-shadow-md">{character.name}</h3>
                                    <p className="text-sm text-white/70 line-clamp-2 group-hover:text-white/90 transition-colors leading-relaxed">
                                        {character.description}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </TabsContent>

        <TabsContent value="favorites" className="space-y-8 animate-in fade-in-50 duration-500">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                {myFavorites === undefined ? (
                    // Loading state
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="aspect-[3/4] rounded-2xl bg-neutral-900 animate-pulse border border-white/5" />
                    ))
                ) : myFavorites.length === 0 ? (
                    // Empty state
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-muted-foreground">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                            <Heart className="w-8 h-8 opacity-50" />
                        </div>
                        <p className="text-lg mb-4">No favorites yet</p>
                        <Link href="/discover">
                            <Button variant="outline" className="gap-2">
                                <Heart className="w-4 h-4" />
                                Discover Characters
                            </Button>
                        </Link>
                    </div>
                ) : (
                    // Favorite character cards
                    myFavorites.map((character: any) => (
                        <Link href={`/chat?characterId=${character._id}`} key={character._id}>
                            <div className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-neutral-900 border border-white/5 transition-all duration-300 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 cursor-pointer">
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/90 z-10 opacity-60 group-hover:opacity-90 transition-opacity" />
                                <img 
                                    src={character.avatar_url || "/generated_characters/character_street_fashion.png"} 
                                    alt={character.name} 
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    onError={(e) => {
                                        e.currentTarget.src = "/placeholder.png";
                                    }}
                                />
                                
                                {/* Favorited Badge */}
                                <div className="absolute top-4 left-4 z-20">
                                    <div className="px-3 py-1.5 rounded-full bg-yellow-500/20 backdrop-blur-md text-xs font-semibold text-yellow-400 border border-yellow-500/30 shadow-lg flex items-center gap-1.5">
                                        <Bookmark className="w-3.5 h-3.5 fill-current" />
                                        Favorited
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="absolute top-4 right-4 z-20 flex gap-2">
                                    <div className="px-2 py-1 rounded-full bg-black/60 backdrop-blur-md text-xs text-white/80 flex items-center gap-1">
                                        <Heart className="w-3 h-3" />
                                        {character.like_count || 0}
                                    </div>
                                </div>

                                <div className="absolute bottom-0 left-0 right-0 p-6 z-20 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                    <h3 className="text-xl font-bold text-white mb-2 drop-shadow-md">{character.name}</h3>
                                    <p className="text-sm text-white/70 line-clamp-2 group-hover:text-white/90 transition-colors leading-relaxed">
                                        {character.description}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </TabsContent>

        <TabsContent value="images" className="space-y-8 animate-in fade-in-50 duration-500">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                {myImages === undefined ? (
                    // Loading state
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="aspect-square rounded-xl bg-neutral-900 animate-pulse border border-white/5" />
                    ))
                ) : myImages.length === 0 ? (
                    // Empty state
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-muted-foreground">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                            <ImageIcon className="w-8 h-8 opacity-50" />
                        </div>
                        <p className="text-lg mb-4">No images generated yet</p>
                        <Link href="/generate">
                            <Button variant="outline" className="gap-2">
                                <ImageIcon className="w-4 h-4" />
                                Generate Images
                            </Button>
                        </Link>
                    </div>
                ) : (
                    // Image cards
                    myImages.map((image: any) => (
                        <div key={image._id} className="group relative aspect-square rounded-xl overflow-hidden bg-neutral-900 border border-white/5 transition-all duration-300 hover:border-primary/50 hover:shadow-xl cursor-pointer">
                            <img 
                                src={image.image_url} 
                                alt={image.prompt || "Generated image"} 
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                onError={(e) => {
                                    e.currentTarget.src = "/placeholder.png";
                                }}
                            />
                            {/* Overlay on hover */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                <p className="text-xs text-white/90 line-clamp-2">{image.prompt}</p>
                            </div>
                            {/* Delete button */}
                            <button 
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20 bg-red-500 text-white rounded-full p-1.5 shadow-md hover:bg-red-600 hover:scale-110"
                                onClick={(e) => handleDeleteImage(image._id, e)}
                                disabled={deletingImageId === image._id}
                                title="Delete image"
                            >
                                <X className={`w-3.5 h-3.5 ${deletingImageId === image._id ? 'animate-spin' : ''}`} />
                            </button>
                            {/* Status badge */}
                            {image.status === "failed" && (
                                <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-red-500/80 text-xs text-white">
                                    Failed
                                </div>
                            )}
                        </div>
                    ))
                )}
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


