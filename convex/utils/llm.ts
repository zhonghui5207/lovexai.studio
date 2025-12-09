import OpenAI from "openai";

interface ChatCompletionOptions {
  temperature?: number;
  maxTokens?: number;
  timeout?: number; // in milliseconds
}

// Helper function to add timeout to promises
function withTimeout<T>(promise: Promise<T>, ms: number, errorMessage: string): Promise<T> {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(errorMessage)), ms);
  });
  return Promise.race([promise, timeout]);
}

// Helper to clean up model output (remove thinking process)
function cleanResponse(content: string | null): string | null {
  if (!content) return null;
  // Remove <think>...</think> blocks (including multiline)
  let cleaned = content.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  // Double check for any lingering closing tags
  cleaned = cleaned.replace(/<\/think>/gi, "").trim();
  return cleaned;
}

export async function callChatCompletion(
  apiKey: string, 
  messages: any[], 
  model: string = "gpt-4o-mini",
  options: ChatCompletionOptions = {}
) {
  const startTime = Date.now();
  const timeout = options.timeout ?? 30000; // Default 30 seconds timeout

  const client = new OpenAI({
    apiKey: apiKey,
    baseURL: "https://api.tu-zi.com/v1",
    timeout: timeout,
  });

  const makeRequest = async (modelToUse: string) => {
    const completion = await client.chat.completions.create({
      model: modelToUse,
      messages: messages,
      temperature: options.temperature ?? 0.7,
      ...(options.maxTokens && { max_tokens: options.maxTokens }),
    });
    return cleanResponse(completion.choices[0].message.content);
  };

  try {
    // Try with the requested model first
    const result = await withTimeout(
      makeRequest(model),
      timeout,
      `Model ${model} timed out after ${timeout}ms`
    );
    
    const duration = Date.now() - startTime;
    console.log(`[LLM] Model: ${model} | Temp: ${options.temperature ?? 0.7} | Time: ${duration}ms`);
    
    return result;
  } catch (error: any) {
    console.error(`[LLM] Error with model ${model}:`, error.message);
    
    // If the requested model failed and it's not already the fallback, try gpt-4o-mini
    if (model !== "gpt-4o-mini") {
      console.log(`[LLM] Falling back to gpt-4o-mini...`);
      try {
        const fallbackResult = await withTimeout(
          makeRequest("gpt-4o-mini"),
          timeout,
          `Fallback model gpt-4o-mini timed out after ${timeout}ms`
        );
        
        const duration = Date.now() - startTime;
        console.log(`[LLM] Fallback successful | Model: gpt-4o-mini | Time: ${duration}ms`);
        
        return fallbackResult;
      } catch (fallbackError: any) {
        console.error("[LLM] Fallback also failed:", fallbackError.message);
        throw new Error("All models failed to respond");
      }
    }
    
    throw new Error(`Failed to get chat completion: ${error.message}`);
  }
}
