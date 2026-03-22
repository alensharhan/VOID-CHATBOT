import React, { useEffect, useRef, useState } from 'react';
import { Toaster, toast } from 'sonner';
import { useAppStore } from './store/useAppStore';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import ChatWindow from './components/ChatWindow';
import Composer from './components/Composer';
import EmptyState from './components/EmptyState';
import { ArrowDown } from 'lucide-react';

function App() {
  const { _hasHydrated, chats, activeChatId, isTyping, loadModels, optimizeStorage, startNewChat } = useAppStore();

  const activeChat = chats.find(c => c.id === activeChatId);
  const currentMessages = activeChat ? activeChat.messages : [];

  const scrollContainerRef = useRef(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const prevMsgCountRef = useRef(currentMessages.length);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
    setShowScrollButton(!isNearBottom);
  };

  const scrollToBottom = (behavior = 'smooth') => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior
      });
    }
  };

  useEffect(() => {
    setTimeout(() => scrollToBottom('auto'), 50);
  }, [activeChatId]);

  useEffect(() => {
    if (currentMessages.length > prevMsgCountRef.current) {
      const lastMsg = currentMessages[currentMessages.length - 1];
      // Only auto-scroll when the user sends a message or when a deep research trace initialized.
      // Do NOT forcefully auto-scroll when a generated AI output arrives, so the reader stays at the top.
      if (lastMsg && (lastMsg.role === 'user' || lastMsg.isResearching)) {
        setTimeout(() => scrollToBottom('smooth'), 50);
      }
    }
    prevMsgCountRef.current = currentMessages.length;
  }, [currentMessages.length]);



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
        {/* Scroll area wrapper */}
        <div className="relative flex-1 min-h-0 w-full">

          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="absolute inset-0 flex flex-col items-center overflow-x-hidden overflow-y-auto custom-scrollbar"
          >
          <div id="void-chat-export" className="w-full max-w-[800px] px-4 pt-8 flex-1 flex flex-col bg-white dark:bg-[#1B1B1B] transition-colors">
            <div className={`w-full flex-1 flex flex-col ${currentMessages.length > 0 ? 'pb-[180px]' : 'pb-8 md:pb-12'}`}>
              <ChatWindow
                messages={currentMessages}
                isTyping={isTyping}
              />
            </div>
          </div>
          </div>

        </div>

        <div className={`absolute left-0 right-0 md:right-[12px] px-4 pb-2 md:px-6 md:pb-4 pointer-events-none z-10 transition-all duration-300 ${
          currentMessages.length === 0
            ? 'top-[52%] -translate-y-1/2 bg-transparent flex flex-col justify-center'
            : 'bottom-0 bg-white dark:bg-[#1B1B1B]'
        }`}>
          <div className="max-w-[720px] mx-auto w-full pointer-events-auto relative flex flex-col justify-center">
            
            {showScrollButton && (
              <button
                onClick={() => scrollToBottom('smooth')}
                className="absolute -top-14 left-1/2 -translate-x-1/2 w-8 h-8 flex items-center justify-center bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-full shadow-md text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors z-50 animate-in fade-in zoom-in duration-200"
              >
                <ArrowDown className="w-4 h-4" strokeWidth={2.5} />
              </button>
            )}

            {currentMessages.length === 0 && <EmptyState />}
            <Composer />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
