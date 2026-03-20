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
    const perfectHybridModels = [
      {
        id: "meta-llama/llama-3.3-70b-instruct:free",
        name: "Llama 3.3 70B",
        badge: "Auto-Failover",
        note: "Attempts OpenRouter Free, instantly fails over to Groq."
      },
      {
        id: "google/gemma-3-27b-it:free",
        name: "Gemma 3 27B",
        badge: "Auto-Failover",
        note: "Attempts OpenRouter Free, instantly fails over to Groq."
      },
      {
        id: "openai/gpt-oss-120b:free",
        name: "GPT OSS 120B",
        badge: "Reasoning",
        note: "Powered natively via OpenRouter Free tier."
      },
      {
        id: "mistralai/mistral-small-3.1-24b-instruct:free",
        name: "Mistral 24B",
        badge: "Fast",
        note: "Lightning fast OpenRouter model."
      },
      {
        id: "llama-3.1-8b-instant",
        name: "Llama 3.1 8B",
        badge: "Groq Native",
        note: "Routes exclusively through Groq."
      }
    ];

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(perfectHybridModels)
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
