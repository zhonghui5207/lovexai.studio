"use action";
import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

export const generateResponse = action({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    // 1. Fetch conversation and messages
    // We use runQuery to fetch data from the database within an action
    const messages = await ctx.runQuery(api.messages.list, { conversationId: args.conversationId });
    const conversation = await ctx.runQuery(api.conversations.get, { id: args.conversationId });
    
    if (!conversation || !messages || !conversation.character) {
      console.error("Conversation, messages, or character not found");
      return;
    }

    // 2. Prepare prompt
    const systemPrompt = `You are ${conversation.character.name}. ${conversation.character.description}. ${conversation.character.personality}. \n\nRespond in character. Keep responses engaging but concise unless asked otherwise.`;
    
    const coreMessages = messages.map(m => ({
      role: m.sender_type === 'user' ? 'user' : 'assistant',
      content: m.content,
    }));

    // 3. Call LLM
    // Note: Ensure OPENAI_API_KEY is set in Convex dashboard
    try {
      const { text } = await generateText({
        model: openai("gpt-4o"), // You can make this dynamic based on user tier or settings
        system: systemPrompt,
        messages: coreMessages as any,
      });

      // 4. Save response
      await ctx.runMutation(api.messages.saveAIResponse, {
        conversationId: args.conversationId,
        content: text,
      });
    } catch (e) {
      console.error("AI Generation failed:", e);
      // Optionally save an error message to the conversation
    }
  },
});
