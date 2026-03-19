import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MessageSquare, Menu, Settings, X } from 'lucide-react';

const mockHistory = [
  "Architecture patterns for scalable ML",
  "Optimizing React render cycles",
  "Deep dark UI aesthetic guidelines",
  "Microservices vs Monolith trade-offs",
  "Database indexing strategies",
  "Understanding Transformer models"
];

const Sidebar = ({ isOpen, onClose, onNewChat, activeChatId }) => {
  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      <div className={`
        fixed top-0 left-0 h-full w-[280px] z-50 transform transition-transform duration-300 ease-in-out flex flex-col
        md:relative md:translate-x-0 bg-[#0a0a0a] border-r border-white/5 shadow-2xl md:shadow-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        
        {/* Header / Brand */}
        <div className="h-16 flex items-center justify-between px-6 shrink-0">
          <span className="font-bold text-lg tracking-[0.2em] text-white">VOID</span>
          <button onClick={onClose} className="md:hidden text-white/50 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="px-4 pb-4 shrink-0 mt-2">
          <button 
            onClick={onNewChat}
            className="w-full h-11 flex items-center gap-3 px-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl transition-all duration-200 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">New Chat</span>
          </button>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar">
          <div className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3 px-2 mt-4">Recent</div>
          <ul className="flex flex-col gap-1">
            <li className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-surface/80 border border-white/5 text-white cursor-pointer transition-colors group">
              <MessageSquare className="w-4 h-4 text-white/80 shrink-0" />
              <span className="text-sm truncate">Current Session</span>
            </li>
            {mockHistory.map((title, idx) => (
              <li 
                key={idx} 
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/50 hover:text-white hover:bg-white/5 cursor-pointer transition-colors group"
                onClick={onClose}
              >
                <MessageSquare className="w-4 h-4 shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />
                <span className="text-sm truncate">{title}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer / User Settings */}
        <div className="px-4 py-4 shrink-0 border-t border-white/5 mt-auto">
          <button className="flex items-center gap-3 px-3 py-3 w-full rounded-lg hover:bg-white/5 text-white/70 hover:text-white transition-colors group">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/10 group-hover:bg-white/20 transition-colors">
              <span className="text-xs font-medium text-white">U</span>
            </div>
            <span className="text-sm font-medium">Personal Account</span>
            <Settings className="w-4 h-4 ml-auto opacity-50 group-hover:opacity-100" />
          </button>
        </div>

      </div>
    </>
  );
};

export default Sidebar;
