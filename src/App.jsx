import React, { useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import { useAppStore } from './store/useAppStore';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import ChatWindow from './components/ChatWindow';
import Composer from './components/Composer';

function App() {
  const { _hasHydrated, chats, activeChatId, isTyping, loadModels, optimizeStorage, startNewChat } = useAppStore();

  const activeChat = chats.find(c => c.id === activeChatId);
  const currentMessages = activeChat ? activeChat.messages : [];

  // Distinguish between a page refresh and a completely new browser tab/visit
  useEffect(() => {
    if (!_hasHydrated) return;
    const isReturningSession = sessionStorage.getItem('void_active_session');
    
    if (!isReturningSession) {
      // User literally just arrived at the website (or opened a new tab). Force a clean slate.
      startNewChat();
      sessionStorage.setItem('void_active_session', 'true');
    }
    // If 'void_active_session' exists, they just hit F5/Refresh. Do nothing, let Zustand keep the active chat open!
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_hasHydrated]);

  useEffect(() => {
    if (_hasHydrated) loadModels();
  }, [loadModels, _hasHydrated]);

  useEffect(() => {
    if (_hasHydrated) optimizeStorage();
  }, [activeChatId, optimizeStorage, _hasHydrated]);

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  if (!_hasHydrated) {
    return <div className="h-[100dvh] w-full bg-[#1B1B1B]" />;
  }

  return (
    <div className="h-[100dvh] w-full flex overflow-hidden bg-white text-zinc-900 dark:bg-[#1B1B1B] dark:text-[#D9D9D9] font-sans transition-colors duration-300 relative">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 h-full bg-white dark:bg-[#1B1B1B] transition-colors duration-300 relative">
        <Toaster 
          position="top-center" 
          toastOptions={{
            duration: 5000,
            className: "bg-zinc-900 border-none text-white dark:bg-white dark:text-zinc-900 text-[13.5px] font-medium tracking-tight rounded-xl shadow-2xl py-3 px-4 !w-[calc(100vw-32px)] sm:!w-[356px] break-words"
          }} 
        />

        <Topbar />

        <div className="flex-1 w-full flex flex-col items-center relative z-0 overflow-x-hidden overflow-y-auto custom-scrollbar">
        <div id="void-chat-export" className="w-full max-w-[800px] px-4 pt-8 flex-1 flex flex-col bg-white dark:bg-[#1B1B1B] transition-colors">
          <div className={`w-full flex-1 flex flex-col ${currentMessages.length > 0 ? 'pb-[180px]' : 'pb-8 md:pb-12'}`}>
            <ChatWindow
              messages={currentMessages}
              isTyping={isTyping}
            />
          </div>
        </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 md:right-[12px] px-4 pb-2 md:px-6 md:pb-4 bg-white dark:bg-[#1B1B1B] pointer-events-none z-10 transition-colors duration-300">
          <div className="max-w-[800px] mx-auto w-full pointer-events-auto">
            <Composer />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
