import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Sparkles, Zap, Brain, Globe, FlaskConical, ShieldAlert, Cpu } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

const enrichModelData = (modelId, modelName) => {
  if (!modelId) return null;
  const id = String(modelId).toLowerCase();

  if (id.includes('llama-3.3-70b') || id.includes('llama3-70b') || id.includes('llama-3.3')) {
    return { group: 'Recommended', title: 'VOID Core', description: 'Balanced, high-quality responses for everyday use.', badge: 'Best', Icon: Sparkles };
  }
  if (id.includes('llama-3.1-8b') || id.includes('llama-3-8b') || id.includes('mistral') || id.includes('gemma')) {
    let titleStr = 'VOID Flash';
    if (id.includes('mistral')) titleStr = 'VOID Surge';
    else if (id.includes('gemma')) titleStr = 'VOID Spark';
    
    return { group: 'Fast', title: titleStr, description: 'Instant responses for lighter tasks.', badge: null, Icon: Zap };
  }
  if (id.includes('deepseek') || id.includes('120b') || id.includes('reasoning') || id.includes('gpt-oss') || id.includes('void-deep-research')) {
    return { group: 'Reasoning', title: 'VOID Deep', description: 'Advanced logic and rigorous analytical reasoning.', badge: 'Pro', Icon: Brain };
  }
  if (id.includes('allam') || id.includes('arabic')) {
    return { group: 'Multilingual', title: 'VOID Global', description: 'Optimized for Arabic and vast multilingual prompts.', badge: 'Arabic', Icon: Globe };
  }
  if (id.includes('qwen') || id.includes('mixtral')) {
    return { group: 'Multilingual', title: 'VOID Global', description: 'Strong multilingual support across general tasks.', badge: null, Icon: Globe };
  }
  if (id.includes('prompt-guard') || id.includes('safety') || id.includes('safeguard')) {
    return { group: 'Experimental', title: 'VOID Shield', description: 'Evaluates prompt security boundaries.', badge: 'Beta', Icon: ShieldAlert };
  }
  if (id.includes('compound') || id.includes('agent')) {
    return { group: 'Experimental', title: 'VOID Agent', description: 'Autonomous multi-step tool utilization.', badge: 'Beta', Icon: Cpu };
  }

  return { group: 'Experimental', title: modelName, description: 'External general purpose LLM endpoint.', badge: null, Icon: FlaskConical };
};

