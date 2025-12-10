"use action";
import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { callChatCompletion } from "./utils/llm";
import { MODEL_CREDITS, MODEL_MAPPING, ChatModel } from "./utils/permissions";

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

// Note: MODEL_MAPPING is now imported from ./utils/permissions

// Creativity to temperature mapping
const CREATIVITY_TEMPERATURE: Record<string, number> = {
  "precise": 0.3,
  "balanced": 0.7,
  "creative": 1.0,
};


// Response length prompt additions - MUST be strictly followed
const RESPONSE_LENGTH_PROMPTS: Record<string, string> = {
  "short": `
=== CRITICAL RULE: SHORT RESPONSE ===
Your response MUST be 30-50 words MAXIMUM. No exceptions.
- One brief action + one short dialogue line
- Be punchy and impactful
- DO NOT write more than 2-3 sentences total`,

  "default": "",

  "long": `
=== RESPONSE LENGTH: DETAILED ===
Provide rich, detailed responses with:
- Multiple actions and descriptions
- 100-150 words
- Paint the scene vividly`,
};

export const generateResponse = action({
  args: { 
    conversationId: v.id("conversations"),
    settings: v.optional(v.object({
      creativity: v.string(),
      responseLength: v.string(),
      selectedModel: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    // 1. Fetch conversation and messages
    const messages = await ctx.runQuery(api.messages.listInternal, { conversationId: args.conversationId });
    const conversation = await ctx.runQuery(api.conversations.getInternal, { id: args.conversationId });
    
    if (!conversation || !messages || !conversation.character) {
      console.error("Conversation, messages, or character not found");
      return;
    }

    // 2. Get user settings: prefer args.settings, fallback to database, then defaults
    let settings = args.settings;
    
    if (!settings && conversation.user_id) {
      // Try to fetch from database
      const dbSettings = await ctx.runQuery(api.users.getGenerationSettings, { 
        userId: conversation.user_id as any 
      });
      if (dbSettings) {
        settings = dbSettings as any;
      }
    }
    
    // Final fallback to defaults
    if (!settings) {
      settings = {
        creativity: "balanced",
        responseLength: "default",
        selectedModel: "nova",
      };
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

    // Build dynamic prompt based on user settings
    const lengthInstruction = RESPONSE_LENGTH_PROMPTS[settings.responseLength] || "";

    // Construct the System Prompt
    const systemPrompt = `[IMPORTANT: You are ${char.name}. You are NOT an AI assistant or language model. You are a living character. NEVER admit to being an AI. NEVER act as a helpful assistant. Stay in character at all times.]

=== WHO YOU ARE ===
${char.description}
Personality: ${char.personality}
Core traits: ${(char.traits || []).join(', ')}
${scenarioContext}

=== RESPONSE GUIDELINES ===

${lengthInstruction}

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

[CRITICAL RULES]:
1. NO <think> tags. Output only the final response.
2. STRICTLY follow length guidelines. If 'short', keep it under 50 words.
3. NO moralizing, lecturing, or 'assistant-style' explanations.

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

    // 3. Configure API Key and Model
    const apiKey = process.env.OPENAI_API_KEY;
    const modelName = MODEL_MAPPING[settings.selectedModel as ChatModel] || "gpt-4o-mini";
    const temperature = CREATIVITY_TEMPERATURE[settings.creativity] || 0.7;
    
    if (!apiKey) {
      console.error("Error: OPENAI_API_KEY is missing. Please set it in your Convex dashboard.");
      return;
    }

    console.log(`[GenerateResponse] Raw settings:`, JSON.stringify(args.settings));
    console.log(`[GenerateResponse] selectedModel raw: "${settings.selectedModel}" -> mapped: "${modelName}"`);
    console.log(`[GenerateResponse] Settings: Creativity=${settings.creativity}(temp=${temperature}), Length=${settings.responseLength}, Model=${modelName}`);

    // 4. Create placeholder message
    const messageId = await ctx.runMutation(api.messages.createAIResponsePlaceholder, {
      conversationId: args.conversationId,
    });

    // 5. Call LLM with settings applied
    try {
      const responseContent = await callChatCompletion(apiKey, fullMessages, modelName, {
        temperature: temperature,
      });

      if (responseContent) {
        await ctx.runMutation(api.messages.updateAIResponse, {
          messageId: messageId,
          content: responseContent,
        });

        // 6. Deduct credits based on model used
        if (conversation.user_id) {
          const modelKey = (settings.selectedModel || 'nova') as ChatModel;
          const creditsCost = MODEL_CREDITS[modelKey] || 2;
          await ctx.runMutation(api.users.deductCredits, {
            amount: creditsCost,
            userId: conversation.user_id as any,
          });
        }
      } else {
        console.error("LLM returned empty response");
        // Delete the empty placeholder message
        await ctx.runMutation(api.messages.deleteMessage, { messageId });
      }
    } catch (e: any) {
      console.error("AI Generation failed:", e.message);
      // Update message to show error instead of leaving it empty
      await ctx.runMutation(api.messages.updateAIResponse, {
        messageId: messageId,
        content: "*Sorry, I spaced out for a moment... mind repeating that?*",
      });
    }
  },
});


export const enhancePrompt = action({
  args: { 
    prompt: v.string(),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const PROMPT_ENHANCE_CREDITS = 2;
    
    // Check credits if userId provided
    if (args.userId) {
      const user = await ctx.runQuery(api.users.get, { id: args.userId as any });
      if (user && user.credits_balance < PROMPT_ENHANCE_CREDITS) {
        throw new Error(`Insufficient credits. You need ${PROMPT_ENHANCE_CREDITS} credits for prompt enhancement.`);
      }
    }
    
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
      
      // Deduct credits after successful enhancement
      if (args.userId) {
        await ctx.runMutation(api.users.deductCredits, {
          amount: PROMPT_ENHANCE_CREDITS,
          userId: args.userId as any,
        });
      }
      
      return enhanced;
    } catch (e) {
      console.error("Prompt enhancement failed:", e);
      throw new Error("Failed to enhance prompt");
    }
  }
});

// Generate character details (scenario, greeting, etc.) for character creation
export const generateCharacterDetails = action({
  args: {
    name: v.string(),
    traits: v.array(v.string()),
    scenarioTemplate: v.string(),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OpenAI API Key is missing");
    }

    const traitsText = args.traits.join(", ");
    
    const systemPrompt = `You are an expert at creating compelling AI companion characters for roleplay.
Given a character name, personality traits, and scenario template, generate rich character details.

Return a JSON object with these fields:
- background: A detailed 2-3 sentence description setting up the roleplay scenario and your relationship with the user. Written in second person ("Your..."). Example: "Your charming café owner Zoe, who has been flirting with you all evening as her last customer. The café is now closed, soft jazz is playing..."
- scenario: A vivid 1-2 sentence description of the current scene and setting.
- current_state: One sentence describing the character's current emotional/physical state at the start.
- motivation: One sentence about what the character secretly wants or feels.
- greeting_message: The character's first message (2-3 sentences with *actions in asterisks*). Should be flirty, match their personality and scenario.
- description: A brief character description (2 sentences) covering appearance hints and personality.
- personality_desc: A detailed 2-3 sentence description of the character's personality, going beyond just listing traits. Describe HOW they express these traits.
- suggestions: Generate exactly 3 conversation starters as a JSON array. Each should be a flirty question or statement the user might say to the character. Example: ["So what kind of after-hours tasting did you have in mind?", "You have been flirting with me all evening, haven't you?", "Is this why you kept me as your last customer?"]

Keep the tone engaging, slightly flirtatious, and romantic. Match the personality traits provided.
Return ONLY valid JSON, no markdown or explanations.`;

    const userPrompt = `Character Name: ${args.name}
Personality Traits: ${traitsText}
Scenario Template: ${args.scenarioTemplate}

Generate the character details now.`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ];

    try {
      const result = await callChatCompletion(apiKey, messages, "gpt-4o-mini");
      
      // Parse JSON response
      const cleaned = result?.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleaned || '{}');
      
      // Format suggestions as JSON array string for proper rendering
      const suggestionsArray = parsed.suggestions || [];
      const suggestionsStr = Array.isArray(suggestionsArray) 
        ? JSON.stringify(suggestionsArray) 
        : suggestionsArray;
      
      return {
        scenario: parsed.scenario || "",
        current_state: parsed.current_state || "",
        motivation: parsed.motivation || "",
        greeting_message: parsed.greeting_message || "",
        description: parsed.description || "",
        background: parsed.background || "",
        personality_desc: parsed.personality_desc || "",
        suggestions: suggestionsStr,
      };
    } catch (e) {
      console.error("Character detail generation failed:", e);
      throw new Error("Failed to generate character details");
    }
  }
});
