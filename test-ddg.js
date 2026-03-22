const url = 'https://html.duckduckgo.com/html/?q=latest news';
fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } })
  .then(r => r.text())
  .then(html => {
    const urlRegex = /class="result__url"[^>]*href="([^"]+)"/gi;
    let match;
    let urls = [];
    while ((match = urlRegex.exec(html)) !== null && urls.length < 5) {
      urls.push(match[1]);
    }
    console.log('URLs:', urls);
  });
