import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Palette,
  Type,
  Vibrate,
  Keyboard,
  Trash2,
  Check,
  Terminal,
  Sun,
  Moon,
  Sparkles,
} from 'lucide-react';
import { useTheme } from '../theme/ThemeProvider';
import { PRESET_SEED_COLORS, ThemeMode } from '../theme/tokens';
import { M3Switch, M3Slider, M3ExpressiveButton } from './M3Components';
import { vfs } from '../virtual-fs/fs';
import { haptics } from '../haptics/haptics';

interface SettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onResetCompleted?: () => void;
}

export const SettingsSheet: React.FC<SettingsSheetProps> = ({
  isOpen,
  onClose,
  onResetCompleted,
}) => {
  const {
    themeMode,
    setThemeMode,
    seedColor,
    setSeedColor,
    fontSize,
    setFontSize,
    showExtraKeys,
    setShowExtraKeys,
    hapticsOn,
    setHapticsOn,
    cursorStyle,
    setCursorStyle,
  } = useTheme();

  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  const handleClearStorage = async () => {
    haptics.heavy();
    await vfs.clearStorage();
    setConfirmClearOpen(false);
    onClose();
    onResetCompleted?.();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-end select-none"
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="w-full max-w-lg bg-[#0e121a] border-t border-[#1f2638] rounded-t-3xl max-h-[90vh] flex flex-col shadow-2xl pb-safe"
          >
            {/* Grab Bar */}
            <div className="w-full flex justify-center pt-3 pb-1">
              <div className="w-12 h-1.5 rounded-full bg-slate-700" />
            </div>

            {/* Header */}
            <div className="px-5 py-3 border-b border-[#1b2233] flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-base text-slate-100 flex items-center gap-2">
                  <Terminal size={18} className="text-primary" /> Settings
                </h3>
                <p className="text-xs text-slate-400">Appearance & Terminal Preferences</p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 active:scale-95"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
              {/* Theme Mode Selector */}
              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5 block">
                  Color Theme
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['amoled', 'dark', 'light'] as ThemeMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => {
                        haptics.click();
                        setThemeMode(mode);
                      }}
                      className={`p-3 rounded-2xl border text-xs font-medium flex flex-col items-center gap-1.5 transition-all active:scale-95 ${
                        themeMode === mode
                          ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm'
                          : 'border-[#222b3d] bg-[#141a26] text-slate-300'
                      }`}
                    >
                      {mode === 'amoled' && <Moon size={18} className="text-cyan-400" />}
                      {mode === 'dark' && <Moon size={18} className="text-indigo-400" />}
                      {mode === 'light' && <Sun size={18} className="text-amber-400" />}
                      <span className="capitalize">{mode}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Seed Color Picker */}
              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5 block">
                  M3 Dynamic Seed Color
                </label>
                <div className="flex flex-wrap gap-2.5 items-center">
                  {PRESET_SEED_COLORS.map((preset) => {
                    const isSelected = seedColor.toLowerCase() === preset.hex.toLowerCase();
                    return (
                      <button
                        key={preset.hex}
                        onClick={() => {
                          haptics.click();
                          setSeedColor(preset.hex);
                        }}
                        style={{ backgroundColor: preset.hex }}
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-md ${
                          isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-black scale-105' : ''
                        }`}
                        title={preset.name}
                      >
                        {isSelected && <Check size={16} className="text-black font-bold" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Font Size Slider */}
              <div>
                <M3Slider
                  label="Terminal Font Size"
                  value={fontSize}
                  min={11}
                  max={22}
                  unit="px"
                  onChange={setFontSize}
                />
              </div>

              {/* Cursor Style */}
              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5 block">
                  Cursor Style
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['block', 'underline', 'bar'] as const).map((style) => (
                    <button
                      key={style}
                      onClick={() => {
                        haptics.click();
                        setCursorStyle(style);
                      }}
                      className={`p-2.5 rounded-xl border text-xs font-mono capitalize transition-all active:scale-95 ${
                        cursorStyle === style
                          ? 'border-primary bg-primary/10 text-primary font-bold'
                          : 'border-[#222b3d] bg-[#141a26] text-slate-300'
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="border-t border-[#1b2233] pt-4 space-y-2">
                <M3Switch
                  label="Show Extra-Keys Row (ESC, TAB, CTRL...)"
                  checked={showExtraKeys}
                  onChange={setShowExtraKeys}
                />
                <M3Switch
                  label="Haptic Vibration Feedback"
                  checked={hapticsOn}
                  onChange={setHapticsOn}
                />
              </div>

              {/* Storage Reset */}
              <div className="border-t border-[#1b2233] pt-4">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 block">
                  Storage
                </label>
                <button
                  onClick={() => {
                    haptics.click();
                    setConfirmClearOpen(true);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl border border-red-800/60 bg-red-950/20 text-red-300 text-xs font-medium flex items-center justify-center gap-2 hover:bg-red-950/40 active:scale-95 transition-all"
                >
                  <Trash2 size={16} /> Reset Virtual Filesystem
                </button>
              </div>
            </div>

            {/* Confirmation Dialog */}
            {confirmClearOpen && (
              <div className="p-4 bg-[#141a26] border-t border-[#222b3d] flex flex-col gap-3">
                <p className="text-xs text-red-200">
                  Are you sure you want to restore default files? All edited files will be reset.
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setConfirmClearOpen(false)}
                    className="px-3 py-1.5 text-xs text-slate-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleClearStorage}
                    className="px-4 py-1.5 bg-red-600 text-white font-semibold text-xs rounded-xl active:scale-95"
                  >
                    Yes, Reset Files
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
