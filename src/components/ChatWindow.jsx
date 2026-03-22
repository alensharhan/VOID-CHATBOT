import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import EmptyState from './EmptyState';
import MessageBubble from './MessageBubble';

const ChatWindow = ({ messages, isTyping }) => {
  const endRef = useRef(null);

  // Auto-scroll removed to let App.jsx handle smart scrolling

  if (messages.length === 0) {
    return <EmptyState />;
  }

  const lastAiIndex = [...messages].reverse().findIndex(m => m.role === 'assistant');
  const actualLastAiIndex = lastAiIndex !== -1 ? messages.length - 1 - lastAiIndex : -1;

  return (
    <div className="flex flex-col gap-6 w-full pb-4">
      {messages.map((m, index) => (
        <MessageBubble 
          key={m.id} 
          message={m} 
          isLatestAI={index === actualLastAiIndex} 
        />
      ))}

      {isTyping && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex gap-4 w-full"
        >
          <div className="w-8 h-8 rounded-full bg-white border border-zinc-200 shadow-sm dark:bg-zinc-800 dark:border-transparent flex items-center justify-center shrink-0 mt-1">
            <div className="w-3 h-3 bg-zinc-300 dark:bg-zinc-400 rounded-full" />
          </div>
          <div className="py-4 px-2 flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-zinc-400 dark:bg-zinc-500 rounded-full animate-[bounce_1s_infinite_ease-in-out_both]" style={{ animationDelay: '-0.32s' }} />
            <div className="w-1.5 h-1.5 bg-zinc-400 dark:bg-zinc-500 rounded-full animate-[bounce_1s_infinite_ease-in-out_both]" style={{ animationDelay: '-0.16s' }} />
            <div className="w-1.5 h-1.5 bg-zinc-400 dark:bg-zinc-500 rounded-full animate-[bounce_1s_infinite_ease-in-out_both]" />
          </div>
        </motion.div>
      )}

      <div ref={endRef} className="h-4" />
    </div>
  );
};

export default ChatWindow;
