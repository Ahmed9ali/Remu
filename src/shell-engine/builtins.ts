import { vfs, HOME_DIR } from '../virtual-fs/fs';
import { FSNode } from '../virtual-fs/types';
import { ShellContext } from './types';
import { runJavaScript } from './nodeRunner';
import { runPython } from './pyodideRunner';

const INSTALLED_PKGS = new Set(['coreutils', 'bash', 'node', 'python', 'neofetch']);

export async function executeBuiltin(
  cmd: string,
  args: string[],
  context: ShellContext
): Promise<void> {
  switch (cmd) {
    case 'pwd': {
      context.writeOutput(context.cwd + '\r\n');
      break;
    }

    case 'cd': {
      const target = args[0] || '~';
      const resolved = vfs.resolvePath(context.cwd, target);
      const node = await vfs.stat(resolved);
      if (!node) {
        context.writeError(`cd: no such file or directory: ${target}\r\n`);
        return;
      }
      if (node.type !== 'dir') {
        context.writeError(`cd: not a directory: ${target}\r\n`);
        return;
      }
      context.setCwd(resolved);
      break;
    }

    case 'ls': {
      let showAll = false;
      let longFormat = false;
      const targets: string[] = [];

      for (const arg of args) {
        if (arg.startsWith('-')) {
          if (arg.includes('a')) showAll = true;
          if (arg.includes('l')) longFormat = true;
        } else {
          targets.push(arg);
        }
      }

      const targetPath = targets[0] ? vfs.resolvePath(context.cwd, targets[0]) : context.cwd;
      const stat = await vfs.stat(targetPath);
      if (!stat) {
        context.writeError(`ls: cannot access '${targets[0]}': No such file or directory\r\n`);
        return;
      }

      if (stat.type === 'file') {
        context.writeOutput(`${stat.name}\r\n`);
        return;
      }

      let entries = await vfs.readdir(targetPath);
      if (!showAll) {
        entries = entries.filter((e) => !e.name.startsWith('.'));
      }
      entries.sort((a, b) => a.name.localeCompare(b.name));

      if (longFormat) {
        let total = entries.reduce((acc, curr) => acc + curr.size, 0);
        context.writeOutput(`total ${Math.ceil(total / 1024)}K\r\n`);
        for (const entry of entries) {
          const d = new Date(entry.mtime);
          const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }) + ' ' +
                          d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
          const colorName = entry.type === 'dir'
            ? `\x1b[1;34m${entry.name}/\x1b[0m`
            : entry.name.endsWith('.js') || entry.name.endsWith('.ts')
            ? `\x1b[33m${entry.name}\x1b[0m`
            : entry.name.endsWith('.py')
            ? `\x1b[32m${entry.name}\x1b[0m`
            : entry.name.endsWith('.json') || entry.name.endsWith('.md')
            ? `\x1b[36m${entry.name}\x1b[0m`
            : entry.name;

          context.writeOutput(
            `${entry.mode || (entry.type === 'dir' ? 'drwxr-xr-x' : '-rw-r--r--')} 1 ahmed ahmed ${String(entry.size).padStart(6, ' ')} ${dateStr} ${colorName}\r\n`
          );
        }
      } else {
        const rendered = entries.map((entry) => {
          if (entry.type === 'dir') {
            return `\x1b[1;34m${entry.name}/\x1b[0m`;
          }
          if (entry.name.endsWith('.js') || entry.name.endsWith('.ts')) {
            return `\x1b[33m${entry.name}\x1b[0m`;
          }
          if (entry.name.endsWith('.py')) {
            return `\x1b[32m${entry.name}\x1b[0m`;
          }
          return entry.name;
        });
        if (rendered.length > 0) {
          context.writeOutput(rendered.join('  ') + '\r\n');
        }
      }
      break;
    }

    case 'mkdir': {
      let recursive = false;
      const paths: string[] = [];
      for (const arg of args) {
        if (arg === '-p') recursive = true;
        else paths.push(arg);
      }
      if (paths.length === 0) {
        context.writeError('mkdir: missing operand\r\n');
        return;
      }
      for (const p of paths) {
        try {
          const target = vfs.resolvePath(context.cwd, p);
          await vfs.mkdir(target, recursive);
        } catch (err: any) {
          context.writeError(`mkdir: ${err.message}\r\n`);
        }
      }
      break;
    }

    case 'touch': {
      if (args.length === 0) {
        context.writeError('touch: missing file operand\r\n');
        return;
      }
      for (const p of args) {
        const target = vfs.resolvePath(context.cwd, p);
        const existing = await vfs.stat(target);
        if (existing) {
          existing.mtime = Date.now();
          await vfs.writeFile(target, existing.content || '');
        } else {
          await vfs.writeFile(target, '');
        }
      }
      break;
    }

    case 'rm': {
      let recursive = false;
      let force = false;
      const paths: string[] = [];
      for (const arg of args) {
        if (arg.startsWith('-')) {
          if (arg.includes('r') || arg.includes('R')) recursive = true;
          if (arg.includes('f')) force = true;
        } else {
          paths.push(arg);
        }
      }
      if (paths.length === 0) {
        if (!force) context.writeError('rm: missing operand\r\n');
        return;
      }
      for (const p of paths) {
        try {
          const target = vfs.resolvePath(context.cwd, p);
          await vfs.rm(target, recursive);
        } catch (err: any) {
          if (!force) context.writeError(`rm: ${err.message}\r\n`);
        }
      }
      break;
    }

    case 'cp': {
      let recursive = false;
      const paths: string[] = [];
      for (const arg of args) {
        if (arg.startsWith('-') && (arg.includes('r') || arg.includes('R'))) {
          recursive = true;
        } else {
          paths.push(arg);
        }
      }
      if (paths.length < 2) {
        context.writeError('cp: missing destination file operand after source\r\n');
        return;
      }
      try {
        const src = vfs.resolvePath(context.cwd, paths[0]);
        const dest = vfs.resolvePath(context.cwd, paths[1]);
        await vfs.cp(src, dest, recursive);
      } catch (err: any) {
        context.writeError(`${err.message}\r\n`);
      }
      break;
    }

    case 'mv': {
      if (args.length < 2) {
        context.writeError('mv: missing destination file operand\r\n');
        return;
      }
      try {
        const src = vfs.resolvePath(context.cwd, args[0]);
        const dest = vfs.resolvePath(context.cwd, args[1]);
        await vfs.mv(src, dest);
      } catch (err: any) {
        context.writeError(`mv: ${err.message}\r\n`);
      }
      break;
    }

    case 'cat': {
      if (args.length === 0) {
        context.writeError('cat: missing operand\r\n');
        return;
      }
      for (const p of args) {
        try {
          const target = vfs.resolvePath(context.cwd, p);
          const content = await vfs.readFile(target);
          context.writeOutput(content.replace(/\n/g, '\r\n') + (content.endsWith('\n') ? '' : '\r\n'));
        } catch (err: any) {
          context.writeError(`cat: ${err.message}\r\n`);
        }
      }
      break;
    }

    case 'echo': {
      const text = args.join(' ');
      context.writeOutput(text + '\r\n');
      break;
    }

    case 'clear': {
      context.clearTerminal();
      break;
    }

    case 'tree': {
      const target = args[0] ? vfs.resolvePath(context.cwd, args[0]) : context.cwd;
      const treeStr = await vfs.tree(target);
      context.writeOutput(treeStr.replace(/\n/g, '\r\n') + '\r\n');
      break;
    }

    case 'grep': {
      if (args.length < 2) {
        context.writeError('grep: usage: grep <pattern> <file_or_dir>\r\n');
        return;
      }
      const pattern = args[0];
      const target = vfs.resolvePath(context.cwd, args[1]);
      const matches = await vfs.grep(pattern, target);
      if (matches.length === 0) {
        // no output like real grep
        return;
      }
      for (const m of matches) {
        context.writeOutput(`\x1b[35m${m.file}\x1b[0m:\x1b[32m${m.line}\x1b[0m: ${m.text}\r\n`);
      }
      break;
    }

    case 'find': {
      const target = args[0] && !args[0].startsWith('-') ? vfs.resolvePath(context.cwd, args[0]) : context.cwd;
      let query = '*';
      for (let i = 0; i < args.length; i++) {
        if (args[i] === '-name' && args[i + 1]) {
          query = args[i + 1];
        }
      }
      const results = await vfs.find(target, query);
      for (const r of results) {
        context.writeOutput(r + '\r\n');
      }
      break;
    }

    case 'code': {
      if (!args[0] || args[0] === '.') {
        context.openEditor();
      } else {
        const target = vfs.resolvePath(context.cwd, args[0]);
        const exists = await vfs.exists(target);
        if (!exists) {
          // create new file on demand
          await vfs.writeFile(target, '');
        }
        context.openEditor(target);
      }
      break;
    }

    case 'explorer': {
      context.openExplorer();
      break;
    }

    case 'settings': {
      context.openSettings();
      break;
    }

    case 'pkg': {
      const sub = args[0];
      if (sub === 'install') {
        const pkgName = args[1];
        if (!pkgName) {
          context.writeError('pkg: missing package name. Example: pkg install python\r\n');
          return;
        }
        context.writeOutput(`\x1b[36mChecking availability of ${pkgName} in termux repository...\x1b[0m\r\n`);
        await new Promise((r) => setTimeout(r, 400));
        context.writeOutput(`Get:1 https://termux.net/main ${pkgName} [${Math.floor(Math.random() * 8 + 2)}MB]\r\n`);
        context.writeOutput(`Unpacking ${pkgName} ...\r\n`);
        
        // Progress animation
        for (let pct = 0; pct <= 100; pct += 25) {
          const filled = Math.floor(pct / 5);
          const bar = '█'.repeat(filled) + '-'.repeat(20 - filled);
          context.writeOutput(`\rProgress: [${bar}] ${pct}%`);
          await new Promise((r) => setTimeout(r, 120));
        }
        INSTALLED_PKGS.add(pkgName);
        context.writeOutput(`\r\n\x1b[32mSetting up ${pkgName} ... Success!\x1b[0m\r\n`);
      } else if (sub === 'list') {
        context.writeOutput(`Installed packages:\r\n  ` + Array.from(INSTALLED_PKGS).join(', ') + '\r\n');
      } else {
        context.writeOutput('Usage: pkg install <package> | pkg list\r\nAvailable: node, python, git, rust, curl, htop, clang\r\n');
      }
      break;
    }

    case 'node': {
      if (args.length === 0) {
        context.writeOutput('Welcome to Node.js v22.14.0 sandboxed REPL.\r\nType "node <filename.js>" to run a script.\r\n');
        return;
      }
      const filename = args[0];
      const target = vfs.resolvePath(context.cwd, filename);
      const exists = await vfs.exists(target);
      if (!exists) {
        context.writeError(`node: Cannot find module '${filename}'\r\n`);
        return;
      }
      const script = await vfs.readFile(target);
      context.writeOutput(`\x1b[90m[Running ${filename} via Node sandboxed worker...]\x1b[0m\r\n`);
      const output = await runJavaScript(script, args.slice(1));
      if (output) {
        context.writeOutput(output + '\r\n');
      }
      break;
    }

    case 'python':
    case 'python3': {
      if (args.length === 0) {
        context.writeOutput('Python 3.12 (Termux Code Pyodide)\r\nType "python <filename.py>" to execute.\r\n');
        return;
      }
      const filename = args[0];
      const target = vfs.resolvePath(context.cwd, filename);
      const exists = await vfs.exists(target);
      if (!exists) {
        context.writeError(`python: can't open file '${filename}': [Errno 2] No such file or directory\r\n`);
        return;
      }
      const script = await vfs.readFile(target);
      const output = await runPython(script, (msg) => context.writeOutput(msg));
      if (output) {
        context.writeOutput(output + '\r\n');
      }
      break;
    }

    case 'neofetch': {
      const art = [
        `\x1b[1;32m      ___          \x1b[1;36mahmed@device\x1b[0m`,
        `\x1b[1;32m     /   \\         \x1b[90m------------\x1b[0m`,
        `\x1b[1;32m    |     |        \x1b[1;37mOS\x1b[0m: Termux Code (Linux 6.6.0 Android OLED)`,
        `\x1b[1;32m    |  _  |        \x1b[1;37mHost\x1b[0m: Mobile Virtual Terminal`,
        `\x1b[1;32m    | | | |        \x1b[1;37mKernel\x1b[0m: WebAssembly / VFS`,
        `\x1b[1;32m    | |_| |        \x1b[1;37mShell\x1b[0m: bash (Termux Engine v1.0)`,
        `\x1b[1;32m    |     |        \x1b[1;37mEditor\x1b[0m: Monaco Code Sheet`,
        `\x1b[1;32m     \\___/         \x1b[1;37mTerminal\x1b[0m: xterm.js 5.5 + JetBrains Mono`,
        `\x1b[1;32m   /       \\       \x1b[1;37mCPU\x1b[0m: Octa-core ARMv9 / V8 Engine`,
        `\x1b[1;32m  |  /\\ /\\  |      \x1b[1;37mMemory\x1b[0m: 142MB / IndexedDB 2.0GB`,
        `\x1b[1;32m  |         |      \x1b[1;37mTheme\x1b[0m: AMOLED Material 3 Expressive`,
        `\x1b[1;32m   \\_______/       `,
        `                   \x1b[40m   \x1b[41m   \x1b[42m   \x1b[43m   \x1b[44m   \x1b[45m   \x1b[46m   \x1b[47m   \x1b[0m`,
      ];
      context.writeOutput(art.join('\r\n') + '\r\n');
      break;
    }

    case 'help': {
      const helpText = `
\x1b[1;36mTermux Code Commands\x1b[0m
  \x1b[32mcode <file>\x1b[0m      Open file in sliding Monaco editor
  \x1b[32mcode .\x1b[0m           Open workspace editor
  \x1b[32mexplorer\x1b[0m         Show visual interactive file tree
  \x1b[32mnode <file.js>\x1b[0m   Run JavaScript in sandboxed worker
  \x1b[32mpython <file.py>\x1b[0m Run Python 3 via Pyodide WebAssembly
  \x1b[32mpkg install <p>\x1b[0m  Simulate tool installation
  \x1b[32mneofetch\x1b[0m         Show device & system information
  \x1b[32msettings\x1b[0m         Open theme & configuration sheet
  \x1b[33mls, cd, pwd, mkdir, touch, rm, cp, mv, cat, echo, clear, grep, find, tree, history\x1b[0m

\x1b[1;36mNavigation & Keyboard\x1b[0m
  - \x1b[35mExtra Keys\x1b[0m: ESC, TAB (completion), CTRL, ALT, Arrow keys, |, /, ~, -
  - \x1b[35mCtrl+C\x1b[0m    : Interrupt line / cancel command
  - \x1b[35mCtrl+L\x1b[0m    : Clear terminal screen
  - \x1b[35mUp / Down\x1b[0m : Browse command history
`;
      context.writeOutput(helpText.replace(/\n/g, '\r\n') + '\r\n');
      break;
    }

    default: {
      context.writeError(`bash: ${cmd}: command not found. Type 'help' for commands.\r\n`);
      break;
    }
  }
}
