import { NextRequest, NextResponse } from 'next/server';
import { getConversationMessagesWithSender } from '@/models/conversation';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const conversationId = id;

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Missing conversation ID' },
        { status: 400 }
      );
    }

    // Get messages for conversation
    const messages = await getConversationMessagesWithSender(conversationId);

    return NextResponse.json({
      success: true,
      data: messages
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Failed to get messages',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}