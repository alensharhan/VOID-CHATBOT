import React, { useState, useRef, useEffect } from 'react';
import { Send, FileUp, Loader2 } from 'lucide-react';

const Composer = ({ onSend, disabled }) => {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [text]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (text.trim() && !disabled) {
      onSend(text);
      setText('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
  };

  return (
    <div className="relative w-full z-10 group">
      <div className="absolute inset-0 bg-surface/80 backdrop-blur-xl rounded-2xl shadow-2xl glass border border-white/10 transition-all group-focus-within:border-white/20 group-focus-within:bg-surface/90" />
      
      <div className="relative flex items-end gap-2 p-3">
        <button 
          className="p-2.5 text-white/40 hover:text-white hover:bg-white/10 rounded-xl transition-colors shrink-0"
          type="button"
        >
          <FileUp className="w-5 h-5" />
        </button>
        
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message VOID..."
          disabled={disabled}
          className="w-full min-h-[44px] max-h-[200px] bg-transparent text-white placeholder:text-white/30 text-[15px] leading-relaxed resize-none focus:outline-none py-2.5 custom-scrollbar disabled:opacity-50"
          rows={1}
        />

        <button 
          onClick={handleSubmit}
          disabled={!text.trim() || disabled}
          className="p-2.5 bg-white text-black rounded-xl hover:bg-white/90 disabled:opacity-30 disabled:bg-white/20 disabled:text-white transition-all shrink-0 flex items-center justify-center min-w-[44px]"
        >
          {disabled ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </button>
      </div>
      <div className="text-center mt-2 pb-1 text-[10px] text-white/30 truncate px-4">
        AI responses may not always be accurate. Void is currently running in mock mode.
      </div>
    </div>
  );
};

export default Composer;
