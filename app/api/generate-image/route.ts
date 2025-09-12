import { NextRequest, NextResponse } from "next/server";
import { decreaseCredits, getUserCredits, CreditsTransType } from "@/services/credit";
import { getUserUuid } from "@/services/user";
import { respData, respErr } from "@/lib/resp";
import { newStorage } from "@/lib/storage";
import { getSnowId } from "@/lib/hash";
import { insertImageGeneration } from "@/models/image";

// Image generation credit cost
const IMAGE_GENERATION_COST = 10;

export async function POST(request: NextRequest) {
  try {
    // Use existing authentication system
    const user_uuid = await getUserUuid();
    
    if (!user_uuid) {
      return respErr("no auth");
    }

    const body = await request.json();
    const { 
      prompt, 
      aspect_ratio = "16:9", 
      model = "flux-kontext-pro",
      mode = "text-to-image",
      source_image_url 
    } = body;

    // Validate required parameters
    if (!prompt || prompt.trim().length === 0) {
      return respErr("Prompt is required");
    }

    // Image-to-image mode requires original image URL
    if (mode === "image-to-image" && !source_image_url) {
      return respErr("Source image URL is required for image-to-image mode");
    }

    // Use existing credit system to check balance
    const userCredits = await getUserCredits(user_uuid);
    if (userCredits.left_credits < IMAGE_GENERATION_COST) {
      return respErr(`Insufficient credits. Need ${IMAGE_GENERATION_COST} but only have ${userCredits.left_credits}`);
    }

    // Validate API key
    const apiKey = process.env.TUZI_API_KEY;
    if (!apiKey) {
      console.error("TUZI_API_KEY not configured");
      return respErr("API configuration error");
    }

    // Build request data
    // Build different prompt format based on mode
    let finalPrompt = prompt.trim();
    if (mode === "image-to-image" && source_image_url) {
      finalPrompt = `${source_image_url} ${prompt.trim()}`;
    }

    const payload = {
      model,
      prompt: finalPrompt,
      aspect_ratio,
      output_format: "png",
      safety_tolerance: 2,
      prompt_upsampling: false
    };

    console.log("Generating image with payload:", payload);

    // Call Tuzi AI API - add network configuration
    const response = await fetch("https://api.tu-zi.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json; charset=utf-8",
        "User-Agent": "LOVEXAI-Studio/1.0"
      },
      body: JSON.stringify(payload),
      // Add timeout and retry configuration
      signal: AbortSignal.timeout(60000), // 60 second timeout
    });

    const responseData = await response.json();
    console.log("Tuzi API response:", responseData);

    if (!response.ok) {
      console.error("Tuzi API error:", responseData);
      // Image generation failed, don't deduct credits, return error directly
      return respErr(responseData.error?.message || "Failed to generate image");
    }

    // Successful response, extract image URL
    const imageUrl = responseData.data?.[0]?.url || responseData.url;
    
    if (!imageUrl) {
      console.error("No image URL in response:", responseData);
      return respErr("No image URL received from API");
    }

    // Deduct credits first
    await decreaseCredits({
      user_uuid,
      trans_type: CreditsTransType.Ping,
      credits: IMAGE_GENERATION_COST,
    });
    
    // Get credit balance after deduction
    const updatedCredits = await getUserCredits(user_uuid);

    // Generate record ID
    const imageId = getSnowId();
    
    try {
      console.log("📁 Starting async R2 storage processing:", imageId);
      console.log("Current time:", new Date().toISOString());
      console.log("Image URL:", imageUrl);
      
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const storageKey = `images/${year}/${month}/${user_uuid}/${imageId}.png`;
      
      // Return response to user immediately, avoid user waiting
      const quickResponse = {
        success: true,
        imageUrl: imageUrl, // Return original URL first, user can view immediately
        data: responseData,
        cost: IMAGE_GENERATION_COST,
        remaining_credits: updatedCredits.left_credits,
        image_id: imageId,
        status: "processing" // Indicates permanent storage is being processed in background
      };

      // Background async processing of R2 storage and database records (non-blocking user response)
      process.nextTick(async () => {
        try {
          console.log("📁 Background R2 storage processing started:", imageId);
          console.log("Background processing time:", new Date().toISOString());
          
          // Download and upload to R2
          const storage = newStorage();
          const storageResult = await storage.downloadAndUpload({
            url: imageUrl,
            key: storageKey,
            contentType: "image/png"
          });
          
          console.log("✅ Image saved to R2:", storageResult.url);
          
          // Save to database
          await insertImageGeneration({
            uuid: imageId,
            user_uuid,
            prompt: prompt.trim(),
            revised_prompt: responseData.data?.[0]?.revised_prompt,
            aspect_ratio: aspect_ratio || "16:9",
            model: model || "flux-kontext-pro",
            generation_mode: mode,
            source_image_url: mode === "image-to-image" ? source_image_url : undefined,
            original_url: imageUrl,
            storage_url: storageResult.url || imageUrl,
            storage_key: storageKey,
            credits_cost: IMAGE_GENERATION_COST,
            status: "completed"
          });

          console.log("💾 Image record completed:", imageId);
        } catch (backgroundError) {
          console.error("Background storage processing failed:", backgroundError);
          console.error("Failure time:", new Date().toISOString());
          
          // Even if storage fails, save database record (using original URL)
          try {
            await insertImageGeneration({
              uuid: imageId,
              user_uuid,
              prompt: prompt.trim(),
              revised_prompt: responseData.data?.[0]?.revised_prompt,
              aspect_ratio: aspect_ratio || "16:9",
              model: model || "flux-kontext-pro",
              generation_mode: mode,
              source_image_url: mode === "image-to-image" ? source_image_url : undefined,
              original_url: imageUrl,
              storage_url: imageUrl, // Use original URL as fallback
              storage_key: "",
              credits_cost: IMAGE_GENERATION_COST,
              status: "completed"
            });
            console.log("⚠️  Database record saved using original URL:", imageId);
          } catch (dbError) {
            console.error("Database record also failed:", dbError);
          }
        }
      });

      return respData(quickResponse);

    } catch (error) {
      console.error("R2 storage processing failed:", error);
      
      // Fallback solution when storage fails: use original URL
      try {
        await insertImageGeneration({
          uuid: imageId,
          user_uuid,
          prompt: prompt.trim(),
          revised_prompt: responseData.data?.[0]?.revised_prompt,
          aspect_ratio: aspect_ratio || "16:9",
          model: model || "flux-kontext-pro",
          original_url: imageUrl,
          storage_url: imageUrl, // Use original URL as fallback
          storage_key: "", // Storage not successful
          credits_cost: IMAGE_GENERATION_COST,
          status: "completed"
        });
        
        console.log("⚠️  R2 storage failed, database record saved using original URL:", imageId);
        
        // Return original URL (although it may expire)
        return respData({
          success: true,
          imageUrl: imageUrl,
          data: responseData,
          cost: IMAGE_GENERATION_COST,
          remaining_credits: updatedCredits.left_credits,
          image_id: imageId,
          status: "completed",
          warning: "Image saved to temporary storage only"
        });
        
      } catch (dbError) {
        console.error("Database record also failed:", dbError);
        return respErr("Failed to save image record to database");
      }
    }

  } catch (error) {
    console.error("Generate image API error:", error);
    return respErr(error instanceof Error ? error.message : "Internal server error");
  }
}