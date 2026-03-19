import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import ChatWindow from './components/ChatWindow';
import Composer from './components/Composer';
import { sendMessage } from './lib/chatApi';
import { fetchModels, DEFAULT_MODEL } from './lib/models';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [isTyping, setIsTyping] = useState(false);

  const [availableModels, setAvailableModels] = useState([]);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [selectedModel, setSelectedModel] = useState(
    localStorage.getItem('void_model') || DEFAULT_MODEL
  );

  const [projects, setProjects] = useState(() => {
    const saved = localStorage.getItem('void_projects');
    return saved ? JSON.parse(saved) : [];
  });

  const [chats, setChats] = useState(() => {
    const saved = localStorage.getItem('void_chats_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeChatId, setActiveChatId] = useState(Date.now().toString());
  const [toastMessage, setToastMessage] = useState("");

  const activeChat = chats.find(c => c.id === activeChatId);
  const currentMessages = activeChat ? activeChat.messages : [];

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  useEffect(() => {
    localStorage.setItem('void_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    try {
      let currentChats = [...chats];
      const MAX_STORAGE = 4 * 1024 * 1024; // 4MB safe threshold
      const MAX_CONVERSATIONS = 50;
      let projectedSize = new Blob([JSON.stringify(currentChats)]).size;
      let wasOptimized = false;

      // Smart loop: calculate exact size against limits, pruning oldest first
      while ((projectedSize > MAX_STORAGE || currentChats.length > MAX_CONVERSATIONS) && currentChats.length > 1) {
        const prunable = currentChats.filter(c => c.id !== activeChatId);
        if (prunable.length === 0) break; // Hard shield active conversation

        // Find the absolute oldest chat by historical ID string mapping
        prunable.sort((a, b) => Number(a.id) - Number(b.id));
        const oldestId = prunable[0].id;

        currentChats = currentChats.filter(c => c.id !== oldestId);
        projectedSize = new Blob([JSON.stringify(currentChats)]).size;
        wasOptimized = true;
      }

      localStorage.setItem('void_chats_history', JSON.stringify(currentChats));

      if (wasOptimized) {
        setChats(currentChats); // Reactively sync pruned memory array to DOM
        setToastMessage("Storage optimized — older chats were removed to keep the app running smoothly on the free plan.");
      }
    } catch (error) {
      console.error("Storage crash avoided:", error);
    }
  }, [chats, activeChatId]);

  useEffect(() => {
    const loadModels = async () => {
      setIsLoadingModels(true);
      const models = await fetchModels();
      setAvailableModels(models);

      if (models.length > 0 && !models.find(m => m.id === selectedModel)) {
        const fallBackId = models.find(m => m.id === DEFAULT_MODEL) ? DEFAULT_MODEL : models[0].id;
        setSelectedModel(fallBackId);
      }
      setIsLoadingModels(false);
    };
    loadModels();
  }, []);

  useEffect(() => {
    localStorage.setItem('void_model', selectedModel);
  }, [selectedModel]);

  useEffect(() => {
    // Force permanent dark mode explicitly
    document.documentElement.classList.add('dark');
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleStartNewChat = () => {
    setActiveChatId(Date.now().toString());
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const handleSelectChat = (id) => {
    setActiveChatId(id);
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const handleRenameChat = (id, newTitle) => {
    setChats(prev => prev.map(c => c.id === id ? { ...c, title: newTitle } : c));
  };

  const handleDeleteChat = (targetId) => {
    setChats(prev => {
      const filtered = prev.filter(c => c.id !== targetId);
      if (activeChatId === targetId) {
        if (filtered.length > 0) setActiveChatId(filtered[0].id);
        else setActiveChatId(Date.now().toString());
      }
      return filtered;
    });
  };

  const handleClearAllChats = () => {
    if (window.confirm("Are you sure you want to delete all chat history? This cannot be undone.")) {
      setChats([]);
      setActiveChatId(Date.now().toString());
    }
  };

  // --- Project Management Actions ---
  const handleCreateProject = (name) => {
    const newProject = {
      id: "proj_" + Date.now().toString(),
      name,
      isExpanded: true
    };
    setProjects(prev => [newProject, ...prev]);
  };

  const handleRenameProject = (id, newName) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, name: newName } : p));
  };

  const handleDeleteProject = (id) => {
    if (window.confirm("Delete project? Chats inside will be moved to uncategorized and saved.")) {
      setProjects(prev => prev.filter(p => p.id !== id));
      // Safely strip the projectId binding so they appear natively in Uncategorized
      setChats(prev => prev.map(c => c.projectId === id ? { ...c, projectId: null } : c));
    }
  };

  const handleToggleProjectExpand = (id) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, isExpanded: !p.isExpanded } : p));
  };

  const handleMoveChatToProject = (chatId, projectId) => {
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, projectId } : c));
  };
  // ----------------------------------

  const handleSendMessage = async (text, outputLength = 'Auto') => {
    if (!text.trim() || isTyping) return;

    const userMsg = { id: Date.now().toString(), role: 'user', content: text.trim() };
    const tempMessages = [...currentMessages, userMsg];

    let newTitle = "";
    const isNewChat = !activeChat;

    if (isNewChat) {
      const words = text.trim().split(' ');
      newTitle = words.slice(0, 4).join(' ') + (words.length > 4 ? '...' : '');
    }

    setChats(prev => {
      if (isNewChat) {
        return [{ id: activeChatId, title: newTitle, messages: tempMessages, projectId: null }, ...prev];
      }
      return prev.map(chat =>
        chat.id === activeChatId
          ? { ...chat, messages: tempMessages }
          : chat
      );
    });

    setIsTyping(true);

    try {
      let finalPrompt = text.trim();
      
      if (outputLength === 'Snapshot') {
        finalPrompt += `\n\n[MANDATORY SYSTEM INSTRUCTION: Your response must be an absolute maximum of 1 to 2 sentences. Be razor sharp, highly direct, and get straight to the point without any conversational filler, greetings, or fluff. Give the user exactly what they asked for in the shortest amount of words possible.]`;
      } else if (outputLength === 'Concise') {
        finalPrompt += `\n\n[MANDATORY SYSTEM INSTRUCTION: Keep your response relatively brief and concise. Use short paragraphs. Avoid over-explaining edge cases unless explicitly asked for. Omit long introductions and standard AI disclaimers.]`;
      } else if (outputLength === 'In-Depth') {
        finalPrompt += `\n\n[MANDATORY SYSTEM INSTRUCTION: Provide a highly detailed, comprehensive, and nuanced response to this query. Break the answer down into structured logic, utilize helpful formatting (like bolding, bullet points, or headers), and explore the topic deeply.]`;
      }

      const response = await sendMessage(finalPrompt, tempMessages.slice(0, -1), selectedModel);

      const assistantMsg = { id: (Date.now() + 1).toString(), role: 'assistant', content: response.reply };

      setChats(prev => prev.map(chat =>
        chat.id === activeChatId
          ? { ...chat, messages: [...chat.messages, assistantMsg] }
          : chat
      ));

      if (response.isModelError) {
        setSelectedModel(DEFAULT_MODEL);
      }

    } catch (e) {
      const errorMsg = { id: (Date.now() + 1).toString(), role: 'assistant', content: "I am unable to reach the network core. Please verify your connection." };
      setChats(prev => prev.map(chat =>
        chat.id === activeChatId
          ? { ...chat, messages: [...chat.messages, errorMsg] }
          : chat
      ));
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="h-screen w-full flex overflow-hidden bg-white text-zinc-900 dark:bg-[#1B1B1B] dark:text-[#D9D9D9] font-sans transition-colors duration-300">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onNewChat={handleStartNewChat}
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={handleSelectChat}
        onRenameChat={handleRenameChat}
        onDeleteChat={handleDeleteChat}
        onClearAllChats={handleClearAllChats}
        projects={projects}
        onCreateProject={handleCreateProject}
        onRenameProject={handleRenameProject}
        onDeleteProject={handleDeleteProject}
        onToggleProjectExpand={handleToggleProjectExpand}
        onMoveChatToProject={handleMoveChatToProject}
      />

      <main className="flex-1 flex flex-col min-w-0 h-full bg-white dark:bg-[#1B1B1B] transition-colors duration-300 relative">
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[13.5px] font-medium tracking-tight rounded-full shadow-2xl border border-white/10 dark:border-black/10 flex items-center justify-center max-w-[90%] text-center pointer-events-none"
            >
              {toastMessage}
            </motion.div>
          )}
        </AnimatePresence>

        <Topbar
          isSidebarOpen={isSidebarOpen}
          onMenuToggle={toggleSidebar}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          availableModels={availableModels}
          isLoadingModels={isLoadingModels}
        />

        <div className="flex-1 w-full flex flex-col items-center relative z-0 overflow-x-hidden overflow-y-auto custom-scrollbar">
          <div className="w-full max-w-3xl px-4 pt-8 pb-[180px] flex-1 flex flex-col">
            <ChatWindow
              messages={currentMessages}
              isTyping={isTyping}
              onSuggestionClick={handleSendMessage}
            />
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-[12px] p-4 md:p-6 bg-gradient-to-t from-white via-white/80 to-transparent dark:from-[#1b1b1b] dark:via-[#1b1b1b]/80 pointer-events-none z-10 transition-colors duration-300">
          <div className="max-w-3xl mx-auto w-full pointer-events-auto">
            <Composer onSend={handleSendMessage} disabled={isTyping} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
