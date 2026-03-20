import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Infinity, Copy, Check, Volume2, VolumeX, RefreshCcw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import MermaidBlock from './MermaidBlock';
import ChartBlock from './ChartBlock';

const CodeBlock = ({ node, inline, className, children, ...props }) => {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : 'text';

  if (language === 'mermaid' && !inline) {
    return <MermaidBlock chart={children} />;
  }

  if (language === 'recharts' && !inline) {
    return <ChartBlock config={String(children).trim()} />;
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!inline && match) {
    return (
      <div className="my-6 overflow-hidden rounded-xl bg-[#1E1E1E] font-sans border border-transparent dark:border-white/5 shadow-sm">
        <div className="flex items-center justify-between px-4 py-2 bg-[#2D2D2D] select-none border-b border-white/5">
          <span className="text-[11.5px] font-bold text-zinc-400 dark:text-zinc-400 uppercase tracking-widest">{language}</span>
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-1.5 text-[12px] font-medium text-zinc-400 hover:text-white dark:hover:text-zinc-100 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <div className="text-[13px] md:text-[14px] bg-[#1E1E1E] custom-scrollbar overflow-x-auto max-h-[400px]">
          <SyntaxHighlighter
            style={vscDarkPlus}
            language={language}
            PreTag="div"
            customStyle={{ margin: 0, background: 'transparent', padding: '1rem' }}
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
  
  const [isCopied, setIsCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    return () => {
      // Cleanup: stop talking if component unmounts mid-speech
      if (isSpeaking) {
        window.speechSynthesis?.cancel();
      }
    };
  }, [isSpeaking]);

  const handleSpeak = () => {
    if (!('speechSynthesis' in window)) {
      console.warn("Your browser does not support the Web Speech API.");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    // Advanced stripping of markdown, giant code blocks, and repetitive symbols (like ==== or ----)
    const spokenText = message.content
      .replace(/```[\s\S]*?```/g, ' . Code snippet omitted. ') // Remove large code blocks
      .replace(/!\[.*?\]\(.*?\)/g, '') // Remove images
      .replace(/\[([^\]]+)\]\(.*?\)/g, '$1') // Keep link text, but remove the URL formatting
      .replace(/[#*~_=\-<>[\]|]/g, ' ') // Strip repetitive markdown characters (like horizontal rules ====)
      .replace(/\b(https?:\/\/\S+)\b/g, '') // Remove raw URLs
      .replace(/\s+/g, ' ') // Collapse multiple spaces
      .trim();

    const utterance = new SpeechSynthesisUtterance(spokenText);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-3 md:gap-5 w-full group ${isUser ? 'flex-row-reverse items-end' : 'flex-row'}`}
    >
      <div className={`py-3.5 px-5 rounded-[24px] max-w-full md:max-w-[90%] break-words ${isUser
        ? 'bg-zinc-100 border text-zinc-900 border-zinc-200/60 dark:bg-[#2A2A2A] dark:border-white/5 dark:text-[#D9D9D9] rounded-tr-sm whitespace-pre-wrap text-[15px] leading-relaxed shadow-sm dark:shadow-none'
        : 'bg-transparent w-full'
        }`}>
        {isUser ? (
          message.content
        ) : (
          <div className="flex flex-col w-full">
            <div className="prose w-full max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
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
            <div className="flex items-center gap-1.5 mt-1 -ml-1.5 opacity-100 transition-opacity duration-200">
              <button
                onClick={handleSpeak}
                className="p-1.5 text-zinc-400 hover:text-zinc-800 dark:text-zinc-500 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-md transition-all"
                title="Read aloud"
              >
                {isSpeaking ? <VolumeX className="w-4 h-4 text-blue-500 animate-pulse" /> : <Volume2 className="w-4 h-4" />}
              </button>
              
              <button
                onClick={handleCopy}
                className="p-1.5 text-zinc-400 hover:text-zinc-800 dark:text-zinc-500 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-md transition-all"
                title="Copy message"
              >
                {isCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
              
              <button
                onClick={() => {
                  import('../store/useAppStore').then(module => {
                    module.useAppStore.getState().regenerateMessage(message.id);
                  });
                }}
                className="p-1.5 text-zinc-400 hover:text-zinc-800 dark:text-zinc-500 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-md transition-all"
                title="Regenerate response"
              >
                <RefreshCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {isUser && (
        <div className="flex items-center gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 mb-1">
          <button
            onClick={handleCopy}
            className="p-1.5 text-zinc-400 hover:text-zinc-800 dark:text-zinc-500 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-md transition-all"
            title="Copy message"
          >
            {isCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default MessageBubble;
