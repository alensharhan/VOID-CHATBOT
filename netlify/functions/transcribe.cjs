const Groq = require('groq-sdk');
const { toFile } = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const body = JSON.parse(event.body);
    const audioBase64 = body.audioBase64;
    const fileExt = body.fileExt || 'webm';
    
    if (!audioBase64) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing audio base64 data' }) };
    }

    // Convert the incoming Base64 string directly into binary buffers for the LLM
    const buffer = Buffer.from(audioBase64, 'base64');
    
    // Cast the raw memory buffer into a virtual file object to satisfy the Whisper endpoint
    const mimeMap = { 'mp4': 'audio/mp4', 'm4a': 'audio/m4a', 'webm': 'audio/webm' };
    const contentType = mimeMap[fileExt] || 'audio/webm';
    const file = await toFile(buffer, `audio.${fileExt}`, { type: contentType });

    console.log("Transcribing via whisper-large-v3-turbo...");

    // Directly call the Groq supercluster on the turbo model
    const translation = await groq.audio.transcriptions.create({
      file: file,
      model: "whisper-large-v3-turbo",
      response_format: "json",
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ text: translation.text }),
    };
  } catch (error) {
    console.error('Whisper Transcription Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
