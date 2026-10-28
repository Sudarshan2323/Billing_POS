import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Bot,
  Send,
  X,
  Settings,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Key,
  ChevronDown,
  Layers,
  HelpCircle,
  Loader2,
  RefreshCw,
  Share2,
} from 'lucide-react';
import {
  getGeminiApiKey,
  saveGeminiApiKey,
  getGeminiModel,
  saveGeminiModel,
  sendGeminiChatMessage,
  testGeminiApiKey,
} from '../lib/gemini';

const INITIAL_MESSAGES = [
  {
    role: 'model',
    text: "Namaste! I am **Munim AI**, your Bharat Hardware & Electricals copilot.\n\nAsk me about **item rack locations**, **stock availability**, **contractor vs retail rates**, **Khata balances**, or ask me to **draft WhatsApp payment reminders**!",
  },
];

const SUGGESTED_PROMPTS = [
  'Which hardware items are low in stock?',
  'Who owes the highest Khata balance?',
  'Where is the PVC pipe and solvent stored?',
  'Draft a polite Hindi/English payment reminder for Ramesh Patil',
  'Compare retail vs contractor rate for 1.5 sq mm copper wire',
];

export const AiChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(() => getGeminiApiKey());
  const [selectedModel, setSelectedModel] = useState(() => getGeminiModel());
  const [testStatus, setTestStatus] = useState(null); // { success: boolean, message: string }
  const [isTestingKey, setIsTestingKey] = useState(false);

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('billbook_ai_chat_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      // ignore
    }
    return INITIAL_MESSAGES;
  });

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Sync chat history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('billbook_ai_chat_history', JSON.stringify(messages));
    } catch (e) {
      // ignore
    }
  }, [messages]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Keyboard shortcut Ctrl+Space or Alt+A to toggle AI Chatbot
  useEffect(() => {
    const handleKeyDown = e => {
      if ((e.ctrlKey && e.code === 'Space') || (e.altKey && e.key.toLowerCase() === 'a')) {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSendMessage = async textToSend => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isLoading) return;

    setErrorMessage('');
    setInputMessage('');

    // Append user message
    const updatedMessages = [...messages, { role: 'user', text: query }];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      // Format history for Gemini API
      const geminiHistory = updatedMessages.map(m => ({
        role: m.role === 'model' ? 'model' : 'user',
        parts: [{ text: m.text }],
      }));

      const replyText = await sendGeminiChatMessage(geminiHistory);

      setMessages(prev => [...prev, { role: 'model', text: replyText }]);
    } catch (err) {
      console.error('Gemini error:', err);
      const isMissingKey =
        !getGeminiApiKey() ||
        err.message.includes('API Key is missing') ||
        err.message.includes('API_KEY_INVALID');

      setErrorMessage(err.message || 'Failed to get response from Gemini.');
      if (isMissingKey) {
        setShowSettings(true);
      }
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleTestAndSaveKey = async e => {
    e.preventDefault();
    setIsTestingKey(true);
    setTestStatus(null);

    const res = await testGeminiApiKey(apiKeyInput);
    setIsTestingKey(false);
    setTestStatus(res);

    if (res.success) {
      saveGeminiApiKey(apiKeyInput);
      saveGeminiModel(selectedModel);
      setErrorMessage('');
      setTimeout(() => {
        setShowSettings(false);
        setTestStatus(null);
      }, 1500);
    }
  };

  const handleClearChat = () => {
    if (confirm('Clear AI conversation history?')) {
      setMessages(INITIAL_MESSAGES);
      localStorage.removeItem('billbook_ai_chat_history');
    }
  };

  const handleCopyText = text => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <>
      {/* Floating Launcher Button */}
      <div className="fixed bottom-5 right-5 z-40 print:hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2.5 px-4 py-3 rounded-full shadow-2xl transition-all duration-200 border border-primary/20 ${
            isOpen
              ? 'bg-ink text-paper hover:bg-black scale-95'
              : 'bg-primary text-primary-foreground hover:bg-primary-hover hover:scale-105'
          }`}
          title="Munim AI Copilot (Shortcut: Alt+A or Ctrl+Space)"
          aria-label="Open Munim AI Chatbot"
        >
          <div className="relative flex items-center justify-center">
            <Sparkles className="h-5 w-5 animate-pulse text-amber-300" />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
            </span>
          </div>
          <span className="font-bold text-xs tracking-wide">Munim AI</span>
        </button>
      </div>

      {/* Slide-Up Chat Window */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 sm:right-6 z-50 w-[95vw] sm:w-[420px] max-w-[440px] h-[600px] max-h-[85vh] bg-paper-surface border border-border rounded-panel shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200 print:hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground border-b border-primary-hover shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">
                <Bot className="h-5 w-5 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm tracking-tight">Munim AI</h3>
                  <span className="text-[10px] bg-white/20 text-white font-mono px-1.5 py-0.2 rounded font-semibold">
                    Live Copilot
                  </span>
                </div>
                <p className="text-[10px] text-white/80 leading-none mt-0.5">
                  Bharat Hardware Assistant · {getGeminiModel()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleClearChat}
                className="p-1.5 rounded-control text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                title="Clear conversation"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-1.5 rounded-control transition-colors ${
                  showSettings ? 'bg-white/20 text-white' : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
                title="Configure Gemini API Key"
              >
                <Settings className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-control text-white/80 hover:text-white hover:bg-white/10 transition-colors ml-1"
                title="Close chat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Settings Overlay Drawer */}
          {showSettings && (
            <div className="p-4 bg-paper-sunken border-b border-border text-xs space-y-3 shrink-0 animate-in slide-in-from-top-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-ink text-xs">
                  <Key className="h-4 w-4 text-primary" />
                  <span>Google Gemini API Configuration</span>
                </div>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-ink-muted hover:text-ink"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleTestAndSaveKey} className="space-y-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-ink uppercase mb-1">
                    Gemini API Key *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="AIzaSy..."
                    value={apiKeyInput}
                    onChange={e => setApiKeyInput(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-control border border-border bg-paper text-ink font-mono focus:border-primary focus:outline-none"
                  />
                  <div className="flex justify-between items-center mt-1 text-[10px]">
                    <span className="text-ink-muted">Keys are stored locally in your browser.</span>
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary font-bold hover:underline inline-flex items-center gap-0.5"
                    >
                      <span>Get Free Key</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-ink uppercase mb-1">
                      Model
                    </label>
                    <select
                      value={selectedModel}
                      onChange={e => setSelectedModel(e.target.value)}
                      className="w-full p-1.5 text-xs rounded-control border border-border bg-paper text-ink font-medium"
                    >
                      <option value="gemini-1.5-flash">Gemini 1.5 Flash (Fastest)</option>
                      <option value="gemini-1.5-pro">Gemini 1.5 Pro (Deep)</option>
                      <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash Exp</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={isTestingKey || !apiKeyInput.trim()}
                      className="w-full py-2 bg-primary text-primary-foreground font-bold rounded-control hover:bg-primary-hover shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      {isTestingKey ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Testing...</span>
                        </>
                      ) : (
                        <span>Save & Validate</span>
                      )}
                    </button>
                  </div>
                </div>

                {testStatus && (
                  <div
                    className={`p-2 rounded-control text-xs flex items-center gap-1.5 border ${
                      testStatus.success
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}
                  >
                    {testStatus.success ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                    )}
                    <span className="leading-tight">{testStatus.message}</span>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* Missing API Key Alert */}
          {!getGeminiApiKey() && !showSettings && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/50 border-b border-amber-200 dark:border-amber-800 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200 shrink-0">
              <div className="flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                <span>Gemini API Key needed to chat.</span>
              </div>
              <button
                onClick={() => setShowSettings(true)}
                className="px-2.5 py-1 bg-amber-200 dark:bg-amber-800 font-bold rounded-control text-[11px] hover:opacity-90"
              >
                Configure
              </button>
            </div>
          )}

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-paper">
            {messages.map((msg, idx) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={idx}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-ink-muted font-bold">
                    {isUser ? (
                      <span>You</span>
                    ) : (
                      <span className="text-primary flex items-center gap-1">
                        <Bot className="h-3 w-3" /> Munim AI
                      </span>
                    )}
                  </div>

                  <div
                    className={`relative group max-w-[88%] p-3 rounded-panel text-xs leading-relaxed whitespace-pre-wrap ${
                      isUser
                        ? 'bg-primary text-primary-foreground font-medium rounded-br-none shadow-sm'
                        : 'bg-paper-surface text-ink border border-border shadow-sm rounded-bl-none'
                    }`}
                  >
                    {msg.text}

                    {/* Copy button for model responses */}
                    {!isUser && (
                      <button
                        onClick={() => handleCopyText(msg.text)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 p-1 text-ink-muted hover:text-ink bg-paper rounded border border-border"
                        title="Copy text"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-center gap-2 p-3 bg-paper-surface border border-border rounded-panel text-xs text-ink-muted w-fit animate-pulse">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="font-medium">Munim AI is checking inventory & records...</span>
              </div>
            )}

            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-panel text-xs flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
                <div className="space-y-1">
                  <div className="font-bold">Error</div>
                  <div>{errorMessage}</div>
                  <button
                    onClick={() => setShowSettings(true)}
                    className="text-primary font-bold underline text-[11px] block mt-1"
                  >
                    Click here to check your Gemini API key
                  </button>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Quick Prompt Pills */}
          <div className="px-3 py-2 bg-paper-sunken border-t border-border flex items-center gap-1.5 overflow-x-auto shrink-0 no-scrollbar">
            {SUGGESTED_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                disabled={isLoading}
                className="px-2.5 py-1 bg-paper border border-border rounded-full text-[11px] text-ink hover:text-primary hover:border-primary whitespace-nowrap transition-colors font-medium shrink-0 disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-paper-surface border-t border-border flex items-center gap-2 shrink-0"
          >
            <input
              ref={inputRef}
              type="text"
              placeholder="Ask about items, stock, racks, Khata dues..."
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              disabled={isLoading}
              className="flex-1 px-3 py-2 text-xs rounded-control border border-border bg-paper text-ink placeholder:text-ink-muted focus:border-primary focus:outline-none font-medium"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="p-2 bg-primary text-primary-foreground rounded-control hover:bg-primary-hover disabled:opacity-40 transition-colors shadow-sm"
              title="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default AiChatbot;
