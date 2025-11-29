"use action";
import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText } from "ai";

export const generateResponse = action({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    // 1. Fetch conversation and messages
    const messages = await ctx.runQuery(api.messages.list, { conversationId: args.conversationId });
    const conversation = await ctx.runQuery(api.conversations.get, { id: args.conversationId });
    
    if (!conversation || !messages || !conversation.character) {
      console.error("Conversation, messages, or character not found");
      return;
    }

    // 2. Prepare prompt with rich character context
    const char = conversation.character;
    let systemPrompt = `You are ${char.name}. ${char.description}. ${char.personality}.`;
    
    if (char.background) systemPrompt += `\n\nBackground: ${char.background}`;
    if (char.scenario) systemPrompt += `\n\nCurrent Scenario: ${char.scenario}`;
    if (char.current_state) systemPrompt += `\n\nCurrent State: ${char.current_state}`;
    if (char.motivation) systemPrompt += `\n\nMotivation: ${char.motivation}`;
    
    systemPrompt += `\n\nRespond in character. Keep responses engaging but concise unless asked otherwise. Stay in the current scenario and react to the user's actions.`;

    const coreMessages = messages.map(m => ({
      role: m.sender_type === 'user' ? 'user' : 'assistant',
      content: m.content,
    }));

    // 3. Configure AI Provider (OpenAI Compatible)
    // Adapted for tu-zi API based on user configuration
    const baseURL = process.env.OPENAI_BASE_URL || "https://api.tu-zi.com/v1";
    const apiKey = process.env.OPENAI_API_KEY;
    const modelName = process.env.OPENAI_MODEL || "gpt-4o-all";

    if (!apiKey) {
      console.error("Error: OPENAI_API_KEY is missing. Please set it in your Convex dashboard.");
    }

    const provider = createOpenAICompatible({
      name: "tu-zi",
      baseURL: baseURL,
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    // 4. Call LLM
    try {
      const { text } = await generateText({
        model: provider(modelName),
        system: systemPrompt,
        messages: coreMessages as any,
      });

      // 5. Save response
      await ctx.runMutation(api.messages.saveAIResponse, {
        conversationId: args.conversationId,
        content: text,
      });
    } catch (e) {
      console.error("AI Generation failed:", e);
    }
  },
});
