import { CreateMLCEngine } from "@mlc-ai/web-llm";

class LocalAiEngine {
  constructor() {
    this.engine = null;
    this.activeModelId = null;
    this.isLoaded = false;
  }

  /**
   * Initialize and load the selected MLC model natively using WebGPU.
   */
  async initEngine(modelId, progressCallback) {
    // If the same model is already loaded, no need to re-init
    if (this.engine && this.activeModelId === modelId && this.isLoaded) {
      return this.engine;
    }

    try {
      this.isLoaded = false;
      this.activeModelId = modelId;
      
      this.engine = await CreateMLCEngine(modelId, {
        initProgressCallback: progressCallback,
      });

      this.isLoaded = true;
      return this.engine;
    } catch (error) {
      console.error("[WebLLM] Fatal initialization error:", error);
      this.engine = null;
      this.isLoaded = false;
      throw error;
    }
  }

  /**
   * Stream a chat response natively through the user's local GPU.
   */
  async generateChat(messages, systemMessageContent = "") {
    if (!this.engine || !this.isLoaded) {
      throw new Error("Local AI Engine is not initialized.");
    }

    // Prepare system instruction if provided (used for RAG/Wikipedia context injection)
    const formattedMessages = [];
    if (systemMessageContent) {
      formattedMessages.push({ role: "system", content: systemMessageContent });
    }
    
    // Append chat history
    formattedMessages.push(...messages);

    // Call the WebGPU model natively
    const reply = await this.engine.chat.completions.create({
      messages: formattedMessages,
      temperature: 0.7,
      max_tokens: 1024,
    });

    return reply.choices[0].message.content;
  }

  /**
   * Check if WebGPU is supported on this specific device and browser combination.
   */
  static async checkHardwareSupport() {
    if (!navigator.gpu) return false;
    
    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) return false;
      
      // Optional: Check max VRAM buffer size to filter out extremely weak adapters
      // const memoryLimit = adapter.limits?.maxStorageBufferBindingSize;
      
      return true;
    } catch(e) {
      return false;
    }
  }
}

export const localAi = new LocalAiEngine();
