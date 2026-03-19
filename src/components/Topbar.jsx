import React from 'react';
import { PanelLeft, Menu, Loader2 } from 'lucide-react';
import ModelSelector from './ModelSelector';

const Topbar = ({ isSidebarOpen, onMenuToggle, selectedModel, onModelChange, availableModels = [], isLoadingModels }) => {
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

    </header>
  );
};

export default Topbar;
