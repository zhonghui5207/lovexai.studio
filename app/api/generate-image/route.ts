import { NextRequest, NextResponse } from "next/server";
import { decreaseCredits, getUserCredits, CreditsTransType } from "@/services/credit";
import { getUserUuid } from "@/services/user";
import { respData, respErr } from "@/lib/resp";
import { newStorage } from "@/lib/storage";
import { getSnowId } from "@/lib/hash";
import { insertImageGeneration } from "@/models/image";

// 图片生成消费积分数量
const IMAGE_GENERATION_COST = 10;

export async function POST(request: NextRequest) {
  try {
    // 使用现有认证系统
    const user_uuid = await getUserUuid();
    
    if (!user_uuid) {
      return respErr("no auth");
    }

    const body = await request.json();
    const { prompt, aspect_ratio = "16:9", model = "flux-kontext-pro" } = body;

    // 验证必填参数
    if (!prompt || prompt.trim().length === 0) {
      return respErr("Prompt is required");
    }

    // 使用现有积分系统检查余额
    const userCredits = await getUserCredits(user_uuid);
    if (userCredits.left_credits < IMAGE_GENERATION_COST) {
      return respErr(`Insufficient credits. Need ${IMAGE_GENERATION_COST} but only have ${userCredits.left_credits}`);
    }

    // 验证API密钥
    const apiKey = process.env.TUZI_API_KEY;
    if (!apiKey) {
      console.error("TUZI_API_KEY not configured");
      return respErr("API configuration error");
    }

    // 构建请求数据
    const payload = {
      model,
      prompt: prompt.trim(),
      aspect_ratio,
      output_format: "png",
      safety_tolerance: 2,
      prompt_upsampling: false
    };

    console.log("Generating image with payload:", payload);

    // 调用兔子AI的API
    const response = await fetch("https://api.tu-zi.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json; charset=utf-8"
      },
      body: JSON.stringify(payload)
    });

    const responseData = await response.json();
    console.log("Tuzi API response:", responseData);

    if (!response.ok) {
      console.error("Tuzi API error:", responseData);
      // 生图失败，不扣积分，直接返回错误
      return respErr(responseData.error?.message || "Failed to generate image");
    }

    // 成功响应，提取图片URL
    const imageUrl = responseData.data?.[0]?.url || responseData.url;
    
    if (!imageUrl) {
      console.error("No image URL in response:", responseData);
      return respErr("No image URL received from API");
    }

    // 先扣除积分
    await decreaseCredits({
      user_uuid,
      trans_type: CreditsTransType.Ping,
      credits: IMAGE_GENERATION_COST,
    });
    
    // 获取扣费后的积分余额
    const updatedCredits = await getUserCredits(user_uuid);

    // 生成记录ID
    const imageId = getSnowId();
    
    try {
      console.log("📁 开始立即处理R2存储:", imageId);
      
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const storageKey = `images/${year}/${month}/${user_uuid}/${imageId}.png`;
      
      // 立即下载并上传到R2（同步处理）
      const storage = newStorage();
      const storageResult = await storage.downloadAndUpload({
        url: imageUrl,
        key: storageKey,
        contentType: "image/png"
      });
      
      console.log("✅ 图片已保存到R2:", storageResult.url);
      
      // 保存到数据库
      await insertImageGeneration({
        uuid: imageId,
        user_uuid,
        prompt: prompt.trim(),
        revised_prompt: responseData.data?.[0]?.revised_prompt,
        aspect_ratio: aspect_ratio || "16:9",
        model: model || "flux-kontext-pro",
        original_url: imageUrl,
        storage_url: storageResult.url || "", // 使用R2 URL
        storage_key: storageKey,
        credits_cost: IMAGE_GENERATION_COST,
        status: "completed"
      });

      console.log("💾 图片记录已完成:", imageId);

      // 返回成功响应，包含永久可用的R2链接
      return respData({
        success: true,
        imageUrl: storageResult.url, // 返回R2 URL
        original_url: imageUrl, // 保留原始URL作为备份信息
        data: responseData,
        cost: IMAGE_GENERATION_COST,
        remaining_credits: updatedCredits.left_credits,
        image_id: imageId,
        status: "completed"
      });

    } catch (error) {
      console.error("R2存储处理失败:", error);
      
      // 存储失败时的后备方案：使用原始URL
      try {
        await insertImageGeneration({
          uuid: imageId,
          user_uuid,
          prompt: prompt.trim(),
          revised_prompt: responseData.data?.[0]?.revised_prompt,
          aspect_ratio: aspect_ratio || "16:9",
          model: model || "flux-kontext-pro",
          original_url: imageUrl,
          storage_url: imageUrl, // 使用原始URL作为后备
          storage_key: "", // 没有存储成功
          credits_cost: IMAGE_GENERATION_COST,
          status: "completed"
        });
        
        console.log("⚠️  R2存储失败，使用原始URL保存了数据库记录:", imageId);
        
        // 返回原始URL（虽然可能会过期）
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
        console.error("数据库记录也失败了:", dbError);
        return respErr("Failed to save image record to database");
      }
    }

  } catch (error) {
    console.error("Generate image API error:", error);
    return respErr(error instanceof Error ? error.message : "Internal server error");
  }
}