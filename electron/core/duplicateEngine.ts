import fs from 'fs';
import { hashEngine } from './hashEngine.js';
import { metadataExtractor } from './metadataExtractor.js';
import { logger } from './logger.js';
import type { FileInfo } from './fileScanner.js';

export interface DuplicateGroup {
  id: string;
  hash: string;
  files: FileInfo[];
  totalSize: number;
  recoverableSize: number;
  type: string;
  similarity: number;
  aiConfidence?: number;
  recommended?: {
    keep: FileInfo;
    reason: string;
  };
}

export interface DuplicateAnalysis {
  groups: DuplicateGroup[];
  totalDuplicates: number;
  totalFiles: number;
  totalRecoverableSize: number;
  byType: {
    images: number;
    videos: number;
    audio: number;
    documents: number;
    other: number;
  };
  scanDuration: number;
}

export interface DuplicateDetectionOptions {
  sensitivity?: 'low' | 'medium' | 'high';
  compareContent?: boolean;
  useQuickHash?: boolean;
  onProgress?: (progress: DuplicateProgress) => void;
}

export interface DuplicateProgress {
  phase: 'hashing' | 'grouping' | 'analyzing' | 'complete';
  current: number;
  total: number;
  currentFile?: string;
  percentage: number;
  groupsFound?: number;
}

class DuplicateEngine {
  private groupIdCounter = 0;

  async detectDuplicates(
    files: FileInfo[],
    options: DuplicateDetectionOptions = {}
  ): Promise<DuplicateAnalysis> {
    const startTime = Date.now();
    const { sensitivity = 'high', compareContent = false, useQuickHash = false, onProgress } = options;

    logger.info('Starting duplicate detection', { 
      fileCount: files.length, 
      sensitivity,
      compareContent,
    });

    const analysis: DuplicateAnalysis = {
      groups: [],
      totalDuplicates: 0,
      totalFiles: files.length,
      totalRecoverableSize: 0,
      byType: { images: 0, videos: 0, audio: 0, documents: 0, other: 0 },
      scanDuration: 0,
    };

    onProgress?.({
      phase: 'hashing',
      current: 0,
      total: files.length,
      percentage: 0,
    });

    const fileHashes: Map<string, FileInfo[]> = new Map();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      onProgress?.({
        phase: 'hashing',
        current: i + 1,
        total: files.length,
        currentFile: file.name,
        percentage: Math.round(((i + 1) / files.length) * 100),
      });

      try {
        let hash: string;
        
        if (useQuickHash && file.size > 10 * 1024 * 1024) {
          hash = await hashEngine.quickHash(file.path);
          if (!hash) {
            const result = await hashEngine.hashFile(file.path);
            hash = result.hash;
          }
        } else {
          const result = await hashEngine.hashFile(file.path);
          hash = result.hash;
        }

        if (hash) {
          file.hash = hash;
          
          if (!fileHashes.has(hash)) {
            fileHashes.set(hash, []);
          }
          fileHashes.get(hash)!.push(file);
        }
      } catch (error) {
        logger.warn(`Error hashing file ${file.path}`, { error: String(error) });
      }
    }

    onProgress?.({
      phase: 'grouping',
      current: 0,
      total: fileHashes.size,
      percentage: 0,
    });

    let groupIndex = 0;
    for (const [hash, fileGroup] of fileHashes.entries()) {
      groupIndex++;
      
      onProgress?.({
        phase: 'grouping',
        current: groupIndex,
        total: fileHashes.size,
        percentage: Math.round((groupIndex / fileHashes.size) * 100),
        groupsFound: analysis.groups.length,
      });

      if (fileGroup.length > 1) {
        if (compareContent) {
          const subGroups = await this.groupByContent(fileGroup);
          for (const subGroup of subGroups) {
            if (subGroup.length > 1) {
              const group = this.createDuplicateGroup(hash, subGroup, sensitivity);
              analysis.groups.push(group);
              this.updateAnalysisCounts(analysis, group);
            }
          }
        } else {
          const group = this.createDuplicateGroup(hash, fileGroup, sensitivity);
          analysis.groups.push(group);
          this.updateAnalysisCounts(analysis, group);
        }
      }
    }

    onProgress?.({
      phase: 'analyzing',
      current: analysis.groups.length,
      total: analysis.groups.length,
      percentage: 100,
      groupsFound: analysis.groups.length,
    });

    for (const group of analysis.groups) {
      group.recommended = this.recommendKeepFile(group);
    }

    analysis.scanDuration = Date.now() - startTime;

    onProgress?.({
      phase: 'complete',
      current: analysis.groups.length,
      total: analysis.groups.length,
      percentage: 100,
      groupsFound: analysis.groups.length,
    });

    logger.info('Duplicate detection completed', {
      groups: analysis.groups.length,
      duplicates: analysis.totalDuplicates,
      recoverableSize: analysis.totalRecoverableSize,
      duration: analysis.scanDuration,
    });

