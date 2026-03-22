// googleTTS.js - Instant, zero-delay, 100% free Cloud TTS utilizing Google Translate API
// Chunks text accurately to bypass the 200-character limit and streams back-to-back audio with 0ms gap.

export class GoogleTTS {
  constructor() {
    this.audioQueue = [];
    this.currentAudio = null;
    this.isPlaying = false;
    this.onEndedCache = null;
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
    
    // Chunk the requested text into sub-200 char fragments
    const chunks = this.chunkText(text);
    if (chunks.length === 0) return;

    // Generate streamable URLs for each chunk instantly
    this.audioQueue = chunks.map(chunk => {
      // The `tl=en` specifies english, `client=tw-ob` is the specific Google translate web client 
      return `https://translate.google.com/translate_tts?ie=UTF-8&tl=en&client=tw-ob&q=${encodeURIComponent(chunk)}`;
    });

    this.isPlaying = true;
    this.playNextChunk();
  }

  playNextChunk() {
    if (!this.isPlaying || this.audioQueue.length === 0) {
      this.finish();
      return;
    }

    const url = this.audioQueue.shift();
    this.currentAudio = new Audio(url);
    this.currentAudio.playbackRate = 1.05; // Slightly faster for natural speaking cadence
    
    this.currentAudio.onended = () => {
      this.playNextChunk();
    };
    
    this.currentAudio.onerror = (e) => {
      console.error("Google TTS Segment Error:", e);
      // Skip chunk and keep reading instead of catastrophically failing
      this.playNextChunk();
    };

    // Browsers block autoplay unless triggered by a user interaction.
    // Since this is triggered by the 'Read Aloud' button click, the audio will instantly play.
    this.currentAudio.play().catch(e => {
      console.error("Audio playback blocked by browser:", e);
      this.finish();
    });
  }

  stop() {
    this.isPlaying = false;
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
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

export const googleTTS = new GoogleTTS();
