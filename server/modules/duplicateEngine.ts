import { logger } from "./logger";
import { FileInfo } from "./scanner";

export interface DuplicateGroup {
  id: string;
  hash: string;
  files: FileInfo[];
  totalSize: number;
  type: string;
  similarity: number;
}

export interface DuplicateAnalysis {
  groups: DuplicateGroup[];
  totalDuplicates: number;
  totalRecoverableSize: number;
}

class DuplicateEngine {
  private hashCache: Map<string, string> = new Map();

  /**
   * Calculate hash for a file (simulated - in real app would read file content)
   */
  calculateHash(file: FileInfo): string {
    const cacheKey = `${file.path}:${file.modified}`;
    if (this.hashCache.has(cacheKey)) {
      return this.hashCache.get(cacheKey)!;
    }

    // Simulated hash: based on name and size
    const hash = Buffer.from(`${file.name}:${file.size}`).toString("base64");
    this.hashCache.set(cacheKey, hash);

    return hash;
  }

  /**
   * Detect duplicates in file list
   */
  detectDuplicates(
    files: FileInfo[],
    sensitivity: "low" | "medium" | "high" = "high",
  ): DuplicateAnalysis {
    logger.info("Starting duplicate detection", {
      filesCount: files.length,
      sensitivity,
    });

    const groupMap: Map<string, FileInfo[]> = new Map();
    const analysis: DuplicateAnalysis = {
      groups: [],
      totalDuplicates: 0,
      totalRecoverableSize: 0,
    };

    // Group files by hash
    for (const file of files) {
      const hash = this.calculateHash(file);

      if (!groupMap.has(hash)) {
        groupMap.set(hash, []);
      }

      groupMap.get(hash)!.push(file);
    }

    // Create duplicate groups (groups with more than 1 file)
    let groupId = 0;
    for (const [hash, fileGroup] of groupMap.entries()) {
      if (fileGroup.length > 1) {
        const totalSize = fileGroup.reduce((sum, f) => sum + f.size, 0);
        const recoverableSize =
          totalSize - Math.min(...fileGroup.map((f) => f.size));

        const group: DuplicateGroup = {
          id: `group-${groupId++}`,
          hash,
          files: fileGroup,
          totalSize,
          type: fileGroup[0]?.type || "unknown",
          similarity: this.calculateSimilarity(fileGroup, sensitivity),
        };

        analysis.groups.push(group);
        analysis.totalDuplicates += fileGroup.length - 1;
        analysis.totalRecoverableSize += recoverableSize;
      }
    }

    logger.info("Duplicate detection completed", {
      groupsFound: analysis.groups.length,
      totalDuplicates: analysis.totalDuplicates,
      recoverableSize: analysis.totalRecoverableSize,
    });

    return analysis;
  }

  /**
   * Calculate similarity score between files in a group
   */
  private calculateSimilarity(
    files: FileInfo[],
    sensitivity: "low" | "medium" | "high",
  ): number {
    if (files.length < 2) return 1;

    // Simplified similarity calculation
    const baseScore =
      sensitivity === "low" ? 0.85 : sensitivity === "medium" ? 0.9 : 0.95;

    // Adjust based on name similarity
    const names = files.map((f) => f.name);
    const commonChars = this.countCommonChars(names);
    const nameScore = commonChars / Math.max(...names.map((n) => n.length));

    return Math.min(1, baseScore + nameScore * 0.1);
  }

  /**
   * Count common characters in strings
   */
  private countCommonChars(strings: string[]): number {
    if (strings.length === 0) return 0;

    const first = strings[0];
    let common = 0;

    for (const char of first) {
      if (strings.every((s) => s.includes(char))) {
        common++;
      }
    }

    return common;
  }

  /**
   * Clear hash cache to free memory
   */
  clearCache() {
    this.hashCache.clear();
  }
}

export const duplicateEngine = new DuplicateEngine();
