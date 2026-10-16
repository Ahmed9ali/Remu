import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Editor, { OnMount } from '@monaco-editor/react';
import {
  X,
  Play,
  Save,
  Sparkles,
  Search,
  Command,
  MapPin,
  ChevronDown,
  FileCode,
  FolderOpen,
} from 'lucide-react';
import { vfs } from '../virtual-fs/fs';
import { useTheme } from '../theme/ThemeProvider';
import { haptics } from '../haptics/haptics';
import { GeminiAssistant } from './GeminiAssistant';

interface OpenFile {
  path: string;
  name: string;
  content: string;
  language: string;
  isDirty?: boolean;
}

interface EditorSheetProps {
  isOpen: boolean;
  onClose: () => void;
  initialFilePath?: string;
  onRunFile?: (filepath: string) => void;
  onOpenExplorer?: () => void;
}

function detectLanguage(filename: string): string {
  if (filename.endsWith('.js') || filename.endsWith('.mjs')) return 'javascript';
  if (filename.endsWith('.ts')) return 'typescript';
  if (filename.endsWith('.py')) return 'python';
  if (filename.endsWith('.json')) return 'json';
  if (filename.endsWith('.html')) return 'html';
  if (filename.endsWith('.css')) return 'css';
  if (filename.endsWith('.md')) return 'markdown';
  if (filename.endsWith('.sh') || filename.endsWith('.bashrc')) return 'shell';
  if (filename.endsWith('.rs')) return 'rust';
  if (filename.endsWith('.c') || filename.endsWith('.h')) return 'c';
  if (filename.endsWith('.cpp')) return 'cpp';
  return 'plaintext';
}