const ModelSelector = ({ selectedModel, onModelChange, availableModels, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  const { modelCooldowns } = useAppStore();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const allModels = [...availableModels];
  const activeModel = allModels.find(m => m.id === selectedModel);
  const activeParams = activeModel ? enrichModelData(activeModel.id, activeModel.name) : enrichModelData(selectedModel, selectedModel);
  const ActiveIcon = activeParams?.Icon || Sparkles;

  const groupedModels = useMemo(() => {
    const groups = {};
    allModels.forEach(m => {
      const { group, title, description, badge, Icon } = enrichModelData(m.id, m.name);
      if (!groups[group]) groups[group] = [];
      groups[group].push({ ...m, title, description, badge, Icon });
    });

    // Sort logic to enforce logical bucket rendering visually
    const order = ['Recommended', 'Fast', 'Reasoning', 'Multilingual', 'Experimental'];
    return order.map(groupName => ({
      groupName,
      models: groups[groupName] || []
    })).filter(g => g.models.length > 0);
  }, [allModels]);

  return (
    <div className="relative z-50 flex flex-col shrink-0" ref={dropdownRef}>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-colors disabled:opacity-50 group ${
          isOpen 
            ? 'bg-zinc-100 dark:bg-white/10' 
            : 'active:bg-zinc-100 dark:active:bg-white/5 sm:hover:bg-zinc-100 sm:dark:hover:bg-white/5'
        }`}
      >
        {activeParams && (
          <ActiveIcon className="w-[18px] h-[18px] text-zinc-600 dark:text-zinc-300" />
        )}
        <div className="flex flex-col items-start px-0.5">
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
              {activeParams ? activeParams.title : 'Loading...'}
            </span>
            {activeParams?.badge && (
              <span className="px-1.5 py-px text-[9px] font-bold bg-zinc-200/60 text-zinc-600 dark:bg-white/10 dark:text-zinc-300 rounded uppercase tracking-wider">
                {activeParams.badge}
              </span>
            )}
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform duration-200 ml-1 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute top-[100%] mt-2 left-0 w-[calc(100vw-4.8rem)] max-w-[320px] sm:max-w-[360px] sm:w-[360px] max-h-[70vh] sm:max-h-[60vh] flex flex-col bg-white dark:bg-[#1a1a1c] border border-zinc-200 dark:border-white/10 rounded-2xl shadow-[0_12px_40px_-10px_rgba(0,0,0,0.15)] dark:shadow-2xl backdrop-blur-xl dark:bg-[#1a1a1c]/95 overflow-hidden py-1.5 px-0 z-[100]"
          >
            <div className="w-full flex-1 overflow-y-auto custom-scrollbar flex flex-col px-1.5 pb-2">
              {groupedModels.map((group, gIdx) => (
                <div key={group.groupName} className="flex flex-col shrink-0">
                  {gIdx > 0 && <div className="h-px bg-zinc-100 dark:bg-white/[0.04] mx-3 my-2 shrink-0" />}
                  <div className="px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 shrink-0">
                    {group.groupName}
                  </div>

                    <div className="flex flex-col gap-1 w-full pl-0">
                      {group.models.map(m => {
                        const MIcon = m.Icon;
                        const isSelected = selectedModel === m.id;
                        
                        const cd = modelCooldowns[m.id];
                        const isLocked = cd && cd.unlockAt > Date.now();

                        return (
                          <button
                            key={m.id}
                            disabled={isLocked}
                            onClick={() => {
                                if (!isLocked) {
                                  onModelChange(m.id);
                                  setIsOpen(false);
                                }
                            }}
                          className={`flex items-start gap-3 w-full p-2.5 rounded-xl transition-all text-left ${isLocked ? 'cursor-not-allowed opacity-40 grayscale' : 'group/item shrink-0'} ${isSelected && !isLocked
                              ? 'bg-blue-50/50 dark:bg-blue-500/10 cursor-pointer'
                              : !isLocked ? 'hover:bg-zinc-50 dark:hover:bg-white/5 cursor-pointer' : ''
                            }`}
                        >
                          <MIcon className={`w-[18px] h-[18px] mt-0.5 shrink-0 ${isSelected && !isLocked ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-500 dark:text-zinc-400 group-hover/item:text-zinc-900 dark:group-hover/item:text-zinc-200'}`} />
                          <div className="flex flex-col flex-1 min-w-0 pr-2 pb-0.5">
                            <div className="flex items-center gap-2 mb-0.5 shrink-0">
                              <span className={`text-[14px] font-semibold tracking-tight truncate ${isSelected && !isLocked ? 'text-blue-700 dark:text-blue-300' : 'text-zinc-900 dark:text-zinc-100'}`}>
                                {m.title}
                              </span>
                              {m.badge && !isLocked && (
                                <span className={`shrink-0 px-1.5 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider ${isSelected ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300' : 'bg-zinc-100 text-zinc-500 dark:bg-white/10 dark:text-zinc-400'}`}>
                                  {m.badge}
                                </span>
                              )}
                              {isLocked && cd?.text && (
                                <span className="shrink-0 px-1.5 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400">
                                  {cd.text === 'OFFLINE' ? 'MODEL UNAVAILABLE' : `Limit over. Try again after ${cd.text}`}
                                </span>
                              )}
                            </div>
                            <span className={`text-[12px] font-medium whitespace-normal leading-snug break-words ${isSelected && !isLocked ? 'text-blue-600/80 dark:text-blue-400/80' : 'text-zinc-500 dark:text-zinc-400'}`}>
                              {`${m.name} • ${m.description}`}
                            </span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ModelSelector;
