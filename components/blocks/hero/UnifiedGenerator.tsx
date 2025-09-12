"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, Plus, X, ImageIcon, VideoIcon } from "lucide-react";
import { useAppContext } from "@/contexts/app";

interface UnifiedGeneratorProps {
  hero: any; // Hero component props
}

export default function UnifiedGenerator({ hero }: UnifiedGeneratorProps) {
  const [mode, setMode] = useState<"image" | "video">("image");
  const [generationType, setGenerationType] = useState<"text-to-image" | "image-to-image">("text-to-image");
  const [prompt, setPrompt] = useState("");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { user, setShowSignModal, setUser } = useAppContext();
  const credits = user?.credits?.left_credits;

  // Temporary debug
  console.log('DEBUG - User exists:', !!user);
  console.log('DEBUG - Credits value:', credits);
  console.log('DEBUG - Credits type:', typeof credits);
  console.log('DEBUG - Should show credits?', user && typeof credits === 'number');

  // Get placeholder text
  const getPlaceholder = (): string => {
    if (uploadedImage) {
      return "Describe the changes you want, e.g.: give her sunglasses, change to red clothes";
    }
    return hero.prompt_input?.placeholder || "Enter image generation prompt, e.g.: create a 'Valentine's Day' poster";
  };

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

    setIsUploading(true);
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
        setGenerationType("image-to-image");
        console.log('Image upload successful:', result.data.imageUrl);
      } else {
        setError(result.message || 'Upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('Upload failed, please try again');
    } finally {
      setIsUploading(false);
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
        mode: generationType,
        ...(generationType === "image-to-image" && uploadedImage && {
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
      console.log("Image generation API full response:", data);

      if (response.ok && data.code === 0 && data.data?.success) {
        setGeneratedImage(data.data.imageUrl);
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
        console.log("Image generated successfully:", data.data.imageUrl);
      } else {
        // Handle API error response
        let errorMsg = "Failed to generate image";
        
        if (data.code !== 0) {
          errorMsg = data.message || "API error";
        } else if (data.data?.error) {
          errorMsg = data.data.error;
        } else if (!response.ok) {
          errorMsg = `HTTP ${response.status}: ${response.statusText}`;
        }
        
        if (errorMsg.includes('Insufficient credits')) {
          setError(`💳 Insufficient credits. You need at least 10 credits to generate an image.`);
        } else if (errorMsg.includes('fetch failed') || errorMsg.includes('Network error')) {
          setError('🌐 Network connection failed. Please check your internet and try again.');
        } else if (errorMsg.includes('API error') || errorMsg.includes('Failed to generate')) {
          setError('⚠️ Image generation temporarily unavailable. Please try again in a moment.');
        } else {
          setError(`❌ ${errorMsg}`);
        }
        
        if (process.env.NODE_ENV === 'development') {
          console.error("Generation failed:", errorMsg, "Full response:", data);
        }
      }
    } catch (err) {
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('🌐 Network connection failed. Please check your internet and try again.');
      } else if (err instanceof Error) {
        setError(`⚠️ Something went wrong: ${err.message}`);
      } else {
        setError('⚠️ An unexpected error occurred. Please try again.');
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.error("Generation error:", err);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Clear uploaded image
  const clearUploadedImage = () => {
    setUploadedImage(null);
    setGenerationType("text-to-image");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Credits Display - Simplified for debug */}
      {user && (
        <div className="text-center">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-full shadow-lg backdrop-blur-sm">
            <div className="flex items-center gap-2 text-primary font-semibold">
              <span className="text-lg">
                {credits || credits === 0 ? credits : 'No Credits Data'}
              </span>
            </div>
            <div className="h-4 w-px bg-white/20" />
            <span className="text-sm text-muted-foreground">Credits Available</span>
          </div>
        </div>
      )}

      {/* No credits warning */}
      {user && typeof credits === 'number' && credits < 10 && (
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-600">
            <span className="text-sm">⚠️ Low Credits: Only {credits} remaining</span>
          </div>
        </div>
      )}

      {/* Main Generator Interface */}
      <div className="relative">
        {/* Interface when no image uploaded */}
        {!uploadedImage && (
          <div className="flex items-start gap-4 p-4 bg-background/60 backdrop-blur-sm border border-border/50 rounded-2xl shadow-2xl">
            {/* Left upload button */}
            <div className="relative">
              <Button
                variant="ghost"
                size="lg"
                className="h-24 w-24 border-2 border-dashed border-gray-300 hover:border-primary rounded-lg transition-all"
                onClick={() => document.getElementById('image-upload')?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
                ) : (
                  <Plus className="h-6 w-6 text-gray-400" />
                )}
              </Button>
              
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
              
              <p className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 text-xs text-gray-500 whitespace-nowrap">
                Add Image
              </p>
            </div>
            
            {/* Main input box */}
            <div className="flex-1">
              <Input
                type="text"
                placeholder={getPlaceholder()}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="h-24 text-base border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/70"
                onKeyPress={(e) => e.key === 'Enter' && !isGenerating && handleGenerate()}
                disabled={isGenerating}
              />
            </div>
          </div>
        )}

        {/* Interface after image upload */}
        {uploadedImage && (
          <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-200/50 rounded-2xl shadow-2xl">
            {/* Left image preview */}
            <div className="relative">
              <div className="w-20 h-24 rounded-lg overflow-hidden border-2 border-white shadow-lg transform rotate-[-2deg]">
                <img src={uploadedImage} alt="Uploaded" className="w-full h-full object-cover" />
              </div>
              
              {/* Replace/delete buttons */}
              <div className="absolute -bottom-2 -right-2 flex gap-1">
                <Button
                  size="sm"
                  className="h-6 w-6 rounded-full bg-white border border-gray-200 shadow-md p-0"
                  onClick={() => document.getElementById('image-upload')?.click()}
                >
                  <Plus className="h-3 w-3 text-gray-600" />
                </Button>
                <Button
                  size="sm" 
                  variant="destructive"
                  className="h-6 w-6 rounded-full shadow-md p-0"
                  onClick={clearUploadedImage}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            {/* Right input area */}
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-2">Describe how you want to adjust the image</p>
              <Input
                type="text"
                placeholder={getPlaceholder()}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="border-0 bg-white/50 backdrop-blur-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                onKeyPress={(e) => e.key === 'Enter' && !isGenerating && handleGenerate()}
                disabled={isGenerating}
              />
            </div>
          </div>
        )}
      </div>

      {/* Control bar */}
      <div className="flex items-center justify-between">
        {/* Left: Creation type */}
        <Select value={mode} onValueChange={(value: "image" | "video") => setMode(value)}>
          <SelectTrigger className="w-40">
            <div className="flex items-center gap-2">
              {mode === "image" ? <ImageIcon className="h-4 w-4" /> : <VideoIcon className="h-4 w-4" />}
              <span>{mode === "image" ? "Image Generation" : "Video Generation"}</span>
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="image">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                <span>Image Generation</span>
              </div>
            </SelectItem>
            <SelectItem value="video" disabled>
              <div className="flex items-center gap-2">
                <VideoIcon className="h-4 w-4" />
                <span>Video Generation</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Center: Size selection */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Size</span>
          <Select value={aspectRatio} onValueChange={setAspectRatio}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1:1">1:1</SelectItem>
              <SelectItem value="16:9">16:9</SelectItem>
              <SelectItem value="9:16">9:16</SelectItem>
              <SelectItem value="4:3">4:3</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Right: Generate button */}
        <Button
          onClick={handleGenerate}
          size="lg"
          className="px-8 bg-gradient-to-r from-primary to-green-500 hover:from-primary/90 hover:to-green-500/90 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl transform hover:-translate-y-0.5"
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
              Generate {mode === "image" ? "Image" : "Video"}
              <span className="ml-1 text-xs opacity-80">(-10)</span>
            </>
          )}
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-xl backdrop-blur-sm">
          <p className="text-sm text-destructive font-medium">{error}</p>
        </div>
      )}

      {/* Generated Image Display */}
      {generatedImage && (
        <div className="p-2 bg-background/60 backdrop-blur-sm border border-border/50 rounded-2xl shadow-2xl">
          <div className="relative rounded-xl overflow-hidden bg-muted/20">
            <img 
              src={generatedImage} 
              alt={`Generated: ${prompt}`}
              className="w-full h-auto max-h-[600px] object-contain"
            />
            <div className="absolute top-4 right-4 flex gap-2">
              <Button
                size="sm"
                onClick={() => {
                  try {
                    window.open(generatedImage, '_blank', 'noopener,noreferrer');
                  } catch (err) {
                    console.error('Failed to open image:', err);
                    // Fallback: copy URL to clipboard
                    navigator.clipboard.writeText(generatedImage).then(() => {
                      alert('Image URL copied to clipboard');
                    });
                  }
                }}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm transition-all duration-200"
              >
                View Full
              </Button>
              <Button
                size="sm"
                onClick={async () => {
                  try {
                    // Try to download via fetch to handle CORS
                    const response = await fetch(generatedImage);
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `lovexai-${prompt.slice(0, 30).replace(/[^a-zA-Z0-9]/g, '_')}.png`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                  } catch (err) {
                    console.error('Download failed:', err);
                    // Fallback: try direct download
                    const a = document.createElement('a');
                    a.href = generatedImage;
                    a.download = `lovexai-${prompt.slice(0, 30).replace(/[^a-zA-Z0-9]/g, '_')}.png`;
                    a.target = '_blank';
                    a.click();
                  }
                }}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm transition-all duration-200"
              >
                Download
              </Button>
            </div>
          </div>
          <div className="p-4 text-center">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">"{prompt}"</span> • 
              <span className="text-primary font-semibold"> Cost: 10 Credits</span>
              {uploadedImage && <span> • Image-to-Image Mode</span>}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}