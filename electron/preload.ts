import { contextBridge, ipcRenderer } from 'electron';

const electronAPI = {
  dialog: {
    selectFolder: () => ipcRenderer.invoke('dialog:selectFolder'),
    selectFiles: () => ipcRenderer.invoke('dialog:selectFiles'),
  },

  scan: {
    start: (options: { folders: string[]; fileTypes?: string[]; recursive?: boolean }) =>
      ipcRenderer.invoke('scan:start', options),
    cancel: () => ipcRenderer.invoke('scan:cancel'),
    onProgress: (callback: (progress: any) => void) => {
      ipcRenderer.on('scan:progress', (_, progress) => callback(progress));
      return () => ipcRenderer.removeAllListeners('scan:progress');
    },
  },

  hash: {
    calculate: (filePath: string) => ipcRenderer.invoke('hash:calculate', filePath),
    calculateBatch: (filePaths: string[]) => ipcRenderer.invoke('hash:calculateBatch', filePaths),
    onProgress: (callback: (progress: any) => void) => {
      ipcRenderer.on('hash:progress', (_, progress) => callback(progress));
      return () => ipcRenderer.removeAllListeners('hash:progress');
    },
  },

  metadata: {
    extract: (filePath: string) => ipcRenderer.invoke('metadata:extract', filePath),
    extractBatch: (filePaths: string[]) => ipcRenderer.invoke('metadata:extractBatch', filePaths),
    onProgress: (callback: (progress: any) => void) => {
      ipcRenderer.on('metadata:progress', (_, progress) => callback(progress));
      return () => ipcRenderer.removeAllListeners('metadata:progress');
    },
  },

  duplicates: {
    detect: (files: any[], options?: { sensitivity?: string }) =>
      ipcRenderer.invoke('duplicates:detect', files, options),
    compare: (file1: string, file2: string) => ipcRenderer.invoke('duplicates:compare', file1, file2),
    onProgress: (callback: (progress: any) => void) => {
      ipcRenderer.on('duplicates:progress', (_, progress) => callback(progress));
      return () => ipcRenderer.removeAllListeners('duplicates:progress');
    },
  },

  trash: {
    move: (files: any[]) => ipcRenderer.invoke('trash:move', files),
    restore: (trashId: string) => ipcRenderer.invoke('trash:restore', trashId),
    delete: (trashIds: string[]) => ipcRenderer.invoke('trash:delete', trashIds),
    empty: () => ipcRenderer.invoke('trash:empty'),
    getStatus: () => ipcRenderer.invoke('trash:getStatus'),
    getItems: () => ipcRenderer.invoke('trash:getItems'),
  },

  rules: {
    getAll: () => ipcRenderer.invoke('rules:getAll'),
    create: (rule: any) => ipcRenderer.invoke('rules:create', rule),
    update: (ruleId: string, updates: any) => ipcRenderer.invoke('rules:update', ruleId, updates),
    delete: (ruleId: string) => ipcRenderer.invoke('rules:delete', ruleId),
    toggle: (ruleId: string) => ipcRenderer.invoke('rules:toggle', ruleId),
    apply: (groups: any[]) => ipcRenderer.invoke('rules:apply', groups),
    onProgress: (callback: (progress: any) => void) => {
      ipcRenderer.on('rules:progress', (_, progress) => callback(progress));
      return () => ipcRenderer.removeAllListeners('rules:progress');
    },
  },

  ai: {
    analyze: (files: any[]) => ipcRenderer.invoke('ai:analyze', files),
    recommend: (group: any) => ipcRenderer.invoke('ai:recommend', group),
    getSummary: (analysis: any) => ipcRenderer.invoke('ai:getSummary', analysis),
    onProgress: (callback: (progress: any) => void) => {
      ipcRenderer.on('ai:progress', (_, progress) => callback(progress));
      return () => ipcRenderer.removeAllListeners('ai:progress');
    },
  },

  settings: {
    get: (key: string) => ipcRenderer.invoke('settings:get', key),
    set: (key: string, value: any) => ipcRenderer.invoke('settings:set', key, value),
    getAll: () => ipcRenderer.invoke('settings:getAll'),
    reset: () => ipcRenderer.invoke('settings:reset'),
  },

  shell: {
    openPath: (filePath: string) => ipcRenderer.invoke('shell:openPath', filePath),
    showItemInFolder: (filePath: string) => ipcRenderer.invoke('shell:showItemInFolder', filePath),
  },

  app: {
    getVersion: () => ipcRenderer.invoke('app:getVersion'),
    getPath: (name: string) => ipcRenderer.invoke('app:getPath', name),
  },

  system: {
    getStats: () => ipcRenderer.invoke('system:getStats'),
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

declare global {
  interface Window {
    electronAPI: typeof electronAPI;
  }
}
