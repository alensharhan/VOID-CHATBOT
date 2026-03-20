import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Document, Page, pdfjs } from 'react-pdf';
import { X, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Use the same worker convention as pdfjs-dist to avoid version conflicts
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const PDFPreview = ({ file, onClose }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);

  if (!file) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        className="fixed right-0 top-0 h-full w-full max-w-[520px] bg-white dark:bg-[#1a1a1a] border-l border-zinc-200 dark:border-white/[0.07] z-50 flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-white/[0.07] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <FileText className="w-4 h-4 text-blue-500 shrink-0" />
            <span className="text-[13.5px] font-semibold text-zinc-800 dark:text-zinc-200 truncate">
              {file.name}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors shrink-0 ml-3"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col items-center py-6 px-4 gap-4 bg-zinc-50 dark:bg-[#141414]">
          <Document
            file={file.rawFile}
            onLoadSuccess={({ numPages }) => { setNumPages(numPages); setPageNumber(1); }}
            onLoadError={(e) => console.error('PDF Load Error:', e)}
            loading={
              <div className="flex items-center justify-center h-48 text-zinc-400 text-sm">
                Loading preview...
              </div>
            }
          >
            <Page
              pageNumber={pageNumber}
              width={Math.min(window.innerWidth * 0.85, 460)}
              className="rounded-xl shadow-lg overflow-hidden"
              renderAnnotationLayer={true}
              renderTextLayer={true}
            />
          </Document>
        </div>

        {/* Page Controls */}
        {numPages && numPages > 1 && (
          <div className="flex items-center justify-center gap-4 py-3.5 border-t border-zinc-200 dark:border-white/[0.07] shrink-0">
            <button
              onClick={() => setPageNumber(p => Math.max(1, p - 1))}
              disabled={pageNumber <= 1}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[13px] font-medium text-zinc-600 dark:text-zinc-400 tabular-nums">
              Page {pageNumber} of {numPages}
            </span>
            <button
              onClick={() => setPageNumber(p => Math.min(numPages, p + 1))}
              disabled={pageNumber >= numPages}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default PDFPreview;
