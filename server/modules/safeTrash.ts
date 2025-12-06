import { logger } from "./logger";
import { FileInfo } from "./scanner";

export interface TrashEntry {
  id: string;
  originalPath: string;
  fileName: string;
  size: number;
  deletedAt: string;
  type: string;
}

export interface TrashStatus {
  totalItems: number;
  totalSize: number;
  items: TrashEntry[];
}

class SafeTrash {
  private trashBin: Map<string, TrashEntry> = new Map();

  /**
   * Move file to safe trash instead of permanent deletion
   */
  moveToTrash(file: FileInfo): TrashEntry {
    const trashEntry: TrashEntry = {
      id: `trash-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      originalPath: file.path,
      fileName: file.name,
      size: file.size,
      deletedAt: new Date().toISOString(),
      type: file.type,
    };

    this.trashBin.set(trashEntry.id, trashEntry);

    logger.info(`File moved to trash: ${file.name}`, {
      id: trashEntry.id,
      originalPath: file.path,
      size: file.size,
    });

    return trashEntry;
  }

  /**
   * Move multiple files to trash
   */
  moveMultipleToTrash(files: FileInfo[]): TrashEntry[] {
    return files.map((file) => this.moveToTrash(file));
  }

  /**
   * Restore a file from trash
   */
  restoreFromTrash(trashId: string): TrashEntry | null {
    const entry = this.trashBin.get(trashId);

    if (!entry) {
      logger.warn(`Trash entry not found: ${trashId}`);
      return null;
    }

    this.trashBin.delete(trashId);

    logger.info(`File restored from trash: ${entry.fileName}`, {
      id: trashId,
      originalPath: entry.originalPath,
    });

    return entry;
  }

  /**
   * Permanently delete files from trash
   */
  permanentlyDelete(trashIds: string[]): string[] {
    const deleted: string[] = [];

    for (const id of trashIds) {
      const entry = this.trashBin.get(id);
      if (entry) {
        this.trashBin.delete(id);
        deleted.push(id);

        logger.info(`File permanently deleted: ${entry.fileName}`, {
          id,
          originalPath: entry.originalPath,
        });
      }
    }

    return deleted;
  }

  /**
   * Empty entire trash
   */
  emptyTrash(): number {
    const count = this.trashBin.size;
    const deletedFiles = Array.from(this.trashBin.values()).map(
      (e) => e.fileName,
    );

    this.trashBin.clear();

    logger.info(`Trash emptied`, {
      filesDeleted: count,
      fileNames: deletedFiles,
    });

    return count;
  }

  /**
   * Get trash status
   */
  getTrashStatus(): TrashStatus {
    const items = Array.from(this.trashBin.values());
    const totalSize = items.reduce((sum, item) => sum + item.size, 0);

    return {
      totalItems: items.length,
      totalSize,
      items,
    };
  }

  /**
   * Get specific trash entry
   */
  getTrashEntry(trashId: string): TrashEntry | null {
    return this.trashBin.get(trashId) || null;
  }

  /**
   * Clear old trash entries (older than specified days)
   */
  clearOldEntries(daysOld: number = 30): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const entriesToDelete: string[] = [];

    for (const [id, entry] of this.trashBin.entries()) {
      const entryDate = new Date(entry.deletedAt);
      if (entryDate < cutoffDate) {
        entriesToDelete.push(id);
      }
    }

    const deleted = this.permanentlyDelete(entriesToDelete);

    logger.info(`Old trash entries cleared`, {
      deletedCount: deleted.length,
      daysOld,
    });

    return deleted.length;
  }
}

export const safeTrash = new SafeTrash();
