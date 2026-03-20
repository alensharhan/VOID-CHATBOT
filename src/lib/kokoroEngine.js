export class KokoroEngine {
  constructor() {
    this.worker = null;
    this.isReady = false;
    this.audioContext = null;
    this.currentSource = null;
    this.initializationPromise = null;
  }

  async init() {
    if (this.isReady) return;
    if (this.initializationPromise) return this.initializationPromise;

    this.initializationPromise = new Promise((resolve, reject) => {
      // Bind directly against the native React infrastructure pipeline securely
      this.worker = new Worker(new URL('./kokoroWorker.js', import.meta.url), { type: 'module' });
      this.worker.postMessage({ type: 'init' });

      this.worker.onmessage = (e) => {
        if (e.data.status === 'ready') {
          this.isReady = true;
          resolve();
        } else if (e.data.status === 'error') {
          console.error("Kokoro TTS Fatal:", e.data.error);
          reject(new Error(e.data.error));
        } else if (e.data.status === 'complete') {
          this.playAudio(e.data.audio, e.data.sampleRate);
        } else if (e.data.status === 'generating') {
          // Signal generation active
          console.log("Synthesizing native vocals...");
        }
      };
    });

    return this.initializationPromise;
  }

  stop() {
    if (this.currentSource) {
      this.currentSource.stop();
      this.currentSource = null;
    }
  }

  async speak(text, voice = 'af_heart') {
    if (!this.isReady) await this.init();
    this.stop(); // Mathematically block echoing overlays securely
    this.worker.postMessage({ type: 'generate', text, voice });
  }

  playAudio(float32Array, sampleRate) {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    // Resume context actively if suspended securely
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    const audioBuffer = this.audioContext.createBuffer(1, float32Array.length, sampleRate);
    audioBuffer.getChannelData(0).set(float32Array);

    this.currentSource = this.audioContext.createBufferSource();
    this.currentSource.buffer = audioBuffer;
    this.currentSource.connect(this.audioContext.destination);
    this.currentSource.start();
  }
}

export const kokoroTTS = new KokoroEngine();
