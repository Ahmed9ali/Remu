import { openDB, IDBPDatabase } from 'idb';
import { FSNode, SearchMatch } from './types';

const DB_NAME = 'termux_vfs_db';
const STORE_NAME = 'nodes';
const DB_VERSION = 1;

export const HOME_DIR = '/home/ahmed';

class VirtualFileSystem {
  private dbPromise: Promise<IDBPDatabase> | null = null;
  private initialized = false;

  private async getDB(): Promise<IDBPDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const store = db.createObjectStore(STORE_NAME, { keyPath: 'path' });
            store.createIndex('type', 'type');
          }
        },
      });
    }
    return this.dbPromise;
  }

  public async init(): Promise<void> {
    if (this.initialized) return;
    const db = await this.getDB();
    const count = await db.count(STORE_NAME);

    if (count === 0) {
      await this.seedDefaultFiles();
    }
    this.initialized = true;
  }

  private async seedDefaultFiles(): Promise<void> {
    const defaultNodes: FSNode[] = [
      { path: '/', name: '', type: 'dir', size: 0, mtime: Date.now(), mode: 'drwxr-xr-x' },
      { path: '/home', name: 'home', type: 'dir', size: 0, mtime: Date.now(), mode: 'drwxr-xr-x' },
      { path: '/home/ahmed', name: 'ahmed', type: 'dir', size: 0, mtime: Date.now(), mode: 'drwxr-xr-x' },
      { path: '/home/ahmed/projects', name: 'projects', type: 'dir', size: 0, mtime: Date.now(), mode: 'drwxr-xr-x' },
      
      {
        path: '/home/ahmed/README.md',
        name: 'README.md',
        type: 'file',
        size: 890,
        mtime: Date.now(),
        mode: '-rw-r--r--',
        content: `# Termux Code ⚡

Welcome to **Termux Code**, a mobile-first developer environment bridging a full-featured terminal with a lightweight VS Code-style editor!

## 🚀 Quick Terminal Commands:
- \`code <file>\`    : Open any file in the slide-up Monaco editor
- \`code .\`         : Open editor on current directory
- \`explorer\`       : View interactive visual file manager
- \`pkg install <pkg>\`: Install tools (node, python, git)
- \`node hello.js\`  : Run JavaScript sandbox in real-time
- \`python main.py\` : Run Python 3 via Pyodide
- \`neofetch\`       : View OLED-styled system summary
- \`settings\`       : Customize seed colors, themes, font sizes & haptics

## ⌨️ Extra Keys:
Use the dedicated touch toolbar above your keyboard for ESC, TAB, CTRL, ALT, and arrow navigation!

Happy coding!
`
      },
      {
        path: '/home/ahmed/hello.js',
        name: 'hello.js',
        type: 'file',
        size: 512,
        mtime: Date.now(),
        mode: '-rw-r--r--',
        content: `// JavaScript Demo running inside Termux Code sandbox
console.log("⚡ Executing Node.js Script inside browser sandbox...");

function fibonacci(n) {
  if (n <= 1) return n;
  let a = 0, b = 1;
  for (let i = 2; i <= n; i++) {
    const c = a + b;
    a = b;
    b = c;
  }
  return b;
}

console.log("Fibonacci(10) =", fibonacci(10));
console.log("Fibonacci(20) =", fibonacci(20));

const techStack = ["Termux", "Monaco Editor", "React 19", "Material 3 Expressive"];
console.log("Active stack:", techStack.join(" • "));
`
      },
      {
        path: '/home/ahmed/main.py',
        name: 'main.py',
        type: 'file',
        size: 560,
        mtime: Date.now(),
        mode: '-rw-r--r--',
        content: `# Python 3 script running via Pyodide in Termux Code
import sys
import math

print("🐍 Python 3 execution initialized!")
print(f"Platform: {sys.platform}")

points = [math.sin(x * 0.4) for x in range(12)]
print("Trigonometric Sine Series:")
for i, val in enumerate(points):
    bar = "█" * int(abs(val) * 15)
    sign = "+" if val >= 0 else "-"
    print(f"[{i:02d}] {sign} {bar}")

print("✨ Done! Edit this file with 'code main.py'.")
`
      },
      {
        path: '/home/ahmed/package.json',
        name: 'package.json',
        type: 'file',
        size: 210,
        mtime: Date.now(),
        mode: '-rw-r--r--',
        content: `{
  "name": "my-mobile-project",
  "version": "1.0.0",
  "description": "Built inside Termux Code",
  "main": "hello.js",
  "scripts": {
    "start": "node hello.js"
  }
}
`
      },
      {
        path: '/home/ahmed/.bashrc',
        name: '.bashrc',
        type: 'file',
        size: 140,
        mtime: Date.now(),
        mode: '-rw-r--r--',
        content: `export PS1="ahmed@device:\\w$ "
alias ll="ls -la"
alias cls="clear"
`
      },
      {
        path: '/home/ahmed/projects/matrix.js',
        name: 'matrix.js',
        type: 'file',
        size: 320,
        mtime: Date.now(),
        mode: '-rw-r--r--',
        content: `// Matrix digital rain calculation
const chars = "01アイウエオカキクケコサシスセソタチツテト";
let output = "";
for (let i = 0; i < 5; i++) {
  let line = "";
  for (let j = 0; j < 30; j++) {
    line += chars[Math.floor(Math.random() * chars.length)];
  }
  output += line + "\\n";
}
console.log(output);
`
      }
    ];

    const db = await this.getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    for (const node of defaultNodes) {
      await tx.store.put(node);
    }
    await tx.done;
  }

  public resolvePath(cwd: string, target: string): string {
    if (!target) return cwd;
    let resolved = target;

    if (resolved.startsWith('~')) {
      resolved = HOME_DIR + resolved.slice(1);
    } else if (!resolved.startsWith('/')) {
      resolved = (cwd === '/' ? '' : cwd) + '/' + resolved;
    }

    const segments = resolved.split('/').filter(Boolean);
    const stack: string[] = [];

    for (const seg of segments) {
      if (seg === '.') continue;
      if (seg === '..') {
        stack.pop();
      } else {
        stack.push(seg);
      }
    }

    return '/' + stack.join('/');
  }

  public async exists(path: string): Promise<boolean> {
    const node = await this.stat(path);
    return node !== null;
  }

  public async stat(path: string): Promise<FSNode | null> {
    const norm = path === '/' ? '/' : path.replace(/\/+$/, '');
    const db = await this.getDB();
    const node = await db.get(STORE_NAME, norm);
    return node || null;
  }

  public async readFile(path: string): Promise<string> {
    const node = await this.stat(path);
    if (!node) {
      throw new Error(`No such file: ${path}`);
    }
    if (node.type === 'dir') {
      throw new Error(`Is a directory: ${path}`);
    }
    return node.content || '';
  }

  public async writeFile(path: string, content: string): Promise<void> {
    const norm = this.resolvePath('/', path);
    const parentPath = norm.substring(0, norm.lastIndexOf('/')) || '/';
    
    // Ensure parent directory exists
    const parent = await this.stat(parentPath);
    if (!parent) {
      await this.mkdir(parentPath, true);
    }

    const name = norm.substring(norm.lastIndexOf('/') + 1);
    const node: FSNode = {
      path: norm,
      name,
      type: 'file',
      content,
      size: new Blob([content]).size,
      mtime: Date.now(),
      mode: '-rw-r--r--',
    };

    const db = await this.getDB();
    await db.put(STORE_NAME, node);
  }

  public async mkdir(path: string, recursive = false): Promise<void> {
    const norm = this.resolvePath('/', path);
    if (norm === '/') return;

    const parentPath = norm.substring(0, norm.lastIndexOf('/')) || '/';
    const parent = await this.stat(parentPath);

    if (!parent) {
      if (!recursive) {
        throw new Error(`No such file or directory: ${parentPath}`);
      }
      await this.mkdir(parentPath, true);
    }

    const name = norm.substring(norm.lastIndexOf('/') + 1);
    const node: FSNode = {
      path: norm,
      name,
      type: 'dir',
      size: 0,
      mtime: Date.now(),
      mode: 'drwxr-xr-x',
    };

    const db = await this.getDB();
    await db.put(STORE_NAME, node);
  }

  public async readdir(path: string): Promise<FSNode[]> {
    const norm = path === '/' ? '/' : path.replace(/\/+$/, '');
    const node = await this.stat(norm);
    if (!node) {
      throw new Error(`No such file or directory: ${path}`);
    }
    if (node.type !== 'dir') {
      throw new Error(`Not a directory: ${path}`);
    }

    const db = await this.getDB();
    const all = await db.getAll(STORE_NAME);
    const prefix = norm === '/' ? '/' : norm + '/';

    return all.filter((n) => {
      if (n.path === norm) return false;
      if (!n.path.startsWith(prefix)) return false;
      const rest = n.path.slice(prefix.length);
      return !rest.includes('/');
    });
  }

  public async rm(path: string, recursive = false): Promise<void> {
    const norm = this.resolvePath('/', path);
    if (norm === '/' || norm === '/home' || norm === '/home/ahmed') {
      throw new Error(`Cannot remove protected system directory: ${norm}`);
    }

    const node = await this.stat(norm);
    if (!node) {
      throw new Error(`No such file or directory: ${path}`);
    }

    const db = await this.getDB();
    if (node.type === 'dir') {
      const children = await this.readdir(norm);
      if (children.length > 0 && !recursive) {
        throw new Error(`Directory not empty: ${path}`);
      }
      if (recursive) {
        const all = await db.getAll(STORE_NAME);
        const prefix = norm + '/';
        const tx = db.transaction(STORE_NAME, 'readwrite');
        for (const item of all) {
          if (item.path.startsWith(prefix) || item.path === norm) {
            await tx.store.delete(item.path);
          }
        }
        await tx.done;
        return;
      }
    }

    await db.delete(STORE_NAME, norm);
  }

  public async cp(srcPath: string, destPath: string, recursive = false): Promise<void> {
    const srcNorm = this.resolvePath('/', srcPath);
    const srcNode = await this.stat(srcNorm);
    if (!srcNode) {
      throw new Error(`cp: cannot stat '${srcPath}': No such file or directory`);
    }

    let destNorm = this.resolvePath('/', destPath);
    const destNode = await this.stat(destNorm);
    if (destNode && destNode.type === 'dir') {
      destNorm = (destNorm === '/' ? '' : destNorm) + '/' + srcNode.name;
    }

    if (srcNode.type === 'file') {
      await this.writeFile(destNorm, srcNode.content || '');
      return;
    }

    if (srcNode.type === 'dir') {
      if (!recursive) {
        throw new Error(`cp: -r not specified; omitting directory '${srcPath}'`);
      }
      await this.mkdir(destNorm, true);
      const db = await this.getDB();
      const all = await db.getAll(STORE_NAME);
      const prefix = srcNorm + '/';

      for (const item of all) {
        if (item.path.startsWith(prefix)) {
          const subPath = item.path.slice(prefix.length);
          const target = destNorm + '/' + subPath;
          if (item.type === 'dir') {
            await this.mkdir(target, true);
          } else {
            await this.writeFile(target, item.content || '');
          }
        }
      }
    }
  }

  public async mv(srcPath: string, destPath: string): Promise<void> {
    await this.cp(srcPath, destPath, true);
    await this.rm(srcPath, true);
  }

  public async tree(path: string): Promise<string> {
    const norm = this.resolvePath('/', path);
    const node = await this.stat(norm);
    if (!node) return `tree: ${path}: No such file or directory`;
    if (node.type !== 'dir') return `tree: ${path}: Not a directory`;

    const lines: string[] = [norm];

    const printTree = async (current: string, prefix: string) => {
      const items = await this.readdir(current);
      items.sort((a, b) => a.name.localeCompare(b.name));

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const isLast = i === items.length - 1;
        const branch = isLast ? '└── ' : '├── ';
        lines.push(`${prefix}${branch}${item.name}${item.type === 'dir' ? '/' : ''}`);

        if (item.type === 'dir') {
          const nextPrefix = prefix + (isLast ? '    ' : '│   ');
          await printTree(item.path, nextPrefix);
        }
      }
    };

    await printTree(norm, '');
    return lines.join('\n');
  }

  public async grep(pattern: string, path: string): Promise<SearchMatch[]> {
    const norm = this.resolvePath('/', path);
    const regex = new RegExp(pattern, 'i');
    const matches: SearchMatch[] = [];

    const db = await this.getDB();
    const all = await db.getAll(STORE_NAME);

    for (const node of all) {
      if (node.type === 'file' && (node.path === norm || node.path.startsWith(norm + '/'))) {
        const lines = (node.content || '').split('\n');
        lines.forEach((line: string, index: number) => {
          if (regex.test(line)) {
            matches.push({
              file: node.path,
              line: index + 1,
              text: line,
            });
          }
        });
      }
    }
    return matches;
  }

  public async find(path: string, query: string): Promise<string[]> {
    const norm = this.resolvePath('/', path);
    const db = await this.getDB();
    const all = await db.getAll(STORE_NAME);
    const regex = new RegExp(query.replace(/\*/g, '.*'), 'i');

    return all
      .filter((n) => (n.path === norm || n.path.startsWith(norm + '/')) && regex.test(n.name))
      .map((n) => n.path);
  }

  public async clearStorage(): Promise<void> {
    const db = await this.getDB();
    await db.clear(STORE_NAME);
    await this.seedDefaultFiles();
  }
}

export const vfs = new VirtualFileSystem();
