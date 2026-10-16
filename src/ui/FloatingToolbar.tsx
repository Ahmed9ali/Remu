import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Code,
  FolderTree,
  Settings as SettingsIcon,
  Plus,
  Trash2,
  Terminal as TerminalIcon,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { haptics } from '../haptics/haptics';

interface FloatingToolbarProps {
  onOpenEditor: () => void;
  onOpenExplorer: () => void;
  onOpenSettings: () => void;
  onQuickNewFile: () => void;
  onClearTerminal: () => void;
}

export const FloatingToolbar: React.FC<FloatingToolbarProps> = ({
  onOpenEditor,
  onOpenExplorer,
  onOpenSettings,
  onQuickNewFile,
  onClearTerminal,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    haptics.click();
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5 select-none">
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="flex items-center gap-1 bg-[#101522]/90 backdrop-blur-md border border-[#222c40] px-2 py-1 rounded-full shadow-2xl"
          >
            {/* Quick Open Editor */}
            <button
              onClick={() => {
                haptics.click();
                onOpenEditor();
              }}
              className="p-2 rounded-full text-cyan-400 hover:bg-cyan-950/40 active:scale-95 transition-all"
              title="Open Editor (code .)"
            >
              <Code size={18} />
            </button>

            {/* Quick Open Explorer */}
            <button
              onClick={() => {
                haptics.click();
                onOpenExplorer();
              }}
              className="p-2 rounded-full text-emerald-400 hover:bg-emerald-950/40 active:scale-95 transition-all"
              title="File Explorer"
            >
              <FolderTree size={18} />
            </button>

            {/* Quick New File */}
            <button
              onClick={() => {
                haptics.click();
                onQuickNewFile();
              }}
              className="p-2 rounded-full text-purple-400 hover:bg-purple-950/40 active:scale-95 transition-all"
              title="New File"
            >
              <Plus size={18} />
            </button>

            {/* Clear Screen */}
            <button
              onClick={() => {
                haptics.click();
                onClearTerminal();
              }}
              className="p-2 rounded-full text-slate-400 hover:text-slate-200 active:scale-95 transition-all"
              title="Clear Terminal (Ctrl+L)"
            >
              <Trash2 size={18} />
            </button>

            {/* Settings */}
            <button
              onClick={() => {
                haptics.click();
                onOpenSettings();
              }}
              className="p-2 rounded-full text-slate-400 hover:text-slate-200 active:scale-95 transition-all"
              title="Settings"
            >
              <SettingsIcon size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Main Toggle Pill / FAB */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={toggleExpand}
        className={`w-10 h-10 rounded-full flex items-center justify-center shadow-xl border transition-all ${
          isExpanded
            ? 'bg-primary text-black border-cyan-400 font-bold'
            : 'bg-[#10141f]/85 text-slate-200 border-[#222c40] backdrop-blur-md'
        }`}
        title="Termux Quick Tools"
      >
        <TerminalIcon size={18} />
      </motion.button>
    </div>
  );
};
