"use server";

import { openai } from '@ai-sdk/openai';
import { streamText, Message } from 'ai';

export async function POST(req: Request) {
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
- Respond naturally as this character would`;

    // Convert messages to the expected format
    const formattedMessages: Message[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map((msg: any) => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content
      }))
    ];

    // Select model based on settings
    let model;
    switch (settings.selectedModel) {
      case 'nevoria':
      case 'fuchsia':
      case 'deepseek_v3':
      case 'orchid':
        model = openai('gpt-4'); // Premium models use GPT-4
        break;
      case 'nectar_basic':
      default:
        model = openai('gpt-3.5-turbo'); // Basic model uses GPT-3.5
        break;
    }

    const result = await streamText({
      model,
      messages: formattedMessages,
      temperature: settings.selectedModel === 'nevoria' ? 0.8 : 0.7,
      maxTokens: settings.responseLength === 'short' ? 150 :
                 settings.responseLength === 'long' ? 500 : 300,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate response' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}