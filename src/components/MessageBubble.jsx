import React from 'react';
import { motion } from 'framer-motion';
import { User, Infinity, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const CodeBlock = ({ node, inline, className, children, ...props }) => {
  const [copied, setCopied] = React.useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : 'text';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!inline && match) {
    return (
      <div className="my-6 overflow-hidden rounded-xl bg-[#0d0d0d] font-sans">
        <div className="flex items-center justify-between px-4 py-2 bg-[#202020] select-none">
          <span className="text-[11.5px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">{language}</span>
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-1.5 text-[12px] font-medium text-zinc-400 hover:text-white dark:hover:text-zinc-100 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <div className="text-[13px] md:text-[14px]">
          <SyntaxHighlighter
            language={language}
            style={vscDarkPlus}
            className="custom-scrollbar"
            customStyle={{
              margin: 0,
              padding: '1rem',
              background: 'transparent',
              fontSize: 'inherit',
              lineHeight: '1.7',
              maxHeight: '400px',
              overflowY: 'auto',
              overflowX: 'auto'
            }}
            PreTag="div"
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        </div>
      </div>
    );
  }

  // Inline code styling falls back to CSS Prose logic automatically mapped in index.css
  return (
    <code className={className} {...props}>
      {children}
    </code>
  );
};

const MessageBubble = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-3 md:gap-5 w-full ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      <div className={`py-3.5 px-5 rounded-[24px] max-w-full md:max-w-[90%] break-words ${isUser
        ? 'bg-zinc-100 border text-zinc-900 border-zinc-200/60 dark:bg-[#2A2A2A] dark:border-white/5 dark:text-[#D9D9D9] rounded-tr-sm whitespace-pre-wrap text-[15px] leading-relaxed shadow-sm dark:shadow-none'
        : 'bg-transparent w-full'
        }`}>
        {isUser ? (
          message.content
        ) : (
          <div className="prose w-full max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code: CodeBlock,
                table: ({ node, ...props }) => (
                  <div className="overflow-x-auto w-full custom-scrollbar my-6 rounded-xl border border-zinc-200 dark:border-white/[0.08]">
                    <table className="w-full text-left border-collapse text-[14px]" {...props} />
                  </div>
                ),
                th: ({ node, ...props }) => (
                  <th className="px-5 py-3.5 font-semibold text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-white/[0.04] border-b border-r last:border-r-0 border-zinc-200 dark:border-white/[0.08] align-middle whitespace-nowrap" {...props} />
                ),
                td: ({ node, ...props }) => (
                  <td className="px-5 py-3.5 text-zinc-800 dark:text-zinc-300 border-b border-r last:border-r-0 border-zinc-200 dark:border-white/[0.05] align-top leading-relaxed min-w-[120px]" {...props} />
                ),
                tr: ({ node, ...props }) => (
                  <tr className="hover:bg-zinc-100/50 dark:hover:bg-white/[0.02] even:bg-zinc-50/50 dark:even:bg-white/[0.01] transition-colors group [&:last-child>td]:border-b-0" {...props} />
                )
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MessageBubble;
