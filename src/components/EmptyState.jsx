import React from 'react';
import { motion } from 'framer-motion';
import { Terminal, Lightbulb, Link2, Sparkles } from 'lucide-react';

const suggestions = [
  { icon: Terminal, text: "Write a React component with Framer Motion" },
  { icon: Lightbulb, text: "Explain quantum computing in simple terms" },
  { icon: Link2, text: "How to integrate WebSockets in Node.js" },
  { icon: Sparkles, text: "Design a premium dark mode color palette" }
];

const EmptyState = ({ onSuggestionClick }) => {
  return (
    <div className="w-full flex flex-col items-center justify-center flex-1 p-6 z-10 h-full min-h-[50vh]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="text-center mb-12"
      >
        <div className="w-16 h-16 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
          <div className="w-5 h-5 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.8)]" />
        </div>
        <h2 className="text-3xl md:text-4xl font-semibold text-white tracking-tight mb-3">Ask into the VOID</h2>
        <p className="text-white/40 text-sm md:text-base font-light">Calm intelligence, on demand.</p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
        className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl mx-auto"
      >
        {suggestions.map((s, i) => {
          const Icon = s.icon;
          return (
             <button 
               key={i}
               onClick={() => onSuggestionClick(s.text)}
               className="flex flex-col items-start gap-3 p-4 rounded-2xl bg-surface/40 hover:bg-surface/80 border border-white/5 hover:border-white/10 transition-all text-left group shadow-lg"
             >
               <Icon className="w-4 h-4 text-white/50 group-hover:text-white transition-colors" />
               <span className="text-sm text-white/70 group-hover:text-white transition-colors">{s.text}</span>
             </button>
          )
        })}
      </motion.div>
    </div>
  );
};

export default EmptyState;