    return analysis;
  }

  private createDuplicateGroup(
    hash: string,
    files: FileInfo[],
    sensitivity: 'low' | 'medium' | 'high'
  ): DuplicateGroup {
    const sortedFiles = [...files].sort((a, b) => b.size - a.size);
    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    const largestFile = sortedFiles[0];
    const recoverableSize = totalSize - largestFile.size;

    return {
      id: `group-${this.groupIdCounter++}`,
      hash,
      files: sortedFiles,
      totalSize,
      recoverableSize,
      type: files[0]?.type || 'unknown',
      similarity: this.calculateSimilarity(files, sensitivity),
    };
  }

  private calculateSimilarity(
    files: FileInfo[],
    sensitivity: 'low' | 'medium' | 'high'
  ): number {
    if (files.length < 2) return 1;

    const baseScore = sensitivity === 'low' ? 0.85 : sensitivity === 'medium' ? 0.92 : 0.98;
    
    const sizes = files.map(f => f.size);
    const maxSize = Math.max(...sizes);
    const minSize = Math.min(...sizes);
    const sizeVariance = maxSize > 0 ? (maxSize - minSize) / maxSize : 0;
    
    return Math.min(1, baseScore + (1 - sizeVariance) * 0.1);
  }

  private async groupByContent(files: FileInfo[]): Promise<FileInfo[][]> {
    const groups: FileInfo[][] = [];
    const processed = new Set<string>();

    for (let i = 0; i < files.length; i++) {
      if (processed.has(files[i].path)) continue;

      const group: FileInfo[] = [files[i]];
      processed.add(files[i].path);

      for (let j = i + 1; j < files.length; j++) {
        if (processed.has(files[j].path)) continue;

        try {
          const identical = await this.compareFilesContent(files[i].path, files[j].path);
          if (identical) {
            group.push(files[j]);
            processed.add(files[j].path);
          }
        } catch (error) {
          logger.warn(`Error comparing files`, { error: String(error) });
        }
      }

      groups.push(group);
    }

    return groups;
  }

  private async compareFilesContent(path1: string, path2: string): Promise<boolean> {
    const stats1 = fs.statSync(path1);
    const stats2 = fs.statSync(path2);

    if (stats1.size !== stats2.size) return false;

    const chunkSize = 64 * 1024;
    const fd1 = fs.openSync(path1, 'r');
    const fd2 = fs.openSync(path2, 'r');

    try {
      const buffer1 = Buffer.alloc(chunkSize);
      const buffer2 = Buffer.alloc(chunkSize);
      let position = 0;

      while (position < stats1.size) {
        const bytesRead1 = fs.readSync(fd1, buffer1, 0, chunkSize, position);
        const bytesRead2 = fs.readSync(fd2, buffer2, 0, chunkSize, position);

        if (bytesRead1 !== bytesRead2) return false;
        if (!buffer1.slice(0, bytesRead1).equals(buffer2.slice(0, bytesRead2))) return false;

        position += bytesRead1;
      }

      return true;
    } finally {
      fs.closeSync(fd1);
      fs.closeSync(fd2);
    }
  }

  private recommendKeepFile(group: DuplicateGroup): { keep: FileInfo; reason: string } {
    const files = group.files;
    
    const largest = files.reduce((a, b) => (a.size > b.size ? a : b));
    const newest = files.reduce((a, b) => (a.modified > b.modified ? a : b));
    
    if (largest.path === newest.path) {
      return { keep: largest, reason: 'Largest and newest file' };
    }

    if (largest.size > newest.size * 1.1) {
      return { keep: largest, reason: 'Significantly larger file (better quality)' };
    }

    return { keep: newest, reason: 'Most recently modified file' };
  }

  private updateAnalysisCounts(analysis: DuplicateAnalysis, group: DuplicateGroup): void {
    analysis.totalDuplicates += group.files.length - 1;
    analysis.totalRecoverableSize += group.recoverableSize;

    switch (group.type) {
      case 'image':
        analysis.byType.images += group.files.length - 1;
        break;
      case 'video':
        analysis.byType.videos += group.files.length - 1;
        break;
      case 'audio':
        analysis.byType.audio += group.files.length - 1;
        break;
      case 'document':
        analysis.byType.documents += group.files.length - 1;
        break;
      default:
        analysis.byType.other += group.files.length - 1;
    }
  }

  async compareFiles(path1: string, path2: string): Promise<{
    identical: boolean;
    similarity: number;
    sizeDiff: number;
    details: string;
  }> {
    const comparison = await hashEngine.compareFiles(path1, path2);
    
    if (comparison.identical) {
      return {
        identical: true,
        similarity: 1.0,
        sizeDiff: 0,
        details: 'Files are identical (same hash)',
      };
    }

    const stats1 = fs.statSync(path1);
    const stats2 = fs.statSync(path2);
    const sizeDiff = Math.abs(stats1.size - stats2.size);
    const sizeRatio = Math.min(stats1.size, stats2.size) / Math.max(stats1.size, stats2.size);

    return {
      identical: false,
      similarity: sizeRatio,
      sizeDiff,
      details: `Files have different hashes. Size difference: ${sizeDiff} bytes`,
    };
  }
}

export const duplicateEngine = new DuplicateEngine();
