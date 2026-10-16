// Python 3 runner powered by Pyodide

declare global {
  interface Window {
    loadPyodide?: (config: { indexURL: string }) => Promise<any>;
    pyodideInstance?: any;
  }
}

let pyodideLoadingPromise: Promise<any> | null = null;

export async function getPyodide(onProgress?: (msg: string) => void): Promise<any> {
  if (window.pyodideInstance) {
    return window.pyodideInstance;
  }

  if (pyodideLoadingPromise) {
    return pyodideLoadingPromise;
  }

  pyodideLoadingPromise = (async () => {
    onProgress?.('\x1b[36m[*] Fetching Pyodide Python 3 runtime...\x1b[0m\r\n');

    if (!window.loadPyodide) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Pyodide script from CDN'));
        document.head.appendChild(script);
      });
    }

    onProgress?.('\x1b[36m[*] Initializing Python WebAssembly environment...\x1b[0m\r\n');
    const pyodide = await window.loadPyodide!({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/',
    });

    window.pyodideInstance = pyodide;
    onProgress?.('\x1b[32m[+] Python 3.12 ready.\x1b[0m\r\n');
    return pyodide;
  })();

  return pyodideLoadingPromise;
}

export async function runPython(
  code: string,
  onProgress?: (msg: string) => void
): Promise<string> {
  try {
    const pyodide = await getPyodide(onProgress);

    // Setup stdout and stderr capture
    const setupCode = `
import sys
import io

class OutputCapture:
    def __init__(self):
        self.buffer = io.StringIO()
    def write(self, s):
        self.buffer.write(s)
    def flush(self):
        pass
    def getvalue(self):
        return self.buffer.getvalue()

__termux_stdout__ = OutputCapture()
__termux_stderr__ = OutputCapture()
sys.stdout = __termux_stdout__
sys.stderr = __termux_stderr__
`;
    pyodide.runPython(setupCode);

    try {
      pyodide.runPython(code);
    } catch (err: any) {
      return `\x1b[31m${err.message || String(err)}\x1b[0m`;
    }

    const getOutputCode = `
sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__
(__termux_stdout__.getvalue(), __termux_stderr__.getvalue())
`;
    const [stdout, stderr] = pyodide.runPython(getOutputCode).toJs();
    let result = stdout || '';
    if (stderr) {
      result += (result ? '\r\n' : '') + `\x1b[31m${stderr}\x1b[0m`;
    }
    return result.replace(/\n/g, '\r\n');
  } catch (err: any) {
    return `\x1b[31mPython error: ${err.message || String(err)}\x1b[0m`;
  }
}
