import React from 'react';
import { motion } from 'framer-motion';
import { Terminal, Lightbulb, Link2, Sparkles, Infinity } from 'lucide-react';

const suggestions = [
  { icon: Terminal, text: "Write a React component with Framer Motion" },
  { icon: Lightbulb, text: "Explain quantum computing in simple terms" },
  { icon: Link2, text: "How to integrate WebSockets in Node.js" },
  { icon: Sparkles, text: "Design a premium dark mode color palette" }
];

const EmptyState = ({ onSuggestionClick }) => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center m-auto max-w-2xl py-12">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="text-center mb-10"
      >
        <div className="w-16 h-16 rounded-[24px] bg-white border border-zinc-200 dark:bg-white/[0.03] dark:border-white/[0.08] flex items-center justify-center mx-auto mb-6 shadow-sm dark:shadow-none">
          <Infinity className="w-8 h-8 text-zinc-400 dark:text-zinc-300" />
        </div>
        <h2 className="text-[28px] font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight mb-3">Ask into the VOID</h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium tracking-wide">Calm intelligence, on demand.</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full"
      >
        {suggestions.map((s, i) => {
          const Icon = s.icon;
          return (
            <button
              key={i}
              onClick={() => onSuggestionClick(s.text)}
              className="flex flex-col items-start gap-3.5 p-4 md:p-5 rounded-2xl bg-white hover:bg-zinc-50 border border-zinc-200 hover:border-zinc-300 dark:bg-white/[0.03] dark:hover:bg-white/[0.06] dark:border-white/[0.06] dark:hover:border-white/[0.12] transition-colors text-left shadow-sm hover:shadow-md dark:shadow-none group"
            >
              <div className="w-8 h-8 rounded-full bg-zinc-100 group-hover:bg-zinc-200 dark:bg-white/[0.06] flex items-center justify-center dark:group-hover:bg-white/[0.1] transition-colors">
                <Icon className="w-4 h-4 text-zinc-500 group-hover:text-zinc-700 dark:text-zinc-400 dark:group-hover:text-zinc-200 transition-colors" />
              </div>
              <span className="text-[13.5px] md:text-[14.5px] font-medium text-zinc-600 group-hover:text-zinc-900 dark:text-zinc-300 dark:group-hover:text-zinc-100 transition-colors leading-snug">{s.text}</span>
            </button>
          )
        })}
      </motion.div>
    </div>
  );
};

export default EmptyState;
