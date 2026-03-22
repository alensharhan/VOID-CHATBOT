import React, { useRef } from 'react';
import { PanelLeft, Menu, Loader2, Download } from 'lucide-react';
import { toast } from 'sonner';
import html2pdf from 'html2pdf.js';
import ModelSelector from './ModelSelector';
import { useAppStore } from '../store/useAppStore';

const Topbar = () => {
  const { isSidebarOpen, toggleSidebar: onMenuToggle, selectedModel, setSelectedModel: onModelChange, availableModels, isLoadingModels, activeChatId, chats } = useAppStore();

  const handleExportChat = () => {
    const element = document.getElementById('void-chat-export');
    if (!element) {
      toast.error('Chat window not found!');
      return;
    }

    const activeChat = chats.find(c => c.id === activeChatId);
    if (!activeChat || !activeChat.messages || activeChat.messages.length === 0) {
      toast.error('No messages to export!');
      return;
    }
    
    const toastId = toast.loading('Generating your PDF document...');
    
    // Explicitly transition native elements into the specialized layout PDF mode graphically.
    // The geometry is automatically naturally structurally preserved without geometric hack bounds natively preventing overflow-x.
    document.body.classList.add('pdf-export-mode');
    
    try {
      const opt = {
        margin:       [15, 15, 15, 15], // Native physical A4 Margin bounds handle the visual breathing room safely!
        filename:     `${(activeChat.title || 'VOID_Transcript').replace(/[^a-zA-Z0-9_-]/g, '_')}_${new Date().getTime()}.pdf`,
        image:        { type: 'jpeg', quality: 1 },
        html2canvas:  { 
          scale: 2, 
          useCORS: true, 
          letterRendering: true,
          backgroundColor: document.documentElement.classList.contains('dark') ? '#1B1B1B' : '#ffffff',
          windowWidth: Math.max(element.scrollWidth, 800) // Fallback explicit horizon guarantee ensuring massive flex buffers align completely cleanly
        },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
      };

      html2pdf().set(opt).from(element).save().then(() => {
        document.body.classList.remove('pdf-export-mode');
        
        toast.success('Successfully downloaded PDF!', { id: toastId, icon: '📄' });
      }).catch(err => {
        // Safe revert on fail
        document.body.classList.remove('pdf-export-mode');
        console.error(err);
        toast.error('Failed to export PDF', { id: toastId });
      });
      
    } catch (err) {
      document.body.classList.remove('pdf-export-mode');
      console.error(err);
      toast.error('Failed to export PDF', { id: toastId });
    }
  };
  return (
    <header className="min-h-[56px] py-1.5 shrink-0 border-b border-zinc-200 dark:border-white/[0.04] flex items-center justify-between px-4 bg-white dark:bg-[#1B1B1B]/90 backdrop-blur-xl z-40 w-full transition-colors duration-300 relative">
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        {/* On mobile devices, the burger menu sits cleanly on the absolute left to invoke the slide-in matrix. */}

        <button
          onClick={onMenuToggle}
          className="md:hidden shrink-0 p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center ml-1">
          {isLoadingModels ? (
            <div className="flex items-center gap-2 text-zinc-500 font-medium text-sm px-3 py-1.5">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Fetching cores...</span>
            </div>
          ) : (
            <ModelSelector
              selectedModel={selectedModel}
              onModelChange={onModelChange}
              availableModels={availableModels}
              disabled={availableModels.length === 0}
            />
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleExportChat}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold tracking-wider uppercase text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-white/[0.04] hover:bg-zinc-200 dark:hover:bg-white/[0.08] transition-colors rounded-lg border border-transparent dark:border-white/[0.04]"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Export</span>
        </button>
      </div>
    </header>
  );
};

export default Topbar;
