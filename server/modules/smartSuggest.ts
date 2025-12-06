import { logger } from "./logger";
import { FileInfo } from "./scanner";
import { DuplicateGroup } from "./duplicateEngine";

export interface FileSuggestion {
  fileIndex: number;
  file: FileInfo;
  score: number;
  reasons: string[];
}

export interface SuggestionResult {
  groupId: string;
  bestFile: FileSuggestion;
  filesToDelete: FileSuggestion[];
}

class SmartSuggest {
  /**
   * Suggest best file to keep in a duplicate group
   */
  suggestBestFile(group: DuplicateGroup): SuggestionResult {
    logger.debug(`Analyzing group ${group.id}`, {
      filesCount: group.files.length,
    });

    const suggestions: FileSuggestion[] = group.files.map((file, index) => ({
      fileIndex: index,
      file,
      score: this.calculateFileScore(file, group.files),
      reasons: this.getScoreReasons(file, group.files),
    }));

    // Sort by score (highest first)
    suggestions.sort((a, b) => b.score - a.score);

    const bestFile = suggestions[0];
    const filesToDelete = suggestions.slice(1);

    logger.info(`Best file suggestion for ${group.id}`, {
      fileName: bestFile.file.name,
      score: bestFile.score,
      reasons: bestFile.reasons,
    });

    return {
      groupId: group.id,
      bestFile,
      filesToDelete,
    };
  }

  /**
   * Calculate score for a file based on various criteria
   */
  private calculateFileScore(file: FileInfo, allFiles: FileInfo[]): number {
    let score = 0;

    // Higher size = better quality (1-25 points)
    const avgSize =
      allFiles.reduce((sum, f) => sum + f.size, 0) / allFiles.length;
    const sizeScore = Math.min(25, (file.size / avgSize) * 25);
    score += sizeScore;

    // Newest file = better (1-25 points)
    const newestFile = allFiles.reduce((a, b) =>
      a.modified > b.modified ? a : b,
    );
    const newestScore =
      file.modified === newestFile.modified
        ? 25
        : (file.modified / newestFile.modified) * 25;
    score += newestScore;

    // File name preference (1-25 points)
    const nameScore = this.scoreFileName(file.name);
    score += nameScore;

    // Higher resolution/quality for images (1-25 points)
    const qualityScore = this.scoreFileQuality(file);
    score += qualityScore;

    return Math.min(100, score);
  }

  /**
   * Score filename based on naming patterns
   */
  private scoreFileName(filename: string): number {
    const lowerName = filename.toLowerCase();

    // Prefer files without duplicates indicators
    const duplicateIndicators = [
      "copy",
      "duplicate",
      "backup",
      "old",
      "temp",
      "test",
      "v1",
      "v2",
      "v3",
    ];

    let score = 25; // Base score

    for (const indicator of duplicateIndicators) {
      if (lowerName.includes(indicator)) {
        score -= 10;
      }
    }

    return Math.max(0, score);
  }

  /**
   * Score file quality based on type and other factors
   */
  private scoreFileQuality(file: FileInfo): number {
    const ext = file.extension.toLowerCase();

    // Image quality indicators
    const imageExtQuality: Record<string, number> = {
      png: 25,
      jpg: 20,
      jpeg: 20,
      gif: 15,
      bmp: 10,
      webp: 22,
    };

    // Video quality indicators
    const videoExtQuality: Record<string, number> = {
      mp4: 25,
      mkv: 24,
      mov: 23,
      avi: 15,
      flv: 10,
      webm: 20,
    };

    const audioExtQuality: Record<string, number> = {
      flac: 25,
      wav: 24,
      mp3: 18,
      aac: 20,
      ogg: 15,
      wma: 12,
    };

    return (
      imageExtQuality[ext] || videoExtQuality[ext] || audioExtQuality[ext] || 10
    );
  }

  /**
   * Get human-readable reasons for the suggestion
   */
  private getScoreReasons(file: FileInfo, allFiles: FileInfo[]): string[] {
    const reasons: string[] = [];

    const avgSize =
      allFiles.reduce((sum, f) => sum + f.size, 0) / allFiles.length;
    if (file.size > avgSize) {
      reasons.push("Larger file size");
    }

    const newestFile = allFiles.reduce((a, b) =>
      a.modified > b.modified ? a : b,
    );
    if (file.modified === newestFile.modified) {
      reasons.push("Most recent file");
    }

    const lowerName = file.name.toLowerCase();
    if (!lowerName.includes("copy") && !lowerName.includes("duplicate")) {
      reasons.push("Clean filename");
    }

    return reasons.length > 0 ? reasons : ["Standard quality file"];
  }
}

export const smartSuggest = new SmartSuggest();
