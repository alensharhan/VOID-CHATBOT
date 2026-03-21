

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

    // Ensure we strip messy tracking parameters `?si=` to avoid crashing the parser blindly
    const videoMatch = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    const cleanVideoId = videoMatch ? videoMatch[1] : url;

    // Dynamically resolve the binary fetcher mathematically to prevent ESBuild static compilation target mismatch crashes globally
    const yt = await import('youtube-transcript');
    const fetcher = yt.YoutubeTranscript ? yt.YoutubeTranscript.fetchTranscript : (yt.default?.fetchTranscript || yt.fetchTranscript || yt.default?.YoutubeTranscript?.fetchTranscript);
    
    if (!fetcher) {
       throw new Error("Critical fallback: System could not intercept fetchTranscript binding physically in the module object.");
    }
    
    const transcriptArray = await fetcher(cleanVideoId);

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
    console.error('Netlify YouTube Serverless Exception:', error.message);
    
    // Explicitly handle Region/Language lockouts or completely disabled captions
    const errorMsg = error.message.includes("Could not find transcripts") 
        ? "Video creator has aggressively disabled English closed captions natively." 
        : `Failed to bypass YouTube XML security layers. (${error.message})`;

    return {
      statusCode: 500,
      body: JSON.stringify({ error: errorMsg })
    };
  }
};
