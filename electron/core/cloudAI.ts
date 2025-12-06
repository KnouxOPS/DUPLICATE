import OpenAI from 'openai';
import { logger } from './logger.js';
import type { FileInfo } from './fileScanner.js';
import type { DuplicateGroup, DuplicateAnalysis } from './duplicateEngine.js';

export interface CloudAIRecommendation {
  action: 'keep_largest' | 'keep_newest' | 'keep_best_quality' | 'keep_custom' | 'review_required';
  confidence: number;
  reason: string;
  keepFile: FileInfo;
  deleteFiles: FileInfo[];
  riskLevel: 'low' | 'medium' | 'high';
  aiExplanation: string;
  suggestions: string[];
}

export interface CloudAIAnalysis {
  groupId: string;
  recommendation: CloudAIRecommendation;
  processingTime: number;
  modelUsed: string;
}

export interface CloudAISummary {
  totalGroups: number;
  totalDuplicates: number;
  totalRecoverableSpace: number;
  aiInsights: string[];
  recommendations: {
    autoCleanSafe: number;
    reviewRecommended: number;
    highRisk: number;
  };
  topSuggestions: string[];
  estimatedSavings: string;
}

class CloudAIEngine {
  private openai: OpenAI | null = null;
  private initialized = false;
  private readonly modelName = 'gpt-4o';

  private async ensureInitialized(): Promise<boolean> {
    if (this.initialized && this.openai) return true;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      logger.warn('OpenAI API key not found. Cloud AI features disabled.');
      return false;
    }

