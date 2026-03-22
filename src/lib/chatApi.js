export async function sendMessage(message, chatHistory = [], modelId, hiddenContext = null, systemInstructions = null) {
  const apiUrl = '/api/chat';

  // Format history safely: only send role and content to Groq, merging hidden context natively
  const cleanHistory = chatHistory.map(m => {
    let finalContent = m.content;
    if (m.hiddenContext) {
      finalContent = `${m.hiddenContext}\n\n---\nUser Message:\n${m.content}`;
    }
    return {
      role: m.role,
      content: finalContent
    };
  });

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        message, 
        hiddenContext,
        systemInstructions,
        messages: cleanHistory,
        model: modelId
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 429 || data.isRateLimit) {
        throw new Error(`RATE_LIMIT|${data.rateLimitTime || '1h'}`);
      }
      if (data.isModelError) {
        throw new Error("MODEL_UNAVAILABLE");
      }
      if (data.error) {
        throw new Error(`[Server] ${data.error}`);
      }
      throw new Error(`API error: ${response.status}`);
    }
    
    if (data.reply) {
      return { reply: data.reply };
    }
    
    throw new Error('Invalid response format');
  } catch (error) {
    console.warn("Backend Error:", error.message);
    
    if (error.message.startsWith("RATE_LIMIT")) {
      const timeStr = error.message.split('|')[1];
      return {
        reply: `Rate limit reached. Please wait ${timeStr} before querying this specific model.`,
        isRateLimitError: true,
        rateLimitTime: timeStr,
        failedModelId: modelId
      };
    }

    if (error.message === "MODEL_UNAVAILABLE") {
      return { 
        reply: "Model temporarily unavailable. Switching to default.", 
        isModelError: true 
      };
    }
    
    // Smooth fallback if the network totally fails or API isn't set up yet
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 500));
    
    if (error.message && error.message.includes("[Server]")) {
      return { reply: `Connection error details:\n\`\`\`text\n${error.message}\n\`\`\`\n\nPlease check your API Key configuration or trigger a fresh Netlify Deploy.` };
    }
    
    return { reply: "I am currently disconnected from my neural core. Please verify the API integration or check your connection." };
  }
}
