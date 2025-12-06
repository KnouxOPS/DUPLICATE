import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { app } from 'electron';
import { logger } from './logger.js';
import type { FileInfo } from './fileScanner.js';

export interface TrashEntry {
  id: string;
  originalPath: string;
  trashPath: string;
  fileName: string;
  size: number;
  deletedAt: string;
  type: string;
  hash?: string;
  canRestore: boolean;
}

export interface TrashStatus {
  totalItems: number;
  totalSize: number;
  trashPath: string;
  items: TrashEntry[];
}

export interface TrashResult {
  success: boolean;
  entries?: TrashEntry[];
  errors?: string[];
}

class SafeTrash {
  private trashPath: string = '';
  private metadataPath: string = '';
  private trashMetadata: Map<string, TrashEntry> = new Map();
  private initialized = false;

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;

    try {
      const userDataPath = app?.getPath?.('userData') || process.env.APPDATA || path.join(process.env.HOME || '', '.knoux');
      this.trashPath = path.join(userDataPath, 'Knoux', 'SafeTrash');
      this.metadataPath = path.join(userDataPath, 'Knoux', 'trash_metadata.json');

      if (!fs.existsSync(this.trashPath)) {
        fs.mkdirSync(this.trashPath, { recursive: true });
        logger.info('Safe Trash directory created', { path: this.trashPath });
      }

      this.loadMetadata();
      this.initialized = true;
    } catch (error) {
      logger.error('Failed to initialize Safe Trash', { error: String(error) });
      throw error;
    }
  }

  private loadMetadata(): void {
    try {
      if (fs.existsSync(this.metadataPath)) {
        const data = fs.readFileSync(this.metadataPath, 'utf-8');
        const entries: TrashEntry[] = JSON.parse(data);
        this.trashMetadata.clear();
        
        for (const entry of entries) {
          if (fs.existsSync(entry.trashPath)) {
            this.trashMetadata.set(entry.id, entry);
          }
        }
        
        this.saveMetadata();
      }
    } catch (error) {
      logger.warn('Failed to load trash metadata', { error: String(error) });
      this.trashMetadata.clear();
    }
  }

  private saveMetadata(): void {
    try {
      const dir = path.dirname(this.metadataPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      const entries = Array.from(this.trashMetadata.values());
      fs.writeFileSync(this.metadataPath, JSON.stringify(entries, null, 2));
    } catch (error) {
      logger.error('Failed to save trash metadata', { error: String(error) });
    }
  }

  private generateTrashId(): string {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(4).toString('hex');
    return `trash-${timestamp}-${random}`;
  }

  private generateUniqueTrashPath(fileName: string): string {
    let trashFilePath = path.join(this.trashPath, fileName);
    let counter = 1;
    const ext = path.extname(fileName);
    const baseName = path.basename(fileName, ext);

    while (fs.existsSync(trashFilePath)) {
      trashFilePath = path.join(this.trashPath, `${baseName}_${counter}${ext}`);
      counter++;
    }

    return trashFilePath;
  }

  async moveToTrash(files: FileInfo[]): Promise<TrashResult> {
    await this.ensureInitialized();

    const entries: TrashEntry[] = [];
    const errors: string[] = [];

    for (const file of files) {
      try {
        if (!fs.existsSync(file.path)) {
          errors.push(`File not found: ${file.path}`);
          continue;
        }

        const trashId = this.generateTrashId();
        const trashFilePath = this.generateUniqueTrashPath(file.name);

        fs.renameSync(file.path, trashFilePath);

        const entry: TrashEntry = {
          id: trashId,
          originalPath: file.path,
          trashPath: trashFilePath,
          fileName: file.name,
          size: file.size,
          deletedAt: new Date().toISOString(),
          type: file.type,
          hash: file.hash,
          canRestore: true,
        };

        this.trashMetadata.set(trashId, entry);
        entries.push(entry);

        logger.info('File moved to Safe Trash', {
          id: trashId,
          originalPath: file.path,
          trashPath: trashFilePath,
        });
      } catch (error) {
        const errorMsg = `Failed to move ${file.path}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        logger.error(errorMsg);
      }
    }

    this.saveMetadata();

    return {
      success: errors.length === 0,
      entries,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  async restoreFromTrash(trashId: string): Promise<TrashResult> {
    await this.ensureInitialized();

    const entry = this.trashMetadata.get(trashId);

    if (!entry) {
      logger.warn('Trash entry not found', { id: trashId });
      return { success: false, errors: ['Trash entry not found'] };
    }

    try {
      if (!fs.existsSync(entry.trashPath)) {
        this.trashMetadata.delete(trashId);
        this.saveMetadata();
        return { success: false, errors: ['File no longer exists in trash'] };
      }

      const originalDir = path.dirname(entry.originalPath);
      if (!fs.existsSync(originalDir)) {
        fs.mkdirSync(originalDir, { recursive: true });
      }

      let restorePath = entry.originalPath;
      if (fs.existsSync(restorePath)) {
        const ext = path.extname(entry.originalPath);
        const baseName = path.basename(entry.originalPath, ext);
        const dir = path.dirname(entry.originalPath);
        let counter = 1;
        
        while (fs.existsSync(restorePath)) {
          restorePath = path.join(dir, `${baseName}_restored_${counter}${ext}`);
          counter++;
        }
      }

      fs.renameSync(entry.trashPath, restorePath);

      this.trashMetadata.delete(trashId);
      this.saveMetadata();

      logger.info('File restored from Safe Trash', {
        id: trashId,
        originalPath: entry.originalPath,
        restoredPath: restorePath,
      });

      return {
        success: true,
        entries: [{ ...entry, originalPath: restorePath }],
      };
    } catch (error) {
      const errorMsg = `Failed to restore: ${error instanceof Error ? error.message : 'Unknown error'}`;
      logger.error(errorMsg);
      return { success: false, errors: [errorMsg] };
    }
  }

  async permanentlyDelete(trashIds: string[]): Promise<TrashResult> {
    await this.ensureInitialized();

    const deleted: TrashEntry[] = [];
    const errors: string[] = [];

    for (const id of trashIds) {
      const entry = this.trashMetadata.get(id);
      
      if (!entry) {
        errors.push(`Entry not found: ${id}`);
        continue;
      }

      try {
        if (fs.existsSync(entry.trashPath)) {
          fs.unlinkSync(entry.trashPath);
        }

        this.trashMetadata.delete(id);
        deleted.push(entry);

        logger.info('File permanently deleted', {
          id,
          fileName: entry.fileName,
        });
      } catch (error) {
        const errorMsg = `Failed to delete ${entry.fileName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        logger.error(errorMsg);
      }
    }

    this.saveMetadata();

    return {
      success: errors.length === 0,
      entries: deleted,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  async emptyTrash(): Promise<TrashResult> {
    await this.ensureInitialized();

    const allIds = Array.from(this.trashMetadata.keys());
    return this.permanentlyDelete(allIds);
  }

  async getTrashStatus(): Promise<TrashStatus> {
    await this.ensureInitialized();

    const items = Array.from(this.trashMetadata.values());
    const totalSize = items.reduce((sum, item) => sum + item.size, 0);

    return {
      totalItems: items.length,
      totalSize,
      trashPath: this.trashPath,
      items,
    };
  }

  async getTrashItems(): Promise<TrashEntry[]> {
    await this.ensureInitialized();
    return Array.from(this.trashMetadata.values());
  }

  async getTrashEntry(trashId: string): Promise<TrashEntry | null> {
    await this.ensureInitialized();
    return this.trashMetadata.get(trashId) || null;
  }

  async clearOldEntries(daysOld: number = 30): Promise<number> {
    await this.ensureInitialized();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const entriesToDelete: string[] = [];

    for (const [id, entry] of this.trashMetadata.entries()) {
      const entryDate = new Date(entry.deletedAt);
      if (entryDate < cutoffDate) {
        entriesToDelete.push(id);
      }
    }

    if (entriesToDelete.length > 0) {
      await this.permanentlyDelete(entriesToDelete);
    }

    logger.info('Old trash entries cleared', {
      deletedCount: entriesToDelete.length,
      daysOld,
    });

    return entriesToDelete.length;
  }

  getTrashPath(): string {
    return this.trashPath;
  }
}

export const safeTrash = new SafeTrash();
