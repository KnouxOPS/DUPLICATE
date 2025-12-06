import { logger } from './logger.js';
import { metadataExtractor } from './metadataExtractor.js';
import type { FileInfo } from './fileScanner.js';
import type { DuplicateGroup, DuplicateAnalysis } from './duplicateEngine.js';

export interface AIRecommendation {
  action: 'keep_largest' | 'keep_newest' | 'keep_best_quality' | 'keep_custom' | 'review_required';
  confidence: number;
  reason: string;
  keepFile: FileInfo;
  deleteFiles: FileInfo[];
  riskLevel: 'low' | 'medium' | 'high';
  details: string[];
}

export interface AIAnalysisResult {
  groupId: string;
  recommendation: AIRecommendation;
  features: FileFeatures[];
  processingTime: number;
}

export interface FileFeatures {
  path: string;
  name: string;
  size: number;
  sizeScore: number;
  ageScore: number;
  qualityScore: number;
  pathScore: number;
  overallScore: number;
}

export interface AISummary {
  totalGroups: number;
  totalDuplicates: number;
  totalRecoverableSpace: number;
  recommendations: {
    autoCleanSafe: number;
    reviewRecommended: number;
    highRisk: number;
  };
  byType: {
    images: { count: number; space: number };
    videos: { count: number; space: number };
    audio: { count: number; space: number };
    documents: { count: number; space: number };
    other: { count: number; space: number };
  };
  topSuggestions: string[];
  estimatedTimeToClean: number;
}

export interface AIProgress {
  current: number;
  total: number;
  currentFile?: string;
  phase: 'analyzing' | 'scoring' | 'recommending' | 'complete';
  percentage: number;
}

class AIEngine {
  private readonly protectedPaths = [
    'system32',
    'windows',
    'program files',
    'appdata',
    'desktop',
    'documents',
  ];

  private readonly importantExtensions = [
    'exe', 'dll', 'sys', 'ini', 'cfg', 'reg',
  ];

  async analyzeFiles(
    files: FileInfo[],
    onProgress?: (progress: AIProgress) => void
  ): Promise<FileFeatures[]> {
    const features: FileFeatures[] = [];
    const total = files.length;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      onProgress?.({
        current: i + 1,
        total,
        currentFile: file.name,
        phase: 'analyzing',
        percentage: Math.round(((i + 1) / total) * 100),
      });

      const fileFeatures = await this.extractFeatures(file, files);
      features.push(fileFeatures);
    }

    onProgress?.({
      current: total,
      total,
      phase: 'complete',
      percentage: 100,
    });

    logger.info('AI analysis completed', { filesAnalyzed: features.length });

