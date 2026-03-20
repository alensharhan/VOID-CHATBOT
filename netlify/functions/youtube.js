import { YoutubeTranscript } from 'youtube-transcript';

export const handler = async (event) => {
  // Only accept rigorous POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { url } = JSON.parse(event.body);

    if (!url || (!url.includes('youtube.com') && !url.includes('youtu.be'))) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'System intercepted an invalid architectural YouTube URL snippet.' })
      };
    }

    // Mathematically extract the raw video timeline array from Google's native internal XML subtitle servers via CORS bypass
    const transcriptArray = await YoutubeTranscript.fetchTranscript(url);

    if (!transcriptArray || transcriptArray.length === 0) {
       return {
         statusCode: 404,
         body: JSON.stringify({ error: 'No closed captions were mathematically detected for this exact video hash.' })
       };
    }

    // Systematically map the raw DOM nodes into a single, beautiful contiguous memory string
    const fullTranscript = transcriptArray.map(item => item.text).join(' ');

    return {
      statusCode: 200,
      body: JSON.stringify({ transcript: fullTranscript })
    };
  } catch (error) {
    console.error('Netlify YouTube Serverless Exception:', error);
    
    // Explicitly handle Region/Language lockouts or completely disabled captions
    const errorMsg = error.message.includes("Could not find transcripts") 
        ? "Video creator has aggressively disabled English closed captions natively." 
        : "Failed to bypass YouTube XML security layers.";

    return {
      statusCode: 500,
      body: JSON.stringify({ error: errorMsg })
    };
  }
};