    try {
      this.openai = new OpenAI({ apiKey });
      this.initialized = true;
      logger.info('Cloud AI Engine initialized with OpenAI');
      return true;
    } catch (error) {
      logger.error('Failed to initialize OpenAI', { error: String(error) });
      return false;
    }
  }

  async isAvailable(): Promise<boolean> {
    return await this.ensureInitialized();
  }

  async analyzeGroup(group: DuplicateGroup): Promise<CloudAIAnalysis | null> {
    if (!await this.ensureInitialized() || !this.openai) {
      return null;
    }

    const startTime = Date.now();

    try {
      const filesDescription = group.files.map((f, i) => ({
        index: i + 1,
        name: f.name,
        path: f.path,
        size: this.formatSize(f.size),
        sizeBytes: f.size,
        type: f.type,
        modified: new Date(f.modified).toISOString(),
        extension: f.extension,
      }));

      const prompt = `You are an expert file management AI. Analyze these duplicate files and recommend which one to keep.

DUPLICATE GROUP:
- Type: ${group.type}
- Total Size: ${this.formatSize(group.totalSize)}
- Recoverable Space: ${this.formatSize(group.recoverableSize)}
- File Count: ${group.files.length}

FILES:
${JSON.stringify(filesDescription, null, 2)}

Analyze these files and provide a recommendation in JSON format:
{
  "keepFileIndex": <number 1-${group.files.length}>,
  "action": "keep_largest" | "keep_newest" | "keep_best_quality" | "keep_custom" | "review_required",
  "confidence": <number 0-100>,
  "riskLevel": "low" | "medium" | "high",
  "reason": "<brief reason for decision>",
  "aiExplanation": "<detailed explanation of analysis>",
  "suggestions": ["<suggestion 1>", "<suggestion 2>"]
}

Consider:
1. File size (larger often means better quality)
2. Modification date (newer may have updates)
3. File path (original folders vs temp/cache)
4. File name patterns (original vs copy)`;

      const response = await this.openai.chat.completions.create({
        model: this.modelName,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        max_tokens: 1024,
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('Empty response from OpenAI');
      }

      const result = JSON.parse(content);
      const keepIndex = Math.max(0, Math.min(result.keepFileIndex - 1, group.files.length - 1));
      const keepFile = group.files[keepIndex];
      const deleteFiles = group.files.filter((_, i) => i !== keepIndex);

      logger.info('Cloud AI analyzed group', {
        groupId: group.id,
        action: result.action,
        confidence: result.confidence,
      });

      return {
        groupId: group.id,
        recommendation: {
          action: result.action,
          confidence: result.confidence,
          reason: result.reason,
          keepFile,
          deleteFiles,
          riskLevel: result.riskLevel,
          aiExplanation: result.aiExplanation,
          suggestions: result.suggestions || [],
        },
        processingTime: Date.now() - startTime,
        modelUsed: this.modelName,
      };
    } catch (error) {
      logger.error('Cloud AI analysis failed', { error: String(error) });
      return null;
    }
  }

  async generateSmartSummary(analysis: DuplicateAnalysis): Promise<CloudAISummary | null> {
    if (!await this.ensureInitialized() || !this.openai) {
      return null;
    }

    try {
      const summary = {
        totalGroups: analysis.groups.length,
        totalDuplicates: analysis.totalDuplicates,
        totalRecoverableSize: this.formatSize(analysis.totalRecoverableSize),
        byType: analysis.byType,
        scanDuration: analysis.scanDuration,
        sampleGroups: analysis.groups.slice(0, 5).map(g => ({
          type: g.type,
          fileCount: g.files.length,
          recoverableSize: this.formatSize(g.recoverableSize),
          fileNames: g.files.map(f => f.name),
        })),
      };

      const prompt = `You are a file organization expert. Analyze this duplicate file scan summary and provide insights.

SCAN SUMMARY:
${JSON.stringify(summary, null, 2)}

Provide a response in JSON format:
{
  "aiInsights": ["<insight 1>", "<insight 2>", "<insight 3>"],
  "autoCleanSafe": <number of groups safe for auto-clean>,
  "reviewRecommended": <number of groups needing review>,
  "highRisk": <number of high-risk groups>,
  "topSuggestions": ["<suggestion 1>", "<suggestion 2>", "<suggestion 3>"],
  "estimatedSavings": "<human readable storage savings>"
}

Focus on:
1. Patterns in duplicate files
2. Safety recommendations
3. Storage optimization tips
4. Best practices for file management`;

      const response = await this.openai.chat.completions.create({
        model: this.modelName,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        max_tokens: 1024,
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('Empty response from OpenAI');
      }

      const result = JSON.parse(content);

      return {
        totalGroups: analysis.groups.length,
        totalDuplicates: analysis.totalDuplicates,
        totalRecoverableSpace: analysis.totalRecoverableSize,
        aiInsights: result.aiInsights || [],
        recommendations: {
          autoCleanSafe: result.autoCleanSafe || 0,
          reviewRecommended: result.reviewRecommended || 0,
          highRisk: result.highRisk || 0,
        },
        topSuggestions: result.topSuggestions || [],
        estimatedSavings: result.estimatedSavings || this.formatSize(analysis.totalRecoverableSize),
      };
    } catch (error) {
      logger.error('Cloud AI summary generation failed', { error: String(error) });
      return null;
    }
  }

  async askAboutFiles(question: string, files: FileInfo[]): Promise<string | null> {
    if (!await this.ensureInitialized() || !this.openai) {
      return null;
    }

    try {
      const filesData = files.map(f => ({
        name: f.name,
        path: f.path,
        size: this.formatSize(f.size),
        type: f.type,
        modified: new Date(f.modified).toISOString(),
      }));

      const prompt = `You are a helpful file management assistant. Answer the user's question about these files.

FILES:
${JSON.stringify(filesData, null, 2)}

USER QUESTION: ${question}

Provide a helpful, concise answer focused on the files provided.`;

      const response = await this.openai.chat.completions.create({
        model: this.modelName,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 512,
      });

      return response.choices[0].message.content;
    } catch (error) {
      logger.error('Cloud AI question failed', { error: String(error) });
      return null;
    }
  }

  async getCleanupStrategy(analysis: DuplicateAnalysis): Promise<{
    strategy: string;
    steps: string[];
    warnings: string[];
    estimatedTime: string;
  } | null> {
    if (!await this.ensureInitialized() || !this.openai) {
      return null;
    }

    try {
      const prompt = `You are a file cleanup expert. Create a cleanup strategy for this duplicate file analysis.

ANALYSIS:
- Total Duplicate Groups: ${analysis.groups.length}
- Total Duplicates: ${analysis.totalDuplicates}
- Recoverable Space: ${this.formatSize(analysis.totalRecoverableSize)}
- By Type: Images=${analysis.byType.images}, Videos=${analysis.byType.videos}, Audio=${analysis.byType.audio}, Documents=${analysis.byType.documents}

Provide a response in JSON format:
{
  "strategy": "<overall strategy name>",
  "steps": ["<step 1>", "<step 2>", "<step 3>", "<step 4>"],
  "warnings": ["<warning 1>", "<warning 2>"],
  "estimatedTime": "<human readable time estimate>"
}`;

      const response = await this.openai.chat.completions.create({
        model: this.modelName,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        max_tokens: 512,
      });

      const content = response.choices[0].message.content;
      if (!content) return null;

      return JSON.parse(content);
    } catch (error) {
      logger.error('Cloud AI strategy generation failed', { error: String(error) });
      return null;
    }
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
}

export const cloudAI = new CloudAIEngine();
