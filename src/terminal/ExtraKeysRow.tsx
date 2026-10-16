import React, { useState } from 'react';
import { haptics } from '../haptics/haptics';

interface ExtraKeysRowProps {
  onKeyPress: (key: string) => void;
  onModifierChange?: (ctrl: boolean, alt: boolean) => void;
}

export const ExtraKeysRow: React.FC<ExtraKeysRowProps> = ({ onKeyPress, onModifierChange }) => {
  const [ctrlActive, setCtrlActive] = useState(false);
  const [altActive, setAltActive] = useState(false);

  const toggleCtrl = () => {
    haptics.click();
    const next = !ctrlActive;
    setCtrlActive(next);
    onModifierChange?.(next, altActive);
  };

  const toggleAlt = () => {
    haptics.click();
    const next = !altActive;
    setAltActive(next);
    onModifierChange?.(ctrlActive, next);
  };

  const handleKey = (key: string) => {
    haptics.key();
    onKeyPress(key);
    // Reset one-shot modifiers if they were toggled
    if (ctrlActive) {
      setCtrlActive(false);
      onModifierChange?.(false, altActive);
    }
    if (altActive) {
      setAltActive(false);
      onModifierChange?.(ctrlActive, false);
    }
  };

  return (
    <div
      className="w-full bg-[#0a0d14] border-t border-[#1e2535] px-1 py-1 flex items-center justify-between gap-1 overflow-x-auto no-scrollbar z-20 touch-none select-none text-xs font-mono"
      style={{ minHeight: '44px' }}
      aria-label="Terminal Extra Keys"
    >
      {/* ESC */}
      <button
        onClick={() => handleKey('ESC')}
        className="flex-1 min-w-[38px] h-9 rounded-lg bg-[#141a26] active:bg-primary/30 text-slate-200 active:scale-95 font-semibold transition-all duration-75 flex items-center justify-center"
      >
        ESC
      </button>

      {/* TAB */}
      <button
        onClick={() => handleKey('TAB')}
        className="flex-1 min-w-[38px] h-9 rounded-lg bg-[#141a26] active:bg-primary/30 text-slate-200 active:scale-95 font-semibold transition-all duration-75 flex items-center justify-center"
      >
        TAB
      </button>

      {/* CTRL Toggle */}
      <button
        onClick={toggleCtrl}
        className={`flex-1 min-w-[38px] h-9 rounded-lg font-semibold transition-all duration-75 flex items-center justify-center active:scale-95 ${
          ctrlActive
            ? 'bg-primary text-black shadow-[0_0_10px_rgba(56,189,248,0.5)] font-bold'
            : 'bg-[#141a26] text-slate-200 active:bg-primary/30'
        }`}
      >
        CTRL
      </button>

      {/* ALT Toggle */}
      <button
        onClick={toggleAlt}
        className={`flex-1 min-w-[38px] h-9 rounded-lg font-semibold transition-all duration-75 flex items-center justify-center active:scale-95 ${
          altActive
            ? 'bg-secondary text-black shadow-[0_0_10px_rgba(52,211,153,0.5)] font-bold'
            : 'bg-[#141a26] text-slate-200 active:bg-secondary/30'
        }`}
      >
        ALT
      </button>

      {/* Arrow Left */}
      <button
        onClick={() => handleKey('LEFT')}
        className="flex-1 min-w-[34px] h-9 rounded-lg bg-[#141a26] active:bg-primary/30 text-slate-300 active:scale-95 text-sm transition-all duration-75 flex items-center justify-center"
        aria-label="Left Arrow"
      >
        ◀
      </button>

      {/* Arrow Down */}
      <button
        onClick={() => handleKey('DOWN')}
        className="flex-1 min-w-[34px] h-9 rounded-lg bg-[#141a26] active:bg-primary/30 text-slate-300 active:scale-95 text-sm transition-all duration-75 flex items-center justify-center"
        aria-label="Down Arrow"
      >
        ▼
      </button>

      {/* Arrow Up */}
      <button
        onClick={() => handleKey('UP')}
        className="flex-1 min-w-[34px] h-9 rounded-lg bg-[#141a26] active:bg-primary/30 text-slate-300 active:scale-95 text-sm transition-all duration-75 flex items-center justify-center"
        aria-label="Up Arrow"
      >
        ▲
      </button>

      {/* Arrow Right */}
      <button
        onClick={() => handleKey('RIGHT')}
        className="flex-1 min-w-[34px] h-9 rounded-lg bg-[#141a26] active:bg-primary/30 text-slate-300 active:scale-95 text-sm transition-all duration-75 flex items-center justify-center"
        aria-label="Right Arrow"
      >
        ▶
      </button>

      {/* Pipe | */}
      <button
        onClick={() => handleKey('|')}
        className="flex-1 min-w-[32px] h-9 rounded-lg bg-[#141a26] active:bg-primary/30 text-slate-200 active:scale-95 font-semibold transition-all duration-75 flex items-center justify-center"
      >
        |
      </button>

      {/* Slash / */}
      <button
        onClick={() => handleKey('/')}
        className="flex-1 min-w-[32px] h-9 rounded-lg bg-[#141a26] active:bg-primary/30 text-slate-200 active:scale-95 font-semibold transition-all duration-75 flex items-center justify-center"
      >
        /
      </button>

      {/* Tilde ~ */}
      <button
        onClick={() => handleKey('~')}
        className="flex-1 min-w-[32px] h-9 rounded-lg bg-[#141a26] active:bg-primary/30 text-slate-200 active:scale-95 font-semibold transition-all duration-75 flex items-center justify-center"
      >
        ~
      </button>

      {/* Dash - */}
      <button
        onClick={() => handleKey('-')}
        className="flex-1 min-w-[32px] h-9 rounded-lg bg-[#141a26] active:bg-primary/30 text-slate-200 active:scale-95 font-bold transition-all duration-75 flex items-center justify-center"
      >
        -
      </button>
    </div>
  );
};
