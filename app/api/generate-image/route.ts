import { NextRequest, NextResponse } from "next/server";
import { decreaseCredits, getUserCredits } from "@/services/credit";
import { getUserUuid } from "@/services/user";
import { respData, respErr } from "@/lib/resp";
import { newStorage } from "@/lib/storage";
import { getSnowId } from "@/lib/hash";

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
      // 没有图片URL，生图失败，不扣积分
      return respErr("No image URL received from API");
    }

    // 只有在确认生图成功并获得图片URL后才扣费和存储
    try {
      // 生成图片成功，开始保存到R2存储
      const imageId = getSnowId();
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      
      // 文件存储路径：images/2025/01/user_uuid/image_id.png
      const storageKey = `images/${year}/${month}/${user_uuid}/${imageId}.png`;
      
      console.log("📁 开始保存图片到R2存储:", storageKey);
      
      // 下载并上传到R2
      const storage = newStorage();
      const storageResult = await storage.downloadAndUpload({
        url: imageUrl,
        key: storageKey,
        contentType: "image/png"
      });
      
      console.log("✅ 图片已保存到R2:", storageResult.url);
      
      // 扣除积分
      await decreaseCredits({
        user_uuid,
        trans_type: "ping", // 沿用现有类型
        credits: IMAGE_GENERATION_COST,
      });
      
      // 获取扣费后的积分余额
      const updatedCredits = await getUserCredits(user_uuid);

      return respData({
        success: true,
        imageUrl: storageResult.url, // 返回R2存储的永久URL
        originalUrl: imageUrl, // 原始临时URL（备用）
        data: responseData,
        cost: IMAGE_GENERATION_COST,
        remaining_credits: updatedCredits.left_credits,
        storage: {
          key: storageResult.key,
          bucket: storageResult.bucket,
          location: storageResult.location
        }
      });
    } catch (creditError) {
      console.error("积分扣费或存储失败:", creditError);
      // 存储失败但图片已生成，记录错误但仍返回成功
      return respData({
        success: true,
        imageUrl, // 返回原始URL作为备用
        data: responseData,
        cost: IMAGE_GENERATION_COST,
        warning: "Image generated successfully but storage or credit deduction failed: " + (creditError instanceof Error ? creditError.message : "Unknown error"),
        remaining_credits: userCredits.left_credits // 使用原始积分
      });
    }

  } catch (error) {
    console.error("Generate image API error:", error);
    return respErr(error instanceof Error ? error.message : "Internal server error");
  }
}