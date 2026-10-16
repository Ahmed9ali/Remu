import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, Check, Copy, RefreshCw, AlertCircle, Key } from 'lucide-react';
import { haptics } from '../haptics/haptics';

interface GeminiAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  currentCode: string;
  language: string;
  onApplyCode: (newCode: string) => void;
}

export const GeminiAssistant: React.FC<GeminiAssistantProps> = ({
  isOpen,
  onClose,
  currentCode,
  language,
  onApplyCode,
}) => {
  const [promptMode, setPromptMode] = useState<'explain' | 'fix' | 'refactor' | 'custom'>('explain');
  const [customPrompt, setCustomPrompt] = useState('');
  const [apiKey, setApiKey] = useState(() => {
    // Check native Android bridge first, then localStorage
    return window.AndroidBridge?.getGeminiApiKey?.() || localStorage.getItem('termux_gemini_key') || '';
  });
  const [isLoading, setIsLoading] = useState(false);
  const [resultText, setResultText] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showKeyInput, setShowKeyInput] = useState(false);

  const handleGenerate = async (mode: 'explain' | 'fix' | 'refactor' | 'custom') => {
    haptics.click();
    setPromptMode(mode);
    setErrorMessage(null);
    setResultText('');
    setGeneratedCode(null);

    const effectiveKey = apiKey || window.AndroidBridge?.getGeminiApiKey?.() || '';
    if (!effectiveKey) {
      setShowKeyInput(true);
      setErrorMessage('Please provide your Gemini API key or configure it in AI Studio Secrets.');
      return;
    }

    setIsLoading(true);

    let systemInstruction = 'You are an expert programming assistant integrated into Termux Code on Android.';
    let promptContent = '';

    if (mode === 'explain') {
      promptContent = `Explain the following ${language} code concisely:\n\`\`\`${language}\n${currentCode}\n\`\`\``;
    } else if (mode === 'fix') {
      promptContent = `Identify and fix bugs or syntax issues in the following ${language} code. Provide the corrected code in a code block:\n\`\`\`${language}\n${currentCode}\n\`\`\``;
    } else if (mode === 'refactor') {
      promptContent = `Refactor the following ${language} code for better performance, readability, and modern best practices. Provide the refactored code in a code block:\n\`\`\`${language}\n${currentCode}\n\`\`\``;
    } else {
      promptContent = `${customPrompt}\n\nCode:\n\`\`\`${language}\n${currentCode}\n\`\`\``;
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${effectiveKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptContent }] }],
            systemInstruction: { parts: [{ text: systemInstruction }] },
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 2048,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        throw new Error(errorJson?.error?.message || `HTTP ${response.status}: Failed to call Gemini API`);
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
      setResultText(text);

      // Extract code block if present
      const codeMatch = text.match(/```(?:[a-zA-Z0-9_-]+)?\n([\s\S]*?)```/);
      if (codeMatch && codeMatch[1]) {
        setGeneratedCode(codeMatch[1].trim());
      }
      haptics.success();
    } catch (err: any) {
      setErrorMessage(err.message || String(err));
      haptics.error();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('termux_gemini_key', key);
    setShowKeyInput(false);
    setErrorMessage(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="w-full max-w-xl max-h-[85vh] bg-[#10141d] border border-[#252d3d] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-[#1f2637] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-purple-500 flex items-center justify-center text-black">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-slate-100 flex items-center gap-2">
                    Gemini AI Assistant
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                      3.5 Flash
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">Explain, fix, or optimize your code</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowKeyInput(!showKeyInput)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-200 active:scale-95"
                  title="Configure API Key"
                >
                  <Key size={18} />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-200 active:scale-95"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* API Key Banner/Input */}
            {showKeyInput && (
              <div className="p-4 bg-[#161d2b] border-b border-[#252d3d]">
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Gemini API Key
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="flex-1 bg-black/50 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    onClick={() => handleSaveKey(apiKey)}
                    className="px-4 py-2 bg-primary text-black font-semibold text-xs rounded-xl active:scale-95"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="p-4 flex flex-wrap gap-2 border-b border-[#1f2637]">
              <button
                onClick={() => handleGenerate('explain')}
                disabled={isLoading}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95 ${
                  promptMode === 'explain'
                    ? 'bg-primary text-black font-semibold'
                    : 'bg-[#1b2233] text-slate-300 hover:bg-[#252e42]'
                }`}
              >
                💡 Explain Code
              </button>
              <button
                onClick={() => handleGenerate('fix')}
                disabled={isLoading}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95 ${
                  promptMode === 'fix'
                    ? 'bg-primary text-black font-semibold'
                    : 'bg-[#1b2233] text-slate-300 hover:bg-[#252e42]'
                }`}
              >
                🛠️ Fix Bugs
              </button>
              <button
                onClick={() => handleGenerate('refactor')}
                disabled={isLoading}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95 ${
                  promptMode === 'refactor'
                    ? 'bg-primary text-black font-semibold'
                    : 'bg-[#1b2233] text-slate-300 hover:bg-[#252e42]'
                }`}
              >
                ✨ Refactor & Optimize
              </button>
            </div>

            {/* Body / Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {isLoading && (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-3">
                  <RefreshCw className="animate-spin text-cyan-400" size={24} />
                  <span className="text-xs">Consulting Gemini 3.5 Flash...</span>
                </div>
              )}

              {errorMessage && (
                <div className="p-3 bg-red-950/40 border border-red-800 rounded-xl flex items-start gap-2 text-xs text-red-200">
                  <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {resultText && (
                <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                  {resultText}
                </div>
              )}
            </div>

            {/* Footer with Apply action if code was generated */}
            {generatedCode && (
              <div className="p-4 bg-[#141a27] border-t border-[#1f2637] flex items-center justify-between gap-2">
                <span className="text-xs text-emerald-400 font-mono">Suggested code ready</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedCode);
                      haptics.click();
                    }}
                    className="px-3 py-2 bg-[#1f2637] hover:bg-[#2b354c] text-xs font-medium text-slate-200 rounded-xl flex items-center gap-1 active:scale-95"
                  >
                    <Copy size={14} /> Copy
                  </button>
                  <button
                    onClick={() => {
                      onApplyCode(generatedCode);
                      haptics.success();
                      onClose();
                    }}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs rounded-xl flex items-center gap-1 active:scale-95"
                  >
                    <Check size={14} /> Apply to Editor
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
