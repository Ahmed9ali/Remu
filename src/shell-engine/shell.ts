import { vfs, HOME_DIR } from '../virtual-fs/fs';
import { executeBuiltin } from './builtins';
import { ShellContext } from './types';

export class ShellEngine {
  private history: string[] = [];
  private historyIndex = -1;
  private cwd = HOME_DIR;
  private commandList = [
    'ls', 'cd', 'pwd', 'mkdir', 'touch', 'rm', 'cp', 'mv', 'cat', 'echo',
    'clear', 'grep', 'find', 'tree', 'history', 'help', 'neofetch',
    'code', 'explorer', 'pkg', 'node', 'python', 'settings'
  ];

  public getCwd(): string {
    return this.cwd;
  }

  public setCwd(newCwd: string): void {
    this.cwd = newCwd;
  }

  public getPrompt(): string {
    let displayPath = this.cwd;
    if (displayPath.startsWith(HOME_DIR)) {
      displayPath = '~' + displayPath.slice(HOME_DIR.length);
    }
    return `\x1b[1;32mahmed@device\x1b[0m:\x1b[1;34m${displayPath}\x1b[0m$ `;
  }

  public getPromptPlain(): string {
    let displayPath = this.cwd;
    if (displayPath.startsWith(HOME_DIR)) {
      displayPath = '~' + displayPath.slice(HOME_DIR.length);
    }
    return `ahmed@device:${displayPath}$ `;
  }

  public addHistory(cmd: string): void {
    const trimmed = cmd.trim();
    if (trimmed && (this.history.length === 0 || this.history[this.history.length - 1] !== trimmed)) {
      this.history.push(trimmed);
    }
    this.historyIndex = this.history.length;
  }

  public historyPrev(): string | null {
    if (this.history.length === 0) return null;
    if (this.historyIndex > 0) {
      this.historyIndex--;
      return this.history[this.historyIndex];
    } else if (this.historyIndex === 0) {
      return this.history[0];
    }
    return null;
  }

  public historyNext(): string | null {
    if (this.history.length === 0) return null;
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      return this.history[this.historyIndex];
    } else {
      this.historyIndex = this.history.length;
      return '';
    }
  }

  public getHistory(): string[] {
    return [...this.history];
  }

  public async getCompletions(currentLine: string): Promise<string[]> {
    const tokens = currentLine.trimStart().split(/\s+/);
    if (tokens.length <= 1) {
      // Complete command
      const prefix = tokens[0] || '';
      return this.commandList.filter((c) => c.startsWith(prefix));
    }

    // Complete file or folder path for argument
    const lastToken = tokens[tokens.length - 1] || '';
    const lastSlash = lastToken.lastIndexOf('/');
    let searchDir = this.cwd;
    let filePrefix = lastToken;

    if (lastSlash !== -1) {
      const dirPart = lastToken.substring(0, lastSlash);
      filePrefix = lastToken.substring(lastSlash + 1);
      searchDir = vfs.resolvePath(this.cwd, dirPart || '/');
    }

    try {
      const entries = await vfs.readdir(searchDir);
      return entries
        .filter((e) => e.name.startsWith(filePrefix))
        .map((e) => (lastSlash !== -1 ? lastToken.substring(0, lastSlash + 1) : '') + e.name + (e.type === 'dir' ? '/' : ''));
    } catch {
      return [];
    }
  }

  // Tokenize preserving quotes
  private tokenize(line: string): string[] {
    const tokens: string[] = [];
    let current = '';
    let inSingle = false;
    let inDouble = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === "'" && !inDouble) {
        inSingle = !inSingle;
      } else if (ch === '"' && !inSingle) {
        inDouble = !inDouble;
      } else if ((ch === ' ' || ch === '\t') && !inSingle && !inDouble) {
        if (current.length > 0) {
          tokens.push(current);
          current = '';
        }
      } else {
        current += ch;
      }
    }
    if (current.length > 0) {
      tokens.push(current);
    }
    return tokens;
  }

  public async execute(rawLine: string, context: ShellContext): Promise<void> {
    const line = rawLine.trim();
    if (!line) return;

    this.addHistory(line);

    // Check for redirection: > or >>
    let redirectMode: 'none' | 'overwrite' | 'append' = 'none';
    let redirectFile = '';
    let cmdPart = line;

    const appendIdx = line.indexOf('>>');
    const overwriteIdx = line.indexOf('>');

    if (appendIdx !== -1) {
      redirectMode = 'append';
      redirectFile = line.substring(appendIdx + 2).trim();
      cmdPart = line.substring(0, appendIdx).trim();
    } else if (overwriteIdx !== -1) {
      redirectMode = 'overwrite';
      redirectFile = line.substring(overwriteIdx + 1).trim();
      cmdPart = line.substring(0, overwriteIdx).trim();
    }

    const tokens = this.tokenize(cmdPart);
    if (tokens.length === 0) return;

    const cmd = tokens[0];
    const args = tokens.slice(1);

    if (cmd === 'history') {
      this.history.forEach((h, i) => {
        context.writeOutput(`  ${i + 1}  ${h}\r\n`);
      });
      return;
    }

    if (redirectMode !== 'none' && redirectFile) {
      let captured = '';
      const customContext: ShellContext = {
        ...context,
        writeOutput: (text) => { captured += text; },
        writeError: (text) => { context.writeError(text); },
      };

      await executeBuiltin(cmd, args, customContext);

      try {
        const target = vfs.resolvePath(this.cwd, redirectFile);
        let finalContent = captured.replace(/\r\n/g, '\n');
        if (redirectMode === 'append') {
          const prev = (await vfs.exists(target)) ? await vfs.readFile(target) : '';
          finalContent = prev + finalContent;
        }
        await vfs.writeFile(target, finalContent);
      } catch (err: any) {
        context.writeError(`bash: ${redirectFile}: ${err.message}\r\n`);
      }
      return;
    }

    await executeBuiltin(cmd, args, {
      ...context,
      cwd: this.cwd,
      setCwd: (p) => {
        this.cwd = p;
        context.setCwd(p);
      },
    });
  }
}
