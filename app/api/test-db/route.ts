import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/models/db";

export async function GET(request: NextRequest) {
  try {
    console.log("Testing database connection...");
    
    const client = getSupabaseClient();
    
    // 测试连接 - 尝试查询users表
    const { data, error, count } = await client
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error("Database connection error:", error);
      return NextResponse.json(
        { 
          success: false, 
          error: error.message,
          details: error
        },
        { status: 500 }
      );
    }

    console.log("Database connection successful:", data);
    
    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      tableExists: true,
      userCount: count || 0,
      data: null // 不返回实际数据以保护隐私
    });

  } catch (error) {
    console.error("Database test error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Database connection failed",
        details: error
      },
      { status: 500 }
    );
  }
}