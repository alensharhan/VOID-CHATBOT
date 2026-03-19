import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, AlignLeft, ChevronDown, Check } from 'lucide-react';

const LENGTH_MODES = ['Auto', 'Snapshot', 'Concise', 'In-Depth'];

const Composer = ({ onSend, disabled }) => {
  const [text, setText] = useState('');
  const [outputLength, setOutputLength] = useState('Auto');
  const [isLengthMenuOpen, setIsLengthMenuOpen] = useState(false);
  const textareaRef = useRef(null);
  const menuRef = useRef(null);
  const toggleRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [text]);

  useEffect(() => {
    if (!disabled && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [disabled]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) && toggleRef.current && !toggleRef.current.contains(e.target)) {
        setIsLengthMenuOpen(false);
      }
    };
    if (isLengthMenuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isLengthMenuOpen]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (text.trim() && !disabled) {
      onSend(text, outputLength);
      setText('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
  };

  return (
    <div className="w-full flex flex-col gap-2 relative">
      <div className="relative flex flex-col gap-2 pl-4 pr-3 py-2.5 md:pl-5 md:pr-4 md:py-3 bg-zinc-100 dark:bg-[#2A2A2A] rounded-3xl transition-colors dark:border dark:border-white/[0.04] shadow-sm">
        
        {/* Input Row */}
        <div className="flex items-end gap-2.5 w-full">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message VOID..."
            disabled={disabled}
            className="flex-1 w-full min-h-[36px] max-h-[250px] bg-transparent text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 text-[15px] leading-[24px] resize-none focus:outline-none py-1.5 custom-scrollbar disabled:opacity-50"
            rows={1}
          />

          <button
            onClick={handleSubmit}
            disabled={!text.trim() || disabled}
            className="w-[36px] h-[36px] rounded-full transition-all shrink-0 flex items-center justify-center 
              bg-zinc-900 text-white hover:bg-zinc-800 disabled:bg-zinc-300 disabled:text-zinc-500
              dark:bg-white dark:text-black dark:hover:bg-zinc-200 dark:disabled:bg-white/10 dark:disabled:text-white/40"
          >
            <ArrowUp className="w-[18px] h-[18px]" strokeWidth={2.5} />
          </button>
        </div>

        {/* Toolbar Row */}
        <div className="w-full flex items-center justify-between pt-1 pb-0.5">
          <div className="flex items-center gap-2">
            <button
              ref={toggleRef}
              onClick={() => setIsLengthMenuOpen(!isLengthMenuOpen)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12.5px] font-semibold tracking-wide transition-colors ${
                outputLength !== 'Auto' || isLengthMenuOpen
                  ? 'bg-zinc-200 text-zinc-800 dark:bg-white/10 dark:text-zinc-200' 
                  : 'bg-transparent text-zinc-500 hover:bg-zinc-200 dark:hover:bg-white/5 dark:text-zinc-400 dark:hover:text-zinc-300'
              }`}
            >
              <AlignLeft className="w-3.5 h-3.5 opacity-80" />
              <span>{outputLength}</span>
              <ChevronDown className={`w-3.5 h-3.5 opacity-60 transition-transform duration-200 ${isLengthMenuOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

      </div>

      {/* Length Popover Menu */}
      {isLengthMenuOpen && (
        <div
          ref={menuRef}
          className="absolute left-2 bottom-[calc(100%+8px)] w-[160px] bg-white dark:bg-[#2A2A2A] border border-zinc-200 dark:border-[#383838] rounded-xl shadow-lg dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)] z-50 p-1.5 flex flex-col font-sans origin-bottom-left animate-in fade-in slide-in-from-bottom-2 duration-150 ring-1 ring-black/[0.03] dark:ring-white/[0.03]"
        >
          <div className="px-2 pb-1.5 pt-1 text-[11px] font-bold text-zinc-400 dark:text-zinc-500 tracking-wider">RESPONSE LENGTH</div>
          <div className="flex flex-col gap-0.5">
            {LENGTH_MODES.map((mode) => (
              <button
                key={mode}
                onClick={() => { setOutputLength(mode); setIsLengthMenuOpen(false); }}
                className={`flex items-center justify-between px-2.5 py-2 text-[13px] font-[500] rounded-md transition-colors text-left w-full group ${
                  outputLength === mode 
                    ? 'text-zinc-900 bg-zinc-100 dark:text-white dark:bg-white/10' 
                    : 'text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10'
                }`}
              >
                <span>{mode}</span>
                {outputLength === mode && <Check className="w-[14px] h-[14px] shrink-0 text-zinc-700 dark:text-zinc-300" />}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="text-center text-xs text-zinc-500 dark:text-zinc-500 tracking-wide mt-1">
        VOID can make mistakes. Remember to verify critical information.
      </div>
    </div>
  );
};

export default Composer;
