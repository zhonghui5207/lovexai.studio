import { NextRequest, NextResponse } from 'next/server';
import { startConversationWithCharacter } from '@/models/conversation';
import { checkUserPermissions } from '@/models/user';
import { findCharacterById } from '@/models/character';

export async function POST(req: NextRequest) {
  let requestBody: any;

  try {
    requestBody = await req.json();
    const { userId, characterId, title } = requestBody;

    if (!userId || !characterId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // 检查角色是否存在
    const character = await findCharacterById(characterId);
    if (!character) {
      return NextResponse.json(
        { error: 'Character not found' },
        { status: 404 }
      );
    }

    // 检查用户权限
    const permissions = await checkUserPermissions(userId);

    if (!permissions.canAccessCharacter(character.access_level)) {
      return NextResponse.json(
        {
          error: 'Access denied: Upgrade subscription to chat with this character',
          debug: {
            userTier: 'unknown', // 我们不能暴露用户信息
            characterAccessLevel: character.access_level,
            characterName: character.name
          }
        },
        { status: 403 }
      );
    }

    // 创建对话
    const result = await startConversationWithCharacter(userId, characterId, title);

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Detailed error in create conversation:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      requestBody: requestBody || 'Could not parse request body'
    });

    return NextResponse.json({
      error: 'Failed to create conversation',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}