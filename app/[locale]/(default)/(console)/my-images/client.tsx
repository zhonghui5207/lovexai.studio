"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Calendar, Download, Trash2, MoreHorizontal, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface ImageGeneration {
  uuid: string;
  prompt: string;
  revised_prompt?: string;
  aspect_ratio?: string;
  model?: string;
  storage_url: string;
  credits_cost?: number;
  created_at: string;
  status?: string;
}

interface ImageStats {
  total_count: number;
  today_count: number;
  monthly_count: number;
  monthly_credits: number;
}

interface ApiResponse {
  code: number;
  message: string;
  data?: {
    images: ImageGeneration[];
    stats?: ImageStats;
    pagination: {
      page: number;
      limit: number;
      hasMore: boolean;
    };
    filters: {
      search: string;
      sort: 'newest' | 'oldest';
    };
  };
}

export default function MyImagesClient() {
  const [images, setImages] = useState<ImageGeneration[]>([]);
  const [stats, setStats] = useState<ImageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [selectedImage, setSelectedImage] = useState<ImageGeneration | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchImages = async (pageNum: number = 1, isLoadMore: boolean = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '12',
        search: searchTerm,
        sort: sortBy,
      });

      const response = await fetch(`/api/my-images?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result: ApiResponse = await response.json();

      // 检查API响应格式 - 使用项目的标准响应格式
      if (result.code !== 0) {
        throw new Error(result.message || 'API request failed');
      }
      
      // 对于空数据的情况，直接设置空数组而不是抛出错误  
      if (!result.data) {
        // 设置空数据
        if (isLoadMore) {
          // Load more时不改变现有数据
        } else {
          setImages([]);
          setStats({
            total_count: 0,
            today_count: 0,
            monthly_count: 0,
            monthly_credits: 0
          });
        }
        setHasMore(false);
        setPage(pageNum);
        return;
      }

      const { images: newImages = [], stats: newStats, pagination } = result.data;

      if (isLoadMore) {
        setImages(prev => [...prev, ...newImages]);
      } else {
        setImages(newImages);
        if (newStats) {
          setStats(newStats);
        }
      }

      setHasMore(pagination.hasMore);
      setPage(pageNum);

    } catch (error) {
      console.error('Failed to fetch images:', error);
      // 对于新用户或空数据情况，不显示错误提示
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch images';
      if (!errorMessage.includes('no auth') && !errorMessage.includes('empty')) {
        toast.error(errorMessage);
      }
      
      // 即使出错也设置空数据，避免无限loading
      setImages([]);
      setStats({
        total_count: 0,
        today_count: 0,
        monthly_count: 0,
        monthly_credits: 0
      });
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchImages(1, false);
  };

  const handleLoadMore = () => {
    if (hasMore && !loadingMore) {
      fetchImages(page + 1, true);
    }
  };

  const handleDelete = async (uuid: string) => {
    try {
      const response = await fetch(`/api/my-images/${uuid}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (result.code !== 0) {
        throw new Error(result.message || 'Failed to delete image');
      }
      
      setImages(prev => prev.filter(img => img.uuid !== uuid));
      setSelectedImage(null);
      toast.success('Image deleted successfully');
      
      // Update stats if we have them
      if (stats) {
        setStats(prev => prev ? {
          ...prev,
          total_count: prev.total_count - 1
        } : null);
      }
    } catch (error) {
      console.error('Failed to delete image:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete image');
    }
  };

  const downloadImage = async (imageUrl: string, filename: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Image downloaded');
    } catch (error) {
      console.error('Failed to download image:', error);
      toast.error('Failed to download image');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  useEffect(() => {
    fetchImages(1, false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, sortBy]);

  return (
    <div className="space-y-8">
      {/* Statistics Panel - Unified lightweight design */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-white/70 font-medium mb-1">Total</div>
                <div className="text-2xl font-bold text-white">{stats.total_count}</div>
              </div>
              <ImageIcon className="h-8 w-8 text-white/40" />
            </div>
          </div>
          
          <div className="p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-white/70 font-medium mb-1">Today</div>
                <div className="text-2xl font-bold text-white">{stats.today_count}</div>
              </div>
              <Calendar className="h-8 w-8 text-white/40" />
            </div>
          </div>
          
          <div className="p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-white/70 font-medium mb-1">This Month</div>
                <div className="text-2xl font-bold text-white">{stats.monthly_count}</div>
              </div>
              <Calendar className="h-8 w-8 text-white/40" />
            </div>
          </div>
          
          <div className="p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-white/70 font-medium mb-1">Credits Used</div>
                <div className="text-2xl font-bold text-white">{stats.monthly_credits}</div>
              </div>
              <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                <div className="h-4 w-4 rounded-full bg-white/60"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter Controls - Unified style */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 h-4 w-4" />
          <Input
            placeholder="Search image descriptions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/40"
          />
        </div>
        
        <Select value={sortBy} onValueChange={(value: 'newest' | 'oldest') => setSortBy(value)}>
          <SelectTrigger className="w-full sm:w-[180px] bg-white/5 border-white/10 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-800/95 backdrop-blur-sm border-white/10">
            <SelectItem value="newest" className="text-white hover:bg-white/10">Newest First</SelectItem>
            <SelectItem value="oldest" className="text-white hover:bg-white/10">Oldest First</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/20 border-t-white"></div>
        </div>
      )}

      {/* Empty State */}
      {!loading && images.length === 0 && (
        <div className="p-16 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl">
          <div className="flex flex-col items-center justify-center">
            <ImageIcon className="h-12 w-12 text-white/40 mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-white">No Images Found</h3>
            <p className="text-white/70 text-center mb-4">
              {searchTerm 
                ? 'Try adjusting your search terms or clear the search to see all images' 
                : 'You haven\'t generated any images yet. Start creating some beautiful AI images!'}
            </p>
            {!searchTerm && (
              <Button 
                onClick={() => window.location.href = '/'}
                className="mt-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600"
              >
                Generate Your First Image
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Images Grid */}
      {!loading && images.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {images.map((image) => (
            <div key={image.uuid} className="group overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl transform hover:scale-105" onClick={() => setSelectedImage(image)}>
              <div className="relative aspect-square">
                <img
                  src={image.storage_url}
                  alt={image.prompt}
                  className="w-full h-full object-cover rounded-t-2xl"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder-image.jpg';
                  }}
                />
                
                {/* Prompt overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent rounded-t-2xl">
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-white text-sm font-medium line-clamp-2">
                      {image.prompt}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-white/80 text-xs">{formatDate(image.created_at).split(',')[0]}</span>
                      {image.credits_cost && (
                        <span className="text-white/80 text-xs">{image.credits_cost} credits</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load More Button */}
      {!loading && hasMore && (
        <div className="flex justify-center pt-6">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="bg-white/5 border-white/10 text-white hover:bg-white/10"
          >
            {loadingMore ? 'Loading...' : 'Load More'}
          </Button>
        </div>
      )}

      {/* Image Detail Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl bg-slate-900/95 backdrop-blur-sm border-white/10">
          {selectedImage && (
            <>
              <DialogHeader>
                <DialogTitle className="text-white">Image Details</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                <div className="aspect-video w-full rounded-lg overflow-hidden">
                  <img
                    src={selectedImage.storage_url}
                    alt={selectedImage.prompt}
                    className="w-full h-full object-contain bg-white/5"
                  />
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2 text-white">Prompt</h4>
                    <p className="text-sm text-white/70">{selectedImage.prompt}</p>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/70">Generated: {formatDate(selectedImage.created_at)}</span>
                    <span className="text-white/70">Credits: {selectedImage.credits_cost || 10}</span>
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={() => downloadImage(selectedImage.storage_url, `${selectedImage.uuid}.png`)}
                      variant="outline"
                      className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    
                    <Button
                      variant="destructive"
                      onClick={() => handleDelete(selectedImage.uuid)}
                      className="flex-1 bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}