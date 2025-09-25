import { NextRequest, NextResponse } from 'next/server';
import { getCharactersForUser } from '@/models/character';
import { findUserById } from '@/models/user-new';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
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

    // 获取用户可访问的角色
    const characters = await getCharactersForUser(user.subscription_tier);

    return NextResponse.json({
      success: true,
      data: characters
    });

  } catch (error) {
    console.error('Get characters error:', error);
    return NextResponse.json({
      error: 'Failed to get characters',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}