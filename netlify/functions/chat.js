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
    const { message, messages = [] } = JSON.parse(event.body);

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

    const systemPrompt = {
      role: "system",
      content: "You are VOID, a calm, premium, concise, and highly helpful AI assistant. You speak with a refined, elegant, and clear tone. You never use emojis. You prioritize insight, performance, and deep focus without unnecessary pleasantries."
    };

    const completionMessages = [
      systemPrompt,
      ...formattedHistory,
      { role: "user", content: message }
    ];

    const chatCompletion = await groq.chat.completions.create({
      messages: completionMessages,
      model: "llama-3.3-70b-versatile",
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
    
    // Provide a graceful premium fallback on error
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        reply: "I am experiencing network friction. Please maintain your focus and try again shortly." 
      })
    };
  }
};
