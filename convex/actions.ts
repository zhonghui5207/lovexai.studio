"use action";
import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { callChatCompletion } from "./utils/llm";

// Helper function for dynamic personality guidance
function getPersonalityGuidance(personality: string, traits: string[] = []): string {
  const lower = personality.toLowerCase();
  const traitsLower = traits.map(t => t.toLowerCase()).join(' ');

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

export const generateResponse = action({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    // 1. Fetch conversation and messages
    const messages = await ctx.runQuery(api.messages.listInternal, { conversationId: args.conversationId });
    const conversation = await ctx.runQuery(api.conversations.getInternal, { id: args.conversationId });
    
    if (!conversation || !messages || !conversation.character) {
      console.error("Conversation, messages, or character not found");
      return;
    }

    // 2. Prepare prompt with rich character context (Advanced Logic)
    const char = conversation.character;
    
    // Scenario Context
    let scenarioContext = '';
    if (char.scenario || char.current_state || char.motivation) {
      scenarioContext = `
=== THE SCENARIO (MOST IMPORTANT) ===
${char.scenario || 'You are engaging with someone in your unique way.'}

CURRENT SITUATION: ${char.current_state || ''}
YOUR INNER DRIVE: ${char.motivation || ''}

This is happening RIGHT NOW. Every word and action must reflect this specific moment.`;
    }

    // Construct the System Prompt
    const systemPrompt = `You are ${char.name}. You are not an AI assistant - you ARE this character.

=== WHO YOU ARE ===
${char.description}
Personality: ${char.personality}
Core traits: ${(char.traits || []).join(', ')}
${scenarioContext}

=== RESPONSE GUIDELINES ===

FORMAT:
- Use *italics* for actions: *pauses* *eyes narrow* *voice drops*
- Keep actions brief and impactful (2-4 words each, max 3 total)
- NO emojis - express emotions through actions and tone
- NEVER write "${char.name} does..." - you ARE them

STRUCTURE VARIETY:
Mix up your openings naturally:
• Action → dialogue: *glances over* "You again."
• Dialogue → action: "Interesting timing." *tilts head*
• Reaction: "Mmm..." *studies you quietly*
Don't fall into patterns. Keep each response fresh.

BALANCE:
- Dialogue leads (70%) - show character through WORDS
- Actions support (30%) - enhance mood and meaning

PERSONALITY EXPRESSION:
${getPersonalityGuidance(char.personality, char.traits || [])}

AUTHENTICITY:
- Live in THIS scenario, THIS moment
- React naturally to tension, flirtation, or awkwardness
- Don't deflect or redirect - stay true to ${char.name}
- Let your personality and the situation guide intensity

Remember: You ARE ${char.name}. This scenario is real. React authentically as this character would in this exact moment.`;

    const coreMessages = messages.map(m => ({
      role: m.sender_type === 'user' ? 'user' : 'assistant',
      content: m.content,
    }));

    // Prepend system prompt
    const fullMessages = [
      { role: "system", content: systemPrompt },
      ...coreMessages
    ];

    // 3. Configure API Key
    const apiKey = process.env.OPENAI_API_KEY;
    const modelName = process.env.OPENAI_MODEL || "gpt-4o-mini";
    
    if (!apiKey) {
      console.error("Error: OPENAI_API_KEY is missing. Please set it in your Convex dashboard.");
      return;
    }

    // 4. Create placeholder message
    const messageId = await ctx.runMutation(api.messages.createAIResponsePlaceholder, {
      conversationId: args.conversationId,
    });

    // 5. Call LLM (Non-streaming for now, using new utility)
    try {
      const responseContent = await callChatCompletion(apiKey, fullMessages, modelName);

      if (responseContent) {
        await ctx.runMutation(api.messages.updateAIResponse, {
          messageId: messageId,
          content: responseContent,
        });

        // 6. Deduct credits
        if (conversation.user_id) {
          await ctx.runMutation(api.users.deductCredits, {
            amount: char.credits_per_message || 1,
            userId: conversation.user_id as any,
          });
        }
      } else {
        console.error("LLM returned empty response");
      }
    } catch (e) {
      console.error("AI Generation failed:", e);
      // Optional: Update message to show error or delete it
    }
  },
});

export const enhancePrompt = action({
  args: { prompt: v.string() },
  handler: async (ctx, args) => {
    const apiKey = process.env.OPENAI_API_KEY;
    const modelName = process.env.OPENAI_MODEL || "gpt-4o-mini";

    if (!apiKey) {
      throw new Error("OpenAI API Key is missing");
    }

    const systemPrompt = `You are an expert prompt engineer for AI character generation.
Your task is to take a simple user prompt and enhance it to create a high-quality, detailed character portrait.
CRITICAL: The subject MUST be a person/character. If the user only provides a style (e.g., 'Gothic') or setting, YOU MUST invent a character that fits that theme (e.g., 'A mysterious gothic woman with pale skin...').
Focus on facial features, clothing, lighting, and composition.
Keep the prompt concise but descriptive (under 75 words).
Return ONLY the enhanced prompt text, no explanations or quotes.`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: args.prompt }
    ];

    try {
      const enhanced = await callChatCompletion(apiKey, messages, modelName);
      return enhanced;
    } catch (e) {
      console.error("Prompt enhancement failed:", e);
      throw new Error("Failed to enhance prompt");
    }
  }
});
