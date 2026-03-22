import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, AlignLeft, ChevronDown, Check, Mic, Plus, Paperclip, X, FileText, Upload, Eye, Cpu, Globe, Zap, FileJson, BookOpen, Sparkles, SlidersHorizontal, User, Briefcase, ZapIcon } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import RAGSystem from '../lib/rag';
import { useDropzone } from 'react-dropzone';
import { useHotkeys } from 'react-hotkeys-hook';
import PDFPreview from './PDFPreview';
import { extractTextFromPDF } from '../lib/pdfParser';
import Tooltip from './Tooltip';

import { useAppStore } from '../store/useAppStore';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

const LENGTH_MODES = ['Auto', 'Snapshot', 'Concise', 'In-Depth'];

const Composer = () => {
  const { sendChatMessage: onSend, isTyping, selectedModel, outputLength, setOutputLength, responseBehavior, setResponseBehavior, isWebSearchActive, setIsWebSearchActive } = useAppStore();
  const disabled = isTyping;
  const [text, setText] = useState('');
  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const textareaRef = useRef(null);
  const attachMenuRef = useRef(null);
  const attachToggleRef = useRef(null);

  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const [attachedFile, setAttachedFile] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isPDFPreviewOpen, setIsPDFPreviewOpen] = useState(false);
  const fileInputRef = useRef(null);

  // Keyboard shortcuts
  useHotkeys('mod+k', (e) => { e.preventDefault(); textareaRef.current?.focus(); }, { enableOnFormTags: false });
  useHotkeys('escape', () => { setIsAttachMenuOpen(false); textareaRef.current?.blur(); }, { enableOnFormTags: true });

  // Parse a raw File object (shared between the Dropzone and the manual file button)
  const parseFile = useCallback(async (file) => {
    if (!file) return;

    const validExtensions = ['.pdf', '.txt', '.csv', '.md', '.json', '.xlsx', '.xls'];
    const hasValidExt = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    
    if (!hasValidExt) {
      toast.error('Unsupported file format.', { icon: '🛡️' });
      
      const rejectMsg = { 
        id: crypto.randomUUID(), 
        role: 'assistant', 
        content: `I am currently unable to analyze the file **"${file.name}"**. My core extraction systems are strictly structured for reading text-based documents (PDF, CSV, Excel, TXT, JSON, MD). I cannot process raw images, media, or proprietary binary formats natively yet.`, 
        createdAt: Date.now() 
      };
      
      useAppStore.setState(state => {
        const activeChat = state.chats.find(c => c.id === state.activeChatId);
        if (activeChat) {
          return { chats: state.chats.map(chat => chat.id === state.activeChatId ? { ...chat, messages: [...chat.messages, rejectMsg] } : chat) };
        }
        return { chats: [{ id: state.activeChatId, title: "Blocked Upload", messages: [rejectMsg], projectId: null, createdAt: Date.now() }, ...state.chats] };
      });
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      toast.error('File is too large. Limit is 15MB.', { icon: '📦' });
      return;
    }

    setIsParsing(true);
    const toastId = toast.loading(`Attaching document...`);

    try {
      let extractedText = '';

      if (file.type === 'application/pdf') {
        extractedText = await extractTextFromPDF(file);
        // Estimate pages visually based on ~2000 chars per page
        const approxPages = Math.ceil(extractedText.length / 2000) || 1;
        toast.success(`Attached ${file.name} (~${approxPages} pages)`, { id: toastId });
      } else if (file.name.endsWith('.csv') || file.type === 'text/csv') {
        extractedText = await new Promise((resolve, reject) => {
          Papa.parse(file, {
            header: true, skipEmptyLines: true,
            complete: (r) => resolve(`[CSV Data]\nFields: ${r.meta.fields?.join(', ')}\n\n${r.data.map(row => JSON.stringify(row)).join('\n')}`),
            error: (e) => reject(e)
          });
        });
        toast.success(`Attached ${file.name}`, { id: toastId });
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.type.includes('spreadsheetml')) {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        let allSheetsData = [];
        workbook.SheetNames.forEach(sheetName => {
          const sheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(sheet);
          if (jsonData.length > 0) {
            allSheetsData.push(`--- Sheet: ${sheetName} ---\n` + jsonData.map(row => JSON.stringify(row)).join('\n'));
          }
        });
        extractedText = `[Excel Workbook Data]\n${allSheetsData.join('\n\n')}`;
        toast.success(`Attached ${file.name}`, { id: toastId });
      } else {
        extractedText = await file.text();
        toast.success(`${file.name} attached!`, { id: toastId });
      }

      setAttachedFile({ name: file.name, text: extractedText, type: file.type, rawFile: file });
      // Instantly aggressively return geometric focus to the text input so typing flow is unbroken!
      setTimeout(() => textareaRef.current?.focus(), 50);
    } catch (error) {
      console.error('Parse Error:', error);
      toast.error(`Failed to parse ${file.name}.`, { id: toastId });
      
      const crashMsg = { 
        id: crypto.randomUUID(), 
        role: 'assistant', 
        content: `I encountered a critical error while attempting to extract data from **"${file.name}"**. The memory pipeline reported: \`${error.message || 'Unknown corruption structure'}\`. Please ensure the document is not fully encrypted, empty, or severely corrupted.`, 
        createdAt: Date.now() 
      };
      
      useAppStore.setState(state => {
        const activeChat = state.chats.find(c => c.id === state.activeChatId);
        if (activeChat) return { chats: state.chats.map(chat => chat.id === state.activeChatId ? { ...chat, messages: [...chat.messages, crashMsg] } : chat) };
        return { chats: [{ id: state.activeChatId, title: "Corrupted File", messages: [crashMsg], projectId: null, createdAt: Date.now() }, ...state.chats] };
      });
    } finally {
      setIsParsing(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    noClick: true,
    noKeyboard: true,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'text/csv': ['.csv'],
      'text/markdown': ['.md'],
      'application/json': ['.json'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    onDragEnter: () => setIsDragOver(true),
    onDragLeave: () => setIsDragOver(false),
    onDrop: (acceptedFiles) => {
      setIsDragOver(false);
      if (acceptedFiles.length > 0) parseFile(acceptedFiles[0]);
    },
  });

  const toggleListening = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64data = reader.result.split(',')[1];

          setIsProcessingVoice(true);
          const toastId = toast.loading("Whisper AI translating audio...");

          try {
            const res = await fetch('/.netlify/functions/transcribe', {
              method: 'POST',
              body: JSON.stringify({ audioBase64: base64data })
            });
            const data = await res.json();

            if (data.text) {
              setText(prev => prev + (prev && !prev.endsWith(' ') ? ' ' : '') + data.text.trim());
              toast.dismiss(toastId);
            } else {
              toast.error(data.error || "Could not decipher speech array.", { id: toastId });
            }
          } catch (e) {
            toast.error("Network failed to reach Whisper AI core.", { id: toastId });
          } finally {
            setIsProcessingVoice(false);
          }
        };

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error(err);
      toast.error("Hardware Microphone access denied. Please check your browser security settings.");
      setIsRecording(false);
    }
  };

  useEffect(() => {
    // Only auto-focus on desktop devices to prevent mobile keyboards from forcefully popping up
    if (!disabled && textareaRef.current && window.matchMedia("(pointer: fine)").matches) {
      textareaRef.current.focus();
    }
  }, [disabled]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target) && attachToggleRef.current && !attachToggleRef.current.contains(e.target)) {
        setIsAttachMenuOpen(false);
      }
    };
    if (isAttachMenuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isAttachMenuOpen]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (isRecording || isProcessingVoice) return;
      handleSubmit();
    }
  };


  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }

    if (text.trim() || attachedFile) {
      if (!disabled && !isProcessingVoice && !isParsing) try {
        let finalText = text.trim();
        let hiddenContext = "";

        // Basic web crawler hook for generic links
        const urlMatch = finalText.match(/(https?:\/\/[^\s]+)/);

        if (urlMatch) {
          setIsParsing(true);
          try {
            const res = await fetch(`/.netlify/functions/scrape?url=${encodeURIComponent(urlMatch[0])}`);
            if (res.ok) {
              const data = await res.json();
              if (data.text) {
                hiddenContext += `[Web Scraped Context from ${urlMatch[0]}]\n\n${data.text}\n\n`;
              }
            } else {
              console.warn('Target URL actively blocked connection.');
            }
          } catch (e) {
            console.warn('Failed to establish network pipeline.');
          } finally {
            setIsParsing(false);
          }
        }

        if (attachedFile) {
          setIsParsing(true);
          try {
            await RAGSystem.addDocument(attachedFile.name, attachedFile.text);
            hiddenContext += `[User Attached Document: ${attachedFile.name}]\n\n${attachedFile.text}\n\n`;
          } catch (e) {
            console.error("RAG Embedding Error:", e);
            hiddenContext += `[User Attached Document: ${attachedFile.name}]\n\n${attachedFile.text}\n\n`;
          } finally {
            setIsParsing(false);
          }
        }

        // Before sending, ALWAYS search the vector DB for context if there is a real question and NO attached file
        if (finalText.trim() && !attachedFile) {
          setIsParsing(true);
          try {
            // Pull top 2 matches to prevent context bloat
            const relevantChunks = await RAGSystem.search(finalText, 2);
            // Only inject if similarity score is somewhat relevant
            const highConfidenceChunks = relevantChunks.filter(c => c.score > 0.3);

            if (highConfidenceChunks.length > 0) {
              const memories = highConfidenceChunks.map(c => `From Document '${c.filename}': ${c.text}`).join('\n\n');
              hiddenContext += `[Retrieved Previous Memories Context]\n${memories}\n\n`;
            }
          } catch (e) {
            console.log("RAG Semantic Search bypassed:", e);
          } finally {
            setIsParsing(false);
          }
        }

        if (hiddenContext) {
          onSend(finalText, hiddenContext);
        } else {
          onSend(finalText, null);
        }
        setText('');
        setAttachedFile(null);
        if (textareaRef.current) {
          textareaRef.current.style.height = '36px';
        }
      } catch (error) {
        console.error("Error during message submission:", error);
        toast.error("Failed to send message. Please try again.");
      }
    }
  };

  return (
    <>
      <div className="w-full flex flex-col gap-2 relative" {...getRootProps()}>

        {/* Full-screen drag-over overlay */}
        {isDragActive && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none">
            <div className="flex flex-col items-center gap-4 text-white">
              <Upload className="w-16 h-16 text-blue-400 animate-bounce" />
              <p className="text-2xl font-bold tracking-tight">Drop to Attach Document</p>
              <p className="text-sm text-zinc-400">PDF, Excel, CSV, TXT supported</p>
            </div>
          </div>
        )}

        <div className="relative flex flex-col gap-2 pl-4 pr-3 py-2.5 md:pl-5 md:pr-4 md:py-3 bg-zinc-100 dark:bg-[#2A2A2A] rounded-3xl transition-colors border border-transparent">

          <input {...getInputProps()} className="hidden" />
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => { if (e.target.files[0]) parseFile(e.target.files[0]); e.target.value = ''; }}
            className="hidden"
            accept="application/pdf,text/plain,text/csv,text/markdown,application/json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,.pdf,.txt,.csv,.md,.json,.xlsx,.xls"
          />

          {attachedFile && (
            <div className="flex items-center gap-2 pl-3 pr-2 py-1.5 mb-1 bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl self-start max-w-full shadow-sm">
              <FileText className="w-4 h-4 text-blue-500 shrink-0" />
              <span className="text-[13px] font-medium text-zinc-700 dark:text-zinc-300 truncate max-w-[150px] md:max-w-[260px]">
                {attachedFile.name}
              </span>
              {attachedFile.rawFile && attachedFile.type === 'application/pdf' && (
                <Tooltip content="Preview PDF">
                  <button
                    onClick={() => setIsPDFPreviewOpen(true)}
                    className="w-5 h-5 flex items-center justify-center rounded-md hover:bg-black/5 dark:hover:bg-white/10 text-zinc-400 hover:text-blue-500 dark:text-zinc-500 dark:hover:text-blue-400 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </Tooltip>
              )}
              <button
                className="w-5 h-5 flex items-center justify-center rounded-md hover:bg-black/5 dark:hover:bg-white/10 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Input Row */}
          <div className="flex items-end gap-2.5 w-full">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                e.target.style.height = '36px';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
              }}
              onKeyDown={handleKeyDown}
              placeholder={isRecording ? "Recording your voice..." : (isWebSearchActive ? "Search the web..." : "Message VOID...")}
              disabled={disabled || isProcessingVoice}
              rows={1}
              className="flex-1 w-full bg-transparent text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 text-[15px] leading-[24px] resize-none focus:outline-none py-1.5 custom-scrollbar disabled:opacity-50 min-h-[36px] max-h-[200px] overflow-y-auto max-md:[scrollbar-width:none] max-md:[-ms-overflow-style:none] max-md:[&::-webkit-scrollbar]:hidden"
            />

            <div className="flex items-center gap-1.5 shrink-0 mb-0.5">
              <Tooltip content="Dictate message using Whisper AI">
                <button
                  onClick={toggleListening}
                  disabled={disabled || isProcessingVoice}
                  className={cn(
                    "w-[34px] h-[34px] rounded-full transition-all flex items-center justify-center border",
                    isRecording
                      ? "bg-red-500/10 text-red-500 border-red-500/20 animate-pulse hover:bg-red-500/20"
                      : "bg-zinc-100/80 text-zinc-500 border-transparent hover:bg-zinc-200 dark:bg-white/5 dark:text-zinc-400 dark:border-transparent dark:hover:bg-white/10 dark:hover:text-zinc-300"
                  )}
                >
                  <Mic className="w-[17px] h-[17px]" strokeWidth={isRecording ? 2.5 : 2} />
                </button>
              </Tooltip>

              <button
                onClick={handleSubmit}
                disabled={!(text.trim() || attachedFile) || disabled || isRecording || isProcessingVoice || isParsing}
                className="w-[34px] h-[34px] rounded-full transition-all flex items-center justify-center border border-transparent
                bg-zinc-900 text-white hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400
                dark:bg-white dark:text-black dark:hover:bg-zinc-200 dark:disabled:bg-white/10 dark:disabled:text-white/40"
              >
                <ArrowUp className="w-[17px] h-[17px]" strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* Toolbar Row */}
          <div className="w-full flex items-center justify-between pt-1 pb-0.5">
            <div className="flex items-center gap-2">
              <button
                ref={attachToggleRef}
                onClick={() => setIsAttachMenuOpen(!isAttachMenuOpen)}
                disabled={disabled || isProcessingVoice || isParsing}
                className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors ${isAttachMenuOpen
                    ? 'bg-zinc-200 text-zinc-900 dark:bg-white/10 dark:text-white'
                    : 'bg-transparent text-zinc-500 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-zinc-300'
                  } disabled:opacity-50`}
              >
                <Plus className="w-4 h-4" strokeWidth={2.5} />
              </button>

              {isWebSearchActive && (
                <button
                  onClick={() => setIsWebSearchActive(false)}
                  disabled={disabled || isProcessingVoice || isParsing}
                  className="group flex items-center gap-2 px-3 py-1.5 rounded-full text-[13px] font-[600] tracking-wide transition-all duration-200 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-[#20293A] dark:text-[#60A5FA] dark:hover:bg-[#28344A] disabled:opacity-50 border border-blue-200/50 dark:border-blue-500/10 shadow-sm hover:shadow"
                >
                  <Globe className="w-[14px] h-[14px] animate-in spin-in-180 duration-500" strokeWidth={2.5} />
                  <span>Search</span>
                  <X className="w-3.5 h-3.5 ml-0.5 opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all" strokeWidth={3} />
                </button>
              )}
            </div>
          </div>

        </div>

        {/* Attach Popover Menu */}
        {isAttachMenuOpen && (
          <div
            ref={attachMenuRef}
            className="absolute left-2 bottom-[calc(100%+8px)] w-[200px] bg-white dark:bg-[#2A2A2A] border border-zinc-200 dark:border-[#383838] rounded-xl shadow-lg dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)] z-50 p-1.5 flex flex-col gap-0.5 font-sans origin-bottom-left animate-in fade-in slide-in-from-bottom-2 duration-150 ring-1 ring-black/[0.03] dark:ring-white/[0.03]"
          >
            <button
              onClick={() => { fileInputRef.current?.click(); setIsAttachMenuOpen(false); }}
              className="flex items-center gap-3 px-3 py-2 text-[13.5px] font-[500] rounded-lg transition-colors text-left w-full group text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10"
            >
              <Paperclip className="w-4 h-4 shrink-0 text-zinc-500 group-hover:text-zinc-700 dark:text-zinc-400 dark:group-hover:text-zinc-200" />
              <span>Upload files</span>
            </button>
            <button
               onClick={() => { setIsWebSearchActive(true); setIsAttachMenuOpen(false); textareaRef.current?.focus(); }}
               className="flex items-center gap-3 px-3 py-2 text-[13.5px] font-[500] rounded-lg transition-colors text-left w-full group text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10"
            >
               <Globe className="w-4 h-4 shrink-0 text-blue-500 dark:text-blue-400 group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors" />
               <span>Web search</span>
            </button>
            
            <div className="h-[1px] bg-zinc-100 dark:bg-white/10 w-full my-1" />
            
            <button
               onClick={() => { setIsSettingsModalOpen(true); setIsAttachMenuOpen(false); }}
               className="flex items-center gap-3 px-3 py-2 text-[13.5px] font-[500] rounded-lg transition-colors text-left w-full group text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10"
            >
               <SlidersHorizontal className="w-4 h-4 shrink-0 text-emerald-500 dark:text-emerald-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors" />
               <span>Response Tone</span>
            </button>
          </div>
        )}
        <div className="text-center text-xs text-zinc-500 dark:text-zinc-500 tracking-wide mt-1">
          VOID can make mistakes. Remember to verify critical information.
        </div>
      </div>

      {isPDFPreviewOpen && attachedFile?.rawFile && (
        <PDFPreview
          file={attachedFile}
          onClose={() => setIsPDFPreviewOpen(false)}
        />
      )}

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99]"
          >
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsSettingsModalOpen(false)}
            />
            
            {/* Dialog Panel */}
            <div className="absolute inset-0 flex items-center justify-center p-4 py-10 overflow-y-auto pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ type: "spring", damping: 25, stiffness: 350 }}
                className="bg-white dark:bg-[#1C1C1E] border border-zinc-200 dark:border-white/10 w-full max-w-lg max-h-full rounded-2xl shadow-2xl pointer-events-auto flex flex-col font-sans overflow-hidden"
              >
                <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-white/5 shrink-0">
                  <div className="flex items-center gap-2.5 text-zinc-900 dark:text-zinc-100 font-semibold tracking-wide">
                    <SlidersHorizontal className="w-5 h-5 text-emerald-500" strokeWidth={2.5} />
                    <span>Response Configuration</span>
                  </div>
                  <button 
                    onClick={() => setIsSettingsModalOpen(false)}
                    className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="p-5 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
                  {/* Length Section */}
                  <div>
                    <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 tracking-widest uppercase mb-3">Response Verbosity</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'Auto', label: 'Auto', icon: Sparkles },
                        { id: 'Snapshot', label: 'Snapshot', icon: Zap },
                        { id: 'Concise', label: 'Concise', icon: FileJson },
                        { id: 'In-Depth', label: 'In-Depth', icon: BookOpen }
                      ].map((mode) => (
                        <button
                          key={mode.id}
                          onClick={() => setOutputLength(mode.id)}
                          className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border transition-all ${outputLength === mode.id
                              ? 'bg-blue-50/50 border-blue-500/30 text-blue-700 dark:bg-blue-500/10 dark:border-blue-500/30 dark:text-blue-400 shadow-sm'
                              : 'bg-zinc-50 border-transparent text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:bg-white/[0.02] dark:hover:bg-white/5 dark:text-zinc-400 dark:hover:text-zinc-300'
                            }`}
                        >
                          <mode.icon className="w-4 h-4" />
                          <span className="text-[11px] font-[600] tracking-wide">{mode.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Behavior Section */}
                  <div>
                    <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 tracking-widest uppercase mb-3">AI Personality</h3>
                    <div className="flex flex-col gap-2">
                      {[
                        { id: 'Default', title: 'Default', desc: 'Balanced, natural, and highly adaptive formatting.', icon: Cpu },
                        { id: 'Professional', title: 'Professional', desc: 'Strictly objective, formal, and business-oriented.', icon: Briefcase },
                        { id: 'Friendly', title: 'Friendly', desc: 'Warm, highly empathetic, and beautifully expressive.', icon: User },
                        { id: 'Direct', title: 'Direct', desc: 'Absolute minimalism. Binary, direct, and devoid of fluff.', icon: ZapIcon }
                      ].map((mode) => (
                        <button
                          key={mode.id}
                          onClick={() => setResponseBehavior(mode.id)}
                          className={`flex items-start gap-4 p-3.5 rounded-xl border transition-all text-left ${responseBehavior === mode.id
                              ? 'bg-emerald-50/50 border-emerald-500/30 dark:bg-emerald-500/10 dark:border-emerald-500/30 shadow-sm'
                              : 'bg-zinc-50 border-transparent hover:bg-zinc-100 dark:bg-white/[0.02] dark:hover:bg-white/5'
                            }`}
                        >
                          <div className={`mt-0.5 p-1.5 rounded-lg ${responseBehavior === mode.id ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-zinc-200 text-zinc-500 dark:bg-white/10 dark:text-zinc-400'}`}>
                            <mode.icon className="w-4 h-4" strokeWidth={2.5} />
                          </div>
                          <div>
                            <div className={`text-[14px] font-[600] ${responseBehavior === mode.id ? 'text-emerald-800 dark:text-emerald-300' : 'text-zinc-700 dark:text-zinc-300'}`}>
                              {mode.title}
                            </div>
                            <div className={`text-[12px] leading-relaxed mt-0.5 ${responseBehavior === mode.id ? 'text-emerald-600/80 dark:text-emerald-400/80' : 'text-zinc-500 dark:text-zinc-500'}`}>
                              {mode.desc}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="px-5 py-4 border-t border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-black/20 flex justify-end shrink-0">
                  <button 
                    onClick={() => setIsSettingsModalOpen(false)}
                    className="px-6 py-2 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black rounded-lg text-[13.5px] font-[600] transition-colors shadow-sm"
                  >
                    Done
                  </button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Composer;
