export async function callFluxImageGen(apiKey: string, messages: { role: string; content: string }[]) {
  const response = await fetch("https://api.tu-zi.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "flux-kontext-pro",
      messages: messages,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Flux API error: ${response.status} - ${errorText}`);
  }

  if (!response.body) throw new Error("No response body");

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let fullContent = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === "data: [DONE]") continue;
        if (trimmed.startsWith("data: ")) {
          try {
            const json = JSON.parse(trimmed.substring(6));
            const content = json.choices?.[0]?.delta?.content || "";
            fullContent += content;
          } catch (e) {
            // Ignore parse errors for partial chunks
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return fullContent;
}
