export interface ShellContext {
  cwd: string;
  setCwd: (path: string) => void;
  env: Record<string, string>;
  openEditor: (filepath?: string) => void;
  openExplorer: () => void;
  openSettings: () => void;
  writeOutput: (text: string) => void;
  writeError: (text: string) => void;
  clearTerminal: () => void;
}

export interface CommandResult {
  code: number;
  stdout?: string;
  stderr?: string;
}
