# Termux Code ⚡

**Termux Code** is a mobile-first developer environment bridging a full-featured, OLED-friendly Termux-style terminal with a lightweight slide-up VS Code-style editor powered by Monaco and Material 3 Expressive design.

---

## 🌟 Core Features

### 1. Terminal (Pure Black OLED Interface)
- **Engine**: Powered by `@xterm/xterm` (v5.5) with `FitAddon` and `WebLinksAddon`.
- **Aesthetics**: True pure black background (`#000000`), zero distractions, clean responsive viewport.
- **Typography**: Monospace `JetBrains Mono` font with customizable font sizes (11px – 22px).
- **Prompt**: Informative shell prompt `ahmed@device:~$` reflecting current virtual path.
- **Interactivity**:
  - Full command history navigation (`Up` / `Down` arrows)
  - Intelligent tab completion for commands and file/directory paths
  - `Ctrl+C` interrupt and `Ctrl+L` screen clear
  - Mobile touch copy/paste via long-press

### 2. Extra Keys Touch Row
Dedicated slim touch bar positioned right above the mobile keyboard:
- `ESC`, `TAB`, `CTRL` (lockable toggle), `ALT` (lockable toggle)
- Directional arrow keys (`▲`, `▼`, `◀`, `▶`)
- Quick developer punctuation: `|`, `/`, `~`, `-`
- Real-time tactile haptic feedback on every tap

### 3. Shell Engine & Virtual Filesystem
Built over a persistent IndexedDB virtual filesystem (`vfs`):
- **Core Utilities**: `ls` (`-a`, `-l`), `cd`, `pwd`, `mkdir` (`-p`), `touch`, `rm` (`-r`, `-f`), `cp`, `mv`, `cat`, `echo` (with `>` and `>>` output redirection), `clear`, `grep`, `find`, `tree`, `history`, `help`, `neofetch`.
- **Package Manager**: `pkg install <pkg>` simulating realistic installations (node, python, git, rust, curl, htop, clang).
- **Code Execution**:
  - `node script.js`: Runs JavaScript inside a sandboxed Web Worker with intercepted `console.log` and error stack traces.
  - `python script.py`: Runs real Python 3 WebAssembly scripts via **Pyodide** with standard output capture.
- **On-Demand Launchers**:
  - `code <file>`: Slide up Monaco Editor directly on target file.
  - `code .`: Open Monaco Editor workspace.
  - `explorer`: Launch interactive visual file manager.
  - `settings`: Open Material 3 Expressive preferences.

### 4. Monaco Editor Sheet (Slides Up with Spring Motion)
- Full-screen sheet with spring-based motion physics (powered by `motion`).
- Swipe down or tap back to return to the terminal.
- Syntax highlighting for JavaScript, TypeScript, Python, JSON, HTML, CSS, Markdown, Shell, C, Rust.
- Multi-file tabs row automatically shown when two or more files are open.
- Command palette trigger (`Ctrl+Shift+P`), Find/Replace, and Minimap toggle.
- Bottom status bar displaying Line/Column, UTF-8 encoding, language mode, and auto-save indicator.
- One-tap **Run** button to execute scripts directly.

### 5. Inline Gemini AI Assistant
- Integrated with Gemini API (`gemini-3.5-flash`).
- **Code Explanation**: Breaks down logic and algorithms.
- **Bug Detection & Fix**: Detects syntax errors, uncaught exceptions, and provides drop-in fixes.
- **Refactoring & Optimization**: Improves idiomatic patterns and performance.
- One-tap **Apply to Editor** button.

### 6. Material 3 Expressive Design System
- **Tonal Palette Generation**: Dynamic color roles (`primary`, `secondary`, `tertiary`, `surface-container`, etc.) generated algorithmically from any seed color.
- **Themes**: AMOLED Pure Black, Slate Dark, and Solar Light.
- **Expressive Components**: Floating toolbar, spring-animated switches, value-pin sliders, shape-morphing buttons (circles to squircles on tap), and custom loading indicators.
- **Haptic Engine**: Tactile vibration feedback utilizing Android native bridge and Web Vibration API.

---

## 📂 Project Architecture

```
termux-code/
├── app/                        # Android container module
│   ├── src/main/java/com/example/MainActivity.kt  # Compose Edge-to-Edge WebView & AndroidBridge
│   ├── src/main/assets/web/    # Bundled production PWA assets
│   └── src/main/res/           # Android adaptive icons, themes & strings
├── src/
│   ├── terminal/               # xterm.js view, ExtraKeysRow, keyboard handlers
│   ├── editor/                 # Monaco Editor sheet, Gemini assistant, tabs & status bar
│   ├── shell-engine/           # Command parser, builtins, node & pyodide runners
│   ├── virtual-fs/             # IndexedDB-backed virtual filesystem (vfs)
│   ├── ui/                     # M3 Expressive components, FloatingToolbar, Explorer, Settings
│   ├── theme/                  # M3 tokens, tonal palette generator, ThemeProvider
│   ├── haptics/                # Native Android & Web haptic feedback bridge
│   ├── App.tsx                 # Main application coordinator
│   └── main.tsx                # React 19 entry point
├── public/
│   ├── manifest.json           # PWA standalone manifest
│   ├── sw.js                   # Offline caching service worker
│   └── favicon.svg             # Vector app icon
├── vite.config.ts              # Vite configuration bundling to Android assets
└── package.json                # Project dependencies (React 19, TypeScript, Tailwind v4)
```

---

## 🚀 Getting Started

1. Open the app to land directly in the pure-black terminal.
2. Type `ls` to view the starter files (`README.md`, `hello.js`, `main.py`).
3. Run `node hello.js` or `python main.py` to see code execution.
4. Type `code hello.js` to slide up the Monaco editor.
5. Tap the **Sparkles** icon to invoke the Gemini AI assistant.
