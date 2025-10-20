import { NextRequest, NextResponse } from 'next/server';
import { findUserById } from '@/models/user';
import { checkUserPermissions } from '@/models/user';

export async function GET(req: NextRequest) {
  try {
    // 获取当前用户ID (从session中获取，这里简化处理)
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    // 获取用户信息
    const user = await findUserById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 返回用户积分信息
    return NextResponse.json({
      success: true,
      data: {
        credits_balance: user.credits_balance,
        subscription_tier: user.subscription_tier,
        total_credits_purchased: user.total_credits_purchased
      }
    });

  } catch (error) {
    console.error('Error fetching user credits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credits' },
      { status: 500 }
    );
  }
}