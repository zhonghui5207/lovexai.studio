import { NextRequest, NextResponse } from "next/server";
import { getUserUuid } from "@/services/user";
import { respData, respErr } from "@/lib/resp";
import { getUserImageGenerations, getUserImageStats } from "@/models/image";

export async function GET(request: NextRequest) {
  try {
    const user_uuid = await getUserUuid();
    
    if (!user_uuid) {
      return respErr("no auth");
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const sort = (searchParams.get('sort') || 'newest') as 'newest' | 'oldest';

    // 计算偏移量
    const offset = (page - 1) * limit;

    try {
      // 获取图片历史记录
      const images = await getUserImageGenerations(user_uuid, {
        limit,
        offset,
        search: search || undefined,
        sort
      });

      // 获取统计信息（仅第一页时返回）
      let stats = null;
      if (page === 1) {
        try {
          stats = await getUserImageStats(user_uuid);
        } catch (statsError) {
          // 统计信息获取失败时，设置默认值
          console.warn("Failed to get user stats, using defaults:", statsError);
          stats = {
            total_count: 0,
            today_count: 0,
            monthly_count: 0,
            monthly_credits: 0
          };
        }
      }

      const responseData = {
        images: images || [], // 确保返回数组
        stats,
        pagination: {
          page,
          limit,
          hasMore: images && images.length === limit, // 如果返回的数量等于limit，说明可能还有更多
        },
        filters: {
          search,
          sort
        }
      };

      const response = respData(responseData);
      
      // 添加缓存头 - 私有缓存，30秒有效，15秒后台更新（图片数据更新频率较高）
      return new NextResponse(response.body, {
        status: response.status,
        headers: {
          ...Object.fromEntries(response.headers.entries()),
          'Cache-Control': 'private, max-age=30, stale-while-revalidate=15',
          'ETag': `"images-${user_uuid}-${page}-${limit}-${search}-${sort}"`,
        }
      });

    } catch (dbError) {
      // 数据库操作失败，返回空数据而不是错误
      console.warn("Database query failed, returning empty data:", dbError);
      
      const emptyData = {
        images: [],
        stats: {
          total_count: 0,
          today_count: 0,
          monthly_count: 0,
          monthly_credits: 0
        },
        pagination: {
          page,
          limit,
          hasMore: false,
        },
        filters: {
          search,
          sort
        }
      };
      
      const response = respData(emptyData);
      
      // 错误情况下不缓存
      return new NextResponse(response.body, {
        status: response.status,
        headers: {
          ...Object.fromEntries(response.headers.entries()),
          'Cache-Control': 'no-cache',
        }
      });
    }

  } catch (error) {
    console.error("Get images history API error:", error);
    return respErr(error instanceof Error ? error.message : "Internal server error");
  }
}