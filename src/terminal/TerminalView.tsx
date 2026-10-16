import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';
import { ShellEngine } from '../shell-engine/shell';
import { ShellContext } from '../shell-engine/types';
import { useTheme } from '../theme/ThemeProvider';
import { ExtraKeysRow } from './ExtraKeysRow';
import { haptics } from '../haptics/haptics';

interface TerminalViewProps {
  shellEngine: ShellEngine;
  onOpenEditor: (filepath?: string) => void;
  onOpenExplorer: () => void;
  onOpenSettings: () => void;
}

export const TerminalView: React.FC<TerminalViewProps> = ({
  shellEngine,
  onOpenEditor,
  onOpenExplorer,
  onOpenSettings,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  
  const currentLineRef = useRef<string>('');
  const cursorPosRef = useRef<number>(0);
  const isExecutingRef = useRef<boolean>(false);
  
  const ctrlModifierRef = useRef<boolean>(false);
  const altModifierRef = useRef<boolean>(false);

  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const { fontSize, cursorStyle, showExtraKeys } = useTheme();

  // Redraw current line in xterm
  const refreshLine = useCallback((term: Terminal, line: string, pos: number) => {
    // Erase from cursor to end of line, return cursor to prompt start, print line
    const prompt = shellEngine.getPrompt();
    term.write('\r\x1b[K' + prompt + line);
    // Move cursor back to proper position if pos < line.length
    const diff = line.length - pos;
    if (diff > 0) {
      term.write(`\x1b[${diff}D`);
    }
  }, [shellEngine]);

  // Terminal context for executing commands
  const getShellContext = useCallback((): ShellContext => {
    const term = terminalRef.current!;
    return {
      cwd: shellEngine.getCwd(),
      setCwd: (p: string) => shellEngine.setCwd(p),
      env: { HOME: '/home/ahmed', USER: 'ahmed', TERM: 'xterm-256color' },
      openEditor: onOpenEditor,
      openExplorer: onOpenExplorer,
      openSettings: onOpenSettings,
      writeOutput: (text: string) => term.write(text),
      writeError: (text: string) => term.write(`\x1b[31m${text}\x1b[0m`),
      clearTerminal: () => {
        term.clear();
      },
    };
  }, [shellEngine, onOpenEditor, onOpenExplorer, onOpenSettings]);

  // Handle external key presses from ExtraKeysRow
  const handleExtraKeyPress = (key: string) => {
    const term = terminalRef.current;
    if (!term) return;

    if (key === 'ESC') {
      term.focus();
      return;
    }

    if (key === 'TAB') {
      handleTabKey();
      return;
    }

    if (key === 'UP') {
      handleArrowUp();
      return;
    }

    if (key === 'DOWN') {
      handleArrowDown();
      return;
    }

    if (key === 'LEFT') {
      if (cursorPosRef.current > 0) {
        cursorPosRef.current--;
        term.write('\x1b[D');
      }
      return;
    }

    if (key === 'RIGHT') {
      if (cursorPosRef.current < currentLineRef.current.length) {
        cursorPosRef.current++;
        term.write('\x1b[C');
      }
      return;
    }

    // Characters like |, /, ~, -
    insertText(key);
  };

  const insertText = (char: string) => {
    const term = terminalRef.current;
    if (!term || isExecutingRef.current) return;

    const line = currentLineRef.current;
    const pos = cursorPosRef.current;

    currentLineRef.current = line.slice(0, pos) + char + line.slice(pos);
    cursorPosRef.current = pos + char.length;
    refreshLine(term, currentLineRef.current, cursorPosRef.current);
  };

  const handleArrowUp = () => {
    const term = terminalRef.current;
    if (!term || isExecutingRef.current) return;
    const prev = shellEngine.historyPrev();
    if (prev !== null) {
      currentLineRef.current = prev;
      cursorPosRef.current = prev.length;
      refreshLine(term, currentLineRef.current, cursorPosRef.current);
    }
  };

  const handleArrowDown = () => {
    const term = terminalRef.current;
    if (!term || isExecutingRef.current) return;
    const next = shellEngine.historyNext();
    if (next !== null) {
      currentLineRef.current = next;
      cursorPosRef.current = next.length;
      refreshLine(term, currentLineRef.current, cursorPosRef.current);
    }
  };

  const handleTabKey = async () => {
    const term = terminalRef.current;
    if (!term || isExecutingRef.current) return;

    const line = currentLineRef.current;
    const completions = await shellEngine.getCompletions(line);

    if (completions.length === 1) {
      const completion = completions[0];
      const tokens = line.trimStart().split(/\s+/);
      if (tokens.length <= 1) {
        currentLineRef.current = completion + ' ';
      } else {
        const lastToken = tokens[tokens.length - 1];
        const prefix = line.substring(0, line.lastIndexOf(lastToken));
        currentLineRef.current = prefix + completion + (completion.endsWith('/') ? '' : ' ');
      }
      cursorPosRef.current = currentLineRef.current.length;
      refreshLine(term, currentLineRef.current, cursorPosRef.current);
    } else if (completions.length > 1) {
      term.write('\r\n' + completions.join('   ') + '\r\n');
      term.write(shellEngine.getPrompt() + currentLineRef.current);
    }
  };

  // Initialize xterm.js
  useEffect(() => {
    if (!containerRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: cursorStyle,
      fontSize: fontSize,
      fontFamily: 'JetBrains Mono, monospace',
      lineHeight: 1.25,
      convertEol: true,
      scrollback: 2000,
      theme: {
        background: '#000000',
        foreground: '#F1F5F9',
        cursor: '#38BDF8',
        cursorAccent: '#000000',
        selectionBackground: 'rgba(56, 189, 248, 0.35)',
        black: '#000000',
        red: '#F87171',
        green: '#4ADE80',
        yellow: '#FBBF24',
        blue: '#60A5FA',
        magenta: '#C084FC',
        cyan: '#38BDF8',
        white: '#F1F5F9',
        brightBlack: '#475569',
        brightRed: '#EF4444',
        brightGreen: '#22C55E',
        brightYellow: '#EAB308',
        brightBlue: '#3B82F6',
        brightMagenta: '#A855F7',
        brightCyan: '#06B6D4',
        brightWhite: '#FFFFFF',
      },
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);
    term.open(containerRef.current);

    terminalRef.current = term;
    fitAddonRef.current = fitAddon;

    setTimeout(() => {
      try { fitAddon.fit(); } catch (_) {}
    }, 50);

    // Initial greeting
    term.write('\x1b[1;36mTermux Code\x1b[0m \x1b[90mv1.0 (OLED Edition)\x1b[0m\r\n');
    term.write('\x1b[90mType \x1b[32mhelp\x1b[90m for commands or \x1b[32mcode <file>\x1b[90m to open editor.\x1b[0m\r\n\r\n');
    term.write(shellEngine.getPrompt());

    // Main keyboard listener
    term.onData(async (data) => {
      if (isExecutingRef.current) {
        // Allow Ctrl+C during execution
        if (data === '\x03') {
          term.write('^C\r\n');
          isExecutingRef.current = false;
          term.write(shellEngine.getPrompt());
          currentLineRef.current = '';
          cursorPosRef.current = 0;
        }
        return;
      }

      // Check Ctrl modifier
      if (ctrlModifierRef.current) {
        ctrlModifierRef.current = false;
        // Ctrl+C
        if (data.toLowerCase() === 'c') {
          data = '\x03';
        } else if (data.toLowerCase() === 'l') {
          data = '\x0c';
        }
      }

      // Enter
      if (data === '\r') {
        const cmdToRun = currentLineRef.current;
        term.write('\r\n');
        currentLineRef.current = '';
        cursorPosRef.current = 0;

        if (cmdToRun.trim().length > 0) {
          isExecutingRef.current = true;
          try {
            await shellEngine.execute(cmdToRun, getShellContext());
          } catch (err: any) {
            term.write(`\x1b[31m${err.message || String(err)}\x1b[0m\r\n`);
          } finally {
            isExecutingRef.current = false;
          }
        }

        term.write(shellEngine.getPrompt());
        return;
      }

      // Backspace
      if (data === '\x7f' || data === '\b') {
        const line = currentLineRef.current;
        const pos = cursorPosRef.current;
        if (pos > 0) {
          currentLineRef.current = line.slice(0, pos - 1) + line.slice(pos);
          cursorPosRef.current = pos - 1;
          refreshLine(term, currentLineRef.current, cursorPosRef.current);
        }
        return;
      }

      // Tab completion
      if (data === '\t') {
        await handleTabKey();
        return;
      }

      // Ctrl+C
      if (data === '\x03') {
        term.write('^C\r\n');
        currentLineRef.current = '';
        cursorPosRef.current = 0;
        term.write(shellEngine.getPrompt());
        return;
      }

      // Ctrl+L (clear)
      if (data === '\x0c') {
        term.clear();
        term.write(shellEngine.getPrompt() + currentLineRef.current);
        return;
      }

      // Arrow Up
      if (data === '\x1b[A') {
        handleArrowUp();
        return;
      }

      // Arrow Down
      if (data === '\x1b[B') {
        handleArrowDown();
        return;
      }

      // Arrow Right
      if (data === '\x1b[C') {
        if (cursorPosRef.current < currentLineRef.current.length) {
          cursorPosRef.current++;
          term.write(data);
        }
        return;
      }

      // Arrow Left
      if (data === '\x1b[D') {
        if (cursorPosRef.current > 0) {
          cursorPosRef.current--;
          term.write(data);
        }
        return;
      }

      // Ignore unhandled escape codes
      if (data.startsWith('\x1b')) {
        return;
      }

      // Normal text insertion
      insertText(data);
    });

    const handleResize = () => {
      try {
        fitAddon.fit();
      } catch (_) {}
    };

    const handleRunCommand = async (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      const cmdToRun = customEvent.detail;
      if (!cmdToRun) return;

      term.write(cmdToRun + '\r\n');
      currentLineRef.current = '';
      cursorPosRef.current = 0;
      isExecutingRef.current = true;

      try {
        await shellEngine.execute(cmdToRun, getShellContext());
      } catch (err: any) {
        term.write(`\x1b[31m${err.message || String(err)}\x1b[0m\r\n`);
      } finally {
        isExecutingRef.current = false;
        term.write(shellEngine.getPrompt());
      }
    };

    const handleClear = () => {
      term.clear();
      term.write(shellEngine.getPrompt() + currentLineRef.current);
    };

    const resizeObserver = new ResizeObserver(() => {
      try {
        fitAddon.fit();
      } catch (_) {}
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener('resize', handleResize);
    window.addEventListener('termux-run-cmd', handleRunCommand);
    window.addEventListener('termux-clear', handleClear);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('termux-run-cmd', handleRunCommand);
      window.removeEventListener('termux-clear', handleClear);
      term.dispose();
    };
  }, [getShellContext, shellEngine]);

  // Sync font size and cursor style changes
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.options.fontSize = fontSize;
      terminalRef.current.options.cursorStyle = cursorStyle;
      try {
        fitAddonRef.current?.fit();
      } catch (_) {}
    }
  }, [fontSize, cursorStyle]);

  // Handle long press copy/paste
  const handleTouchHold = () => {
    const term = terminalRef.current;
    if (!term) return;
    const selection = term.getSelection();
    if (selection) {
      navigator.clipboard.writeText(selection).then(() => {
        haptics.click();
        setCopyFeedback('Copied to clipboard');
        setTimeout(() => setCopyFeedback(null), 2000);
      }).catch(() => {});
    }
  };

  return (
    <div className="relative flex-1 w-full h-full flex flex-col bg-black overflow-hidden select-none">
      {/* Terminal Viewport */}
      <div
        ref={containerRef}
        onContextMenu={(e) => {
          e.preventDefault();
          handleTouchHold();
        }}
        className="flex-1 w-full h-full bg-black overflow-hidden"
      />

      {/* Copy notification popup */}
      {copyFeedback && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-surfaceContainerHighest text-onSurface text-xs px-3 py-1.5 rounded-full border border-outline/30 shadow-lg z-50 animate-fade">
          {copyFeedback}
        </div>
      )}

      {/* Extra Keys Row */}
      {showExtraKeys && (
        <ExtraKeysRow
          onKeyPress={handleExtraKeyPress}
          onModifierChange={(ctrl, alt) => {
            ctrlModifierRef.current = ctrl;
            altModifierRef.current = alt;
          }}
        />
      )}
    </div>
  );
};