    return features;
  }

  private async extractFeatures(file: FileInfo, allFiles: FileInfo[]): Promise<FileFeatures> {
    const sizeScore = this.calculateSizeScore(file, allFiles);
    const ageScore = this.calculateAgeScore(file, allFiles);
    const qualityScore = await this.calculateQualityScore(file);
    const pathScore = this.calculatePathScore(file);

    const weights = {
      size: 0.3,
      age: 0.2,
      quality: 0.35,
      path: 0.15,
    };

    const overallScore = 
      sizeScore * weights.size +
      ageScore * weights.age +
      qualityScore * weights.quality +
      pathScore * weights.path;

    return {
      path: file.path,
      name: file.name,
      size: file.size,
      sizeScore,
      ageScore,
      qualityScore,
      pathScore,
      overallScore,
    };
  }

  private calculateSizeScore(file: FileInfo, allFiles: FileInfo[]): number {
    const maxSize = Math.max(...allFiles.map(f => f.size));
    if (maxSize === 0) return 50;
    return (file.size / maxSize) * 100;
  }

  private calculateAgeScore(file: FileInfo, allFiles: FileInfo[]): number {
    const maxModified = Math.max(...allFiles.map(f => f.modified));
    const minModified = Math.min(...allFiles.map(f => f.modified));
    const range = maxModified - minModified;

    if (range === 0) return 50;
    return ((file.modified - minModified) / range) * 100;
  }

  private async calculateQualityScore(file: FileInfo): Promise<number> {
    try {
      const metadata = await metadataExtractor.extractMetadata(file.path);
      return metadataExtractor.getQualityScore(metadata);
    } catch {
      return 50;
    }
  }

  private calculatePathScore(file: FileInfo): number {
    const lowerPath = file.path.toLowerCase();
    
    for (const protectedPath of this.protectedPaths) {
      if (lowerPath.includes(protectedPath)) {
        return 20;
      }
    }

    if (lowerPath.includes('original') || lowerPath.includes('backup')) {
      return 90;
    }

    if (lowerPath.includes('copy') || lowerPath.includes('duplicate')) {
      return 30;
    }

    if (lowerPath.includes('temp') || lowerPath.includes('cache')) {
      return 25;
    }

    return 60;
  }

  recommendAction(group: DuplicateGroup): AIRecommendation {
    const files = group.files;
    const fileFeatures: FileFeatures[] = [];

    for (const file of files) {
      const sizeScore = this.calculateSizeScore(file, files);
      const ageScore = this.calculateAgeScore(file, files);
      const pathScore = this.calculatePathScore(file);

      const overallScore = sizeScore * 0.35 + ageScore * 0.25 + pathScore * 0.4;

      fileFeatures.push({
        path: file.path,
        name: file.name,
        size: file.size,
        sizeScore,
        ageScore,
        qualityScore: 50,
        pathScore,
        overallScore,
      });
    }

    fileFeatures.sort((a, b) => b.overallScore - a.overallScore);
    const bestFile = files.find(f => f.path === fileFeatures[0].path)!;
    const deleteFiles = files.filter(f => f.path !== bestFile.path);

    const riskLevel = this.assessRiskLevel(files);
    const confidence = this.calculateConfidence(fileFeatures);

    let action: AIRecommendation['action'];
    let reason: string;

    if (fileFeatures[0].sizeScore > 80) {
      action = 'keep_largest';
      reason = 'Largest file selected as it likely has the best quality';
    } else if (fileFeatures[0].ageScore > 80) {
      action = 'keep_newest';
      reason = 'Newest file selected as it may contain updates';
    } else if (confidence < 60) {
      action = 'review_required';
      reason = 'Files are too similar for automatic decision';
    } else {
      action = 'keep_custom';
      reason = 'Best overall score based on size, age, and path analysis';
    }

    const details: string[] = [];
    details.push(`Selected: ${bestFile.name} (score: ${fileFeatures[0].overallScore.toFixed(1)})`);
    details.push(`Size advantage: ${((bestFile.size / Math.max(...files.map(f => f.size))) * 100).toFixed(0)}%`);
    details.push(`Path safety: ${fileFeatures[0].pathScore > 60 ? 'Safe' : 'Review recommended'}`);

    return {
      action,
      confidence,
      reason,
      keepFile: bestFile,
      deleteFiles,
      riskLevel,
      details,
    };
  }

  private assessRiskLevel(files: FileInfo[]): 'low' | 'medium' | 'high' {
    for (const file of files) {
      const lowerPath = file.path.toLowerCase();
      const ext = file.extension.toLowerCase();

      if (this.importantExtensions.includes(ext)) {
        return 'high';
      }

      for (const protectedPath of this.protectedPaths) {
        if (lowerPath.includes(protectedPath)) {
          return 'high';
        }
      }
    }

    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    if (totalSize > 1024 * 1024 * 1024) {
      return 'medium';
    }

    return 'low';
  }

  private calculateConfidence(features: FileFeatures[]): number {
    if (features.length < 2) return 100;

    const scores = features.map(f => f.overallScore);
    const topScore = scores[0];
    const secondScore = scores[1];

    const gap = topScore - secondScore;
    
    if (gap > 30) return 95;
    if (gap > 20) return 85;
    if (gap > 10) return 70;
    if (gap > 5) return 55;
    return 40;
  }

  generateSummary(analysis: DuplicateAnalysis): AISummary {
    let autoCleanSafe = 0;
    let reviewRecommended = 0;
    let highRisk = 0;

    const byType = {
      images: { count: 0, space: 0 },
      videos: { count: 0, space: 0 },
      audio: { count: 0, space: 0 },
      documents: { count: 0, space: 0 },
      other: { count: 0, space: 0 },
    };

    for (const group of analysis.groups) {
      const recommendation = this.recommendAction(group);
      
      if (recommendation.riskLevel === 'low' && recommendation.confidence > 70) {
        autoCleanSafe++;
      } else if (recommendation.riskLevel === 'high') {
        highRisk++;
      } else {
        reviewRecommended++;
      }

      const typeKey = group.type as keyof typeof byType || 'other';
      if (byType[typeKey]) {
        byType[typeKey].count += group.files.length - 1;
        byType[typeKey].space += group.recoverableSize;
      }
    }

    const topSuggestions: string[] = [];
    
    if (byType.images.count > 0) {
      topSuggestions.push(`Clean ${byType.images.count} duplicate images to save ${this.formatSize(byType.images.space)}`);
    }
    if (byType.videos.count > 0) {
      topSuggestions.push(`Remove ${byType.videos.count} duplicate videos to recover ${this.formatSize(byType.videos.space)}`);
    }
    if (autoCleanSafe > 0) {
      topSuggestions.push(`${autoCleanSafe} duplicate groups can be safely auto-cleaned`);
    }
    if (highRisk > 0) {
      topSuggestions.push(`${highRisk} groups require manual review before deletion`);
    }

    const estimatedTimeToClean = Math.ceil(analysis.totalDuplicates * 0.5);

    return {
      totalGroups: analysis.groups.length,
      totalDuplicates: analysis.totalDuplicates,
      totalRecoverableSpace: analysis.totalRecoverableSize,
      recommendations: {
        autoCleanSafe,
        reviewRecommended,
        highRisk,
      },
      byType,
      topSuggestions,
      estimatedTimeToClean,
    };
  }

  private formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  async safetyCheck(filesToDelete: FileInfo[]): Promise<{
    safe: boolean;
    warnings: string[];
    blockedFiles: FileInfo[];
  }> {
    const warnings: string[] = [];
    const blockedFiles: FileInfo[] = [];

    for (const file of filesToDelete) {
      const lowerPath = file.path.toLowerCase();
      const ext = file.extension.toLowerCase();

      if (this.importantExtensions.includes(ext)) {
        blockedFiles.push(file);
        warnings.push(`System file detected: ${file.name}`);
        continue;
      }

      for (const protectedPath of this.protectedPaths) {
        if (lowerPath.includes(protectedPath)) {
          blockedFiles.push(file);
          warnings.push(`Protected path detected: ${file.path}`);
          break;
        }
      }
    }

    return {
      safe: blockedFiles.length === 0,
      warnings,
      blockedFiles,
    };
  }
}

export const aiEngine = new AIEngine();
