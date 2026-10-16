// Sandboxed JavaScript runner using Web Worker

export async function runJavaScript(code: string, args: string[] = []): Promise<string> {
  return new Promise((resolve) => {
    const logs: string[] = [];

    const workerScript = `
      self.onmessage = async function(e) {
        const { code, args } = e.data;
        const capturedLogs = [];

        const formatArg = (arg) => {
          if (typeof arg === 'object') {
            try { return JSON.stringify(arg, null, 2); } catch (_) { return String(arg); }
          }
          return String(arg);
        };

        const customConsole = {
          log: (...a) => self.postMessage({ type: 'log', text: a.map(formatArg).join(' ') }),
          warn: (...a) => self.postMessage({ type: 'warn', text: '[WARN] ' + a.map(formatArg).join(' ') }),
          error: (...a) => self.postMessage({ type: 'error', text: '[ERR] ' + a.map(formatArg).join(' ') }),
          info: (...a) => self.postMessage({ type: 'log', text: a.map(formatArg).join(' ') }),
          table: (...a) => self.postMessage({ type: 'log', text: a.map(formatArg).join(' ') })
        };

        try {
          const runFn = new Function('console', 'process', code);
          const mockProcess = {
            argv: ['node', 'script.js', ...args],
            env: { NODE_ENV: 'development', TERM: 'xterm-256color' },
            exit: (code = 0) => { self.postMessage({ type: 'exit', code }); }
          };

          const result = runFn(customConsole, mockProcess);
          if (result instanceof Promise) {
            await result;
          }
          self.postMessage({ type: 'done' });
        } catch (err) {
          self.postMessage({ type: 'error', text: (err && err.stack) ? err.stack : String(err) });
          self.postMessage({ type: 'done' });
        }
      };
    `;

    const blob = new Blob([workerScript], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    const worker = new Worker(workerUrl);

    let isFinished = false;
    const timeout = setTimeout(() => {
      if (!isFinished) {
        worker.terminate();
        URL.revokeObjectURL(workerUrl);
        logs.push('\r\n\x1b[31m[Node execution timed out after 10s]\x1b[0m');
        resolve(logs.join('\r\n'));
      }
    }, 10000);

    worker.onmessage = (e) => {
      const { type, text } = e.data;
      if (type === 'log') {
        logs.push(text);
      } else if (type === 'warn') {
        logs.push(`\x1b[33m${text}\x1b[0m`);
      } else if (type === 'error') {
        logs.push(`\x1b[31m${text}\x1b[0m`);
      } else if (type === 'done' || type === 'exit') {
        isFinished = true;
        clearTimeout(timeout);
        worker.terminate();
        URL.revokeObjectURL(workerUrl);
        resolve(logs.join('\r\n'));
      }
    };

    worker.onerror = (err) => {
      isFinished = true;
      clearTimeout(timeout);
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
      logs.push(`\x1b[31mError: ${err.message}\x1b[0m`);
      resolve(logs.join('\r\n'));
    };

    worker.postMessage({ code, args });
  });
}
