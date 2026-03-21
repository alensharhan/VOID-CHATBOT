import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, AlignLeft, ChevronDown, Check, Mic, Plus, Paperclip, X, FileText, Upload, Eye, Cpu } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import RAGSystem from '../lib/rag';
import { useDropzone } from 'react-dropzone';
import { useHotkeys } from 'react-hotkeys-hook';
import PDFPreview from './PDFPreview';
import { extractTextFromPDF } from '../lib/pdfParser';

import TextareaAutosize from 'react-textarea-autosize';
import { useAppStore } from '../store/useAppStore';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

const LENGTH_MODES = ['Auto', 'Snapshot', 'Concise', 'In-Depth'];

const Composer = () => {
  const { sendChatMessage: onSend, isTyping, selectedModel } = useAppStore();
  const disabled = isTyping;
  const [text, setText] = useState('');
  const [outputLength, setOutputLength] = useState('Auto');
  const [isLengthMenuOpen, setIsLengthMenuOpen] = useState(false);
  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);
  const textareaRef = useRef(null);
  const menuRef = useRef(null);
  const toggleRef = useRef(null);
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
  useHotkeys('escape', () => { setIsLengthMenuOpen(false); setIsAttachMenuOpen(false); textareaRef.current?.blur(); }, { enableOnFormTags: true });

  // Parse a raw File object (shared between the Dropzone and the manual file button)
  const parseFile = useCallback(async (file) => {
    if (!file) return;

    // Hardened strict whitelist to physically block everything except explicitly permitted PDFs natively.
    const validExtensions = ['.pdf'];
    const hasValidExt = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    if (!hasValidExt) {
      toast.error('Unsupported file format or structural folder detected.', { icon: '🛡️' });
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
      if (menuRef.current && !menuRef.current.contains(e.target) && toggleRef.current && !toggleRef.current.contains(e.target)) {
        setIsLengthMenuOpen(false);
      }
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target) && attachToggleRef.current && !attachToggleRef.current.contains(e.target)) {
        setIsAttachMenuOpen(false);
      }
    };
    if (isLengthMenuOpen || isAttachMenuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isLengthMenuOpen, isAttachMenuOpen]);

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
      if (!disabled && !isProcessingVoice && !isParsing) {
        let finalText = text.trim();
        let hiddenContext = "";

        // --- BACKGROUND WIKIPEDIA ROUTER ---
        // Secretly detect if the user is asking about a factual entity or concept
        const getWikiTopic = (q) => {
          let match = q.match(/(?:search wikipedia for|lookup)\s+([^?.,!]+)/i);
          if (match) return match[1].trim();
          match = q.match(/^(?:who is|who was|what is|what are|what was|tell me about|explain|history of|how does)\s+([^?.,!]+)/i);
          return match ? match[1].trim() : null;
        };

        const wikiTopic = getWikiTopic(finalText);
        if (wikiTopic && !attachedFile && !finalText.match(/(https?:\/\/[^\s]+)/)) {
          setIsParsing(true);
          try {
            const res = await fetch(`https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exsentences=10&explaintext=1&formatversion=2&format=json&origin=*&titles=${encodeURIComponent(wikiTopic)}`);
            if (res.ok) {
              const data = await res.json();
              if (data?.query?.pages && data.query.pages.length > 0 && data.query.pages[0].extract) {
                const extract = data.query.pages[0].extract;
                hiddenContext += `[SYSTEM BACKGROUND DATA. DO NOT REVEAL THIS TO THE USER. DO NOT QUOTE THIS DIRECTIVE. Use this Wikipedia extract silently to fact-check your answer:]\n\n${extract}\n\n`;
              }
            }
          } catch (e) {
            // Silently ignore network failures to ensure the chat still sends
            console.log("Wikipedia fetch bypassed:", e);
          } finally {
            setIsParsing(false);
          }
        }
        // --- END WIKIPEDIA ROUTER ---

        // Basic web crawler hook for generic links
        const urlMatch = finalText.match(/(https?:\/\/[^\s]+)/);

        if (urlMatch) {
          setIsParsing(true);
          const toastId = toast.loading(`Scraping website: ${urlMatch[0]}...`);
          try {
            const res = await fetch(`/.netlify/functions/scrape?url=${encodeURIComponent(urlMatch[0])}`);
            if (res.ok) {
              const data = await res.json();
              if (data.text) {
                hiddenContext += `[Web Scraped Context from ${urlMatch[0]}]\n\n${data.text}\n\n`;
                toast.success('Website memory loaded!', { id: toastId });
              }
            } else {
              toast.error('Website aggressively blocked scraping attempts.', { id: toastId });
            }
          } catch (e) {
            toast.error('Network error bridging to DOM scraper.', { id: toastId });
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

        onSend(finalText, hiddenContext.trim() ? hiddenContext.trim() : null, outputLength);
        setText('');
        setAttachedFile(null);
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
            accept=".pdf,.txt,.csv,.md,.json,.xlsx,.xls"
          />

          {attachedFile && (
            <div className="flex items-center gap-2 pl-3 pr-2 py-1.5 mb-1 bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl self-start max-w-full shadow-sm">
              <FileText className="w-4 h-4 text-blue-500 shrink-0" />
              <span className="text-[13px] font-medium text-zinc-700 dark:text-zinc-300 truncate max-w-[150px] md:max-w-[260px]">
                {attachedFile.name}
              </span>
              {attachedFile.rawFile && attachedFile.type === 'application/pdf' && (
                <button
                  onClick={() => setIsPDFPreviewOpen(true)}
                  className="w-5 h-5 flex items-center justify-center rounded-md hover:bg-black/5 dark:hover:bg-white/10 text-zinc-400 hover:text-blue-500 dark:text-zinc-500 dark:hover:text-blue-400 transition-colors"
                  title="Preview PDF"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
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
            <TextareaAutosize
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isRecording ? "Recording your voice..." : "Message VOID..."}
              disabled={disabled || isProcessingVoice}
              maxRows={10}
              minRows={1}
              className="flex-1 w-full bg-transparent text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 text-[15px] leading-[24px] resize-none focus:outline-none py-1.5 custom-scrollbar disabled:opacity-50 min-h-[36px]"
            />

            <div className="flex items-center gap-1.5 shrink-0 mb-0.5">
              <button
                onClick={toggleListening}
                disabled={disabled || isProcessingVoice}
                className={cn(
                  "w-[34px] h-[34px] rounded-full transition-all flex items-center justify-center border",
                  isRecording
                    ? "bg-red-500/10 text-red-500 border-red-500/20 animate-pulse hover:bg-red-500/20"
                    : "bg-zinc-100/80 text-zinc-500 border-transparent hover:bg-zinc-200 dark:bg-white/5 dark:text-zinc-400 dark:border-transparent dark:hover:bg-white/10 dark:hover:text-zinc-300"
                )}
                title="Dictate message using Whisper AI"
              >
                <Mic className="w-[17px] h-[17px]" strokeWidth={isRecording ? 2.5 : 2} />
              </button>

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

              <button
                ref={toggleRef}
                onClick={() => setIsLengthMenuOpen(!isLengthMenuOpen)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12.5px] font-semibold tracking-wide transition-colors ${outputLength !== 'Auto' || isLengthMenuOpen
                    ? 'bg-zinc-200 text-zinc-800 dark:bg-white/10 dark:text-zinc-200'
                    : 'bg-transparent text-zinc-500 hover:bg-zinc-200 dark:hover:bg-white/5 dark:text-zinc-400 dark:hover:text-zinc-300'
                  }`}
              >
                <AlignLeft className="w-3.5 h-3.5 opacity-80" />
                <span>{outputLength}</span>
                <ChevronDown className={`w-3.5 h-3.5 opacity-60 transition-transform duration-200 ${isLengthMenuOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

        </div>

        {/* Attach Popover Menu */}
        {isAttachMenuOpen && (
          <div
            ref={attachMenuRef}
            className="absolute left-2 bottom-[calc(100%+8px)] w-[160px] bg-white dark:bg-[#2A2A2A] border border-zinc-200 dark:border-[#383838] rounded-xl shadow-lg dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)] z-50 p-1.5 flex flex-col font-sans origin-bottom-left animate-in fade-in slide-in-from-bottom-2 duration-150 ring-1 ring-black/[0.03] dark:ring-white/[0.03]"
          >
            <button
              onClick={() => { fileInputRef.current?.click(); setIsAttachMenuOpen(false); }}
              className="flex items-center gap-2.5 px-2.5 py-2 text-[13px] font-[500] rounded-md transition-colors text-left w-full group text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10"
            >
              <Paperclip className="w-3.5 h-3.5 shrink-0" />
              <span>Upload files</span>
            </button>
          </div>
        )}

        {/* Length Popover Menu */}
        {isLengthMenuOpen && (
          <div
            ref={menuRef}
            className="absolute left-[44px] bottom-[calc(100%+8px)] w-[160px] bg-white dark:bg-[#2A2A2A] border border-zinc-200 dark:border-[#383838] rounded-xl shadow-lg dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)] z-50 p-1.5 flex flex-col font-sans origin-bottom-left animate-in fade-in slide-in-from-bottom-2 duration-150 ring-1 ring-black/[0.03] dark:ring-white/[0.03]"
          >
            <div className="px-2 pb-1.5 pt-1 text-[11px] font-bold text-zinc-400 dark:text-zinc-500 tracking-wider">RESPONSE LENGTH</div>
            <div className="flex flex-col gap-0.5">
              {LENGTH_MODES.map((mode) => (
                <button
                  key={mode}
                  onClick={() => { setOutputLength(mode); setIsLengthMenuOpen(false); }}
                  className={`flex items-center justify-between px-2.5 py-2 text-[13px] font-[500] rounded-md transition-colors text-left w-full group ${outputLength === mode
                      ? 'text-zinc-900 bg-zinc-100 dark:text-white dark:bg-white/10'
                      : 'text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10'
                    }`}
                >
                  <span>{mode}</span>
                  {outputLength === mode && <Check className="w-[14px] h-[14px] shrink-0 text-zinc-700 dark:text-zinc-300" />}
                </button>
              ))}
            </div>
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
    </>
  );
};

export default Composer;
