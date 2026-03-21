(async () => {
   try {
     const res = await fetch('http://127.0.0.1:8888/.netlify/functions/youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://youtu.be/vTK9KQxUiv4?si=IJPnQKVAf0zD37Vo' })
     });
     console.log("Status:", res.status);
     console.log("Response:", await res.text());
   } catch(e) {
     console.error("Fetch Error:", e);
   }
})();
