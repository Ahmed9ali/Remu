import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  Plus,
  Trash2,
  X,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  FolderPlus,
  FilePlus,
  Download,
} from 'lucide-react';
import { vfs, HOME_DIR } from '../virtual-fs/fs';
import { FSNode } from '../virtual-fs/types';
import { haptics } from '../haptics/haptics';

interface ExplorerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFile: (filepath: string) => void;
}

export const ExplorerDrawer: React.FC<ExplorerDrawerProps> = ({
  isOpen,
  onClose,
  onOpenFile,
}) => {
  const [nodes, setNodes] = useState<FSNode[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set([HOME_DIR]));
  const [newItemModal, setNewItemModal] = useState<{
    open: boolean;
    parentDir: string;
    type: 'file' | 'dir';
  }>({ open: false, parentDir: HOME_DIR, type: 'file' });
  const [newItemName, setNewItemName] = useState('');

  const loadTree = async () => {
    try {
      const homeNodes = await vfs.readdir(HOME_DIR);
      setNodes(homeNodes);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadTree();
    }
  }, [isOpen]);

  const toggleFolder = (path: string) => {
    haptics.key();
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const handleCreateItem = async () => {
    if (!newItemName.trim()) return;
    haptics.click();
    const fullPath = vfs.resolvePath(newItemModal.parentDir, newItemName.trim());

    if (newItemModal.type === 'file') {
      await vfs.writeFile(fullPath, '');
      onOpenFile(fullPath);
    } else {
      await vfs.mkdir(fullPath, true);
    }

    setNewItemModal({ open: false, parentDir: HOME_DIR, type: 'file' });
    setNewItemName('');
    loadTree();
  };

  const handleDelete = async (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    haptics.click();
    if (confirm(`Delete ${path}?`)) {
      await vfs.rm(path, true);
      loadTree();
    }
  };

  const handleDownload = async (e: React.MouseEvent, node: FSNode) => {
    e.stopPropagation();
    haptics.click();
    const content = await vfs.readFile(node.path);

    // Call native Android bridge if available, else browser blob download
    if (window.AndroidBridge?.downloadFile) {
      window.AndroidBridge.downloadFile(node.name, content);
      return;
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = node.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-start select-none"
        >
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="w-full max-w-xs h-full bg-[#0a0d14] border-r border-[#1c2436] flex flex-col pt-safe pb-safe shadow-2xl"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-[#1c2436] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderOpen className="text-cyan-400" size={18} />
                <h3 className="font-semibold text-sm text-slate-100">Explorer</h3>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() =>
                    setNewItemModal({ open: true, parentDir: HOME_DIR, type: 'file' })
                  }
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 active:scale-95"
                  title="New File"
                >
                  <FilePlus size={16} />
                </button>
                <button
                  onClick={() =>
                    setNewItemModal({ open: true, parentDir: HOME_DIR, type: 'dir' })
                  }
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 active:scale-95"
                  title="New Folder"
                >
                  <FolderPlus size={16} />
                </button>
                <button
                  onClick={loadTree}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 active:scale-95"
                  title="Refresh"
                >
                  <RefreshCw size={15} />
                </button>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 active:scale-95"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Path indicator */}
            <div className="px-4 py-1.5 bg-[#0f1420] text-[11px] font-mono text-slate-400 border-b border-[#182030]">
              ~/
            </div>

            {/* Tree listing */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {nodes.map((node) => {
                const isDir = node.type === 'dir';
                const isExpanded = expandedFolders.has(node.path);

                return (
                  <div
                    key={node.path}
                    onClick={() => {
                      if (isDir) {
                        toggleFolder(node.path);
                      } else {
                        haptics.click();
                        onOpenFile(node.path);
                        onClose();
                      }
                    }}
                    className="flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-[#141b2b] text-xs font-mono cursor-pointer group transition-colors"
                  >
                    <div className="flex items-center gap-2 truncate">
                      {isDir ? (
                        <>
                          {isExpanded ? (
                            <ChevronDown size={14} className="text-slate-500 shrink-0" />
                          ) : (
                            <ChevronRight size={14} className="text-slate-500 shrink-0" />
                          )}
                          <Folder size={16} className="text-cyan-400 shrink-0" />
                        </>
                      ) : (
                        <>
                          <span className="w-3.5" />
                          <FileCode size={16} className="text-slate-400 shrink-0" />
                        </>
                      )}
                      <span className="text-slate-200 truncate">{node.name}</span>
                    </div>

                    {/* Quick actions on hover / tap */}
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                      {!isDir && (
                        <button
                          onClick={(e) => handleDownload(e, node)}
                          className="p-1 text-slate-500 hover:text-cyan-400 rounded"
                          title="Export / Download"
                        >
                          <Download size={13} />
                        </button>
                      )}
                      <button
                        onClick={(e) => handleDelete(e, node.path)}
                        className="p-1 text-slate-500 hover:text-red-400 rounded"
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Create Item Dialog Modal */}
            {newItemModal.open && (
              <div className="p-3 bg-[#131926] border-t border-[#20293d] flex flex-col gap-2">
                <span className="text-xs font-medium text-slate-300">
                  New {newItemModal.type === 'file' ? 'File' : 'Directory'} in ~/
                </span>
                <input
                  type="text"
                  autoFocus
                  placeholder={newItemModal.type === 'file' ? 'script.js' : 'src'}
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateItem()}
                  className="bg-black border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setNewItemModal({ ...newItemModal, open: false })}
                    className="px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateItem}
                    className="px-3 py-1 bg-primary text-black font-semibold text-xs rounded-lg active:scale-95"
                  >
                    Create
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
