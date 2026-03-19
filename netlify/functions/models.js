const Groq = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

exports.handler = async (event, context) => {
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method Not Allowed" })
    };
  }

  try {
    const modelsResponse = await groq.models.list();
    
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
    
    // Debug logging
    console.log(`[MODELS API] Raw models fetched: ${modelsResponse.data.length}`, modelsResponse.data.map(m => m.id));

    const chatModels = modelsResponse.data
      .filter(m => {
        const id = m.id.toLowerCase();
        const isBlocked = blocklist.some(term => id.includes(term));
        const isAllowedFamily = allowlist.some(term => id.includes(term));
        
        if (isBlocked) return showAdvancedModels;
        return isAllowedFamily;
      })
      .map(m => {
        let name = m.id;
        let badge = null;
        let note = null;
        
        // Polished formatting mapping
        if (m.id.includes("llama-3.3-70b")) name = "Llama 3.3 70B";
        else if (m.id.includes("llama-3.1-8b")) name = "Llama 3.1 8B";
        else if (m.id.includes("mixtral-8x7b")) name = "Mixtral 8x7B";
        else if (m.id.includes("gemma2-9b")) name = "Gemma 2 9B";
        else if (m.id.includes("llama3-70b")) name = "Llama 3 70B";
        else if (m.id.includes("llama3-8b")) name = "Llama 3 8B";
        else name = m.id.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        
        // Intelligent Metadata Tagging
        const modelIdLower = m.id.toLowerCase();
        if (modelIdLower.includes("allam") || modelIdLower.includes("arabic")) {
            badge = "Arabic-first";
            note = "Optimized for Arabic and multilingual use. English remains the default unless you request another language.";
        } else if (modelIdLower.includes("prompt-guard") || modelIdLower.includes("safeguard")) {
            badge = "Safety";
            note = "Specialized safety model — not intended for normal conversation.";
        } else if (modelIdLower.includes("compound") || modelIdLower.includes("agent")) {
            badge = "Agent";
            note = "Agentic system model — output style may differ from standard chat.";
        } else if (modelIdLower.includes("qwen")) {
            badge = "Multilingual";
        } else if (name.includes("Llama") || name.includes("Mixtral")) {
            badge = "General";
        }

        return {
          id: m.id,
          name: name,
          badge: badge,
          note: note
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(chatModels)
    };
  } catch (error) {
    console.error("Groq Models API Error:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Failed to fetch models dynamically from Groq." })
    };
  }
};
