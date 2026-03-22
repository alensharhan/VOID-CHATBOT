import React from 'react';
import { motion } from 'framer-motion';
import { Infinity } from 'lucide-react';

const EmptyState = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full max-w-[720px] mx-auto flex items-center justify-center gap-3 mb-7 select-none pointer-events-none px-4 md:px-6"
    >
      <div className="w-9 h-9 rounded-xl bg-white border border-zinc-200 dark:bg-white/[0.04] dark:border-white/[0.08] flex items-center justify-center shadow-sm dark:shadow-none shrink-0">
        <Infinity className="w-5 h-5 text-zinc-500 dark:text-zinc-300" />
      </div>
      <h2 className="text-[22px] md:text-[26px] font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
        Ask into the VOID
      </h2>
    </motion.div>
  );
};

export default EmptyState;
