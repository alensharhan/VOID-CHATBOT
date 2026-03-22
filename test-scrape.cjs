const { handler } = require('./netlify/functions/scrape.cjs');

async function test() {
  try {
    const res = await handler({ 
      httpMethod: 'GET', 
      queryStringParameters: { 
        url: 'https://html.duckduckgo.com/html/?q=latest+news', 
        links: 'true' 
      } 
    });
    console.log(JSON.stringify(res, null, 2));
  } catch (err) {
    console.error("TEST FAILED:", err.stack);
  }
}
test();
