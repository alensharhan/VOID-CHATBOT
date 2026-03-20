const Groq = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});



exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method Not Allowed" })
    };
  }

  try {
    let { message, messages = [], model = "llama-3.3-70b-versatile", hiddenContext = null } = JSON.parse(event.body);

    // Dynamic Server-Side Model Validation
    const showAdvancedModels = false;
    const blocklist = [
      "guard", "safeguard", "moderation", "compound",
      "whisper", "transcription", "speech", "tts", "stt", "audio",
      "embed", "embedding", "rerank", "vision", "ocr", "tool", "system"
    ];
    const allowlist = [
      "llama", "qwen", "gpt-oss", "allam", "kimi",
      "gemma", "canopylabs", "orpheus", "mixtral", "deepseek"
    ];

    const modelIdLower = model.toLowerCase();
    const isBlocked = blocklist.some(term => modelIdLower.includes(term));
    const isAllowedFamily = allowlist.some(term => modelIdLower.includes(term));

    if ((isBlocked && !showAdvancedModels) || !isAllowedFamily) {
      console.warn(`[SECURITY] Blocked isolated API request attempting to query non-compliant routing core: ${model}`);
      model = "llama-3.3-70b-versatile"; // Safe Graceful Fallback
    }

    if (!message) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Message is required in the request body" })
      };
    }

    // Prepare message history, filtering out internal UI properties
    const formattedHistory = messages.map(m => ({
      role: m.role,
      content: m.content
    }));

    let sysContent = `You are VOID, a premium AI assistant.

Strict rules:
- Always respond ONLY in English.
- Never switch to Arabic or any other language unless the user explicitly asks.
- If the user input is short or unclear, still respond in English.
- Keep responses clean and readable.
- Use proper formatting and code blocks when needed.`;

    if (hiddenContext) {
       sysContent += `\n\n${hiddenContext}`;
    }

    const systemMessage = {
      role: "system",
      content: sysContent
    };

    const finalMessages = [
      systemMessage,
      ...formattedHistory,
      { role: "user", content: message }
    ];

    // Master Hybrid Auto-Router
    let reply = "";
    
    // Transparently map UI generic requests to 100% Free OpenRouter equivalent endpoints
    let openRouterAlias = null;
    const lowerModel = model.toLowerCase();
    
    if (lowerModel.includes("llama-3.3-70b") || lowerModel.includes("llama3-70b")) openRouterAlias = "meta-llama/llama-3.3-70b-instruct:free";
    else if (lowerModel.includes("llama-3.1-8b") || lowerModel.includes("llama3-8b")) openRouterAlias = "meta-llama/llama-3-8b-instruct:free";
    else if (lowerModel.includes("gemma")) openRouterAlias = "google/gemma-3-27b-it:free";
    else if (lowerModel.includes("mixtral") || lowerModel.includes("mistral")) openRouterAlias = "mistralai/mistral-small-3.1-24b-instruct:free";
    else if (lowerModel.includes("gpt-oss")) openRouterAlias = "openai/gpt-oss-120b:free";
    else if (lowerModel.includes(":free") || lowerModel.includes("/") || lowerModel.includes("openrouter")) openRouterAlias = model; // Direct hit
    
    let fallbackToGroq = true;

    if (openRouterAlias && process.env.OPENROUTER_API_KEY) {
      console.log(`[ROUTER] Attempting primary 100% Free Route via OpenRouter: ${openRouterAlias}`);
      try {
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://localhost:8888/",
            "X-Title": "Nocta AI Chat"
          },
          body: JSON.stringify({
            model: openRouterAlias,
            messages: finalMessages,
            temperature: 0.7
          })
        });
        
        if (res.ok) {
          const data = await res.json();
          reply = data.choices[0]?.message?.content;
          fallbackToGroq = false; // Successfully got free tokens!
          console.log(`[ROUTER] Success! OpenRouter ${openRouterAlias} completed query.`);
        } else {
          const errText = await res.text();
          console.warn(`[ROUTER FAIL] OpenRouter Rate-Limited or Offline (${res.status}): ${errText}`);
        }
      } catch (err) {
        console.warn(`[ROUTER NETWORK ERROR] OpenRouter completely unreachable: ${err.message}`);
      }
    }
    
    // Auto-Failover: If OpenRouter failed, wasn't enabled, or rejected the prompt, use Groq natively
    if (fallbackToGroq) {
      console.log(`[ROUTER] Routing via Groq Engine for maximum stability using: ${model}`);
      
      const fallbackModel = lowerModel.includes("/") ? "llama-3.3-70b-versatile" : model;
      
      const fallbackCompletion = await groq.chat.completions.create({
        messages: finalMessages,
        model: fallbackModel,
        temperature: 0.7,
        max_tokens: 1024,
      });
      reply = fallbackCompletion.choices[0]?.message?.content || "I have no optimal response at this time.";
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply })
    };
  } catch (error) {
    console.error("Groq API Error:", error);

    // Explicitly identify model-related failures to relay actionable error messages
    const errorStr = String(error.message || "").toLowerCase();
    const isModelError = errorStr.includes('model') || errorStr.includes('does not exist');

    const replyMsg = isModelError
      ? "Model temporarily unavailable. Switching to default."
      : "I am experiencing network friction. Please maintain your focus and try again shortly.";

    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: error.message,
        reply: replyMsg,
        isModelError
      })
    };
  }
};
