import { NextRequest, NextResponse } from "next/server";
import { decreaseCredits, getUserCredits } from "@/services/credit";
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
      trans_type: "ping",
      credits: IMAGE_GENERATION_COST,
    });
    
    // 获取扣费后的积分余额
    const updatedCredits = await getUserCredits(user_uuid);

    // 生成记录ID
    const imageId = getSnowId();
    
    // 立即返回原始图片URL给用户（快速响应 < 5秒）
    const quickResponse = {
      success: true,
      imageUrl: imageUrl, // 先返回原始URL，用户可立即查看
      data: responseData,
      cost: IMAGE_GENERATION_COST,
      remaining_credits: updatedCredits.left_credits,
      image_id: imageId,
      status: "processing" // 表示正在后台处理永久存储
    };

    // 后台异步处理R2存储和数据库记录（不阻塞用户响应）
    process.nextTick(async () => {
      try {
        console.log("📁 后台开始处理R2存储:", imageId);
        
        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const storageKey = `images/${year}/${month}/${user_uuid}/${imageId}.png`;
        
        // 下载并上传到R2
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
          storage_url: storageResult.url,
          storage_key: storageKey,
          credits_cost: IMAGE_GENERATION_COST,
          status: "completed"
        });

        console.log("💾 图片记录已完成:", imageId);
      } catch (backgroundError) {
        console.error("后台存储处理失败:", backgroundError);
        // 可以考虑添加重试机制
      }
    });

    return respData(quickResponse);

  } catch (error) {
    console.error("Generate image API error:", error);
    return respErr(error instanceof Error ? error.message : "Internal server error");
  }
}