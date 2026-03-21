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

export const useAppStore = create(
  persist(
    (set, get) => ({
      // State
      isSidebarOpen: window.innerWidth >= 768,
      chats: [],
      projects: [],
      activeChatId: nanoid(),
      selectedModel: DEFAULT_MODEL,
      availableModels: [],
      isLoadingModels: true,
      isTyping: false,

      // Actions
      setIsSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      
      setSelectedModel: (modelId) => set({ selectedModel: modelId }),
      
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

      sendChatMessage: async (text, hiddenContext = null, outputLength = 'Auto') => {
        const { isTyping, chats, activeChatId, selectedModel } = get();
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
          let finalPrompt = text.trim() || "[See Attached Context]";
          
          if (outputLength === 'Snapshot') finalPrompt += `\n\n[MANDATORY SYSTEM INSTRUCTION: Your response must be an absolute maximum of 1 to 2 sentences. Be razor sharp, highly direct, and get straight to the point without any conversational filler, greetings, or fluff. Give the user exactly what they asked for in the shortest amount of words possible.]`;
          else if (outputLength === 'Concise') finalPrompt += `\n\n[MANDATORY SYSTEM INSTRUCTION: Keep your response relatively brief and concise. Use short paragraphs. Avoid over-explaining edge cases unless explicitly asked for. Omit long introductions and standard AI disclaimers.]`;
          else if (outputLength === 'In-Depth') finalPrompt += `\n\n[MANDATORY SYSTEM INSTRUCTION: Provide a highly detailed, comprehensive, and nuanced response to this query. Break the answer down into structured logic, utilize helpful formatting (like bolding, bullet points, or headers), and explore the topic deeply.]`;

          // Standard secure Cloud routing logic
          const response = await sendMessage(finalPrompt, tempMessages.slice(0, -1), selectedModel, hiddenContext);

          const assistantMsg = { id: nanoid(), role: 'assistant', content: response.reply, createdAt: Date.now() };

          set((state) => ({
            chats: state.chats.map(chat => chat.id === activeChatId ? { ...chat, messages: [...chat.messages, assistantMsg] } : chat)
          }));

          if (response.isModelError) {
            set({ selectedModel: DEFAULT_MODEL });
          }
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
        const { isTyping, chats, activeChatId, selectedModel } = get();
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

          const response = await sendMessage(finalPrompt, tempMessages.slice(0, -1), selectedModel, hiddenContext);

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
      partialize: (state) => ({
        chats: state.chats,
        activeChatId: state.activeChatId,
        projects: state.projects,
        selectedModel: state.selectedModel,
        isSidebarOpen: state.isSidebarOpen,
      }), // only persist these fields
    }
  )
);
