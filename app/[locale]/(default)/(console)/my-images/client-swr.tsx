"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Icon from "@/components/icon";
import Link from "next/link";
import { useUserImages } from "@/lib/swr";

interface ImageGeneration {
  uuid: string;
  user_uuid: string;
  created_at: string;
  prompt: string;
  storage_url: string;
  credits_cost?: number;
  status?: string;
}

interface UserImageStats {
  total_count: number;
  today_count: number;
  monthly_count: number;
  monthly_credits: number;
}

export default function MyImagesClientSWR() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [selectedImage, setSelectedImage] = useState<ImageGeneration | null>(null);

  const pageSize = 12;

  // 使用 SWR 获取数据
  const { data, isLoading, isError, mutate } = useUserImages(currentPage, pageSize, searchTerm, sortOrder);

  const images: ImageGeneration[] = data?.images || [];
  const stats: UserImageStats | undefined = data?.stats;

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1); // 搜索时重置到第一页
  };

  const handleSort = (order: 'newest' | 'oldest') => {
    setSortOrder(order);
    setCurrentPage(1); // 排序时重置到第一页
  };

  const handleDeleteImage = async (imageUuid: string) => {
    try {
      const response = await fetch(`/api/my-images/${imageUuid}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      
      if (result.code !== 0) {
        throw new Error(result.message || 'Delete failed');
      }

      // 刷新数据
      mutate();
      setSelectedImage(null);
    } catch (error) {
      console.error('Delete error:', error);
      alert('Delete failed, please try again');
    }
  };

  if (isError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <Icon name="RiErrorWarningLine" className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            Loading Failed
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Unable to load image history, please refresh and try again
          </p>
          <Button onClick={() => mutate()} variant="outline">
            <Icon name="RiRefreshLine" className="mr-2 h-4 w-4" />
            Reload
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-6">My Images</h1>
        
        {/* 统计信息 - 仅在第一页显示 */}
        {currentPage === 1 && stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Total</p>
                  <p className="text-2xl font-bold text-blue-700">{stats.total_count}</p>
                </div>
                <Icon name="RiImageLine" className="h-8 w-8 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Today</p>
                  <p className="text-2xl font-bold text-green-700">{stats.today_count}</p>
                </div>
                <Icon name="RiCalendarTodayLine" className="h-8 w-8 text-green-500" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium">This Month</p>
                  <p className="text-2xl font-bold text-purple-700">{stats.monthly_count}</p>
                </div>
                <Icon name="RiCalendarLine" className="h-8 w-8 text-purple-500" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 text-sm font-medium">Credits Used</p>
                  <p className="text-2xl font-bold text-orange-700">{stats.monthly_credits}</p>
                </div>
                <Icon name="RiCopperCoinLine" className="h-8 w-8 text-orange-500" />
              </div>
            </div>
          </div>
        )}

        {/* 搜索和排序 */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search image descriptions..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={sortOrder === 'newest' ? 'default' : 'outline'}
              onClick={() => handleSort('newest')}
            >
              <Icon name="RiSortDesc" className="mr-2 h-4 w-4" />
              Newest
            </Button>
            <Button
              variant={sortOrder === 'oldest' ? 'default' : 'outline'}
              onClick={() => handleSort('oldest')}
            >
              <Icon name="RiSortAsc" className="mr-2 h-4 w-4" />
              Oldest
            </Button>
          </div>
        </div>
      </div>

      {/* 加载状态 */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: pageSize }).map((_, i) => (
            <div key={i} className="aspect-square bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          {/* 图片网格 */}
          {images.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {images.map((image) => (
                <div
                  key={image.uuid}
                  className="group relative aspect-square overflow-hidden rounded-xl bg-muted cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg"
                  onClick={() => setSelectedImage(image)}
                >
                  <img
                    src={image.storage_url}
                    alt={image.prompt}
                    className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                    <Icon name="RiEyeLine" className="h-8 w-8 text-white" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                    <p className="text-white text-sm line-clamp-2 mb-2">
                      {image.prompt}
                    </p>
                    <div className="flex items-center justify-between text-xs text-white/80">
                      <span>{new Date(image.created_at).toLocaleDateString()}</span>
                      {image.credits_cost && (
                        <span className="bg-primary/20 px-2 py-1 rounded">
                          {image.credits_cost} credits
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Icon name="RiImageLine" className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                {searchTerm ? 'No matching images found' : 'No images generated yet'}
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                {searchTerm ? 'Try a different search term' : 'Generate your first AI image on the homepage'}
              </p>
              <Button asChild>
                <Link href="/">
                  <Icon name="RiAddLine" className="mr-2 h-4 w-4" />
                  Generate Now
                </Link>
              </Button>
            </div>
          )}

          {/* 分页控制 */}
          {images.length === pageSize && (
            <div className="flex justify-center items-center space-x-4 mt-8">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <Icon name="RiArrowLeftSLine" className="mr-2 h-4 w-4" />
                Previous
              </Button>
              
              <span className="text-sm text-muted-foreground">
                Page {currentPage}
              </span>
              
              <Button
                variant="outline"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={images.length < pageSize}
              >
                Next
                <Icon name="RiArrowRightSLine" className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* 图片详情模态框 */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl">
          {selectedImage && (
            <>
              <DialogHeader>
                <DialogTitle>Image Details</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="relative">
                  <img
                    src={selectedImage.storage_url}
                    alt={selectedImage.prompt}
                    className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
                  />
                </div>
                
                <div className="space-y-2">
                  <div>
                    <h4 className="font-semibold mb-1">Prompt</h4>
                    <p className="text-sm text-muted-foreground">{selectedImage.prompt}</p>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>Generated: {new Date(selectedImage.created_at).toLocaleString()}</span>
                    {selectedImage.credits_cost && (
                      <span>Credits: {selectedImage.credits_cost}</span>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const a = document.createElement('a');
                      a.href = selectedImage.storage_url;
                      a.download = `image-${selectedImage.uuid}.png`;
                      a.click();
                    }}
                  >
                    <Icon name="RiDownloadLine" className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                  
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteImage(selectedImage.uuid)}
                  >
                    <Icon name="RiDeleteBinLine" className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}