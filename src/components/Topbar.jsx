import React from 'react';
import { PanelLeft, Menu, Loader2, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';
import ModelSelector from './ModelSelector';
import { useAppStore } from '../store/useAppStore';

const Topbar = () => {
  const { isSidebarOpen, toggleSidebar: onMenuToggle, selectedModel, setSelectedModel: onModelChange, availableModels, isLoadingModels } = useAppStore();
  const handleExportChat = async () => {
    const element = document.getElementById('void-chat-export');
    if (!element) return;
    
    const toastId = toast.loading('Capturing high-res screenshot...');
    
    try {
      const canvas = await html2canvas(element, {
        backgroundColor: document.documentElement.classList.contains('dark') ? '#1B1B1B' : '#ffffff',
        scale: 2,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight
      });
      
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `VOID_Chat_${new Date().getTime()}.png`;
      link.click();
      
      toast.success('Screenshot saved to your device!', { id: toastId, icon: '📸' });
    } catch (err) {
      console.error(err);
      toast.error('Failed to capture screenshot', { id: toastId });
    }
  };
  return (
    <header className="min-h-[56px] py-1.5 shrink-0 border-b border-zinc-200 dark:border-white/[0.04] flex items-center justify-between px-4 bg-white dark:bg-[#1B1B1B]/90 backdrop-blur-xl z-10 w-full transition-colors duration-300 relative">
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        {!isSidebarOpen && (
          <button
            onClick={onMenuToggle}
            className="hidden md:flex shrink-0 p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg transition-colors"
            title="Toggle Sidebar"
          >
            <PanelLeft className="w-5 h-5" />
          </button>
        )}

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
