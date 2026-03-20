import React, { useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import { useAppStore } from './store/useAppStore';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import ChatWindow from './components/ChatWindow';
import Composer from './components/Composer';

function App() {
  const { chats, activeChatId, isTyping, loadModels, optimizeStorage } = useAppStore();

  const activeChat = chats.find(c => c.id === activeChatId);
  const currentMessages = activeChat ? activeChat.messages : [];

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  useEffect(() => {
    optimizeStorage();
  }, [activeChatId, optimizeStorage]);

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <div className="h-[100dvh] w-full flex overflow-hidden bg-white text-zinc-900 dark:bg-[#1B1B1B] dark:text-[#D9D9D9] font-sans transition-colors duration-300 relative">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 h-full bg-white dark:bg-[#1B1B1B] transition-colors duration-300 relative">
        <Toaster 
          position="top-center" 
          toastOptions={{
            duration: 5000,
            className: "bg-zinc-900 border-none text-white dark:bg-white dark:text-zinc-900 text-[13.5px] font-medium tracking-tight rounded-xl shadow-2xl py-3 px-4"
          }} 
        />

        <Topbar />

        <div className="flex-1 w-full flex flex-col items-center relative z-0 overflow-x-hidden overflow-y-auto custom-scrollbar">
        <div id="void-chat-export" className="w-full max-w-3xl px-4 pt-8 flex-1 flex flex-col bg-white dark:bg-[#1B1B1B] transition-colors">
          <div className={`w-full flex-1 flex flex-col ${currentMessages.length > 0 ? 'pb-[180px]' : 'pb-8 md:pb-12'}`}>
            <ChatWindow
              messages={currentMessages}
              isTyping={isTyping}
            />
          </div>
        </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 md:right-[12px] p-4 md:p-6 bg-gradient-to-t from-white via-white/80 to-transparent dark:from-[#1b1b1b] dark:via-[#1b1b1b]/80 pointer-events-none z-10 transition-colors duration-300">
          <div className="max-w-3xl mx-auto w-full pointer-events-auto">
            <Composer />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
