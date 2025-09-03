import { respData, respErr, respJson } from "@/lib/resp";

import { findUserByUuid } from "@/models/user";
import { getUserUuid } from "@/services/user";
import { getUserCredits } from "@/services/credit";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respJson(-2, "no auth");
    }

    // 并行获取用户信息和积分
    const [user, credits] = await Promise.all([
      findUserByUuid(user_uuid),
      getUserCredits(user_uuid)
    ]);

    if (!user) {
      return respErr("user not exist");
    }

    // 返回合并的用户资料
    const userProfile = {
      ...user,
      credits
    };

    const response = respData(userProfile);
    
    // 添加缓存头 - 私有缓存，60秒有效，30秒后台更新
    return new NextResponse(response.body, {
      status: response.status,
      headers: {
        ...Object.fromEntries(response.headers.entries()),
        'Cache-Control': 'private, max-age=60, stale-while-revalidate=30',
        'ETag': `"user-${user_uuid}-${Date.now()}"`,
      }
    });
  } catch (e) {
    console.log("get user profile failed: ", e);
    return respErr("get user profile failed");
  }
}
