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

  // Model-specific parameter adaptation
  if (modelName.includes("flux")) {
    // Flux supports explicit aspect_ratio
    requestBody.aspect_ratio = "3:4"; 
  } else {
    // OpenAI (GPT) / Gemini typically use 'size'
    // We use 1024x1792 for DALL-E 3/Gemini as it's the closest portrait standard (9:16)
    requestBody.size = "1024x1792"; 
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
    console.error("Image Gen API Error Body:", errorText);
    throw new Error(`Image Gen API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  // console.log("Image Gen API: Response data:", data);

  const duration = Date.now() - startTime;
  console.log(`[Image Gen] Model: ${modelName} | Time: ${duration}ms`);

  if (data.data && data.data.length > 0 && data.data[0].url) {
    return data.data[0].url;
  }

  throw new Error("Image Gen API: No image URL in response");
}
