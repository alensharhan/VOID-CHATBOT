import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PanelLeft, Plus, Settings, X, Zap, Trash2, FolderClosed, SquarePen, Search, FolderPlus, Infinity } from 'lucide-react';
import ChatItem from './ChatItem';
import ProjectItem from './ProjectItem';

const Sidebar = ({
  isOpen, onClose, onNewChat,
  chats = [], activeChatId, onSelectChat, onRenameChat, onDeleteChat, onClearAllChats,
  projects = [], onCreateProject, onRenameProject, onDeleteProject, onToggleProjectExpand, onMoveChatToProject
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsRef = useRef(null);

  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const newProjectInputRef = useRef(null);

  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);
  const searchResultsRef = useRef(null);

  useEffect(() => {
    if (isSearching && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearching]);

  useEffect(() => {
    const handleSearchClickOutside = (e) => {
      const isInsideSearchBox = searchContainerRef.current && searchContainerRef.current.contains(e.target);
      const isInsideSearchResults = searchResultsRef.current && searchResultsRef.current.contains(e.target);

      if (!isInsideSearchBox && !isInsideSearchResults) {
        setIsSearching(false);
        setSearchQuery("");
      }
    };
    if (isSearching) document.addEventListener('mousedown', handleSearchClickOutside);
    return () => document.removeEventListener('mousedown', handleSearchClickOutside);
  }, [isSearching]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setIsSettingsOpen(false);
      }
    };
    if (isSettingsOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSettingsOpen]);

  useEffect(() => {
    if (isCreatingProject && newProjectInputRef.current) {
      newProjectInputRef.current.focus();
    }
  }, [isCreatingProject]);

  const handleCreateProjectSubmit = (e) => {
    if (e) e.preventDefault();
    if (newProjectName.trim()) {
      onCreateProject(newProjectName.trim());
    }
    setNewProjectName("");
    setIsCreatingProject(false);
  };

  const handleCreateProjectKeyDown = (e) => {
    if (e.key === 'Enter') handleCreateProjectSubmit(e);
    if (e.key === 'Escape') {
      setNewProjectName("");
      setIsCreatingProject(false);
    }
  };

  const uncategorizedChats = chats.filter(c => !c.projectId);
  const searchLower = searchQuery.toLowerCase();
  const searchResults = chats.filter(c => (c.title || "New Conversation").toLowerCase().includes(searchLower));

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      <div className={`
        absolute md:relative top-0 left-0 h-full bg-[#111111] border-r-0 border-transparent z-50 transition-all duration-300 ease-in-out flex flex-col overflow-hidden shrink-0
        ${isOpen ? 'w-[280px] translate-x-0' : 'w-0 -translate-x-full md:translate-x-0'}
      `}>
        <div className="w-[280px] min-w-[280px] h-full flex flex-col">
          <div className="h-14 flex items-center justify-between px-5 shrink-0 border-b border-transparent">
            <div className="flex items-center gap-2.5 text-zinc-900 dark:text-zinc-100">
              <Infinity className="w-5 h-5" />
              <span className="font-semibold text-base tracking-wide">VOID</span>
            </div>
            <div className="flex items-center">
              <button
                onClick={onClose}
                className="hidden md:flex p-2 -mr-2 text-zinc-400 hover:text-zinc-100 hover:bg-white/5 rounded-lg transition-colors"
                title="Close Sidebar"
              >
                <PanelLeft className="w-5 h-5" />
              </button>
              <button onClick={onClose} className="md:hidden p-2 -mr-2 text-zinc-500 hover:text-zinc-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="px-3 pt-2 pb-1 shrink-0">
            <ul className="flex flex-col gap-0.5">
              <li>
                <button
                  onClick={onNewChat}
                  className="w-full flex items-center gap-3 px-2 py-2.5 hover:bg-zinc-100/80 dark:hover:bg-white/[0.04] text-zinc-700 dark:text-zinc-200 rounded-lg transition-colors group"
                >
                  <SquarePen className="w-[18px] h-[18px] shrink-0 text-zinc-400 group-hover:text-zinc-500 dark:text-zinc-400 dark:group-hover:text-zinc-300" />
                  <span className="text-[14px] font-[500] tracking-tight">New chat</span>
                </button>
              </li>
              <li>
                {isSearching ? (
                  <div ref={searchContainerRef} className="w-full flex items-center gap-3 px-2 py-1.5 bg-zinc-100/80 dark:bg-white/[0.04] text-zinc-700 dark:text-zinc-200 rounded-lg group border border-transparent dark:border-white/5 shadow-sm">
                    <Search className="w-[18px] h-[18px] shrink-0 text-zinc-400" />
                    <input
                      ref={searchInputRef}
                      className="w-full bg-transparent outline-none text-[14px] font-[500] tracking-tight placeholder:text-zinc-500"
                      placeholder="Search chats..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button onClick={() => { setIsSearching(false); setSearchQuery(""); }} className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-md transition-colors text-zinc-500">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsSearching(true)}
                    className="w-full flex items-center gap-3 px-2 py-2.5 hover:bg-zinc-100/80 dark:hover:bg-white/[0.04] text-zinc-700 dark:text-zinc-200 rounded-lg transition-colors group"
                  >
                    <Search className="w-[18px] h-[18px] shrink-0 text-zinc-400 group-hover:text-zinc-500 dark:text-zinc-400 dark:group-hover:text-zinc-300" />
                    <span className="text-[14px] font-[500] tracking-tight">Search chats</span>
                  </button>
                )}
              </li>
            </ul>
          </div>
          <div className="px-5 pb-2 pt-1 shrink-0">
            <div className="h-px w-full bg-zinc-200 dark:bg-white/[0.06]" />
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 custom-scrollbar">
            {isSearching ? (
              <ul ref={searchResultsRef} className="flex flex-col gap-0.5 pb-4">
                <div className="px-2 py-1 text-xs font-semibold text-zinc-500 mt-1 mb-1 tracking-wider">SEARCH RESULTS</div>
                {searchResults.length > 0 ? searchResults.map(chat => (
                  <ChatItem
                    key={chat.id}
                    chat={chat}
                    isActive={chat.id === activeChatId}
                    onSelect={(id) => {
                      onSelectChat(id);
                      setIsSearching(false);
                      setSearchQuery("");
                    }}
                    onRename={onRenameChat}
                    onDelete={onDeleteChat}
                    projects={projects}
                    onMoveToProject={onMoveChatToProject}
                  />
                )) : (
                  <div className="px-2 py-4 text-[13px] text-zinc-500 text-center italic">No chats found.</div>
                )}
              </ul>
            ) : (
              <>
                <ul className="flex flex-col gap-0.5 mb-3">
                  <li>
                    <button
                      onClick={() => setIsCreatingProject(true)}
                      className="w-full flex items-center gap-3 px-2 py-2.5 hover:bg-zinc-100/80 dark:hover:bg-white/[0.04] text-zinc-700 dark:text-zinc-200 rounded-lg transition-colors group"
                    >
                      <FolderPlus className="w-[18px] h-[18px] shrink-0 text-zinc-400 group-hover:text-zinc-500 dark:text-zinc-400 dark:group-hover:text-zinc-300" />
                      <span className="text-[14px] font-[500] tracking-tight">New project</span>
                    </button>
                  </li>

                  {isCreatingProject && (
                    <li className="flex items-center gap-2.5 px-2 py-2.5 rounded-lg bg-zinc-100 dark:bg-white/5 border border-blue-500/50 shadow-sm mt-1 mb-1">
                      <FolderClosed className="w-[18px] h-[18px] text-blue-400 shrink-0" />
                      <input
                        ref={newProjectInputRef}
                        value={newProjectName}
                        onChange={e => setNewProjectName(e.target.value)}
                        onKeyDown={handleCreateProjectKeyDown}
                        onBlur={handleCreateProjectSubmit}
                        className="flex-1 min-w-0 bg-transparent outline-none text-[13.5px] text-zinc-900 dark:text-zinc-100 px-1 py-0.5"
                        placeholder="Project Title..."
                      />
                    </li>
                  )}

                  {projects.map(project => {
                    const projectChats = chats.filter(c => c.projectId === project.id);
                    return (
                      <ProjectItem
                        key={project.id}
                        project={project}
                        hasChats={projectChats.length > 0}
                        onRename={onRenameProject}
                        onDelete={onDeleteProject}
                        onToggleExpand={onToggleProjectExpand}
                      >
                        {project.isExpanded && projectChats.map(chat => (
                          <div key={chat.id} className="pl-[28px] relative before:absolute before:left-[18px] before:top-0 before:bottom-0 before:w-px before:bg-zinc-200 dark:before:bg-white/[0.04]">
                            <ChatItem
                              chat={chat}
                              isActive={chat.id === activeChatId}
                              onSelect={onSelectChat}
                              onRename={onRenameChat}
                              onDelete={onDeleteChat}
                              projects={projects}
                              onMoveToProject={onMoveChatToProject}
                            />
                          </div>
                        ))}
                      </ProjectItem>
                    );
                  })}
                </ul>

                {(projects.length > 0) && uncategorizedChats.length > 0 && <div className="h-px w-[calc(100%-16px)] ml-2 bg-zinc-200 dark:bg-white/[0.06] my-3" />}

                <ul className="flex flex-col gap-0.5 relative z-10 pb-4">
                  {uncategorizedChats.map(chat => (
                    <ChatItem
                      key={chat.id}
                      chat={chat}
                      isActive={chat.id === activeChatId}
                      onSelect={onSelectChat}
                      onRename={onRenameChat}
                      onDelete={onDeleteChat}
                      projects={projects}
                      onMoveToProject={onMoveChatToProject}
                    />
                  ))}
                </ul>
              </>
            )}
          </div>

          <div className="p-3.5 shrink-0 border-t border-white/5 relative z-50" ref={settingsRef}>
            <div
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className="flex items-center gap-3 px-3 py-2 w-full rounded-xl hover:bg-white/5 cursor-pointer transition-colors group select-none"
            >
              <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20">
                <Zap className="w-4 h-4 text-blue-400" />
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-[13px] font-semibold text-zinc-200 truncate leading-snug">Free Plan</span>
                <span className="text-[11px] text-zinc-500 truncate leading-snug">Local workspace</span>
              </div>
              <Settings className={`w-4 h-4 text-zinc-500 transition-transform duration-300 ${isSettingsOpen ? 'rotate-90 text-zinc-300' : 'group-hover:text-zinc-300'}`} />
            </div>

            <AnimatePresence>
              {isSettingsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-full left-3 mb-2 w-[236px] bg-[#1a1a1c] border border-white/10 rounded-xl shadow-2xl py-1.5 overflow-hidden"
                >
                  <button
                    onClick={() => {
                      setIsSettingsOpen(false);
                      setTimeout(onClearAllChats, 150);
                    }}
                    className="flex w-full items-center gap-2.5 px-3 py-2.5 text-[13px] font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-left"
                  >
                    <Trash2 className="w-4 h-4 shrink-0" />
                    <span>Clear all chats</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
