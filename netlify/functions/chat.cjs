const Groq = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Global Memory State for Rate Limiting (persists across warm serverless container invocations)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 15; // Strict limit: 15 queries per minute per IP

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method Not Allowed" })
    };
  }

  // Security: Immediate Rate Limit Check
  const clientIp = event.headers['x-nf-client-connection-ip'] || event.headers['x-forwarded-for'] || 'anonymous_ip';
  const currentTime = Date.now();
  
  if (!rateLimitMap.has(clientIp)) {
    rateLimitMap.set(clientIp, { count: 1, firstRequest: currentTime });
  } else {
    const limitData = rateLimitMap.get(clientIp);
    if (currentTime - limitData.firstRequest > RATE_LIMIT_WINDOW_MS) {
      // Reset window
      rateLimitMap.set(clientIp, { count: 1, firstRequest: currentTime });
    } else {
      limitData.count++;
      if (limitData.count > MAX_REQUESTS_PER_WINDOW) {
        console.warn(`[SECURITY] RATE LIMIT EXCEEDED. Blocked traffic flood from IP: ${clientIp}`);
        return {
          statusCode: 429,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ error: "You are sending messages too fast. Please wait a minute and try again." })
        };
      }
    }
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
- Keep responses clean, legible, and highly structured with Markdown where helpful.`;

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

    // Master Router: Groq Exclusive Engine
    let reply = "";
    
    console.log(`[ROUTER] Routing via Groq Engine using: ${model}`);
    
    const fallbackModel = (model || "").toLowerCase().includes("/") ? "llama-3.3-70b-versatile" : model;
    
    const fallbackCompletion = await groq.chat.completions.create({
      messages: finalMessages,
      model: fallbackModel,
      temperature: 0.7,
      max_tokens: 1024,
    });
    reply = fallbackCompletion.choices[0]?.message?.content || "I have no optimal response at this time.";

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
