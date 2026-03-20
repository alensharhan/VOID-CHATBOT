import { pipeline, env } from '@xenova/transformers';
import { get, set } from 'idb-keyval';

// Disable remote downloading after the model is cached locally
env.allowLocalModels = false;
env.useBrowserCache = true;

const DB_KEY = 'void_rag_vectors';

class RAGSystem {
  static instance = null;

  static async getInstance() {
    if (this.instance === null) {
      // Pull heavily quantized model to keep memory footprint extremely tiny (~22MB)
      this.instance = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
        quantized: true,
      });
    }
    return this.instance;
  }

  // Split massive documents into dense ~500 character chunks
  static chunkText(text, chunkSize = 500) {
    const words = text.split(/\s+/);
    const chunks = [];
    let currentChunk = [];
    let currentLength = 0;

    for (const word of words) {
      if (currentLength + word.length > chunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.join(' '));
        currentChunk = [];
        currentLength = 0;
      }
      currentChunk.push(word);
      currentLength += word.length + 1;
    }
    if (currentChunk.length > 0) {
      chunks.push(currentChunk.join(' '));
    }
    return chunks;
  }

  static async generateEmbedding(text) {
    const extractor = await this.getInstance();
    const output = await extractor(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
  }

  static async addDocument(filename, text) {
    const chunks = this.chunkText(text);
    let vectorStore = (await get(DB_KEY)) || [];

    // To prevent freezing the main thread completely, we yield between chunks
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = await this.generateEmbedding(chunk);
      vectorStore.push({
        id: `${filename}-${i}-${Date.now()}`,
        filename,
        text: chunk,
        embedding
      });
      // Small artificial yield to let React repaint any UI spinners
      await new Promise(r => setTimeout(r, 10));
    }

    await set(DB_KEY, vectorStore);
    return chunks.length;
  }

  static cosineSimilarity(vecA, vecB) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  static async search(query, topK = 3) {
    const vectorStore = (await get(DB_KEY)) || [];
    if (vectorStore.length === 0) return [];

    const queryEmbedding = await this.generateEmbedding(query);

    const results = vectorStore.map(doc => ({
      ...doc,
      score: this.cosineSimilarity(queryEmbedding, doc.embedding)
    }));

    // Sort descending by highest semantic match
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }
  
  static async clearMemory() {
    await set(DB_KEY, []);
  }
}

export default RAGSystem;
