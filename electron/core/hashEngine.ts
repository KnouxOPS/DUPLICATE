import fs from 'fs';
import crypto from 'crypto';
import { logger } from './logger.js';

export interface HashResult {
  path: string;
  hash: string;
  algorithm: string;
  size: number;
  error?: string;
}

export interface HashProgress {
  current: number;
  total: number;
  currentFile: string;
  percentage: number;
}

class HashEngine {
  private hashCache: Map<string, { hash: string; mtime: number }> = new Map();
  private readonly algorithm = 'sha256';
  private readonly chunkSize = 64 * 1024;

  async hashFile(filePath: string): Promise<HashResult> {
    try {
      const stats = fs.statSync(filePath);
      
      const cacheKey = `${filePath}:${stats.mtimeMs}`;
      const cached = this.hashCache.get(cacheKey);
      if (cached && cached.mtime === stats.mtimeMs) {
        return {
          path: filePath,
          hash: cached.hash,
          algorithm: this.algorithm,
          size: stats.size,
        };
      }

      const hash = await this.computeFileHash(filePath);
      
      this.hashCache.set(cacheKey, { hash, mtime: stats.mtimeMs });
      
      return {
        path: filePath,
        hash,
        algorithm: this.algorithm,
        size: stats.size,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Error hashing file ${filePath}`, { error: errorMsg });
      return {
        path: filePath,
        hash: '',
        algorithm: this.algorithm,
        size: 0,
        error: errorMsg,
      };
    }
  }

  private computeFileHash(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash(this.algorithm);
      const stream = fs.createReadStream(filePath, { highWaterMark: this.chunkSize });

      stream.on('data', (chunk) => {
        hash.update(chunk);
      });

      stream.on('end', () => {
        resolve(hash.digest('hex'));
      });

      stream.on('error', (error) => {
        reject(error);
      });
    });
  }

  async hashFiles(
    filePaths: string[],
    onProgress?: (progress: HashProgress) => void
  ): Promise<HashResult[]> {
    const results: HashResult[] = [];
    const total = filePaths.length;

    for (let i = 0; i < filePaths.length; i++) {
      const filePath = filePaths[i];
      
      onProgress?.({
        current: i + 1,
        total,
        currentFile: filePath,
        percentage: Math.round(((i + 1) / total) * 100),
      });

      const result = await this.hashFile(filePath);
      results.push(result);
    }

    logger.info(`Hashed ${results.length} files`);
    return results;
  }

  hashString(content: string): string {
    return crypto.createHash(this.algorithm).update(content).digest('hex');
  }

  hashBuffer(buffer: Buffer): string {
    return crypto.createHash(this.algorithm).update(buffer).digest('hex');
  }

  async compareFiles(filePath1: string, filePath2: string): Promise<{
    identical: boolean;
    hash1: string;
    hash2: string;
    sizeDiff: number;
  }> {
    const [result1, result2] = await Promise.all([
      this.hashFile(filePath1),
      this.hashFile(filePath2),
    ]);

    return {
      identical: result1.hash === result2.hash && result1.hash !== '',
      hash1: result1.hash,
      hash2: result2.hash,
      sizeDiff: Math.abs(result1.size - result2.size),
    };
  }

  async quickHash(filePath: string, bytes: number = 4096): Promise<string> {
    try {
      const fd = fs.openSync(filePath, 'r');
      const buffer = Buffer.alloc(bytes);
      fs.readSync(fd, buffer, 0, bytes, 0);
      fs.closeSync(fd);
      return this.hashBuffer(buffer);
    } catch (error) {
      logger.warn(`Quick hash failed for ${filePath}`, { error: String(error) });
      return '';
    }
  }

  clearCache(): void {
    this.hashCache.clear();
    logger.info('Hash cache cleared');
  }

  getCacheSize(): number {
    return this.hashCache.size;
  }

  getAlgorithm(): string {
    return this.algorithm;
  }
}

export const hashEngine = new HashEngine();
