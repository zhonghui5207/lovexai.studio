import OpenAI from "openai";

interface ChatCompletionOptions {
  temperature?: number;
  maxTokens?: number;
}

export async function callChatCompletion(
  apiKey: string, 
  messages: any[], 
  model: string = "gpt-4o-mini",
  options: ChatCompletionOptions = {}
) {
  const startTime = Date.now();

  const client = new OpenAI({
    apiKey: apiKey,
    baseURL: "https://api.tu-zi.com/v1",
  });

  try {
    const completion = await client.chat.completions.create({
      model: model,
      messages: messages,
      temperature: options.temperature ?? 0.7,
      ...(options.maxTokens && { max_tokens: options.maxTokens }),
    });

    const duration = Date.now() - startTime;
    console.log(`[LLM] Model: ${model} | Temp: ${options.temperature ?? 0.7} | Time: ${duration}ms`);

    return completion.choices[0].message.content;
  } catch (error) {
    console.error("[LLM] Error calling chat completion:", error);
    throw new Error("Failed to get chat completion");
  }
}
