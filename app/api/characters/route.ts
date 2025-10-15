import { NextRequest, NextResponse } from 'next/server';
import { getCharactersForUser, getAllCharacters } from '@/models/character';
import { findUserById } from '@/models/user';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    // 如果没有userId，返回所有活跃角色（用于主页展示）
    if (!userId) {
      // 获取所有活跃角色用于公共展示
      const publicCharacters = await getAllCharacters(true);
      return NextResponse.json({
        success: true,
        data: publicCharacters
      });
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