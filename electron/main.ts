import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import Store from 'electron-store';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { fileScanner } from './core/fileScanner.js';
import { hashEngine } from './core/hashEngine.js';
import { metadataExtractor } from './core/metadataExtractor.js';
import { duplicateEngine } from './core/duplicateEngine.js';
import { safeTrash } from './core/safeTrash.js';
import { batchRules } from './core/batchRules.js';
import { aiEngine } from './core/aiEngine.js';
import { cloudAI } from './core/cloudAI.js';
import { logger } from './core/logger.js';

const store = new Store();
let mainWindow: BrowserWindow | null = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    frame: true,
    titleBarStyle: 'default',
    icon: path.join(__dirname, '../assets/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  logger.info('Main window created');
}

app.whenReady().then(() => {
  createWindow();
  logger.info('Knoux Duplicate AI started');

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('dialog:selectFolder', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory', 'multiSelections'],
    title: 'Select Folders to Scan',
  });
  return result.filePaths;
});

ipcMain.handle('dialog:selectFiles', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile', 'multiSelections'],
    title: 'Select Files',
  });
  return result.filePaths;
});

ipcMain.handle('scan:start', async (event, options: { folders: string[]; fileTypes?: string[]; recursive?: boolean }) => {
  try {
    logger.info('Starting scan', { folders: options.folders });
    
    const sendProgress = (progress: any) => {
      mainWindow?.webContents.send('scan:progress', progress);
    };

    const result = await fileScanner.scanFolders(options.folders, {
      fileTypes: options.fileTypes,
      recursive: options.recursive ?? true,
      onProgress: sendProgress,
    });

    logger.info('Scan completed', { totalFiles: result.totalFiles });
    return result;
  } catch (error) {
    logger.error('Scan failed', { error: String(error) });
    throw error;
  }
});

ipcMain.handle('scan:cancel', async () => {
  fileScanner.cancelScan();
  return { success: true };
});

ipcMain.handle('hash:calculate', async (event, filePath: string) => {
  return await hashEngine.hashFile(filePath);
});

ipcMain.handle('hash:calculateBatch', async (event, filePaths: string[]) => {
  const sendProgress = (progress: any) => {
    mainWindow?.webContents.send('hash:progress', progress);
  };
  return await hashEngine.hashFiles(filePaths, sendProgress);
});

ipcMain.handle('metadata:extract', async (event, filePath: string) => {
  return await metadataExtractor.extractMetadata(filePath);
});

ipcMain.handle('metadata:extractBatch', async (event, filePaths: string[]) => {
  const sendProgress = (progress: any) => {
    mainWindow?.webContents.send('metadata:progress', progress);
  };
  return await metadataExtractor.extractBatch(filePaths, sendProgress);
});

ipcMain.handle('duplicates:detect', async (event, files: any[], options?: { sensitivity?: string }) => {
  const sendProgress = (progress: any) => {
    mainWindow?.webContents.send('duplicates:progress', progress);
  };
  return await duplicateEngine.detectDuplicates(files, {
    sensitivity: options?.sensitivity as 'low' | 'medium' | 'high' || 'high',
    onProgress: sendProgress,
  });
});

ipcMain.handle('duplicates:compare', async (event, file1: string, file2: string) => {
  return await duplicateEngine.compareFiles(file1, file2);
});

ipcMain.handle('trash:move', async (event, files: any[]) => {
  return await safeTrash.moveToTrash(files);
});

ipcMain.handle('trash:restore', async (event, trashId: string) => {
  return await safeTrash.restoreFromTrash(trashId);
});

ipcMain.handle('trash:delete', async (event, trashIds: string[]) => {
  return await safeTrash.permanentlyDelete(trashIds);
});

ipcMain.handle('trash:empty', async () => {
  return await safeTrash.emptyTrash();
});

ipcMain.handle('trash:getStatus', async () => {
  return await safeTrash.getTrashStatus();
});

ipcMain.handle('trash:getItems', async () => {
  return await safeTrash.getTrashItems();
});

ipcMain.handle('rules:getAll', async () => {
  return batchRules.getAllRules();
});

ipcMain.handle('rules:create', async (event, rule: any) => {
  return batchRules.createRule(rule);
});

ipcMain.handle('rules:update', async (event, ruleId: string, updates: any) => {
  return batchRules.updateRule(ruleId, updates);
});

ipcMain.handle('rules:delete', async (event, ruleId: string) => {
  return batchRules.deleteRule(ruleId);
});

ipcMain.handle('rules:toggle', async (event, ruleId: string) => {
  return batchRules.toggleRule(ruleId);
});

ipcMain.handle('rules:apply', async (event, groups: any[]) => {
  const sendProgress = (progress: any) => {
    mainWindow?.webContents.send('rules:progress', progress);
  };
  return await batchRules.applyRulesToGroups(groups, sendProgress);
});

ipcMain.handle('ai:analyze', async (event, files: any[]) => {
  const sendProgress = (progress: any) => {
    mainWindow?.webContents.send('ai:progress', progress);
  };
  return await aiEngine.analyzeFiles(files, sendProgress);
});

ipcMain.handle('ai:recommend', async (event, group: any) => {
  return aiEngine.recommendAction(group);
});

ipcMain.handle('ai:getSummary', async (event, analysis: any) => {
  return aiEngine.generateSummary(analysis);
});

ipcMain.handle('settings:get', async (event, key: string) => {
  return (store as any).get(key);
});

ipcMain.handle('settings:set', async (event, key: string, value: any) => {
  (store as any).set(key, value);
  return { success: true };
});

ipcMain.handle('settings:getAll', async () => {
  return (store as any).store;
});

ipcMain.handle('settings:reset', async () => {
  (store as any).clear();
  return { success: true };
});

ipcMain.handle('shell:openPath', async (event, filePath: string) => {
  return await shell.openPath(filePath);
});

ipcMain.handle('shell:showItemInFolder', async (event, filePath: string) => {
  shell.showItemInFolder(filePath);
  return { success: true };
});

ipcMain.handle('app:getVersion', async () => {
  return app.getVersion();
});

ipcMain.handle('app:getPath', async (event, name: string) => {
  return app.getPath(name as any);
});

ipcMain.handle('system:getStats', async () => {
  const os = await import('os');
  return {
    platform: os.platform(),
    arch: os.arch(),
    cpus: os.cpus().length,
    totalMemory: os.totalmem(),
    freeMemory: os.freemem(),
    hostname: os.hostname(),
    uptime: os.uptime(),
  };
});

ipcMain.handle('cloudAI:isAvailable', async () => {
  return await cloudAI.isAvailable();
});

ipcMain.handle('cloudAI:analyzeGroup', async (event, group: any) => {
  return await cloudAI.analyzeGroup(group);
});

ipcMain.handle('cloudAI:generateSummary', async (event, analysis: any) => {
  return await cloudAI.generateSmartSummary(analysis);
});

ipcMain.handle('cloudAI:askAboutFiles', async (event, question: string, files: any[]) => {
  return await cloudAI.askAboutFiles(question, files);
});

ipcMain.handle('cloudAI:getCleanupStrategy', async (event, analysis: any) => {
  return await cloudAI.getCleanupStrategy(analysis);
});
