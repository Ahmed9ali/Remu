export interface FSNode {
  path: string;       // Absolute path, e.g. /home/ahmed/hello.js
  name: string;       // hello.js
  type: 'file' | 'dir';
  content?: string;   // text content for files
  size: number;       // bytes
  mtime: number;      // timestamp
  mode?: string;      // -rw-r--r-- or drwxr-xr-x
}

export interface SearchMatch {
  file: string;
  line: number;
  text: string;
}
