import fs from 'fs';
import path from 'path';
import { logger } from './logger.js';

export interface FileInfo {
  path: string;
  name: string;
  size: number;
  type: 'image' | 'video' | 'audio' | 'document' | 'other';
  extension: string;
  created: number;
  modified: number;
  hash?: string;
  metadata?: Record<string, any>;
}

export interface ScanResult {
  totalFiles: number;
  filesScanned: number;
  files: FileInfo[];
  errors: string[];
  duration: number;
  byType: {
    images: number;
    videos: number;
    audio: number;
    documents: number;
    other: number;
  };
}

export interface ScanOptions {
  fileTypes?: string[];
  recursive?: boolean;
  maxDepth?: number;
  onProgress?: (progress: ScanProgress) => void;
}

export interface ScanProgress {
  currentFolder: string;
  filesScanned: number;
  totalFilesFound: number;
  currentFile?: string;
  percentage?: number;
}

class FileScanner {
  private cancelled = false;
  
  private readonly supportedFormats = {
    images: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico', 'tiff', 'tif', 'heic', 'heif', 'raw', 'cr2', 'nef', 'arw'],
    videos: ['mp4', 'avi', 'mkv', 'mov', 'flv', 'wmv', 'webm', 'm4v', 'mpg', 'mpeg', '3gp', 'ts', 'vob'],
    audio: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma', 'aiff', 'alac', 'm4a', 'opus', 'ape', 'wv'],
    documents: ['pdf', 'docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt', 'txt', 'rtf', 'odt', 'ods', 'odp', 'csv', 'epub'],
  };

  async scanFolders(folders: string[], options: ScanOptions = {}): Promise<ScanResult> {
    this.cancelled = false;
    const startTime = Date.now();
    
    const result: ScanResult = {
      totalFiles: 0,
      filesScanned: 0,
      files: [],
      errors: [],
      duration: 0,
      byType: {
        images: 0,
        videos: 0,
        audio: 0,
        documents: 0,
        other: 0,
      },
    };

    try {
      for (const folder of folders) {
        if (this.cancelled) break;
        
        logger.info(`Scanning folder: ${folder}`);
        options.onProgress?.({
          currentFolder: folder,
          filesScanned: result.filesScanned,
          totalFilesFound: result.files.length,
        });

        await this.scanDirectory(folder, result, options, 0);
      }

      result.duration = Date.now() - startTime;
      result.totalFiles = result.files.length;
      
      logger.info('Scan completed', {
        totalFiles: result.totalFiles,
        duration: result.duration,
        byType: result.byType,
      });

      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(errorMsg);
      logger.error('Scan failed', { error: errorMsg });
      throw error;
    }
  }

  private async scanDirectory(
    dirPath: string, 
    result: ScanResult, 
    options: ScanOptions,
    depth: number
  ): Promise<void> {
    if (this.cancelled) return;
    if (options.maxDepth !== undefined && depth > options.maxDepth) return;

    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        if (this.cancelled) break;

        const fullPath = path.join(dirPath, entry.name);

        try {
          if (entry.isDirectory()) {
            if (options.recursive !== false) {
              if (!this.isSystemDirectory(entry.name)) {
                await this.scanDirectory(fullPath, result, options, depth + 1);
              }
            }
          } else if (entry.isFile()) {
            const fileInfo = await this.getFileInfo(fullPath);
            
            if (fileInfo) {
              if (this.shouldIncludeFile(fileInfo, options.fileTypes)) {
                result.files.push(fileInfo);
                result.filesScanned++;
                this.updateTypeCount(result, fileInfo.type);

                options.onProgress?.({
                  currentFolder: dirPath,
                  filesScanned: result.filesScanned,
                  totalFilesFound: result.files.length,
                  currentFile: fileInfo.name,
                });
              }
            }
          }
        } catch (entryError) {
          const errorMsg = `Error processing ${fullPath}: ${entryError instanceof Error ? entryError.message : 'Unknown error'}`;
          result.errors.push(errorMsg);
          logger.warn(errorMsg);
        }
      }
    } catch (dirError) {
      const errorMsg = `Error reading directory ${dirPath}: ${dirError instanceof Error ? dirError.message : 'Unknown error'}`;
      result.errors.push(errorMsg);
      logger.warn(errorMsg);
    }
  }

  private async getFileInfo(filePath: string): Promise<FileInfo | null> {
    try {
      const stats = fs.statSync(filePath);
      const ext = path.extname(filePath).toLowerCase().slice(1);
      const type = this.getFileType(ext);

      return {
        path: filePath,
        name: path.basename(filePath),
        size: stats.size,
        type,
        extension: ext,
        created: stats.birthtimeMs,
        modified: stats.mtimeMs,
      };
    } catch (error) {
      logger.warn(`Could not get file info for ${filePath}`, { error: String(error) });
      return null;
    }
  }

  getFileType(extension: string): 'image' | 'video' | 'audio' | 'document' | 'other' {
    const ext = extension.toLowerCase();
    
    if (this.supportedFormats.images.includes(ext)) return 'image';
    if (this.supportedFormats.videos.includes(ext)) return 'video';
    if (this.supportedFormats.audio.includes(ext)) return 'audio';
    if (this.supportedFormats.documents.includes(ext)) return 'document';
    
    return 'other';
  }

  private shouldIncludeFile(fileInfo: FileInfo, allowedTypes?: string[]): boolean {
    if (!allowedTypes || allowedTypes.length === 0) {
      return fileInfo.type !== 'other';
    }
    return allowedTypes.includes(fileInfo.extension) || allowedTypes.includes(fileInfo.type);
  }

  private updateTypeCount(result: ScanResult, type: string): void {
    switch (type) {
      case 'image':
        result.byType.images++;
        break;
      case 'video':
        result.byType.videos++;
        break;
      case 'audio':
        result.byType.audio++;
        break;
      case 'document':
        result.byType.documents++;
        break;
      default:
        result.byType.other++;
    }
  }

  private isSystemDirectory(name: string): boolean {
    const systemDirs = [
      '$RECYCLE.BIN',
      'System Volume Information',
      'Windows',
      'Program Files',
      'Program Files (x86)',
      'ProgramData',
      'node_modules',
      '.git',
      '__pycache__',
      '.cache',
      'AppData',
    ];
    return systemDirs.includes(name) || name.startsWith('.');
  }

  cancelScan(): void {
    this.cancelled = true;
    logger.info('Scan cancelled');
  }

  isScanning(): boolean {
    return !this.cancelled;
  }

  getSupportedFormats(): typeof this.supportedFormats {
    return { ...this.supportedFormats };
  }
}

export const fileScanner = new FileScanner();
