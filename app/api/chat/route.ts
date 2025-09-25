import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import {
  getConversationWithCharacter,
  createMessage,
  getGenerationSettings,
  sendUserMessage
} from '@/models/conversation';
import { recordCreditUsage } from '@/models/payment';
import { checkUserPermissions, findUserById } from '@/models/user-new';
import { getSupabaseClient } from '@/models/db';

const tuziClient = new OpenAI({
  apiKey: process.env.TUZI_API_KEY,
  baseURL: "https://api.tu-zi.com/v1"
});

export async function POST(req: NextRequest) {
  try {
    const { conversationId, content, userId } = await req.json();

    // 验证必要参数
    if (!conversationId || !content || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // 获取对话信息
    const conversation = await getConversationWithCharacter(conversationId);
    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // 验证用户权限
    const user = await findUserById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 检查用户是否有权限访问该角色
    const permissions = await checkUserPermissions(userId);
    if (!permissions.canAccessCharacter(conversation.characters.access_level)) {
      return NextResponse.json(
        { error: 'Access denied: Upgrade subscription to chat with this character' },
        { status: 403 }
      );
    }

    // 检查积分是否足够
    const creditsRequired = conversation.characters.credits_per_message;
    if (!permissions.canSendMessage(creditsRequired)) {
      return NextResponse.json(
        { error: 'Insufficient credits' },
        { status: 402 }
      );
    }

    // 发送用户消息并扣除积分
    const { userMessage } = await sendUserMessage(conversationId, content);

    // 获取对话生成设置
    const settings = await getGenerationSettings(conversationId) || {
      response_length: 'default',
      include_narrator: false,
      narrator_voice: 'male',
      selected_model: 'nectar_basic'
    };

    // 创建角色专用系统提示
    const character = conversation.characters;
    const systemPrompt = `You are ${character.name}, an AI character with the following traits:
- Description: ${character.description}
- Personality: ${character.personality}
- Traits: ${character.traits.join(', ')}
- Age: ${character.age || 'Unknown'}
- Location: ${character.location || 'Unknown'}

Response guidelines:
- Stay in character at all times
- Use ${settings.response_length === 'short' ? 'brief, concise' : settings.response_length === 'long' ? 'detailed, elaborate' : 'moderate length'} responses
- ${settings.include_narrator ? 'Include narrative descriptions in *italics* to describe actions and environment' : 'Focus on dialogue and character responses'}
- Be engaging and maintain the roleplay atmosphere
- Respond naturally as this character would
- Keep responses conversational and immersive`;

    // 获取对话历史 (最近10条消息)
    const { data: recentMessages } = await getSupabaseClient()
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(10);

    // 格式化消息历史
    const formattedMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...(recentMessages?.reverse().map(msg => ({
        role: msg.sender_type === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content
      })) || [])
    ];

    // 选择AI模型
    let model: string;
    let maxTokens: number;

    switch (settings.selected_model) {
      case 'nevoria':
      case 'fuchsia':
      case 'deepseek_v3':
        model = 'gpt-4o-all';
        maxTokens = settings.response_length === 'short' ? 200 :
                   settings.response_length === 'long' ? 600 : 400;
        break;
      case 'orchid':
        model = 'gpt-4o-all';
        maxTokens = settings.response_length === 'short' ? 250 :
                   settings.response_length === 'long' ? 800 : 500;
        break;
      case 'nectar_basic':
      default:
        model = 'gpt-4o-mini';
        maxTokens = settings.response_length === 'short' ? 150 :
                   settings.response_length === 'long' ? 400 : 250;
        break;
    }

    // 调用AI生成回复
    const completion = await tuziClient.chat.completions.create({
      model,
      messages: formattedMessages,
      temperature: settings.selected_model === 'nevoria' ? 0.8 : 0.7,
      max_tokens: maxTokens,
      stream: true,
    });

    // 创建流式响应
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let fullResponse = '';
        let completed = false;

        try {
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              fullResponse += content;
              const data = JSON.stringify({ textDelta: content });
              controller.enqueue(encoder.encode(`0:${data}\n`));
            }

            if (chunk.choices[0]?.finish_reason === 'stop' ||
                chunk.choices[0]?.finish_reason === 'length') {
              completed = true;
              // 发送结束信号
              const endSignal = JSON.stringify({ finished: true });
              controller.enqueue(encoder.encode(`0:${endSignal}\n`));
              break;
            }
          }

          // 保存AI回复到数据库
          if (fullResponse && completed) {
            await createMessage({
              conversation_id: conversationId,
              content: fullResponse.trim(),
              sender_type: 'character'
            });

            // 记录积分使用
            await recordCreditUsage(
              userId,
              creditsRequired,
              user.credits_balance - creditsRequired,
              userMessage.id,
              `Chat with ${character.name}`
            );
          }

        } catch (error) {
          console.error('Stream processing error:', error);
          if (!completed && controller.desiredSize !== null) {
            controller.error(error);
          }
        } finally {
          // 确保流被正确关闭
          if (controller.desiredSize !== null) {
            try {
              controller.close();
            } catch (e) {
              console.error('Error closing stream:', e);
            }
          }
        }
      },

      cancel() {
        console.log('Stream cancelled by client');
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({
      error: 'Failed to generate response',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}