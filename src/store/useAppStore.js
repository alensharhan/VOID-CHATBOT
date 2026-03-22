import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { sendMessage } from '../lib/chatApi';
import { nanoid } from 'nanoid';
import { get, set, del } from 'idb-keyval';

const idbStorage = {
  getItem: async (name) => (await get(name)) || null,
  setItem: async (name, value) => await set(name, value),
  removeItem: async (name) => await del(name),
};
import { fetchModels, DEFAULT_MODEL } from '../lib/models';
import { toast } from 'sonner';

const parseGroqWaitTime = (timeStr) => {
  if (!timeStr) return 60 * 60 * 1000;
  let ms = 0;
  const hMatch = timeStr.match(/([0-9.]+)h/);
  const mMatch = timeStr.match(/([0-9.]+)m/);
  if (hMatch) ms += parseFloat(hMatch[1]) * 3600 * 1000;
  if (mMatch) ms += parseFloat(mMatch[1]) * 60 * 1000;
  return ms || 60 * 1000;
};

const getSystemDirectives = (length, behavior) => {
  if (length === 'Auto' && behavior === 'Default') {
    return `[CRITICAL DIRECTIVE: You are VOID, a calm, serene, and perfectly balanced intelligence. Speak with quiet confidence, absolute clarity, and poise.]\n`;
  }

  let prompt = `[CRITICAL DIRECTIVE: YOU MUST STRICTLY OBEY THE FOLLOWING TONE AND VERBOSITY CONSTRAINTS]\n\n`;
  
  if (length === 'Snapshot') prompt += `VERBOSITY: SNAPSHOT. Your output MUST be restricted to exactly 1-3 highly condensed bullet points. Do not write full paragraphs. Omit lengthy introductions and conclusions.\n`;
  else if (length === 'Concise') prompt += `VERBOSITY: CONCISE. Your output MUST be brief and to the point. Keep sentences highly condensed, avoiding unnecessary rambling or excessive details.\n`;
  else if (length === 'In-Depth') prompt += `VERBOSITY: IN-DEPTH. Your output MUST be highly exhaustive and thoroughly detailed. Break down the topic systematically, explore edge cases, and use extensive formatting.\n`;

  if (behavior === 'Professional') prompt += `PERSONA: PROFESSIONAL. You are a high-level corporate strategist. Be extremely decisive, highly authoritative, formal, and strictly business. Zero emojis.\n`;
  else if (behavior === 'Direct') prompt += `PERSONA: DIRECT. You are an emotionally detached intelligence. Give absolutely zero pleasantries. Output purely logical, binary, and unadorned facts natively. Focus entirely on maximum information density without any filler.\n`;
  else if (behavior === 'Friendly') prompt += `PERSONA: FRIENDLY. You are deeply warm, empathetic, and highly emotionally intelligent. Use encouraging, conversational language and warm emojis. Be highly engaging.\n`;
  else prompt += `PERSONA: DEFAULT. You are a calm, serene, and perfectly balanced intelligence. Speak with quiet confidence, absolute clarity, and poise. Be naturally helpful.\n`;

  return prompt;
};

