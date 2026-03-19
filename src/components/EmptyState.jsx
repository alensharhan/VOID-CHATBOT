import React from 'react';
import { motion } from 'framer-motion';
import { Infinity } from 'lucide-react';

const EmptyState = () => {
  return (
    <div className="w-full flex-1 flex flex-col items-center justify-center mx-auto max-w-2xl mb-[15vh]">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="text-center"
      >
        <div className="w-12 h-12 rounded-[18px] bg-white border border-zinc-200 dark:bg-white/[0.03] dark:border-white/[0.08] flex items-center justify-center mx-auto mb-4 shadow-sm dark:shadow-none">
          <Infinity className="w-6 h-6 text-zinc-400 dark:text-zinc-300" />
        </div>
        <h2 className="text-[24px] md:text-[28px] font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight mb-2">Ask into the VOID</h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium tracking-wide">Calm intelligence, on demand.</p>
      </motion.div>
    </div>
  );
};

export default EmptyState;
