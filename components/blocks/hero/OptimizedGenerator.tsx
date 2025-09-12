"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Wand2 } from "lucide-react";
import { useAppContext } from "@/contexts/app";

interface OptimizedGeneratorProps {
  hero: any; // Hero component props
  onGenerate?: (params: any) => void;
}

export default function OptimizedGenerator({ hero, onGenerate }: OptimizedGeneratorProps) {
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const { user, setShowSignModal, setUser } = useAppContext();
  const credits = user?.credits?.left_credits;

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image size cannot exceed 10MB');
      return;
    }

    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.code === 0) {
        setUploadedImage(result.data.imageUrl);
        console.log('Image upload successful:', result.data.imageUrl);
      } else {
        setError(result.message || 'Upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('Upload failed, please try again');
    }
  };

  // Handle generation
  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    // Check if user is logged in
    if (!user) {
      setShowSignModal(true);
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const requestBody = {
        prompt: prompt.trim(),
        aspect_ratio: aspectRatio,
        mode: uploadedImage ? "image-to-image" : "text-to-image",
        ...(uploadedImage && {
          source_image_url: uploadedImage
        })
      };

      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok && data.code === 0 && data.data?.success) {
        // Success - display the generated image
        setGeneratedImage(data.data.imageUrl);
        console.log("Image generated successfully:", data.data.imageUrl);
        
        // Update user credit information
        if (typeof data.data.remaining_credits === 'number' && user) {
          setUser({
            ...user,
            credits: {
              ...user.credits,
              left_credits: data.data.remaining_credits
            }
          });
        }
        
        if (onGenerate) {
          onGenerate({
            imageUrl: data.data.imageUrl,
            prompt: prompt.trim(),
            mode: uploadedImage ? "image-to-image" : "text-to-image"
          });
        }
      } else {
        // Handle errors
        let errorMsg = "Failed to generate image";
        
        if (data.code !== 0) {
          errorMsg = data.message || "API error";
        } else if (data.data?.error) {
          errorMsg = data.data.error;
        }
        
        if (errorMsg.includes('Insufficient credits')) {
          setError(`💳 Insufficient credits. You need at least 10 credits to generate an image.`);
        } else {
          setError(`❌ ${errorMsg}`);
        }
      }
    } catch (err) {
      setError('⚠️ An unexpected error occurred. Please try again.');
      console.error("Generation error:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const clearUploadedImage = () => {
    setUploadedImage(null);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Main Input Area - Seamlessly integrated */}
      <div className="relative">
        {uploadedImage ? (
          /* Interface after image upload */
          <div className="flex items-start gap-4 p-6 bg-white/5 backdrop-blur-sm border border-emerald-500/30 rounded-2xl">
            {/* Left image preview */}
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-emerald-400/50 shadow-lg transform rotate-[-2deg] hover:rotate-0 transition-transform duration-300">
                <img src={uploadedImage} alt="Uploaded" className="w-full h-full object-cover" />
              </div>
              
              {/* Replace/delete buttons */}
              <div className="absolute -bottom-2 -right-2 flex gap-1">
                <Button
                  size="sm"
                  className="h-5 w-5 rounded-full bg-white/90 hover:bg-white border border-gray-200 shadow-md p-0 transition-all duration-200 hover:scale-110"
                  onClick={() => document.getElementById('image-upload')?.click()}
                >
                  <Plus className="h-2.5 w-2.5 text-gray-600" />
                </Button>
                <Button
                  size="sm" 
                  variant="destructive"
                  className="h-5 w-5 rounded-full shadow-md p-0 transition-all duration-200 hover:scale-110"
                  onClick={clearUploadedImage}
                >
                  <span className="text-xs leading-none">×</span>
                </Button>
              </div>
            </div>
            
            {/* Right input area */}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-emerald-300/80 mb-2 font-medium">📸 Image-to-image mode</p>
              <Input
                type="text"
                placeholder="Describe the changes you want, e.g.: give her sunglasses, change to red clothes"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="h-12 text-base border-0 bg-white/10 backdrop-blur-sm placeholder:text-white/50 text-white focus-visible:ring-2 focus-visible:ring-emerald-400/50 rounded-xl"
                onKeyPress={(e) => e.key === 'Enter' && !isGenerating && handleGenerate()}
                disabled={isGenerating}
              />
            </div>
          </div>
        ) : (
          /* Interface when no image uploaded */
          <div className="flex items-center gap-4 p-6 bg-white/5 backdrop-blur-sm border border-white/20 rounded-2xl hover:bg-white/10 hover:border-white/30 transition-all duration-300">
            {/* Left upload button */}
            <Button
              variant="ghost"
              size="lg"
              className="h-12 w-12 border-2 border-dashed border-white/30 hover:border-white/50 rounded-xl transition-all duration-300 hover:bg-white/10 group flex-shrink-0"
              onClick={() => document.getElementById('image-upload')?.click()}
            >
              <Plus className="h-5 w-5 text-white/60 group-hover:text-white/80 transition-colors" />
            </Button>
            
            {/* Main input box */}
            <div className="flex-1 min-w-0">
              <Input
                type="text"
                placeholder="Enter image generation prompt, e.g.: create a 'Valentine's Day' poster"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="h-12 text-base border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-white/50 text-white"
                onKeyPress={(e) => e.key === 'Enter' && !isGenerating && handleGenerate()}
                disabled={isGenerating}
              />
            </div>
          </div>
        )}
        
        {/* Hidden file input */}
        <input
          id="image-upload"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl backdrop-blur-sm">
          <p className="text-sm text-red-300 font-medium">{error}</p>
        </div>
      )}

      {/* Control Bar */}
      <div className="flex items-center justify-between gap-4">
        {/* Aspect Ratio Selector */}
        <Select value={aspectRatio} onValueChange={setAspectRatio}>
          <SelectTrigger className="w-32 bg-white/5 border-white/20 text-white hover:bg-white/10 focus:ring-2 focus:ring-blue-400/50 transition-all duration-200">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="1:1" className="text-white hover:bg-slate-700">1:1</SelectItem>
            <SelectItem value="16:9" className="text-white hover:bg-slate-700">16:9</SelectItem>
            <SelectItem value="9:16" className="text-white hover:bg-slate-700">9:16</SelectItem>
            <SelectItem value="4:3" className="text-white hover:bg-slate-700">4:3</SelectItem>
          </SelectContent>
        </Select>

        {/* Credits Display - Integrated with controls */}
        {user && typeof credits === 'number' && (
          <div className="flex items-center gap-2 text-sm">
            <span className={`font-medium ${credits < 10 ? 'text-orange-400' : 'text-white'}`}>
              {credits}
            </span>
            <span className="text-white/70">credits</span>
            {credits < 10 && (
              <span className="text-orange-400 text-xs">⚠️ Low</span>
            )}
          </div>
        )}

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          size="lg"
          className="px-8 py-3 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl shadow-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          disabled={!prompt.trim() || isGenerating || (user && typeof credits === 'number' && credits < 10)}
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
              Generating...
            </>
          ) : !user ? (
            "Login to Generate"
          ) : user && typeof credits === 'number' && credits < 10 ? (
            "Need 10 Credits"
          ) : (
            <>
              <Wand2 className="h-4 w-4 mr-2" />
              Generate Image
              <span className="ml-2 text-xs opacity-80">(-10)</span>
            </>
          )}
        </Button>
      </div>

      {/* Generated Image Display */}
      {generatedImage && (
        <div className="p-4 bg-white/5 backdrop-blur-sm border border-emerald-500/20 rounded-2xl">
          <div className="relative rounded-xl overflow-hidden bg-black/20 backdrop-blur-sm">
            <img 
              src={generatedImage} 
              alt={`Generated: ${prompt}`}
              className="w-full h-auto max-h-[600px] object-contain rounded-xl"
            />
            <div className="absolute top-4 right-4 flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => window.open(generatedImage, '_blank')}
                className="bg-black/60 hover:bg-black/80 text-white border-0 backdrop-blur-sm transition-all duration-200"
              >
                View Full Size
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
                className="bg-black/60 hover:bg-black/80 text-white border-0 backdrop-blur-sm transition-all duration-200"
              >
                Download
              </Button>
            </div>
          </div>
          <div className="p-3 text-center">
            <p className="text-sm text-white/70">
              <span className="font-medium text-white">"{prompt}"</span> • 
              <span className="text-emerald-400 font-semibold"> Cost: 10 Credits</span>
              {uploadedImage && <span> • Image-to-Image Mode</span>}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}