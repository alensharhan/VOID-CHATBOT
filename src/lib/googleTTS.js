// browserTTS.js - Instant, zero-delay TTS using the native robust Web Speech API
// Replaces the old Google Translate hack which suffers from CORS and 403 blocks.
// Chunks text accurately to bypass browser utterance limits and streams naturally.

export class BrowserTTS {
  constructor() {
    this.audioQueue = [];
    this.isPlaying = false;
    this.onEndedCache = null;
    this.currentUtterance = null;
  }

  // Split text by natural sentence boundaries so chunking doesn't cut words awkwardly
  chunkText(text, maxLen = 150) {
    const sentences = text.match(/[^.!?]+[.!?]+|\s*[^.!?]+$/g) || [text];
    const chunks = [];
    
    for (let sentence of sentences) {
      if (sentence.length > maxLen) {
        // If a single sentence is stubbornly long, cut it by commas or spaces
        const parts = sentence.split(/(?<=[,;-]|\s+)/);
        let tempChunk = "";
        for (let part of parts) {
          if ((tempChunk + part).length > maxLen) {
            if (tempChunk.trim()) chunks.push(tempChunk.trim());
            tempChunk = part;
          } else {
            tempChunk += part;
          }
        }
        if (tempChunk.trim()) chunks.push(tempChunk.trim());
      } else {
        chunks.push(sentence.trim());
      }
    }
    return chunks.filter(c => c.length > 0);
  }

  async speak(text, onEnded) {
    this.stop(); // Halt any currently speaking session
    this.onEndedCache = onEnded || null;
    
    // Chunk the requested text to avoid 15-second browser synthesis limits
    const chunks = this.chunkText(text);
    if (chunks.length === 0) return;

    this.audioQueue = chunks;
    this.isPlaying = true;
    
    // Slight delay to ensure previous stops have fully flushed in the OS audio engine
    setTimeout(() => this.playNextChunk(), 50);
  }

  playNextChunk() {
    if (!this.isPlaying || this.audioQueue.length === 0) {
      this.finish();
      return;
    }

    const chunk = this.audioQueue.shift();
    
    if (!('speechSynthesis' in window)) {
      console.error("Speech Synthesis not supported in this browser.");
      this.finish();
      return;
    }

    this.currentUtterance = new SpeechSynthesisUtterance(chunk);
    
    // Try to find a good natural voice if available
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      // Prioritize natural sounding English voices, fallback to default English
      const voice = voices.find(v => v.name.includes('Natural') && v.lang.startsWith('en')) 
                 || voices.find(v => v.lang === 'en-US')
                 || voices[0];
      this.currentUtterance.voice = voice;
    }

    this.currentUtterance.rate = 1.05; // Slightly faster for natural speaking cadence
    
    this.currentUtterance.onend = () => {
      this.currentUtterance = null;
      this.playNextChunk();
    };
    
    this.currentUtterance.onerror = (e) => {
      console.error("Speech Synthesis Segment Error:", e);
      this.currentUtterance = null;
      // Skip chunk and keep reading instead of catastrophically failing
      this.playNextChunk();
    };

    window.speechSynthesis.speak(this.currentUtterance);
  }

  stop() {
    this.isPlaying = false;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.currentUtterance = null;
    this.audioQueue = [];
    this.finish();
  }
  
  finish() {
    if (this.onEndedCache) {
      this.onEndedCache();
      this.onEndedCache = null;
    }
    
    // Update global app state dynamically to stop the spinning UI icon
    import('../store/useAppStore').then(module => {
      if (module.useAppStore.getState().activeSpeakingId) {
        module.useAppStore.getState().setActiveSpeakingId(null);
      }
    });
  }
}

// Keep the same export name to prevent breaking other imports like MessageBubble.jsx
export const googleTTS = new BrowserTTS();

