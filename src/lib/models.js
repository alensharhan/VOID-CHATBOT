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
  { id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC', name: 'Qwen 1.5B (1.1GB)', vramWarning: 1.5 },
  { id: 'Llama-3.2-1B-Instruct-q4f16_1-MLC', name: 'Llama 3.2 1B (800MB)', vramWarning: 1 },
  { id: 'TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC', name: 'TinyLlama 1B (600MB)', vramWarning: 1 },
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
