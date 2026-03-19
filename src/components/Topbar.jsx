import React from 'react';
import { Menu, MoreHorizontal, Eraser } from 'lucide-react';

const Topbar = ({ onMenuToggle }) => {
  return (
    <header className="h-16 flex items-center justify-between px-4 md:px-6 shrink-0 relative z-10 border-b border-white/5 backdrop-blur-md bg-transparent">
      <div className="flex items-center gap-3">
        <button 
          onClick={onMenuToggle}
          className="md:hidden p-2 -ml-2 text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="font-medium text-white/90 text-sm md:text-base hidden sm:block">VOID Assistant</div>
      </div>

      <div className="flex items-center gap-2">
        <button className="p-2 text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-colors group" title="Clear Chat">
          <Eraser className="w-4 h-4 group-hover:text-red-400 group-hover:scale-110 transition-all" />
        </button>
        <button className="p-2 text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

export default Topbar;
