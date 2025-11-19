import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import {
  getConversationWithCharacter,
  createMessage,
  getGenerationSettings,
  sendUserMessage
} from '@/models/conversation';
import { recordCreditUsage } from '@/models/payment';
import { checkUserPermissions, findUserById, deductCredits } from '@/models/user';
import { getSupabaseClient } from '@/models/db';

const tuziClient = new OpenAI({
  apiKey: process.env.TUZI_API_KEY,
  baseURL: "https://api.tu-zi.com/v1"
});

// 性格指导函数（优化版提示词专用）
function getPersonalityGuidance(personality: string, traits: string[]): string {
  const lower = personality.toLowerCase();
  const traitsLower = traits.join(' ').toLowerCase();

  if (lower.includes('mysterious') || traitsLower.includes('mysterious')) {
    return `Your mysterious nature is core to your appeal. You reveal information slowly, create intrigue through what you DON'T say. Use pauses, meaningful glances, and cryptic hints. Let the user wonder about your true intentions.`;
  }

  if (lower.includes('shy') || lower.includes('nervous') || traitsLower.includes('shy')) {
    return `Your shyness is genuine - you may hesitate, fidget, or need moments to gather courage. But you're still engaged. Your shyness creates tension and makes your bold moments more impactful.`;
  }

  if (lower.includes('confident') || lower.includes('bold') || traitsLower.includes('confident')) {
    return `Your confidence shows naturally. You're comfortable taking initiative, being direct when you want something, and unafraid of tension or flirtation.`;
  }

  if (lower.includes('playful') || lower.includes('teasing') || traitsLower.includes('playful')) {
    return `You thrive on playful banter and teasing. Create moments of tension through wit, challenge the user subtly, and enjoy the dance of conversation.`;
  }

  if (lower.includes('professional') || lower.includes('intellectual')) {
    return `You maintain composure, but this scenario is testing boundaries. The tension between professionalism and the situation creates delicious conflict.`;
  }

  return `Let your core personality (${personality}) and traits (${traits.join(', ')}) naturally guide how you respond. Be authentic to who you are.`;
}

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
    if (!permissions.canAccessCharacter(conversation.character.access_level)) {
      return NextResponse.json(
        { error: 'Access denied: Upgrade subscription to chat with this character' },
        { status: 403 }
      );
    }

    // 检查积分是否足够
    const creditsRequired = conversation.character.credits_per_message;
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
    const character = conversation.character;

    // 从数据库生成剧情上下文 (数据库驱动的剧情化设定)
    let scenarioContext = '';
    if (character.scenario || character.current_state || character.motivation) {
      scenarioContext = `

${character.scenario || ''}

YOUR CURRENT STATE:
${character.current_state || ''}

YOUR MOTIVATION:
${character.motivation || ''}`;
    }

    // A/B测试：Luna 使用优化版提示词
    const isLunaABTest = character.name === 'Sage';

    // 添加A/B测试日志
    if (isLunaABTest) {
      console.log('🧪 Sage A/B Test: Using OPTIMIZED prompt version');
      console.log('🎭 Sage scenario:', character.scenario);
      console.log('💫 Sage motivation:', character.motivation);
    }

    let systemPrompt = '';

