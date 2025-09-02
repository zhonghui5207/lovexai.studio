import { NextRequest, NextResponse } from "next/server";
import { increaseCredits, CreditsTransType } from "@/services/credit";
import { getUserUuid } from "@/services/user";
import { respData, respErr } from "@/lib/resp";
import { getOneYearLaterTimestr } from "@/lib/time";

export async function POST(request: NextRequest) {
  try {
    const user_uuid = await getUserUuid();
    
    if (!user_uuid) {
      return respErr("no auth");
    }

    const body = await request.json();
    const { credits, reason = "system_add" } = body;

    // 验证积分数量
    if (!credits || credits <= 0 || credits > 10000) {
      return respErr("Invalid credits amount (1-10000)");
    }

    // 使用现有的积分增加服务
    await increaseCredits({
      user_uuid,
      trans_type: reason,
      credits: parseInt(credits),
      expired_at: getOneYearLaterTimestr(),
    });

    return respData({
      success: true,
      message: `Successfully added ${credits} credits`,
      added_credits: credits
    });

  } catch (error) {
    console.error("Add credits API error:", error);
    return respErr(error instanceof Error ? error.message : "Internal server error");
  }
}