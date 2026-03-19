import React, { useState, useRef, useEffect } from 'react';
import { Folder, FolderOpen, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

const ProjectItem = ({ project, hasChats, onRename, onDelete, onToggleExpand, children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [titleInput, setTitleInput] = useState(project.name);

  const menuRef = useRef(null);
  const inputRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) && buttonRef.current && !buttonRef.current.contains(e.target)) {
        setIsMenuOpen(false);
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
    if (titleInput.trim() !== project.name && titleInput.trim() !== "") {
      onRename(project.id, titleInput.trim());
    } else {
      setTitleInput(project.name);
    }
    setIsRenaming(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleRenameSubmit();
    if (e.key === 'Escape') {
      setTitleInput(project.name);
      setIsRenaming(false);
    }
  };

  return (
    <li className="flex flex-col gap-0.5">
      <div
        onClick={() => { if (!isRenaming) onToggleExpand(project.id); }}
        className="group relative flex items-center gap-3 px-2 py-2.5 rounded-lg cursor-pointer transition-colors hover:bg-zinc-100/80 dark:hover:bg-white/[0.04] text-zinc-700 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-zinc-100 select-none"
      >
        {project.isExpanded ? (
          <FolderOpen className="w-[18px] h-[18px] shrink-0 text-zinc-400 group-hover:text-zinc-500 dark:text-zinc-400 dark:group-hover:text-zinc-300" />
        ) : (
          <Folder className="w-[18px] h-[18px] shrink-0 text-zinc-400 group-hover:text-zinc-500 dark:text-zinc-400 dark:group-hover:text-zinc-300" />
        )}

        {isRenaming ? (
          <input
            ref={inputRef}
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleRenameSubmit}
            className="flex-1 min-w-0 bg-transparent border border-blue-500/50 rounded -ml-1 py-0.5 px-1 outline-none text-[14px] tracking-tight font-[500]"
            autoFocus
          />
        ) : (
          <span className="flex-1 min-w-0 text-[14px] tracking-tight font-[500] truncate pt-px">
            {project.name}
          </span>
        )}

        {!isRenaming && (
          <button
            ref={buttonRef}
            onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
            className={`p-1 -mr-1 rounded-md hover:bg-zinc-200 dark:hover:bg-white/10 transition-colors shrink-0 
              ${isMenuOpen ? 'opacity-100 text-zinc-800 bg-zinc-200 dark:text-zinc-200 dark:bg-white/[0.08]' : 'opacity-100 text-zinc-400 md:opacity-0 md:group-hover:opacity-100'}`}
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        )}

        {isMenuOpen && (
          <div
            ref={menuRef}
            className="absolute right-2 top-10 w-[180px] bg-white border-zinc-200 dark:bg-[#2A2A2A] border dark:border-white/[0.08] rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-2xl py-1.5 z-[9999] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => { setIsRenaming(true); setIsMenuOpen(false); }}
              className="flex items-center gap-3 px-3.5 py-2.5 text-[13px] font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors text-left w-full"
            >
              <Pencil className="w-4 h-4 shrink-0 opacity-70" />
              <span className="truncate">Rename</span>
            </button>
            <div className="my-1.5 border-t border-zinc-100 dark:border-white/[0.06]" />
            <button
              onClick={() => { onDelete(project.id); setIsMenuOpen(false); }}
              className="flex items-center gap-3 px-3.5 py-2.5 text-[13px] font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-left w-full"
            >
              <Trash2 className="w-4 h-4 shrink-0 opacity-80" />
              <span className="truncate">Delete</span>
            </button>
          </div>
        )}
      </div>

      {project.isExpanded && hasChats && (
        <div className="flex flex-col gap-0.5 mt-0.5">
          {children}
        </div>
      )}
    </li>
  );
};

export default ProjectItem;
