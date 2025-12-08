// Unified Image Generation Utility
// Supports: Flux, GPT, Gemini via standard /v1/images/generations endpoint

export async function callImageGeneration(apiKey: string, prompt: string, modelName: string = "flux-kontext-pro") {
  // console.log(`Image Gen API: Sending request for model ${modelName}...`);
  const startTime = Date.now();

  // Default parameters enforced for Character Cards (3:4 Ratio)
  const requestBody: any = {
    model: modelName,
    prompt: prompt,
    n: 1,
    response_format: "url",
  };

  // Model-specific parameter adaptation for portrait ratio
  if (modelName.includes("flux")) {
    // Flux: supports aspect_ratio parameter natively
    requestBody.aspect_ratio = "3:4"; 
  } else if (modelName.includes("doubao") || modelName.includes("seedream")) {
    // Doubao/Seedream: try aspect_ratio first, fallback to size
    requestBody.aspect_ratio = "3:4";
  } else if (modelName.includes("gemini")) {
    // Gemini models: use size parameter for portrait
    // 1024x1792 is 9:16 vertical (closest standard portrait option)
    requestBody.size = "1024x1792";
  } else if (modelName.includes("gpt-4o-image") || modelName.includes("gpt-image")) {
    // GPT image models: Only supports fixed sizes (1024x1024, 1024x1792, 1792x1024)
    // 1024x1792 is 9:16 vertical (closest standard portrait option)
    requestBody.size = "1024x1792";
  } else {
    // Default fallback: try aspect_ratio for unknown models
    requestBody.aspect_ratio = "3:4";
  }

  const response = await fetch("https://api.tu-zi.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  // console.log("Image Gen API: Response status:", response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[Image Gen] API Error:", response.status, errorText);
    
    // Parse error for user-friendly message
    let userMessage = "Image generation failed. Please try again.";
    
    try {
      const errorJson = JSON.parse(errorText);
      const errorMsg = errorJson.error?.message || errorJson.message || errorText;
      
      // Check for common error types
      if (errorMsg.toLowerCase().includes("content_policy") || 
          errorMsg.toLowerCase().includes("nsfw") ||
          errorMsg.toLowerCase().includes("safety") ||
          errorMsg.toLowerCase().includes("inappropriate") ||
          errorMsg.toLowerCase().includes("violates") ||
          errorMsg.toLowerCase().includes("sensitive") ||
          errorMsg.toLowerCase().includes("flagged")) {
        userMessage = "Your prompt was flagged as sensitive content. Please modify your prompt and try again.";
      } else if (errorMsg.toLowerCase().includes("rate limit") || 
                 errorMsg.toLowerCase().includes("quota")) {
        userMessage = "API rate limit reached. Please wait a moment and try again.";
      } else if (errorMsg.toLowerCase().includes("invalid") ||
                 errorMsg.toLowerCase().includes("bad request")) {
        userMessage = "Invalid request. Please check your prompt and try again.";
      } else if (errorMsg.toLowerCase().includes("timeout")) {
        userMessage = "Request timed out. Please try again.";
      } else {
        // Include original error for debugging
        userMessage = `Generation failed: ${errorMsg}`;
      }
    } catch {
      // If JSON parsing fails, use raw error text
      if (errorText.toLowerCase().includes("content") || errorText.toLowerCase().includes("policy")) {
        userMessage = "Your prompt was flagged for violating content policy. Please modify your prompt and try again.";
      }
    }
    
    throw new Error(userMessage);
  }

  const data = await response.json();

  const duration = Date.now() - startTime;
  console.log(`[Image Gen] Model: ${modelName} | Time: ${duration}ms`);

  if (data.data && data.data.length > 0 && data.data[0].url) {
    return data.data[0].url;
  }

  throw new Error("No image was generated. Please try a different prompt.");
}
