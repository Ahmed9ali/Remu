// Haptic feedback utility supporting both Web Vibration API and Android native bridge

declare global {
  interface Window {
    AndroidBridge?: {
      vibrate: (ms: number) => void;
      getGeminiApiKey?: () => string;
      onEditorStateChange?: (isOpen: boolean) => void;
      downloadFile?: (filename: string, content: string) => void;
    };
  }
}

let hapticsEnabled = true;

export function setHapticsEnabled(enabled: boolean) {
  hapticsEnabled = enabled;
}

export function isHapticsEnabled(): boolean {
  return hapticsEnabled;
}

export function vibrate(pattern: number | number[] = 10) {
  if (!hapticsEnabled) return;

  try {
    // If running in Android WebView with native bridge
    if (window.AndroidBridge && typeof window.AndroidBridge.vibrate === 'function') {
      const ms = Array.isArray(pattern) ? (pattern[0] || 10) : pattern;
      window.AndroidBridge.vibrate(ms);
      return;
    }

    // Standard Web Vibration API
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  } catch {
    // Graceful fallback
  }
}

export const haptics = {
  key: () => vibrate(8),
  click: () => vibrate(16),
  heavy: () => vibrate(30),
  success: () => vibrate([10, 40, 15]),
  error: () => vibrate([25, 40, 25, 40, 30]),
};
