import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Sparkles, Zap, Brain, Globe, FlaskConical, ShieldAlert, Cpu } from 'lucide-react';
import { LOCAL_MODELS } from '../lib/models';

const enrichModelData = (modelId, modelName) => {
  const id = modelId.toLowerCase();

  if (id.includes('-mlc')) {
    return { group: 'Hardware-Accelerated Local AI', title: modelName.split('(')[0].trim(), description: '100% Free & Offline. Runs completely on your device via WebGPU.', badge: 'Local', Icon: Cpu };
  }

  if (id.includes('llama-3.3-70b') || id.includes('llama3-70b') || id.includes('llama-3.3')) {
    return { group: 'Recommended', title: modelName, description: 'Balanced, high-quality responses for everyday use.', badge: 'Best', Icon: Sparkles };
  }
  if (id.includes('llama-3.1-8b') || id.includes('llama-3-8b') || id.includes('mistral') || id.includes('gemma')) {
    return { group: 'Fast', title: modelName, description: 'Quick responses for lighter tasks.', badge: null, Icon: Zap };
  }
  if (id.includes('deepseek') || id.includes('120b') || id.includes('reasoning') || id.includes('gpt-oss')) {
    return { group: 'Reasoning', title: modelName || 'Deep Thinker', description: 'Stronger reasoning for coding and complex prompts.', badge: null, Icon: Brain };
  }
  if (id.includes('allam') || id.includes('arabic')) {
    return { group: 'Multilingual', title: modelName || 'Global Arabic', description: 'Optimized for Arabic and multilingual prompts.', badge: 'Arabic', Icon: Globe };
  }
  if (id.includes('qwen') || id.includes('mixtral')) {
    return { group: 'Multilingual', title: modelName || 'Global', description: 'Strong multilingual support across general tasks.', badge: null, Icon: Globe };
  }
  if (id.includes('prompt-guard') || id.includes('safety') || id.includes('safeguard')) {
    return { group: 'Experimental', title: modelName || 'Safety Core', description: 'Evaluates prompt security boundaries.', badge: null, Icon: ShieldAlert };
  }
  if (id.includes('compound') || id.includes('agent')) {
    return { group: 'Experimental', title: modelName || 'Agentic Core', description: 'Tool-use and autonomous routing.', badge: null, Icon: Cpu };
  }

  return { group: 'Experimental', title: modelName, description: 'General purpose LLM.', badge: null, Icon: FlaskConical };
};

