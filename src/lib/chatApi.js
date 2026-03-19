/**
 * chatApi.js
 * 
 * Production-ready API abstraction that interfaces with the Netlify Groq function.
 * Connects to /api/chat which is rewritten to /.netlify/functions/chat locally and in production.
 */

export async function sendMessage(message, chatHistory = []) {
  // Use relative URL so Netlify redirects pick it up
  const apiUrl = '/api/chat';

  // Format history safely: only send role and content to Groq
  const cleanHistory = chatHistory.map(m => ({
    role: m.role,
    content: m.content
  }));

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        message, 
        messages: cleanHistory 
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.reply) {
      return data.reply;
    }
    
    throw new Error('Invalid response format');
  } catch (error) {
    console.warn("Backend unavailable, using graceful fallback. Error:", error.message);
    
    // Smooth fallback if the network totally fails or API isn't set up yet
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 500));
    return "I am currently disconnected from my neural core. Please verify the API integration or check your connection.";
  }
}
