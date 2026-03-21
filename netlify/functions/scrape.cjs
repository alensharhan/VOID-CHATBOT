export const handler = async (event) => {
  if (event.httpMethod !== 'POST' && event.httpMethod !== 'GET') {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    let url = event.queryStringParameters?.url;
    if (!url && event.body) {
      try {
        const body = JSON.parse(event.body);
        url = body.url;
      } catch (e) {}
    }

    if (!url) {
      return { statusCode: 400, body: JSON.stringify({ error: 'URL is required' }) };
    }

    // SSRF (Server-Side Request Forgery) Security Barricade
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch (e) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Mathematical URL parsing failed.' }) };
    }
    
    // Strict Protocol Verification
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden protocol layer intercepted.' }) };
    }

    // Strict internal subnet blocks
    const host = parsedUrl.hostname;
    if (
      host === 'localhost' ||
      host.includes('127.0.0.1') ||
      host.endsWith('.local') ||
      host.endsWith('.internal') ||
      host.startsWith('10.') ||
      host.startsWith('192.168.') ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host) ||
      host === '169.254.169.254' // Standard AWS metadata shield
    ) {
      console.warn(`[SECURITY] Blocked critical SSRF probe attempt against internal architecture: ${host}`);
      return { statusCode: 403, body: JSON.stringify({ error: 'SSRF core breach prevented. Cannot resolve internal infrastructure.' }) };
    }

    const response = await fetch(parsedUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch website: HTTP ${response.status}`);
    }

    const html = await response.text();

    // Use pure Regex to strip scripts, styles, and HTML tags without needing massive Node dependencies
    let cleanText = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
      .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, ' ')
      .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, ' ')
      .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, ' ')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, ' ')
      .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, ' ')
      .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, ' ')
      .replace(/<img\b[^>]*>/gi, ' ')
      .replace(/<[^>]+>/g, ' ') // Strip remaining HTML tags
      .replace(/\s+/g, ' ')     // Collapse whitespace
      .trim();

    // Cap output at 20,000 characters to prevent catastrophic LLM context limits
    if (cleanText.length > 20000) {
      cleanText = cleanText.substring(0, 20000) + '\n... [Remaining content truncated]';
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: cleanText })
    };
  } catch (err) {
    console.error("Scraper Error:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: err.message || "Failed to scrape the provided URL." })
    };
  }
}
