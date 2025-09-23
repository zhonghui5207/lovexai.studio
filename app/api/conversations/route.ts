import { NextRequest, NextResponse } from 'next/server';
import { getUserConversations, getLastMessageForConversation } from '@/models/conversation';
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

    // 验证用户存在
    const user = await findUserById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 获取用户的对话列表
    const conversations = await getUserConversations(userId);

    // 格式化数据以匹配前端期望的结构，并获取最后一条消息
    const formattedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const lastMessage = await getLastMessageForConversation(conv.id);

        return {
          id: conv.id,
          characterId: conv.character_id,
          characterName: conv.characters?.name || 'Unknown Character',
          characterAvatar: conv.characters?.avatar_url || '',
          lastMessage: lastMessage?.content || '',
          lastMessageTime: conv.last_message_at,
          unreadCount: 0 // TODO: 实现未读消息计数
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: formattedConversations
    });

  } catch (error) {
    console.error('Get conversations error:', error);
    return NextResponse.json({
      error: 'Failed to get conversations',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}