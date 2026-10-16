import React, { useEffect, useState, useMemo, useRef } from 'react';
import { vfs } from './virtual-fs/fs';
import { ShellEngine } from './shell-engine/shell';
import { TerminalView } from './terminal/TerminalView';
import { EditorSheet } from './editor/EditorSheet';
import { ExplorerDrawer } from './ui/ExplorerDrawer';
import { SettingsSheet } from './ui/SettingsSheet';
import { FloatingToolbar } from './ui/FloatingToolbar';
import { haptics } from './haptics/haptics';

export function App() {
  const [fsReady, setFsReady] = useState(false);
  const shellEngine = useMemo(() => new ShellEngine(), []);

  const [editorState, setEditorState] = useState<{
    open: boolean;
    filePath?: string;
  }>({ open: false });

  const [explorerOpen, setExplorerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Initialize VFS on launch
  useEffect(() => {
    vfs.init().then(() => {
      setFsReady(true);
    });

    const handleAndroidBack = () => {
      if (editorState.open) {
        setEditorState({ open: false });
      } else if (explorerOpen) {
        setExplorerOpen(false);
      } else if (settingsOpen) {
        setSettingsOpen(false);
      }
    };

    window.addEventListener('android-back', handleAndroidBack);
    return () => window.removeEventListener('android-back', handleAndroidBack);
  }, [editorState.open, explorerOpen, settingsOpen]);

  // Sync open sheet status to Android bridge for BackHandler
  useEffect(() => {
    const isAnySheetOpen = editorState.open || explorerOpen || settingsOpen;
    window.AndroidBridge?.onEditorStateChange?.(isAnySheetOpen);
  }, [editorState.open, explorerOpen, settingsOpen]);

  const handleOpenEditor = (filePath?: string) => {
    haptics.click();
    setEditorState({ open: true, filePath });
  };

  const handleOpenExplorer = () => {
    haptics.click();
    setExplorerOpen(true);
  };

  const handleOpenSettings = () => {
    haptics.click();
    setSettingsOpen(true);
  };

  const handleRunFileFromEditor = async (filePath: string) => {
    haptics.click();
    // Execute command in shell engine (e.g. node script.js or python script.py)
    const ext = filePath.substring(filePath.lastIndexOf('.'));
    const runner = ext === '.py' ? 'python' : 'node';
    const relativePath = filePath.replace(shellEngine.getCwd() + '/', '');

    // Focus terminal and dispatch
    const cmd = `${runner} ${relativePath}`;
    // Dispatch through shell engine
    const event = new CustomEvent('termux-run-cmd', { detail: cmd });
    window.dispatchEvent(event);
  };

  const handleQuickNewFile = async () => {
    haptics.click();
    const filename = `new_${Date.now().toString().slice(-4)}.js`;
    const fullPath = `${shellEngine.getCwd()}/${filename}`;
    await vfs.writeFile(fullPath, '// New script created in Termux Code\nconsole.log("Hello from Termux Code!");\n');
    handleOpenEditor(fullPath);
  };

  if (!fsReady) {
    return (
      <div className="w-full h-full bg-black flex flex-col items-center justify-center text-slate-400 font-mono text-xs gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <span>Initializing Termux Virtual Filesystem...</span>
      </div>
    );
  }

  return (
    <main className="relative w-full h-[100dvh] flex flex-col bg-black overflow-hidden select-none">
      {/* Full-screen Pure-Black Terminal (OLED friendly) */}
      <TerminalView
        shellEngine={shellEngine}
        onOpenEditor={handleOpenEditor}
        onOpenExplorer={handleOpenExplorer}
        onOpenSettings={handleOpenSettings}
      />

      {/* Floating Toolbar (M3 Expressive quick launcher) */}
      <FloatingToolbar
        onOpenEditor={() => handleOpenEditor()}
        onOpenExplorer={handleOpenExplorer}
        onOpenSettings={handleOpenSettings}
        onQuickNewFile={handleQuickNewFile}
        onClearTerminal={() => {
          // Trigger clear terminal
          window.dispatchEvent(new CustomEvent('termux-clear'));
        }}
      />

      {/* Slide-Up Monaco Editor Sheet */}
      <EditorSheet
        isOpen={editorState.open}
        onClose={() => setEditorState({ open: false })}
        initialFilePath={editorState.filePath}
        onRunFile={handleRunFileFromEditor}
        onOpenExplorer={handleOpenExplorer}
      />

      {/* Visual File Explorer Drawer */}
      <ExplorerDrawer
        isOpen={explorerOpen}
        onClose={() => setExplorerOpen(false)}
        onOpenFile={(path) => handleOpenEditor(path)}
      />

      {/* Settings Bottom Sheet */}
      <SettingsSheet
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onResetCompleted={() => {
          // Reload page to reset states
          window.location.reload();
        }}
      />
    </main>
  );
}
export default App;
