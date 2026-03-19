import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MessageSquare, MoreHorizontal, Pencil, Trash2, FolderInput, FolderMinus, Folder, ChevronLeft } from 'lucide-react';

const ChatItem = ({ chat, isActive, onSelect, onRename, onDelete, projects, onMoveToProject }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMoveMenuOpen, setIsMoveMenuOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [titleInput, setTitleInput] = useState(chat.title || "New Conversation");
  const [menuPos, setMenuPos] = useState({ top: 'auto', bottom: 'auto', left: 0 });

  const menuRef = useRef(null);
  const inputRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) && buttonRef.current && !buttonRef.current.contains(e.target)) {
        setIsMenuOpen(false);
        setTimeout(() => setIsMoveMenuOpen(false), 200);
      }
    };
    if (isMenuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  const handleRenameSubmit = () => {
    if (titleInput.trim() !== (chat.title || "New Conversation") && titleInput.trim() !== "") {
      onRename(chat.id, titleInput.trim());
    } else {
      setTitleInput(chat.title || "New Conversation");
    }
    setIsRenaming(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleRenameSubmit();
    if (e.key === 'Escape') {
      setTitleInput(chat.title || "New Conversation");
      setIsRenaming(false);
    }
  };

  const handleOpenMenu = (e) => {
    e.stopPropagation();
    if (!isMenuOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      
      let cy = rect.top + (rect.height / 2);
      
      const assumedHalfHeight = 110; 
      if (cy - assumedHalfHeight < 15) {
        cy = assumedHalfHeight + 15;
      } else if (cy + assumedHalfHeight > window.innerHeight - 15) {
        cy = window.innerHeight - assumedHalfHeight - 15;
      }

      // Adjust left position to not overflow right side of screen
      let cx = rect.right + 12;
      const menuWidth = 200; // Fixed width used in the class
      if (cx + menuWidth > window.innerWidth - 12) {
        cx = window.innerWidth - menuWidth - 12;
      }

      setMenuPos({ 
        top: cy, 
        left: cx 
      });
    }
    setIsMenuOpen(!isMenuOpen);
    setIsMoveMenuOpen(false);
  };

  return (
    <li
      onClick={() => {
        if (!isRenaming) onSelect(chat.id);
      }}
      className={`group relative flex items-center gap-3 px-2 py-2.5 rounded-lg cursor-pointer transition-colors ${isActive
        ? 'bg-zinc-200/60 dark:bg-[#2A2A2A] shadow-sm'
        : 'hover:bg-zinc-100/80 dark:hover:bg-white/[0.04]'
        }`}
    >
      <MessageSquare className={`w-[18px] h-[18px] shrink-0 transition-opacity ${isActive ? 'text-zinc-700 dark:text-zinc-300' : 'text-zinc-400'}`} />

      {isRenaming ? (
        <input
          ref={inputRef}
          value={titleInput}
          onChange={(e) => setTitleInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleRenameSubmit}
          className="flex-1 min-w-0 bg-transparent border border-blue-500/50 outline-none text-[14px] tracking-tight font-[500] text-zinc-900 dark:text-zinc-100 px-1 py-0.5 rounded -ml-1 w-full"
          autoFocus
        />
      ) : (
        <span className={`flex-1 min-w-0 text-[14px] tracking-tight truncate pt-px ${isActive ? 'font-[500] text-zinc-900 dark:text-zinc-100' : 'font-[500] text-zinc-700 dark:text-zinc-200 group-hover:text-zinc-900 dark:group-hover:text-zinc-100'}`}>
          {chat.title || "New Conversation"}
        </span>
      )}

      {!isRenaming && (
        <button
          ref={buttonRef}
          onClick={handleOpenMenu}
          className={`p-1 -mr-1 rounded-md hover:bg-zinc-200 dark:hover:bg-white/10 transition-colors shrink-0 
            ${isMenuOpen ? 'opacity-100 text-zinc-800 bg-zinc-200 dark:text-zinc-200 dark:bg-white/[0.08]' : 'opacity-100 text-zinc-400 md:opacity-0 md:group-hover:opacity-100'}`}
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      )}

      {isMenuOpen && createPortal(
        <div
          ref={menuRef}
          style={{ top: menuPos.top, left: menuPos.left }}
          className="fixed w-[200px] bg-white dark:bg-[#2A2A2A] border border-zinc-200 dark:border-[#383838] rounded-xl shadow-lg dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)] z-[99999] p-1.5 flex flex-col font-sans ring-1 ring-black/[0.03] dark:ring-white/[0.03] origin-left -translate-y-1/2"
          onClick={(e) => e.stopPropagation()}
        >
          {!isMoveMenuOpen ? (
            <div className="flex flex-col gap-1">
              <button
                onClick={() => { setIsRenaming(true); setIsMenuOpen(false); }}
                className="flex items-center gap-3 px-3 py-2.5 text-[14px] font-[500] text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 rounded-md transition-colors text-left w-full group"
              >
                <Pencil className="w-[18px] h-[18px] shrink-0 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-100 transition-colors" />
                <span className="truncate">Rename</span>
              </button>

              <div className="h-px bg-zinc-100 dark:bg-white/[0.08] my-0.5 mx-1" />

              <button
                onClick={() => setIsMoveMenuOpen(true)}
                className="flex items-center gap-3 px-3 py-2.5 text-[14px] font-[500] text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 rounded-md transition-colors text-left w-full group"
              >
                <FolderInput className="w-[18px] h-[18px] shrink-0 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-100 transition-colors" />
                <span className="truncate">Move to project</span>
              </button>

              {chat.projectId && (
                <button
                  onClick={() => { onMoveToProject(chat.id, null); setIsMenuOpen(false); }}
                  className="flex items-center gap-3 px-3 py-2.5 text-[14px] font-[500] text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 rounded-md transition-colors text-left w-full group"
                >
                  <FolderMinus className="w-[18px] h-[18px] shrink-0 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-100 transition-colors" />
                  <span className="truncate">Remove from project</span>
                </button>
              )}

              <div className="h-px bg-zinc-100 dark:bg-white/[0.08] my-0.5 mx-1" />

              <button
                onClick={() => { onDelete(chat.id); setIsMenuOpen(false); }}
                className="flex items-center gap-3 px-3 py-2.5 text-[14px] font-[500] text-[#e5484d] hover:text-[#e5484d] dark:text-[#ff6a71] dark:hover:text-[#ff8a91] hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors text-left w-full group"
              >
                <Trash2 className="w-[18px] h-[18px] shrink-0 opacity-80 group-hover:opacity-100 transition-opacity" />
                <span className="truncate">Delete</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col py-1">
              <div className="flex items-center justify-between px-2 pb-2 mb-2 border-b border-zinc-100 dark:border-white/[0.08]">
                <button onClick={() => setIsMoveMenuOpen(false)} className="hover:text-zinc-800 dark:hover:text-zinc-200 p-1.5 -ml-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/10 rounded-md transition-colors">
                  <ChevronLeft className="w-[18px] h-[18px]" />
                </button>
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 tracking-wider">SELECT PROJECT</span>
                <div className="w-[30px]" />
              </div>

              {projects.length === 0 ? (
                <div className="px-3 py-4 text-[13px] text-zinc-500 font-[500] italic text-center">No projects exist.</div>
              ) : (
                <div className="max-h-[220px] overflow-y-auto custom-scrollbar flex flex-col gap-0.5">
                  {projects.map(p => (
                    <button
                      key={p.id}
                      onClick={() => { onMoveToProject(chat.id, p.id); setIsMenuOpen(false); setIsMoveMenuOpen(false); }}
                      className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-[13px] transition-colors text-left select-none ${p.id === chat.projectId ? 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-500/10 font-[600]' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 hover:text-zinc-900 dark:hover:text-white font-[500]'}`}
                    >
                      <Folder className="w-4 h-4 shrink-0 opacity-80" />
                      <span className="truncate flex-1">{p.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>,
        document.body
      )}
    </li>
  );
};

export default ChatItem;