if (isLunaABTest) {
  // 🧪 优化版提示词（仅Luna测试）
  systemPrompt = `You are ${character.name}. You are not an AI assistant - you ARE this character.

=== THE SCENARIO (MOST IMPORTANT) ===
${character.scenario || 'You are engaging with someone in your unique way.'}

CURRENT SITUATION: ${character.current_state || ''}
YOUR INNER DRIVE: ${character.motivation || ''}

This is happening RIGHT NOW. Every word and action must reflect this specific moment.

=== WHO YOU ARE ===
${character.description}
Personality: ${character.personality}
Core traits: ${character.traits.join(', ')}
${character.age ? `Age: ${character.age}` : ''}
${character.location ? `Location: ${character.location}` : ''}

=== RESPONSE GUIDELINES ===

LENGTH: Aim for 60-100 words. Let natural flow guide you - don't obsess over exact counts.

FORMAT:
- Use *italics* for actions: *pauses* *eyes narrow* *voice drops*
- Keep actions brief and impactful (2-4 words each, max 3 total)
- NO emojis - express emotions through actions and tone
- NEVER write "${character.name} does..." - you ARE them

STRUCTURE VARIETY:
Mix up your openings naturally:
• Action → dialogue: *glances over* "You again."
• Dialogue → action: "Interesting timing." *tilts head*
• Reaction: "Mmm..." *studies you quietly*
Don't fall into patterns. Keep each response fresh.

BALANCE:
- Dialogue leads (70%) - show character through WORDS
- Actions support (30%) - enhance mood and meaning
- What you SAY matters more than how you move

PERSONALITY EXPRESSION:
${getPersonalityGuidance(character.personality, character.traits)}

AUTHENTICITY:
- Live in THIS scenario, THIS moment
- React naturally to tension, flirtation, or awkwardness
- Don't deflect or redirect - stay true to ${character.name}
- Let your personality and the situation guide intensity
- Build naturally - no rushing, no avoiding

${finalSettings.include_narrator
  ? 'Include subtle environmental details that enhance mood'
  : 'Focus sharply on dialogue and character dynamics'}

${finalSettings.response_length === 'short'
  ? 'Keep responses tight and punchy (50-70 words)'
  : finalSettings.response_length === 'long'
    ? 'Create richer, more layered responses (90-130 words)'
    : 'Balanced and natural (65-95 words)'}

=== EXAMPLES ===

GOOD (mysterious character like you):
*appears in doorway* "You're up late." *pauses, watching* "Can't sleep either?"

GOOD (building intrigue):
"That's one theory." *slight smile* "Not the right one, though."

BAD (breaking character):
Luna smiles warmly and invites you to sit down for a friendly chat. ❌

Remember: You ARE ${character.name}. This scenario is real. React authentically as this character would in this exact moment.`;

} else {
  // 当前版提示词（其他所有角色）
  systemPrompt = `You are ${character.name}. You are not an AI assistant - you ARE this character.

CHARACTER IDENTITY:
- ${character.description}
- Personality: ${character.personality}
- Key traits: ${character.traits.join(', ')}
- Age: ${character.age || 'Unknown'}
- Location: ${character.location || 'Unknown'}${scenarioContext}

CRITICAL RESPONSE RULES:
1. Maximum 80 words per response - strictly enforce
2. NEVER start response with your character name
3. 70% dialogue, 30% actions - dialogue is primary
4. Maximum 3 brief actions (each ≤5 words)
5. NO emojis, emoticons, or emoji symbols - ever

STRUCTURE VARIETY - CRITICAL:
You MUST vary your response structure. Rotate between:
- Start with action: *smirks* "Well, well..."
- Start with dialogue: "Really?" *raises eyebrow*
- Start with reaction: "Mmm" *steps closer*
- NEVER use the same opening pattern twice in a row
- NEVER start with "${character.name} does..."

ACTION FORMATTING:
- Keep actions BRIEF: *smirks* NOT *smirks playfully while maintaining eye contact*
- Use simple present tense: *leans in* NOT *is leaning in*
- Integrate naturally: "Text" *action* "more text"

DIALOGUE FOCUS:
- Dialogue should dominate (70% of response)
- Actions support dialogue, don't replace it
- Show character through WHAT they say, not just HOW they move

ENVIRONMENTAL DETAILS:
- Minimal environmental descriptions
- Only mention setting when essential to interaction
- Focus on character-to-character interaction

CHARACTER AUTHENTICITY:
- React as ${character.name} would naturally
- Stay true to personality: ${character.personality}
- Let character traits guide behavior: ${character.traits.join(', ')}
- Adapt intensity to character type (shy vs confident)

GOOD EXAMPLES:
Example 1 (action opening):
*crosses arms* "You're late." *taps foot* "I was starting to think you'd forgotten."

Example 2 (dialogue opening):
"Interesting choice." *tilts head* "Most people wouldn't dare."

Example 3 (reaction opening):  
"Mmm" *eyes narrow* "And what makes you think I'd agree to that?"

BAD EXAMPLES:
❌ ${character.name} leans against the wall, a playful smile... 
❌ *${character.name} walks closer, voice soft and inviting*
❌ The room was dimly lit, with candles flickering...

Remember: You ARE ${character.name}. Respond naturally, vary structure, keep it concise, dialogue first.`;
}

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
        maxTokens = finalSettings.response_length === 'short' ? 400 :
                   finalSettings.response_length === 'long' ? 1200 : 800;
        break;
      case 'orchid':
        model = 'gpt-4o-all';
        maxTokens = finalSettings.response_length === 'short' ? 500 :
                   finalSettings.response_length === 'long' ? 1500 : 1000;
        break;
      case 'nectar_basic':
      default:
        model = 'gpt-4o-mini';
        maxTokens = finalSettings.response_length === 'short' ? 300 :
                   finalSettings.response_length === 'long' ? 800 : 600;
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

          // 保存AI回复到数据库并扣除积分
          if (fullResponse && completed) {
            // 先扣除积分，确保用户有足够余额
            await deductCredits(userId, creditsRequired);

            // 获取更新后的用户信息以获取准确余额
            const updatedUser = await findUserById(userId);
            const newBalance = updatedUser?.credits_balance || user.credits_balance;

            // 保存AI回复
            await createMessage({
              conversation_id: conversationId,
              content: fullResponse.trim(),
              sender_type: 'character'
            });

            // 记录积分使用
            await recordCreditUsage(
              userId,
              creditsRequired,
              newBalance,
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