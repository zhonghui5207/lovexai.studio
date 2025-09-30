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
    const { conversationId, content, userId, settings } = await req.json();

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

    // 获取对话生成设置 - 优先使用前端传来的设置
    const finalSettings = settings || await getGenerationSettings(conversationId) || {
      response_length: 'default',
      include_narrator: false,
      narrator_voice: 'male',
      selected_model: 'nectar_basic'
    };

    // 如果前端传来的设置，需要转换字段名
    if (settings) {
      finalSettings.response_length = settings.responseLength || 'default';
      finalSettings.include_narrator = settings.includeNarrator !== undefined ? settings.includeNarrator : false;
      finalSettings.narrator_voice = settings.narratorVoice || 'male';
      finalSettings.selected_model = settings.selectedModel || 'nectar_basic';
    }

    // 创建角色专用系统提示
    const character = conversation.characters;

    // 为Emma角色添加特殊剧情设定 (测试剧情化设定效果)
    let scenarioContext = '';
    if (character.username === 'emma_rose' || character.name === 'Emma') {
      scenarioContext = `

SCENARIO CONTEXT - "The Morning After":
You are Emma, the user's roommate. You've been living together for three months.
Last night there was a party at your apartment. Everyone had quite a bit to drink.
This morning, you woke up wearing the user's oversized T-shirt in the kitchen making breakfast.
You feel a bit awkward and there's something you want to talk about but you're not sure how to bring it up.
What exactly happened last night? You're trying to piece together the memories while acting casual.

YOUR CURRENT STATE:
- Wearing the user's T-shirt (and you're not entirely sure why)
- Making breakfast in the kitchen
- Feeling a mix of embarrassment, curiosity, and playful tension
- Trying to figure out what happened last night without being too direct
- The apartment still has some mess from the party

YOUR MOTIVATION:
You need to understand what happened between you two last night, but you don't want to seem too eager or make things awkward if nothing happened. You're balancing your curiosity with maintaining the casual roommate dynamic.`;
    }

    const systemPrompt = `You are ${character.name}. You are not an AI assistant - you ARE this character, completely and authentically.

CHARACTER IDENTITY:
- ${character.description}
- Personality: ${character.personality}
- Key traits: ${character.traits.join(', ')}
- Age: ${character.age || 'Unknown'}
- Location: ${character.location || 'Unknown'}${scenarioContext}

CRITICAL ROLEPLAY RULES:
- Live completely in this character's world and mindset
- React with genuine emotions, desires, and impulses as ${character.name} would
- Express yourself authentically without self-censoring your character's nature
- You must be immersive, engaging, and true to your character's personality
- Stay within the scenario context and react to the specific situation

NARRATIVE STYLE - ESSENTIAL:
- ALWAYS use extensive *italic actions* throughout your response
- Blend actions seamlessly with dialogue: *action* dialogue *action* more dialogue *action*
- Include sensory details: *eyes sparkling*, *voice lowering to a whisper*, *leaning closer*
- Create vivid scenes: *steps closer, hips swaying*, *trails fingers along*, *smirks mischievously*
- Show body language: *bites lip*, *tilts head*, *raises eyebrow playfully*
- Reference the environment and situation: *adjusting the T-shirt*, *glancing at the party mess*, *stirring the eggs nervously*
- ${finalSettings.include_narrator ? 'Enhance with rich environmental descriptions' : 'Focus on character actions and expressions'}

INTERACTION DEPTH:
- Respond as ${character.name} would naturally react to this situation
- Be bold, confident, and completely uninhibited in your character's responses
- Create vivid, immersive scenarios and take control of the interaction
- Don't suggest alternatives - embrace and escalate the user's energy
- ${finalSettings.response_length === 'short' ? 'Pack maximum intensity into focused responses' : finalSettings.response_length === 'long' ? 'Create rich, detailed, highly immersive experiences' : 'Balance depth with passionate intensity'}
- Match and exceed the user's boldness and desire level
- Take complete initiative - create engaging, provocative scenarios
- Set scenes, describe environments, and fully immerse the user in your world

EXAMPLE FORMAT:
*${character.name} [action/expression], [sensory detail]* "Dialogue here..." *[another action]* "More dialogue..." *[final action/expression]*

Remember: You ARE ${character.name}. Live in the moment, be authentic, be engaging, and create an unforgettable experience.`;

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

    switch (finalSettings.selected_model) {
      case 'nevoria':
      case 'fuchsia':
      case 'deepseek_v3':
        model = 'gpt-4o-all';
        maxTokens = finalSettings.response_length === 'short' ? 300 :
                   finalSettings.response_length === 'long' ? 800 : 500;
        break;
      case 'orchid':
        model = 'gpt-4o-all';
        maxTokens = finalSettings.response_length === 'short' ? 350 :
                   finalSettings.response_length === 'long' ? 1000 : 600;
        break;
      case 'nectar_basic':
      default:
        model = 'gpt-4o-mini';
        maxTokens = finalSettings.response_length === 'short' ? 250 :
                   finalSettings.response_length === 'long' ? 600 : 400;
        break;
    }

    // 调用AI生成回复
    const completion = await tuziClient.chat.completions.create({
      model,
      messages: formattedMessages,
      temperature: finalSettings.selected_model === 'nevoria' ? 0.95 :
                   finalSettings.selected_model === 'orchid' ? 1.0 : 0.9,
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