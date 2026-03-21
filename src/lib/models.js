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
