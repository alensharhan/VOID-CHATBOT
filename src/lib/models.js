export const FALLBACK_MODELS = [
  {
    id: "llama-3.3-70b-versatile",
    name: "Llama 3.3 70B",
  },
  {
    id: "llama-3.1-8b-instant",
    name: "Llama 3.1 8B",
  }
];

export const LOCAL_MODELS = [
  { id: 'Llama-3.1-8B-Instruct-q4f32_1-MLC', name: 'Llama 3.1 8B (4.8GB)', vramWarning: 5 },
  { id: 'Mistral-7B-Instruct-v0.3-q4f16_1-MLC', name: 'Mistral 7B v0.3 (4.3GB)', vramWarning: 4.5 },
  { id: 'Qwen2-7B-Instruct-q4f16_1-MLC', name: 'Qwen 7B (4.5GB)', vramWarning: 4.5 },
  { id: 'Llama-3.2-3B-Instruct-q4f16_1-MLC', name: 'Llama 3.2 3B (2.5GB)', vramWarning: 3 },
  { id: 'Phi-3-mini-4k-instruct-q4f16_1-MLC', name: 'Phi 3 Mini (2.2GB)', vramWarning: 2.5 },
  { id: 'gemma-2b-it-q4f16_1-MLC', name: 'Gemma 2B (1.7GB)', vramWarning: 2 },
  { id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC', name: 'Qwen 1.5B (1.1GB)', vramWarning: 1.5 },
  { id: 'Llama-3.2-1B-Instruct-q4f16_1-MLC', name: 'Llama 3.2 1B (800MB)', vramWarning: 1 },
  { id: 'TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC', name: 'TinyLlama 1B (600MB)', vramWarning: 1 },
  { id: 'Qwen2-0.5B-Instruct-q4f16_1-MLC', name: 'Qwen 0.5B (400MB)', vramWarning: 0.5 },
  { id: 'SmolLM-360M-Instruct-q4f16_1-MLC', name: 'SmolLM 360M (380MB)', vramWarning: 0.5 },
  { id: 'SmolLM-135M-Instruct-q4f16_1-MLC', name: 'SmolLM 135M (150MB)', vramWarning: 0.3 },
];

export const DEFAULT_MODEL = "llama-3.3-70b-versatile";

export async function fetchModels() {
  try {
    const res = await fetch('/api/models');
    if (!res.ok) throw new Error("Failed to hit the Netlify backend /models route securely");
    const data = await res.json();
    return data && data.length > 0 ? data : FALLBACK_MODELS;
  } catch (error) {
    console.warn("Backend dynamic model trace offline, utilizing fallback core constants:", error);
    return FALLBACK_MODELS;
  }
}