const ModelSelector = ({ selectedModel, onModelChange, availableModels, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const [gpuStatus, setGpuStatus] = useState({ supported: false, isLowEnd: true });

  useEffect(() => {
    const checkGpu = async () => {
      if (!navigator.gpu) {
        setGpuStatus({ supported: false, isLowEnd: true });
        return;
      }
      try {
        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) {
          setGpuStatus({ supported: false, isLowEnd: true });
          return;
        }
        
        // Check VRAM limits if possible. Max storage buffer is a decent proxy.
        // A typical 8GB RAM system gives ~2GB max buffer. 16GB gives ~4GB max buffer.
        const maxBuffer = adapter.limits?.maxStorageBufferBindingSize || 0;
        const isLowEnd = maxBuffer < 2147483648; // Less than 2GB max buffer bound implies <8GB total system RAM/VRAM
        
        setGpuStatus({ supported: true, isLowEnd });
      } catch (e) {
         setGpuStatus({ supported: false, isLowEnd: true });
      }
    };
    checkGpu();
  }, []);

  const allModels = [...availableModels, ...LOCAL_MODELS];
  const activeModel = allModels.find(m => m.id === selectedModel);
  const activeParams = activeModel ? enrichModelData(activeModel.id, activeModel.name) : null;
  const ActiveIcon = activeParams?.Icon || Sparkles;

  const groupedModels = useMemo(() => {
    const groups = {};
    allModels.forEach(m => {
      const { group, title, description, badge, Icon } = enrichModelData(m.id, m.name);
      if (!groups[group]) groups[group] = [];
      groups[group].push({ ...m, title, description, badge, Icon });
    });

    // Sort logic to enforce logical bucket rendering visually
    const order = ['Recommended', 'Fast', 'Reasoning', 'Hardware-Accelerated Local AI', 'Multilingual', 'Experimental'];
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
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50 group"
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
            className="fixed top-[64px] left-3 right-3 sm:absolute sm:top-[100%] sm:left-0 sm:right-auto sm:mt-[1.2rem] sm:w-[360px] max-h-[55vh] flex flex-col bg-white dark:bg-[#1a1a1c] border border-zinc-200 dark:border-white/10 rounded-2xl shadow-[0_12px_40px_-10px_rgba(0,0,0,0.15)] dark:shadow-2xl backdrop-blur-xl dark:bg-[#1a1a1c]/95 overflow-hidden py-1.5 pr-2.5 pl-0"
          >
            <div className="w-full flex-1 overflow-y-auto custom-scrollbar flex flex-col pl-1.5 pr-0.5 pb-2">
              {groupedModels.map((group, gIdx) => (
                <div key={group.groupName} className="flex flex-col shrink-0">
                  {gIdx > 0 && <div className="h-px bg-zinc-100 dark:bg-white/[0.04] mx-3 my-2 shrink-0" />}
                  <div className="px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 shrink-0">
                    {group.groupName}
                  </div>

                  <div className="flex flex-col gap-0.5 px-2 shrink-0">
                    {group.models.map(m => {
                      const MIcon = m.Icon;
                      const isSelected = selectedModel === m.id;
                      const isLocal = m.id.includes('-MLC');
                      
                      let isDisabled = false;
                      let disableReason = "";
                      
                      if (isLocal) {
                        if (!gpuStatus.supported) {
                          isDisabled = true;
                          disableReason = "Requires a modern WebGPU-compatible graphics card, which your device lacks.";
                        } else if (gpuStatus.isLowEnd && m.vramWarning && m.vramWarning > 2) {
                          isDisabled = true;
                          disableReason = `Requires ${m.vramWarning}GB+ VRAM. Your device has limited unified memory and would crash if this model is loaded.`;
                        }
                      }

                      return (
                        <button
                          key={m.id}
                          disabled={isDisabled}
                          title={disableReason}
                          onClick={() => {
                            if (!isDisabled) {
                              onModelChange(m.id);
                              setIsOpen(false);
                            }
                          }}
                          className={`flex items-start gap-3 w-full p-2.5 rounded-xl transition-all text-left group/item shrink-0 ${isDisabled ? 'opacity-40 cursor-not-allowed bg-transparent' : isSelected
                              ? 'bg-blue-50/50 dark:bg-blue-500/10 cursor-pointer'
                              : 'hover:bg-zinc-50 dark:hover:bg-white/5 cursor-pointer'
                            }`}
                        >
                          <MIcon className={`w-[18px] h-[18px] mt-0.5 shrink-0 ${isDisabled ? 'text-zinc-400 dark:text-zinc-600' : isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-500 dark:text-zinc-400 group-hover/item:text-zinc-900 dark:group-hover/item:text-zinc-200'}`} />
                          <div className="flex flex-col flex-1 min-w-0 pr-2 pb-0.5">
                            <div className="flex items-center gap-2 mb-0.5 shrink-0">
                              <span className={`text-[14px] font-semibold tracking-tight truncate ${isDisabled ? 'text-zinc-500 dark:text-zinc-500' : isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-zinc-900 dark:text-zinc-100'}`}>
                                {m.title}
                              </span>
                              {m.badge && (
                                <span className={`shrink-0 px-1.5 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider ${isDisabled ? 'bg-zinc-100 text-zinc-400 dark:bg-white/5 dark:text-zinc-600' : isSelected ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300' : 'bg-zinc-100 text-zinc-500 dark:bg-white/10 dark:text-zinc-400'}`}>
                                  {m.badge}
                                </span>
                              )}
                            </div>
                            <span className={`text-[12px] font-medium whitespace-normal leading-snug break-words ${isDisabled ? 'text-zinc-400 dark:text-zinc-600' : isSelected ? 'text-blue-600/80 dark:text-blue-400/80' : 'text-zinc-500 dark:text-zinc-400'}`}>
                              {isDisabled && disableReason ? disableReason : `${m.name} • ${m.description}`}
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
