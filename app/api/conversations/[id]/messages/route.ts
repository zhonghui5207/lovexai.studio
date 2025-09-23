import { NextRequest, NextResponse } from 'next/server';
import { getConversationMessages } from '@/models/conversation';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      );
    }

    const messages = await getConversationMessages(conversationId);

    return NextResponse.json({
      success: true,
      data: messages
    });

  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json({
      error: 'Failed to get messages',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}