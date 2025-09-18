import { OpenAI } from 'openai';
import { NextRequest } from 'next/server';

const tuziClient = new OpenAI({
  apiKey: process.env.TUZI_API_KEY,
  baseURL: "https://api.tu-zi.com/v1"
});

export async function POST(req: NextRequest) {
  try {
    const { messages, character, settings } = await req.json();

    // Create character-specific system prompt
    const systemPrompt = `You are ${character.name}, an AI character with the following traits:
- Description: ${character.description}
- Personality: ${character.personality}
- Traits: ${character.traits.join(', ')}
- Age: ${character.age || 'Unknown'}
- Location: ${character.location || 'Unknown'}

Response guidelines:
- Stay in character at all times
- Use ${settings.responseLength === 'short' ? 'brief, concise' : settings.responseLength === 'long' ? 'detailed, elaborate' : 'moderate length'} responses
- ${settings.includeNarrator ? 'Include narrative descriptions in *italics* to describe actions and environment' : 'Focus on dialogue and character responses'}
- Be engaging and maintain the roleplay atmosphere
- Respond naturally as this character would
- Keep responses conversational and immersive`;

    // Convert messages to the expected format
    const formattedMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((msg: any) => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content
      }))
    ];

    // Select model based on settings
    let model;
    let maxTokens;

    switch (settings.selectedModel) {
      case 'nevoria':
      case 'fuchsia':
      case 'deepseek_v3':
        model = 'gpt-4o-all'; // 使用Tuzi的高级模型
        maxTokens = settings.responseLength === 'short' ? 200 :
                   settings.responseLength === 'long' ? 600 : 400;
        break;
      case 'orchid':
        model = 'gpt-4o-all'; // 最高级模型
        maxTokens = settings.responseLength === 'short' ? 250 :
                   settings.responseLength === 'long' ? 800 : 500;
        break;
      case 'nectar_basic':
      default:
        model = 'gpt-4o-mini'; // 基础模型
        maxTokens = settings.responseLength === 'short' ? 150 :
                   settings.responseLength === 'long' ? 400 : 250;
        break;
    }

    const completion = await tuziClient.chat.completions.create({
      model,
      messages: formattedMessages,
      temperature: settings.selectedModel === 'nevoria' ? 0.8 : 0.7,
      max_tokens: maxTokens,
      stream: true,
    });

    // Create readable stream for real-time response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let completed = false;
        try {
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              const data = JSON.stringify({ textDelta: content });
              controller.enqueue(encoder.encode(`0:${data}\n`));
            }

            // Check if the stream is finished
            if (chunk.choices[0]?.finish_reason === 'stop' ||
                chunk.choices[0]?.finish_reason === 'length') {
              completed = true;
              break;
            }
          }
        } catch (error) {
          console.error('Stream processing error:', error);
          if (!completed && !controller.desiredSize === null) {
            controller.error(error);
          }
        } finally {
          // Ensure stream is properly closed
          if (!completed && controller.desiredSize !== null) {
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
    return new Response(JSON.stringify({
      error: 'Failed to generate response',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}