import React from 'react';
import { motion } from 'motion/react';
import { haptics } from '../haptics/haptics';

// Material 3 Expressive Switch with bouncy spring and icon indicators
export const M3Switch: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}> = ({ checked, onChange, label }) => {
  return (
    <div
      onClick={() => {
        haptics.click();
        onChange(!checked);
      }}
      className="flex items-center justify-between cursor-pointer py-2 select-none group"
    >
      {label && <span className="text-xs sm:text-sm text-slate-200 font-medium">{label}</span>}
      <div
        className={`w-13 h-7 rounded-full p-1 transition-colors duration-200 flex items-center ${
          checked ? 'bg-primary' : 'bg-[#252e42]'
        }`}
      >
        <motion.div
          animate={{
            x: checked ? 24 : 0,
            scale: [1, 1.15, 1],
          }}
          transition={{ type: 'spring', stiffness: 500, damping: 26 }}
          className={`w-5 h-5 rounded-full shadow-md flex items-center justify-center ${
            checked ? 'bg-black text-primary' : 'bg-slate-400'
          }`}
        />
      </div>
    </div>
  );
};

// Material 3 Expressive Slider with pin value indicator
export const M3Slider: React.FC<{
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (val: number) => void;
  label?: string;
  unit?: string;
}> = ({ value, min, max, step = 1, onChange, label, unit = '' }) => {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="py-2 select-none">
      <div className="flex justify-between items-center mb-1.5">
        {label && <span className="text-xs sm:text-sm text-slate-200 font-medium">{label}</span>}
        <span className="text-xs font-mono text-cyan-400 font-semibold bg-cyan-950/40 px-2 py-0.5 rounded-full border border-cyan-800/60">
          {value}
          {unit}
        </span>
      </div>
      <div className="relative w-full h-8 flex items-center">
        {/* Track */}
        <div className="w-full h-2 rounded-full bg-[#1b2333] overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-75"
            style={{ width: `${percentage}%` }}
          />
        </div>
        {/* Native range input overlay */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => {
            const v = Number(e.target.value);
            haptics.key();
            onChange(v);
          }}
          className="absolute inset-0 w-full opacity-0 cursor-pointer"
        />
      </div>
    </div>
  );
};

// Material 3 Expressive Shape-Morphing Button (round -> squircle on press)
export const M3ExpressiveButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'tonal' | 'outlined';
  className?: string;
}> = ({ children, onClick, variant = 'primary', className = '' }) => {
  const baseClasses =
    variant === 'primary'
      ? 'bg-primary text-black font-semibold'
      : variant === 'secondary'
      ? 'bg-secondary text-black font-semibold'
      : variant === 'tonal'
      ? 'bg-[#1e2638] text-slate-100 hover:bg-[#28334b]'
      : 'border border-[#334155] text-slate-200 hover:bg-[#151c2a]';

  return (
    <motion.button
      whileTap={{
        scale: 0.95,
        borderRadius: '12px',
      }}
      initial={{ borderRadius: '9999px' }}
      transition={{ type: 'spring', stiffness: 450, damping: 20 }}
      onClick={() => {
        haptics.click();
        onClick?.();
      }}
      className={`px-4 py-2 text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all ${baseClasses} ${className}`}
    >
      {children}
    </motion.button>
  );
};

// Expressive Loading Indicator (Morphing animated shapes)
export const M3ExpressiveLoader: React.FC = () => {
  return (
    <div className="flex items-center justify-center gap-2 py-4">
      <motion.div
        animate={{
          scale: [1, 1.4, 1],
          borderRadius: ['50%', '20%', '50%'],
          rotate: [0, 90, 180],
        }}
        transition={{
          repeat: Infinity,
          duration: 1.2,
          ease: 'easeInOut',
        }}
        className="w-4 h-4 bg-primary"
      />
      <motion.div
        animate={{
          scale: [1, 1.4, 1],
          borderRadius: ['20%', '50%', '20%'],
          rotate: [90, 180, 270],
        }}
        transition={{
          repeat: Infinity,
          duration: 1.2,
          delay: 0.2,
          ease: 'easeInOut',
        }}
        className="w-4 h-4 bg-secondary"
      />
      <motion.div
        animate={{
          scale: [1, 1.4, 1],
          borderRadius: ['50%', '20%', '50%'],
          rotate: [180, 270, 360],
        }}
        transition={{
          repeat: Infinity,
          duration: 1.2,
          delay: 0.4,
          ease: 'easeInOut',
        }}
        className="w-4 h-4 bg-tertiary"
      />
    </div>
  );
};
