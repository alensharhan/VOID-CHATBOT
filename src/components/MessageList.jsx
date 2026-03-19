import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MessageBubble from './MessageBubble';

const MessageList = ({ messages, isTyping }) => {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div className="w-full h-full overflow-y-auto pb-24 custom-scrollbar relative z-10 pt-8">
      <div className="flex flex-col gap-6">
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}
          
          {isTyping && (
             <motion.div
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="flex gap-4 w-full max-w-3xl mx-auto px-4"
             >
               <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center shrink-0 mt-1 bg-surface/40">
                 <div className="w-3 h-3 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
               </div>
               <div className="py-4 px-6 flex items-center gap-2">
                 <div className="w-1.5 h-1.5 bg-white/50 rounded-full animate-[bounce_1.4s_infinite_ease-in-out_both]" style={{ animationDelay: '-0.32s' }} />
                 <div className="w-1.5 h-1.5 bg-white/50 rounded-full animate-[bounce_1.4s_infinite_ease-in-out_both]" style={{ animationDelay: '-0.16s' }} />
                 <div className="w-1.5 h-1.5 bg-white/50 rounded-full animate-[bounce_1.4s_infinite_ease-in-out_both]" />
               </div>
             </motion.div>
          )}
        </AnimatePresence>
        <div ref={endRef} className="h-10" />
      </div>
    </div>
  );
};

export default MessageList;
