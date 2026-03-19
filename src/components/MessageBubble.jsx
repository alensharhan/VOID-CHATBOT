import React from 'react';
import { motion } from 'framer-motion';
import { User } from 'lucide-react';

const MessageBubble = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`flex gap-4 w-full max-w-3xl mx-auto px-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${isUser ? 'bg-white/10' : 'bg-transparent border border-white/10'}`}>
        {isUser ? <User className="w-4 h-4 text-white/80" /> : <div className="w-3 h-3 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]" />}
      </div>
      
      <div className={`py-3 px-5 rounded-3xl text-[15px] leading-relaxed max-w-[85%] ${
        isUser 
          ? 'bg-surface/80 text-white rounded-tr-md border border-white/5' 
          : 'bg-transparent text-white/90 border-transparent'
      }`}>
        {message.content}
      </div>
    </motion.div>
  );
};

export default MessageBubble;
