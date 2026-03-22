import { KokoroTTS } from "kokoro-js";

let tts = null;

self.onmessage = async (e) => {
  const { type, text, voice } = e.data;

  if (type === 'init') {
    try {
      const model_id = "onnx-community/Kokoro-82M-v1.0-ONNX";
      
      try {
        // Try WebGPU first for instant generation latency
        tts = await KokoroTTS.from_pretrained(model_id, {
          dtype: "q8",
          device: "webgpu",
        });
        console.log("Kokoro TTS initialized with WebGPU acceleration.");
      } catch (gpuErr) {
        console.warn("WebGPU not available, falling back to WASM for Kokoro TTS.");
        tts = await KokoroTTS.from_pretrained(model_id, {
          dtype: "q8", 
          device: "wasm",
        });
      }
      self.postMessage({ status: 'ready' });
    } catch (err) {
      self.postMessage({ status: 'error', error: err.message });
    }
  } else if (type === 'generate') {
    if (!tts) return;
    try {
      self.postMessage({ status: 'generating' });
      // Kokoro specifically targets raw Float32 data mathematically
      const audioObj = await tts.generate(text, { voice: voice || "af_heart" });

      // Attempt to dynamically pull audio array across standard HuggingFace specifications
      const rawAudio = audioObj.audioData || audioObj.audio || audioObj.data;
      const sampleRate = audioObj.sampling_rate || 24000;

      if (rawAudio) {
        // Securely offload ArrayBuffer across the threading matrix to the DOM wrapper
        self.postMessage({ status: 'complete', audio: rawAudio, sampleRate }, [rawAudio.buffer]);
      } else {
        self.postMessage({ status: 'error', error: "Audio array buffer structurally missing from response." });
      }
    } catch (err) {
      self.postMessage({ status: 'error', error: err.message });
    }
  }
};
