import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import ChatWindow from './components/ChatWindow';
import Composer from './components/Composer';
import { sendMessage } from './lib/chatApi';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [chatId, setChatId] = useState(Date.now().toString()); // Represents active chat session

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleStartNewChat = () => {
    setMessages([]);
    setChatId(Date.now().toString());
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const handleSendMessage = async (text) => {
    if (!text.trim() || isTyping) return;

    // Add user message
    const userMsg = { id: Date.now().toString(), role: 'user', content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const replyContent = await sendMessage(text.trim(), messages);
      const assistantMsg = { id: (Date.now() + 1).toString(), role: 'assistant', content: replyContent };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (e) {
      const errorMsg = { id: (Date.now() + 1).toString(), role: 'assistant', content: "An unexpected disturbance occurred while retrieving clearance. Please try again." };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden font-sans text-brand relative">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onNewChat={handleStartNewChat}
        activeChatId={chatId}
      />
      
      <main className="flex-1 flex flex-col h-full relative z-0 min-w-0 transition-all duration-300">
        <Topbar onMenuToggle={toggleSidebar} />
        
        <div className="flex-1 overflow-hidden flex flex-col items-center relative">
          {/* Subtle cinematic gradient behind main chat */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-white/[0.015] rounded-full blur-[150px] pointer-events-none" />
          
          <ChatWindow 
            messages={messages} 
            isTyping={isTyping} 
            onSuggestionClick={handleSendMessage}
          />
        </div>

        <div className="w-full flex justify-center p-4 md:p-6 bg-gradient-to-t from-background via-background/90 to-transparent">
          <div className="w-full max-w-3xl">
            <Composer onSend={handleSendMessage} disabled={isTyping} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