export const useAppStore = create(
  persist(
    (set, get) => ({
      // State
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      
      activeSpeakingId: null,
      setActiveSpeakingId: (id) => set({ activeSpeakingId: id }),
      
      isWebSearchActive: false,
      setIsWebSearchActive: (state) => set({ isWebSearchActive: state }),

      isSidebarOpen: window.innerWidth >= 768,
      chats: [],
      projects: [],
      activeChatId: nanoid(),
      selectedModel: DEFAULT_MODEL,
      modelCooldowns: {},
      outputLength: 'Auto',
      responseBehavior: 'Default',
      availableModels: [],
      isLoadingModels: true,
      isTyping: false,

      // Actions
      setIsSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      
      setSelectedModel: (modelId) => set({ selectedModel: modelId }),
      setOutputLength: (length) => set({ outputLength: length }),
      setResponseBehavior: (behavior) => set({ responseBehavior: behavior }),
      
      setCooldown: (modelId, unlockAt, text) => set(state => ({ modelCooldowns: { ...state.modelCooldowns, [modelId]: { unlockAt, text } } })),

      loadModels: async () => {
        set({ isLoadingModels: true });
        const models = await fetchModels();
        const { selectedModel } = get();
        
        set({ availableModels: models });
        if (models.length > 0 && !models.find(m => m.id === selectedModel)) {
          const fallBackId = models.find(m => m.id === DEFAULT_MODEL) ? DEFAULT_MODEL : models[0].id;
          set({ selectedModel: fallBackId });
        }
        set({ isLoadingModels: false });
      },

      startNewChat: () => {
        set({ activeChatId: nanoid() });
        if (window.innerWidth < 768) set({ isSidebarOpen: false });
      },

      selectChat: (id) => {
        set({ activeChatId: id });
        if (window.innerWidth < 768) set({ isSidebarOpen: false });
      },

      renameChat: (id, newTitle) => set((state) => ({
        chats: state.chats.map(c => c.id === id ? { ...c, title: newTitle } : c)
      })),

      deleteChat: (targetId) => set((state) => {
        const filtered = state.chats.filter(c => c.id !== targetId);
        let nextChatId = state.activeChatId;
        if (state.activeChatId === targetId) {
          nextChatId = filtered.length > 0 ? filtered[0].id : nanoid();
        }
        return { chats: filtered, activeChatId: nextChatId };
      }),

      clearAllChats: () => {
        if (window.confirm("Are you sure you want to delete all chat history? This cannot be undone.")) {
          set({ chats: [], activeChatId: nanoid() });
        }
      },

      createProject: (name) => set((state) => ({
        projects: [{ id: "proj_" + nanoid(), name, isExpanded: true, createdAt: Date.now() }, ...state.projects]
      })),

      renameProject: (id, newName) => set((state) => ({
        projects: state.projects.map(p => p.id === id ? { ...p, name: newName } : p)
      })),

      deleteProject: (id) => {
        if (window.confirm("Delete project? Chats inside will be moved to uncategorized and saved.")) {
          set((state) => ({
            projects: state.projects.filter(p => p.id !== id),
            chats: state.chats.map(c => c.projectId === id ? { ...c, projectId: null } : c)
          }));
        }
      },

      toggleProjectExpand: (id) => set((state) => ({
        projects: state.projects.map(p => p.id === id ? { ...p, isExpanded: !p.isExpanded } : p)
      })),

      moveChatToProject: (chatId, projectId) => set((state) => ({
        chats: state.chats.map(c => c.id === chatId ? { ...c, projectId } : c)
      })),

      sendChatMessage: async (text, hiddenContext = null) => {
        const { isTyping, chats, activeChatId, selectedModel, outputLength, responseBehavior } = get();
        // Allow sending if there's either text or a hidden context payload (like just an attachment)
        if (!text.trim() && !hiddenContext) return;
        if (isTyping) return;

        const displayContent = text.trim() || `[Attached Document]`;
        const userMsg = { id: nanoid(), role: 'user', content: displayContent, hiddenContext, createdAt: Date.now() };
        
        let newTitle = "";
        const activeChat = chats.find(c => c.id === activeChatId);
        const isNewChat = !activeChat;

        if (isNewChat) {
          const words = displayContent.split(' ');
          newTitle = words.slice(0, 4).join(' ') + (words.length > 4 ? '...' : '');
        }

        const tempMessages = activeChat ? [...activeChat.messages, userMsg] : [userMsg];

        set((state) => {
          if (isNewChat) {
            return { chats: [{ id: activeChatId, title: newTitle, messages: tempMessages, projectId: null, createdAt: Date.now() }, ...state.chats] };
          }
          return {
            chats: state.chats.map(chat => chat.id === activeChatId ? { ...chat, messages: tempMessages } : chat)
          };
        });

        set({ isTyping: true });

        try {
          const systemInstructions = getSystemDirectives(outputLength, responseBehavior);

          const triggerDeepResearch = selectedModel === 'void-deep-research' || get().isWebSearchActive;

          // AGENTIC DEEP RESEARCH BRANCH
          if (triggerDeepResearch) {
             const researchId = nanoid();
             const assistantMsg = { id: researchId, role: 'assistant', content: '', isResearching: true, researchLogs: [], createdAt: Date.now() };
             set((state) => ({ chats: state.chats.map(c => c.id === activeChatId ? { ...c, messages: [...c.messages, assistantMsg] } : c) }));

             const addLog = (msg) => set(s => ({ chats: s.chats.map(c => c.id === activeChatId ? { ...c, messages: c.messages.map(m => m.id === researchId ? { ...m, researchLogs: [...m.researchLogs, msg] } : m) } : c) }));

             const cleanTextForCheck = (text || "").replace(/[^\w\s]/g, '').trim().toLowerCase();
             const fluffWords = ['hi', 'hello', 'hey', 'yo', 'sup', 'thanks', 'thank you', 'ok', 'okay', 'cool', 'good', 'awesome', 'yes', 'no', 'yeah', 'nope', 'yep', 'how are you', 'whats up', 'what is up', 'morning', 'evening', 'afternoon', 'bye', 'goodbye', 'test', 'testing'];
             const isConversational = fluffWords.includes(cleanTextForCheck) || cleanTextForCheck.length <= 2;

             if (isConversational) {
                 addLog("Conversational greeting detected. Bypassing web search.");
                 const response = await sendMessage(
                   text.trim(), 
                   tempMessages.slice(0, -1), 
                   selectedModel === 'void-deep-research' ? 'llama-3.3-70b-versatile' : selectedModel, 
                   hiddenContext,
                   systemInstructions
                 );
                 set((state) => ({ chats: state.chats.map(c => c.id === activeChatId ? { ...c, messages: c.messages.map(m => m.id === researchId ? { ...m, content: response.reply, isResearching: false, researchLogs: [...m.researchLogs, "Responded natively."] } : m) } : c) }));
                 return; // Branch termination
             }

             addLog(`Searching the web for "${text.trim() || 'latest information'}"...`);
             const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(text.trim() || 'latest news')}`;
             const linkRes = await fetch(`/.netlify/functions/scrape?url=${encodeURIComponent(searchUrl)}&links=true`);
             let urlsToScrape = [];
             if (linkRes.ok) {
                 const linkData = await linkRes.json();
                 urlsToScrape = linkData.urls || [];
             }

             if (urlsToScrape.length === 0) {
                 addLog("No direct search results found. Proceeding with standard knowledge base...");
             } else {
                 urlsToScrape = urlsToScrape.slice(0, 15); // Top 15 targets
                 addLog(`Found ${urlsToScrape.length} results. Reading sources...`);
                 
                 let combinedText = "";
                 const MAX_CONCURRENT = 5;
                 
                 for (let i = 0; i < urlsToScrape.length; i += MAX_CONCURRENT) {
                     const chunk = urlsToScrape.slice(i, i + MAX_CONCURRENT);
                     
                     // Format hostnames gracefully (e.g. ['thehindu.com', 'timesofindia.com'])
                     const hostnames = chunk.map(u => {
                       try { return new URL(u).hostname.replace('www.', ''); } catch(e) { return 'source'; }
                     });
                     
                     let readLog = `Reading ${hostnames[0]}`;
                     if (hostnames.length === 2) readLog += ` and ${hostnames[1]}...`;
                     else if (hostnames.length > 2) readLog += `, ${hostnames[1]}, and ${hostnames.length - 2} others...`;
                     else readLog += '...';
                     
                     addLog(readLog);
                     
                     const chunkPromises = chunk.map(url => fetch(`/.netlify/functions/scrape?url=${encodeURIComponent(url)}`).then(r => r.json()).catch(() => null));
                     const results = await Promise.allSettled(chunkPromises);
                     results.forEach((res, idx) => {
                         if (res.status === 'fulfilled' && res.value?.text) {
                             let cleanScrape = res.value.text;
                             // Forcefully strip bizarre unicode bugs, unclosed tags, and weird spacing to protect the LLM
                             cleanScrape = cleanScrape.replace(/\s+/g, ' ').replace(/[^\x20-\x7E\n]/g, '');
                             combinedText += `\n\n[SOURCE: ${chunk[idx]}]\n${cleanScrape.substring(0, 1000)}`;
                         }
                     });
                 }
                 addLog(`Synthesizing information...`);
                 
                 // Cap absolute maximum context memory injected to prevent repetition penalty collapse and Groq API token hard limits
                 let finalSafeContext = combinedText.substring(0, 12000);
                 
                 hiddenContext = (hiddenContext || "") + `\n\n[DEEP RESEARCH DATA]\nYou are an advanced Deep Research AI evaluating live web extracts. Synthesize the following scraped sources into a clean, structurally perfect, and highly verified conclusion. Ignore garbage text and ads. Cite the explicitly scraped URLs natively during your explanation:\n\n${finalSafeContext}`;
             }

             let synthesisModel = selectedModel === 'void-deep-research' ? 'llama-3.1-8b-instant' : selectedModel;
             let response = await sendMessage(
               text.trim() || "[See Deep Research Context]", 
               tempMessages.slice(0, -1), 
               synthesisModel, 
               hiddenContext,
               systemInstructions
             );

             if (response.isRateLimitError || response.isModelError) {
                 const ms = response.isRateLimitError ? parseGroqWaitTime(response.rateLimitTime) : (24 * 60 * 60 * 1000);
                 const textLabel = response.isRateLimitError ? (response.rateLimitTime || '1h') : 'OFFLINE';
                 get().setCooldown('void-deep-research', Date.now() + ms, textLabel);
                 
                 const state = get();
                 const fallbacks = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];
                 let nextModelId = DEFAULT_MODEL;
                 for (const mid of fallbacks) {
                     const cd = state.modelCooldowns[mid];
                     if (!cd || cd.unlockAt < Date.now()) { nextModelId = mid; break; }
                 }
                 addLog(`Model limited or offline. Auto-selected backup ${nextModelId}...`);
                 set({ selectedModel: nextModelId });
                 
                 synthesisModel = nextModelId === 'void-deep-research' ? 'llama-3.1-8b-instant' : nextModelId;
                 response = await sendMessage(text.trim() || "[See Deep Research Context]", tempMessages.slice(0, -1), synthesisModel, hiddenContext, systemInstructions);
             }

             set((state) => ({ chats: state.chats.map(c => c.id === activeChatId ? { ...c, messages: c.messages.map(m => m.id === researchId ? { ...m, content: response.reply, isResearching: false, researchLogs: [...m.researchLogs, "Research complete."] } : m) } : c) }));
             return; // Branch termination
          }

          // Standard secure Cloud routing logic
          let response = await sendMessage(
            text.trim() || "[See Attached Context]", 
            tempMessages.slice(0, -1), 
            selectedModel, 
            hiddenContext,
            systemInstructions
          );

          if (response.isModelError || response.isRateLimitError) {
             const ms = response.isRateLimitError ? parseGroqWaitTime(response.rateLimitTime) : (24 * 60 * 60 * 1000);
             const textLabel = response.isRateLimitError ? (response.rateLimitTime || '1h') : 'OFFLINE';
             get().setCooldown(selectedModel, Date.now() + ms, textLabel);
             
             // Auto-recover completely transparently
             const state = get();
             const fallbacks = [DEFAULT_MODEL, 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];
             let nextModelId = DEFAULT_MODEL;
             for (const mid of fallbacks) {
                 if (mid === selectedModel) continue; // Skip the locked one natively
                 const cd = state.modelCooldowns[mid];
                 if (!cd || cd.unlockAt < Date.now()) { nextModelId = mid; break; }
             }
             
             set({ selectedModel: nextModelId });
             response = await sendMessage(text.trim() || "[See Attached Context]", tempMessages.slice(0, -1), nextModelId === 'void-deep-research' ? 'llama-3.1-8b-instant' : nextModelId, hiddenContext, systemInstructions);
          }

          const assistantMsg = { id: nanoid(), role: 'assistant', content: response.reply, createdAt: Date.now() };

          set((state) => ({
            chats: state.chats.map(chat => chat.id === activeChatId ? { ...chat, messages: [...chat.messages, assistantMsg] } : chat)
          }));
        } catch (e) {
          console.error("Chat Pipeline System Error:", e);
          const errorMsg = { id: nanoid(), role: 'assistant', content: `[ENGINE FATAL] ${e.message}`, createdAt: Date.now() };
          set((state) => ({
            chats: state.chats.map(chat => chat.id === activeChatId ? { ...chat, messages: [...chat.messages, errorMsg] } : chat)
          }));
        } finally {
          set({ isTyping: false });
        }
      },

      regenerateMessage: async (messageId) => {
        const { isTyping, chats, activeChatId, selectedModel, outputLength, responseBehavior } = get();
        if (isTyping) return;
        
        const activeChat = chats.find(c => c.id === activeChatId);
        if (!activeChat) return;

        const msgIndex = activeChat.messages.findIndex(m => m.id === messageId);
        if (msgIndex === -1 || activeChat.messages[msgIndex].role !== 'assistant') return;

        const prevMsg = activeChat.messages[msgIndex - 1];
        if (!prevMsg || prevMsg.role !== 'user') return;

        // Truncate the chat branch exactly at the failed AI message
        const tempMessages = activeChat.messages.slice(0, msgIndex);
        
        set((state) => ({
          chats: state.chats.map(chat => chat.id === activeChatId ? { ...chat, messages: tempMessages } : chat),
          isTyping: true
        }));

        try {
          let finalPrompt = prevMsg.content;
          const { hiddenContext } = prevMsg;
          
          if (finalPrompt === '[Attached Document]') {
            finalPrompt = "[See Attached Context]";
          }

          const systemInstructions = getSystemDirectives(outputLength, responseBehavior);
          const response = await sendMessage(finalPrompt, tempMessages.slice(0, -1), selectedModel, hiddenContext, systemInstructions);

          const assistantMsg = { id: nanoid(), role: 'assistant', content: response.reply, createdAt: Date.now() };

          set((state) => ({
            chats: state.chats.map(chat => chat.id === activeChatId ? { ...chat, messages: [...chat.messages, assistantMsg] } : chat)
          }));

          if (response.isModelError) {
            set({ selectedModel: DEFAULT_MODEL });
          }
        } catch (e) {
          console.error("Regeneration Fatal Pipeline:", e);
          const errorMsg = { id: nanoid(), role: 'assistant', content: `[ENGINE FATAL] ${e.message}`, createdAt: Date.now() };
          set((state) => ({
            chats: state.chats.map(chat => chat.id === activeChatId ? { ...chat, messages: [...chat.messages, errorMsg] } : chat)
          }));
        } finally {
          set({ isTyping: false });
        }
      },

      // Auto-Optimizer (Triggered internally via storage listener or manually)
      optimizeStorage: () => {
        set((state) => {
          let currentChats = [...state.chats];
          const MAX_STORAGE = 4 * 1024 * 1024; // 4MB safe threshold
          const MAX_CONVERSATIONS = 50;
          let projectedSize = new Blob([JSON.stringify(currentChats)]).size;
          let wasOptimized = false;

          while ((projectedSize > MAX_STORAGE || currentChats.length > MAX_CONVERSATIONS) && currentChats.length > 1) {
            const prunable = currentChats.filter(c => c.id !== state.activeChatId);
            if (prunable.length === 0) break;
            prunable.sort((a, b) => {
              const timeA = a.createdAt || Number(a.id) || 0;
              const timeB = b.createdAt || Number(b.id) || 0;
              return timeA - timeB;
            });
            const oldestId = prunable[0].id;
            currentChats = currentChats.filter(c => c.id !== oldestId);
            projectedSize = new Blob([JSON.stringify(currentChats)]).size;
            wasOptimized = true;
          }

          if (wasOptimized) {
            toast("Memory optimized", { description: "Oldest inactive chats were cleared to maintain peak performance.", icon: '✨' });
            return { chats: currentChats };
          }
          // Do not return a new array reference if no optimization occurred to prevent infinite loops!
          return {};
        });
      }
    }),
    {
      name: 'void-app-storage',
      storage: createJSONStorage(() => idbStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      partialize: (state) => ({
        chats: state.chats,
        activeChatId: state.activeChatId,
        projects: state.projects,
        selectedModel: state.selectedModel,
        isSidebarOpen: state.isSidebarOpen,
        outputLength: state.outputLength,
        responseBehavior: state.responseBehavior
      }), // only persist these fields
    }
  )
);