export const EditorSheet: React.FC<EditorSheetProps> = ({
  isOpen,
  onClose,
  initialFilePath,
  onRunFile,
  onOpenExplorer,
}) => {
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const [activeFilePath, setActiveFilePath] = useState<string>('');
  const [minimapEnabled, setMinimapEnabled] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, col: 1 });
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'dirty'>('saved');
  const [isAiOpen, setIsAiOpen] = useState(false);

  const editorRef = useRef<any>(null);
  const saveTimeoutRef = useRef<any>(null);
  const { themeMode } = useTheme();

  // Load requested file when sheet opens
  useEffect(() => {
    if (!isOpen) return;

    const target = initialFilePath || '/home/ahmed/README.md';

    const load = async () => {
      try {
        const content = await vfs.readFile(target);
        const name = target.substring(target.lastIndexOf('/') + 1);
        const lang = detectLanguage(name);

        setOpenFiles((prev) => {
          const exists = prev.find((f) => f.path === target);
          if (exists) {
            return prev.map((f) => (f.path === target ? { ...f, content } : f));
          }
          return [...prev, { path: target, name, content, language: lang }];
        });
        setActiveFilePath(target);
        setSaveStatus('saved');
      } catch (err) {
        console.error('Failed to load file:', err);
      }
    };

    load();
  }, [isOpen, initialFilePath]);

  // Inform Android bridge of editor state changes
  useEffect(() => {
    window.AndroidBridge?.onEditorStateChange?.(isOpen);
  }, [isOpen]);

  const activeFile = openFiles.find((f) => f.path === activeFilePath) || openFiles[0];

  // Auto-save logic
  const handleContentChange = (value: string | undefined) => {
    if (value === undefined || !activeFile) return;

    setOpenFiles((prev) =>
      prev.map((f) => (f.path === activeFile.path ? { ...f, content: value, isDirty: true } : f))
    );
    setSaveStatus('dirty');

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        await vfs.writeFile(activeFile.path, value);
        setSaveStatus('saved');
        setOpenFiles((prev) =>
          prev.map((f) => (f.path === activeFile.path ? { ...f, isDirty: false } : f))
        );
      } catch (err) {
        console.error('Autosave failed:', err);
      }
    }, 800);
  };

  const handleCloseTab = (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    haptics.click();
    const remaining = openFiles.filter((f) => f.path !== path);
    setOpenFiles(remaining);
    if (path === activeFilePath) {
      if (remaining.length > 0) {
        setActiveFilePath(remaining[remaining.length - 1].path);
      } else {
        onClose();
      }
    }
  };

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Track cursor movements
    editor.onDidChangeCursorPosition((e) => {
      setCursorPosition({
        line: e.position.lineNumber,
        col: e.position.column,
      });
    });

    // Custom dark theme with AMOLED background
    monaco.editor.defineTheme('amoled-black', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '64748B', fontStyle: 'italic' },
        { token: 'keyword', foreground: '38BDF8' },
        { token: 'string', foreground: '4ADE80' },
        { token: 'number', foreground: 'FBBF24' },
        { token: 'type', foreground: 'C084FC' },
      ],
      colors: {
        'editor.background': '#000000',
        'editor.foreground': '#E2E8F0',
        'editorCursor.foreground': '#38BDF8',
        'editor.lineHighlightBackground': '#0C101A',
        'editorLineNumber.foreground': '#334155',
        'editorLineNumber.activeForeground': '#38BDF8',
        'editor.selectionBackground': '#0369A140',
      },
    });

    monaco.editor.setTheme('amoled-black');
  };

  const toggleMinimap = () => {
    haptics.click();
    const next = !minimapEnabled;
    setMinimapEnabled(next);
    editorRef.current?.updateOptions({ minimap: { enabled: next } });
  };

  const openFind = () => {
    haptics.click();
    editorRef.current?.getAction('actions.find')?.run();
  };

  const openCommandPalette = () => {
    haptics.click();
    editorRef.current?.trigger('', 'editor.action.quickCommand', null);
  };

  const handleRun = () => {
    if (!activeFile) return;
    haptics.click();
    onClose();
    onRunFile?.(activeFile.path);
  };

  const handleApplyAiCode = (newCode: string) => {
    if (!activeFile) return;
    handleContentChange(newCode);
    editorRef.current?.setValue(newCode);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.6 }}
          onDragEnd={(_, info) => {
            if (info.offset.y > 140) {
              haptics.click();
              onClose();
            }
          }}
          className="fixed inset-0 z-40 bg-[#000000] flex flex-col overflow-hidden text-slate-100 shadow-2xl pt-safe"
        >
          {/* Top Bar with Grab Handle and Actions */}
          <div className="w-full bg-[#080B12] border-b border-[#182030] flex flex-col shrink-0">
            {/* Drag Handle Indicator */}
            <div className="w-full flex justify-center pt-2 pb-1 cursor-grab active:cursor-grabbing">
              <div className="w-10 h-1.5 rounded-full bg-slate-700/80 hover:bg-slate-500 transition-colors" />
            </div>

            <div className="px-3 pb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 overflow-hidden">
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 active:bg-slate-800 active:scale-95 transition-all"
                  aria-label="Back to Terminal"
                >
                  <ChevronDown size={20} />
                </button>
                <div className="flex items-center gap-1.5 truncate">
                  <FileCode size={16} className="text-cyan-400 shrink-0" />
                  <span className="font-semibold text-xs sm:text-sm truncate">
                    {activeFile ? activeFile.name : 'Editor'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 shrink-0">
                {/* Run Button (for .js or .py files) */}
                {activeFile && (activeFile.name.endsWith('.js') || activeFile.name.endsWith('.py')) && (
                  <button
                    onClick={handleRun}
                    className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 text-xs font-semibold flex items-center gap-1 active:scale-95 transition-all"
                    title="Run in Terminal"
                  >
                    <Play size={13} fill="currentColor" />
                    <span>Run</span>
                  </button>
                )}

                {/* Gemini AI Assistant */}
                <button
                  onClick={() => {
                    haptics.click();
                    setIsAiOpen(true);
                  }}
                  className="p-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 active:scale-95 transition-all"
                  title="Ask Gemini AI"
                >
                  <Sparkles size={16} />
                </button>

                {/* Find in file */}
                <button
                  onClick={openFind}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 active:scale-95 transition-all"
                  title="Find / Replace"
                >
                  <Search size={16} />
                </button>

                {/* Command Palette */}
                <button
                  onClick={openCommandPalette}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 active:scale-95 transition-all"
                  title="Command Palette (Ctrl+Shift+P)"
                >
                  <Command size={16} />
                </button>

                {/* Minimap toggle */}
                <button
                  onClick={toggleMinimap}
                  className={`p-1.5 rounded-xl active:scale-95 transition-all ${
                    minimapEnabled ? 'text-cyan-400 bg-cyan-950/40' : 'text-slate-400'
                  }`}
                  title="Toggle Minimap"
                >
                  <MapPin size={16} />
                </button>

                {/* Close Editor */}
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 active:scale-95 transition-all ml-1"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* File Tabs Row (Visible only when two or more files are open) */}
            {openFiles.length >= 2 && (
              <div className="flex items-center gap-1 px-2 pb-1 overflow-x-auto no-scrollbar border-t border-[#141b29] pt-1">
                {openFiles.map((f) => (
                  <div
                    key={f.path}
                    onClick={() => {
                      haptics.key();
                      setActiveFilePath(f.path);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono cursor-pointer transition-all shrink-0 ${
                      f.path === activeFilePath
                        ? 'bg-[#151d2c] text-cyan-300 font-semibold border border-[#232e44]'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-[#10141f]'
                    }`}
                  >
                    <span>{f.name}</span>
                    {f.isDirty && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                    <button
                      onClick={(e) => handleCloseTab(e, f.path)}
                      className="p-0.5 hover:text-red-400 rounded-full"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Monaco Editor Canvas */}
          <div className="flex-1 w-full h-full relative overflow-hidden bg-black">
            {activeFile ? (
              <Editor
                height="100%"
                language={activeFile.language}
                value={activeFile.content}
                theme="amoled-black"
                onChange={handleContentChange}
                onMount={handleEditorMount}
                options={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 14,
                  lineNumbers: 'on',
                  roundedSelection: false,
                  scrollBeyondLastLine: false,
                  readOnly: false,
                  automaticLayout: true,
                  minimap: { enabled: minimapEnabled },
                  cursorBlinking: 'smooth',
                  tabSize: 2,
                  wordWrap: 'on',
                  padding: { top: 8, bottom: 8 },
                }}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-2">
                <FileCode size={36} />
                <span className="text-sm">No file open</span>
              </div>
            )}
          </div>

          {/* Bottom Status Bar */}
          <div className="w-full h-8 bg-[#0a0d14] border-t border-[#182030] px-3 flex items-center justify-between text-[11px] font-mono text-slate-400 shrink-0 pb-safe">
            <div className="flex items-center gap-3">
              <span>
                Ln {cursorPosition.line}, Col {cursorPosition.col}
              </span>
              <span>UTF-8</span>
              <span className="capitalize">{activeFile?.language || 'Plain Text'}</span>
            </div>

            <div className="flex items-center gap-2">
              {saveStatus === 'saving' && (
                <span className="text-cyan-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  Saving...
                </span>
              )}
              {saveStatus === 'saved' && (
                <span className="text-slate-500 flex items-center gap-1">
                  <Save size={11} /> Saved
                </span>
              )}
              {saveStatus === 'dirty' && (
                <span className="text-amber-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  Unsaved
                </span>
              )}
            </div>
          </div>

          {/* Gemini AI Assistant Modal */}
          <GeminiAssistant
            isOpen={isAiOpen}
            onClose={() => setIsAiOpen(false)}
            currentCode={activeFile ? activeFile.content : ''}
            language={activeFile ? activeFile.language : 'plaintext'}
            onApplyCode={handleApplyAiCode}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
