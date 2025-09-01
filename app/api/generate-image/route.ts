import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { deductUserCredits, getUserCreditBalance, addUserCredits } from "@/models/credit";

// 定义生图成本（每张图片消耗的积分）
const IMAGE_GENERATION_COST = 10;

export async function POST(request: NextRequest) {
  try {
    // 验证用户认证
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { prompt, aspect_ratio = "16:9", model = "flux-kontext-pro" } = body;

    // 验证必填参数
    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Prompt is required" },
        { status: 400 }
      );
    }

    // 检查用户积分余额
    const currentBalance = await getUserCreditBalance(session.user.email);
    if (currentBalance < IMAGE_GENERATION_COST) {
      return NextResponse.json(
        { 
          success: false,
          error: "Insufficient credits", 
          required: IMAGE_GENERATION_COST,
          current: currentBalance
        },
        { status: 402 } // Payment Required
      );
    }

    // 扣除积分
    const deductResult = await deductUserCredits(
      session.user.email, 
      IMAGE_GENERATION_COST, 
      `Image generation: ${prompt.substring(0, 50)}...`
    );

    if (!deductResult.success) {
      return NextResponse.json(
        { success: false, error: deductResult.error },
        { status: 402 }
      );
    }

    // 验证API密钥
    const apiKey = process.env.TUZI_API_KEY;
    if (!apiKey) {
      console.error("TUZI_API_KEY not configured");
      // 退还积分
      await addUserCredits(
        session.user.email,
        IMAGE_GENERATION_COST,
        `refund_config_error_${Date.now()}`,
        365
      );
      return NextResponse.json(
        { success: false, error: "API configuration error" },
        { status: 500 }
      );
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
      // 如果生图失败，退还积分
      await addUserCredits(
        session.user.email,
        IMAGE_GENERATION_COST,
        `refund_api_error_${Date.now()}`,
        365
      );
      
      console.error("Tuzi API error:", responseData);
      return NextResponse.json(
        { 
          success: false, 
          error: responseData.error?.message || "Failed to generate image (credits refunded)" 
        },
        { status: response.status }
      );
    }

    // 成功响应，提取图片URL
    const imageUrl = responseData.data?.[0]?.url || responseData.url;
    
    if (!imageUrl) {
      // 没有图片URL，退还积分
      await addUserCredits(
        session.user.email,
        IMAGE_GENERATION_COST,
        `refund_no_image_${Date.now()}`,
        365
      );
      
      console.error("No image URL in response:", responseData);
      return NextResponse.json(
        { success: false, error: "No image URL received from API (credits refunded)" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      imageUrl,
      data: responseData,
      cost: IMAGE_GENERATION_COST,
      remaining_credits: deductResult.remaining_credits
    });

  } catch (error) {
    console.error("Generate image API error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Internal server error" 
      },
      { status: 500 }
    );
  }
}