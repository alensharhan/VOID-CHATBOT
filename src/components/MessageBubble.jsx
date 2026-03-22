import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Infinity, Copy, Check, Volume2, VolumeX, RefreshCcw, Brain, ChevronDown, Globe } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import MermaidBlock from './MermaidBlock';
import ChartBlock from './ChartBlock';
import Tooltip from './Tooltip';
import { useAppStore } from '../store/useAppStore';
import { googleTTS } from '../lib/googleTTS';

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
      <div className="not-prose my-6 overflow-hidden rounded-xl bg-[#0D0D0D] font-sans border border-black/10 dark:border-white/10 shadow-sm w-full">
        <div className="flex items-center justify-between px-4 py-2 bg-[#212121] select-none text-zinc-400 dark:text-zinc-400">
          <span className="text-[12px] font-medium font-mono lowercase">{language}</span>
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-1.5 text-[12px] font-medium hover:text-zinc-100 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy code'}
          </button>
        </div>
        <div className="text-[14px] bg-[#0D0D0D] custom-scrollbar overflow-x-auto overflow-y-hidden w-full">
          <SyntaxHighlighter
            style={oneDark}
            language={language}
            PreTag="div"
            customStyle={{ margin: 0, background: 'transparent', padding: '1.25rem 1rem', lineHeight: '1.6', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}
            wrapLongLines={true}
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

const MessageBubble = ({ message, isLatestAI }) => {
  const isUser = message.role === 'user';
  const { activeSpeakingId, setActiveSpeakingId } = useAppStore();

  const contentStr = message.content || '';
  let thinkContent = null;
  let mainContent = contentStr;

  if (!isUser) {
    const thinkStartIdx = contentStr.indexOf('<think>');
    const thinkEndIdx = contentStr.indexOf('</think>');
    
    if (thinkStartIdx !== -1) {
      if (thinkEndIdx !== -1) {
        thinkContent = contentStr.substring(thinkStartIdx + 7, thinkEndIdx).trim();
        mainContent = contentStr.replace(/<think>[\s\S]*?<\/think>/, '').trim();
      } else {
        // Render streaming thought blocks safely dynamically mid-sentence
        thinkContent = contentStr.substring(thinkStartIdx + 7).trim();
        mainContent = '';
      }
    }
  }

  const [isCopied, setIsCopied] = useState(false);
  const isSpeaking = activeSpeakingId === message.id;
  const [showMobileActions, setShowMobileActions] = useState(false);

  useEffect(() => {
    return () => {
      // Cleanup: stop talking if component unmounts mid-speech
      if (isSpeaking) {
        googleTTS.stop();
      }
    };
  }, [isSpeaking]);

  const handleSpeak = async () => {
    if (isSpeaking) {
      googleTTS.stop();
      setActiveSpeakingId(null);
      return;
    }

    // Force cancel any globally running audio before starting the new one
    googleTTS.stop();
    setActiveSpeakingId(message.id);

    // Advanced stripping of markdown, giant code blocks, and repetitive symbols (like ==== or ----)
    const spokenText = mainContent
      .replace(/```[\s\S]*?```/g, ' . Code snippet omitted. ') // Remove large code blocks
      .replace(/!\[.*?\]\(.*?\)/g, '') // Remove images
      .replace(/\[([^\]]+)\]\(.*?\)/g, '$1') // Keep link text, but remove the URL formatting
      .replace(/[#*~_=\-<>[\]|]/g, ' ') // Strip repetitive markdown characters (like horizontal rules ====)
      .replace(/\b(https?:\/\/\S+)\b/g, '') // Remove raw URLs
      .replace(/\s+/g, ' ') // Collapse multiple spaces
      .trim();

    try {
      await googleTTS.speak(spokenText);
    } catch (err) {
      console.error("Google TTS playback failed:", err);
      setActiveSpeakingId(null);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(mainContent);
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
      onClick={() => {
        if (isUser && window.innerWidth < 768) {
          setShowMobileActions(!showMobileActions);
        }
      }}
      className={`flex gap-3 md:gap-5 w-full group ${isUser ? 'flex-row-reverse items-end' : 'flex-row'}`}
    >
      <div className={`py-3.5 rounded-[24px] break-words ${isUser
        ? 'px-5 max-w-[85%] md:max-w-[75%] bg-zinc-100 border text-zinc-900 border-zinc-200/60 dark:bg-[#2A2A2A] dark:border-white/5 dark:text-[#D9D9D9] rounded-tr-sm whitespace-pre-wrap text-[15px] leading-relaxed shadow-sm dark:shadow-none'
        : 'px-1 max-w-full w-full bg-transparent'
        }`}>
        {isUser ? (
          message.content
        ) : (
          <div className="flex flex-col w-full">
            {message.isResearching && (
               <div className="mb-4">
                 <div className="border border-blue-500/30 bg-blue-50/50 dark:bg-blue-500/5 rounded-xl overflow-hidden shadow-sm dark:shadow-none p-4">
                   <div className="flex items-center gap-3 mb-3">
                     <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                     <span className="text-[13px] font-bold text-blue-600 dark:text-blue-400 tracking-wide uppercase">Deep Researching...</span>
                   </div>
                   <div className="flex flex-col gap-1.5 font-mono text-[12.5px] text-zinc-600 dark:text-zinc-400 tracking-tight h-max max-h-[160px] custom-scrollbar overflow-y-auto pr-2 pb-1">
                     {message.researchLogs?.map((log, i) => (
                       <motion.div 
                         key={i} 
                         initial={{ opacity: 0, x: -4 }}
                         animate={{ opacity: 1, x: 0 }}
                         transition={{ duration: 0.2 }}
                         className="flex gap-2 items-start"
                       >
                         <span className="text-blue-500 mt-[-1px] opacity-70">❯</span>
                         <span className="opacity-90 leading-snug">{log}</span>
                       </motion.div>
                     ))}
                   </div>
                 </div>
               </div>
            )}
            
            {message.researchLogs?.length > 0 && !message.isResearching && (
               <div className="mb-4">
                 <details className="group border border-zinc-200 dark:border-white/10 rounded-xl overflow-hidden bg-zinc-50/50 dark:bg-[#1a1a1c] shadow-sm dark:shadow-none">
                  <summary className="flex items-center justify-between gap-2 px-3.5 py-2.5 cursor-pointer text-[12px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 select-none list-none marker:hidden outline-none hover:bg-zinc-100/50 dark:hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-2">
                       <Globe className="w-4 h-4 text-blue-500" />
                       <span className="text-zinc-600 dark:text-zinc-400">Deep Research Trace</span>
                    </div>
                    <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform duration-300" />
                  </summary>
                  <div className="px-4 pb-4 pt-1.5 text-[12.5px] leading-relaxed text-zinc-600 dark:text-zinc-400 border-t border-zinc-200/50 dark:border-white/[0.04] whitespace-pre-wrap font-mono relative">
                    <div className="flex flex-col gap-2">
                     {message.researchLogs?.map((log, i) => (
                       <div key={i} className="flex gap-2 items-start opacity-80 border-b border-black/5 dark:border-white/5 pb-2 last:border-b-0 last:pb-0">
                         <span className="text-emerald-500 mt-[1px] opacity-70">✓</span>
                         <span className="leading-snug">{log}</span>
                       </div>
                     ))}
                    </div>
                  </div>
                 </details>
               </div>
            )}

            {thinkContent && !message.researchLogs && (
              <div className="mb-4">
                <details className="group border border-zinc-200 dark:border-white/10 rounded-xl overflow-hidden bg-zinc-50/50 dark:bg-[#1a1a1c] shadow-sm dark:shadow-none">
                  <summary className="flex items-center justify-between gap-2 px-3.5 py-2.5 cursor-pointer text-[12px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-500 select-none list-none marker:hidden outline-none hover:bg-zinc-100/50 dark:hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-2">
                      <Brain className="w-4 h-4 text-emerald-500 animate-pulse" />
                      <span>AI Reasoning Trace</span>
                    </div>
                    <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform duration-300" />
                  </summary>
                  <div className="px-4 pb-4 pt-1.5 text-[13.5px] leading-relaxed text-zinc-600 dark:text-zinc-400 border-t border-zinc-200/50 dark:border-white/[0.04] whitespace-pre-wrap font-mono relative">
                    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-emerald-500/20" />
                    {thinkContent}
                  </div>
                </details>
              </div>
            )}
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
                {mainContent}
              </ReactMarkdown>
            </div>
            <div className="flex items-center gap-1.5 mt-1 -ml-1.5 opacity-100 transition-opacity duration-200">
              <Tooltip content={isSpeaking ? "Stop speaking" : "Read aloud"}>
                <button
                  onClick={handleSpeak}
                  className="p-1.5 text-zinc-400 hover:text-zinc-800 dark:text-zinc-500 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-md transition-all"
                >
                  {isSpeaking ? <VolumeX className="w-4 h-4 text-emerald-500 animate-pulse" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </Tooltip>

              <Tooltip content="Copy message">
                <button
                  onClick={handleCopy}
                  className="p-1.5 text-zinc-400 hover:text-zinc-800 dark:text-zinc-500 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-md transition-all"
                >
                  {isCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </Tooltip>

              {isLatestAI && (
                <Tooltip content="Regenerate response">
                  <button
                    onClick={() => {
                      import('../store/useAppStore').then(module => {
                        module.useAppStore.getState().regenerateMessage(message.id);
                      });
                    }}
                    className="p-1.5 text-zinc-400 hover:text-zinc-800 dark:text-zinc-500 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-md transition-all"
                  >
                    <RefreshCcw className="w-4 h-4" />
                  </button>
                </Tooltip>
              )}
            </div>
          </div>
        )}
      </div>

      {isUser && (
        <div className={`flex items-center gap-1.5 transition-opacity duration-200 mb-1 ${showMobileActions ? 'opacity-100' : 'opacity-0'} md:opacity-0 md:group-hover:opacity-100`}>
          <Tooltip content="Copy message">
            <button
              onClick={handleCopy}
              className="p-1.5 text-zinc-400 hover:text-zinc-800 dark:text-zinc-500 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-md transition-all"
            >
              {isCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </Tooltip>
        </div>
      )}
    </motion.div>
  );
};

export default MessageBubble;
