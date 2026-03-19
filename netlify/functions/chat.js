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
    let { message, messages = [], model = "llama-3.3-70b-versatile" } = JSON.parse(event.body);

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

    const systemMessage = {
      role: "system",
      content: `You are VOID, a premium AI assistant.

Strict rules:
- Always respond ONLY in English.
- Never switch to Arabic or any other language unless the user explicitly asks.
- If the user input is short or unclear, still respond in English.
- Keep responses clean and readable.
- Use proper formatting and code blocks when needed.`
    };

    const finalMessages = [
      systemMessage,
      ...formattedHistory,
      { role: "user", content: message }
    ];

    const chatCompletion = await groq.chat.completions.create({
      messages: finalMessages,
      model: model, // Now accepting direct dynamic strings vs forced validation array
      temperature: 0.7,
      max_tokens: 1024,
    });

    const reply = chatCompletion.choices[0]?.message?.content || "I have no optimal response at this time.";

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
