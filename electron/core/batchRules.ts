import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import { logger } from './logger.js';
import { metadataExtractor } from './metadataExtractor.js';
import { safeTrash } from './safeTrash.js';
import type { FileInfo } from './fileScanner.js';
import type { DuplicateGroup } from './duplicateEngine.js';

export type RuleType =
  | 'keep_largest'
  | 'keep_newest'
  | 'keep_oldest'
  | 'keep_smallest'
  | 'keep_best_quality'
  | 'keep_by_path'
  | 'delete_pattern';

export type FileCategory = 'image' | 'video' | 'document' | 'audio' | 'all';
export type RuleAction = 'trash' | 'delete' | 'mark';

export interface BatchRule {
  id: string;
  name: string;
  type: RuleType;
  category: FileCategory;
  action: RuleAction;
  enabled: boolean;
  priority: number;
  deletePattern?: string;
  priorityPaths?: string[];
  description: string;
  createdAt: string;
  lastUsed?: string;
  timesApplied: number;
}

export interface RuleApplication {
  ruleId: string;
  ruleName: string;
  groupId: string;
  filesToKeep: FileInfo[];
  filesToDelete: FileInfo[];
  reason: string;
  applied: boolean;
  error?: string;
}

export interface RulesProgress {
  current: number;
  total: number;
  currentRule: string;
  groupsProcessed: number;
  filesProcessed: number;
  percentage: number;
}

class BatchRules {
  private rules: Map<string, BatchRule> = new Map();
  private ruleCounter = 0;
  private rulesPath: string = '';
  private initialized = false;

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;

    try {
      const userDataPath = app?.getPath?.('userData') || process.env.APPDATA || path.join(process.env.HOME || '', '.knoux');
      this.rulesPath = path.join(userDataPath, 'Knoux', 'rules.json');
      this.loadRules();
      this.initialized = true;
    } catch (error) {
      logger.error('Failed to initialize Batch Rules', { error: String(error) });
    }
  }

  private loadRules(): void {
    try {
      if (fs.existsSync(this.rulesPath)) {
        const data = fs.readFileSync(this.rulesPath, 'utf-8');
        const rules: BatchRule[] = JSON.parse(data);
        this.rules.clear();
        
        for (const rule of rules) {
          this.rules.set(rule.id, rule);
          const idNum = parseInt(rule.id.replace('rule-', ''));
          if (!isNaN(idNum) && idNum >= this.ruleCounter) {
            this.ruleCounter = idNum + 1;
          }
        }
      } else {
        this.createDefaultRules();
      }
    } catch (error) {
      logger.warn('Failed to load rules', { error: String(error) });
      this.createDefaultRules();
    }
  }

  private saveRules(): void {
    try {
      const dir = path.dirname(this.rulesPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      const rules = Array.from(this.rules.values());
      fs.writeFileSync(this.rulesPath, JSON.stringify(rules, null, 2));
    } catch (error) {
      logger.error('Failed to save rules', { error: String(error) });
    }
  }

  private createDefaultRules(): void {
    const defaultRules: Omit<BatchRule, 'id' | 'createdAt' | 'timesApplied'>[] = [
      {
        name: 'Keep Largest File',
        type: 'keep_largest',
        category: 'all',
        action: 'trash',
        enabled: true,
        priority: 1,
        description: 'Keep the largest file and move duplicates to Safe Trash',
      },
      {
        name: 'Keep Newest File',
        type: 'keep_newest',
        category: 'all',
        action: 'trash',
        enabled: false,
        priority: 2,
        description: 'Keep the most recently modified file',
      },
      {
        name: 'Keep Best Quality Images',
        type: 'keep_best_quality',
        category: 'image',
        action: 'trash',
        enabled: false,
        priority: 3,
        description: 'Keep the highest resolution image',
      },
      {
        name: 'Keep Best Quality Videos',
        type: 'keep_best_quality',
        category: 'video',
        action: 'trash',
        enabled: false,
        priority: 4,
        description: 'Keep the highest quality video',
      },
    ];

    for (const rule of defaultRules) {
      this.createRule(rule);
    }
  }

  createRule(ruleData: Omit<BatchRule, 'id' | 'createdAt' | 'timesApplied'>): BatchRule {
    const rule: BatchRule = {
      ...ruleData,
      id: `rule-${this.ruleCounter++}`,
      createdAt: new Date().toISOString(),
      timesApplied: 0,
    };

    this.rules.set(rule.id, rule);
    this.saveRules();

    logger.info('Rule created', { id: rule.id, name: rule.name, type: rule.type });

    return rule;
  }

  getAllRules(): BatchRule[] {
    this.ensureInitialized();
    return Array.from(this.rules.values()).sort((a, b) => a.priority - b.priority);
  }

  getRule(ruleId: string): BatchRule | null {
    return this.rules.get(ruleId) || null;
  }

  updateRule(ruleId: string, updates: Partial<BatchRule>): BatchRule | null {
    const rule = this.rules.get(ruleId);

    if (!rule) {
      logger.warn('Rule not found for update', { ruleId });
      return null;
    }

    const updated = { ...rule, ...updates, id: rule.id };
    this.rules.set(ruleId, updated);
    this.saveRules();

    logger.info('Rule updated', { id: ruleId, name: updated.name });

    return updated;
  }

  deleteRule(ruleId: string): boolean {
    const deleted = this.rules.delete(ruleId);
    
    if (deleted) {
      this.saveRules();
      logger.info('Rule deleted', { ruleId });
    }

    return deleted;
  }

  toggleRule(ruleId: string): BatchRule | null {
    const rule = this.rules.get(ruleId);

    if (!rule) return null;

    rule.enabled = !rule.enabled;
    this.saveRules();

    logger.info('Rule toggled', { id: ruleId, enabled: rule.enabled });

    return rule;
  }

  async applyRulesToGroups(
    groups: DuplicateGroup[],
    onProgress?: (progress: RulesProgress) => void
  ): Promise<RuleApplication[]> {
    await this.ensureInitialized();

    const applications: RuleApplication[] = [];
    const enabledRules = Array.from(this.rules.values())
      .filter(r => r.enabled)
      .sort((a, b) => a.priority - b.priority);

    if (enabledRules.length === 0) {
      logger.warn('No enabled rules to apply');
      return applications;
    }

    const totalOperations = groups.length * enabledRules.length;
    let currentOperation = 0;
    let filesProcessed = 0;

    for (const group of groups) {
      for (const rule of enabledRules) {
        currentOperation++;

        onProgress?.({
          current: currentOperation,
          total: totalOperations,
          currentRule: rule.name,
          groupsProcessed: Math.floor(currentOperation / enabledRules.length),
          filesProcessed,
          percentage: Math.round((currentOperation / totalOperations) * 100),
        });

        if (rule.category !== 'all' && group.type !== rule.category) {
          continue;
        }

        const application = await this.applyRuleToGroup(rule, group);
        
        if (application.filesToDelete.length > 0) {
          applications.push(application);
          filesProcessed += application.filesToDelete.length;

          rule.timesApplied++;
          rule.lastUsed = new Date().toISOString();
        }
      }
    }

    this.saveRules();

    logger.info('Rules applied to groups', {
      rulesApplied: enabledRules.length,
      groupsProcessed: groups.length,
      applicationsGenerated: applications.length,
    });

    return applications;
  }

  private async applyRuleToGroup(rule: BatchRule, group: DuplicateGroup): Promise<RuleApplication> {
    let filesToKeep: FileInfo[] = [];
    let filesToDelete: FileInfo[] = [];
    let reason = '';

    try {
      switch (rule.type) {
        case 'keep_largest':
          ({ filesToKeep, filesToDelete, reason } = this.applyKeepLargest(group.files));
          break;

        case 'keep_newest':
          ({ filesToKeep, filesToDelete, reason } = this.applyKeepNewest(group.files));
          break;

        case 'keep_oldest':
          ({ filesToKeep, filesToDelete, reason } = this.applyKeepOldest(group.files));
          break;

        case 'keep_smallest':
          ({ filesToKeep, filesToDelete, reason } = this.applyKeepSmallest(group.files));
          break;

        case 'keep_best_quality':
          ({ filesToKeep, filesToDelete, reason } = await this.applyKeepBestQuality(group.files, group.type));
          break;

        case 'keep_by_path':
          ({ filesToKeep, filesToDelete, reason } = this.applyKeepByPath(group.files, rule.priorityPaths || []));
          break;

        case 'delete_pattern':
          if (rule.deletePattern) {
            ({ filesToKeep, filesToDelete, reason } = this.applyDeletePattern(group.files, rule.deletePattern));
          }
          break;
      }

      if (filesToDelete.length > 0 && rule.action === 'trash') {
        await safeTrash.moveToTrash(filesToDelete);
      }

      return {
        ruleId: rule.id,
        ruleName: rule.name,
        groupId: group.id,
        filesToKeep,
        filesToDelete,
        reason,
        applied: true,
      };
    } catch (error) {
      return {
        ruleId: rule.id,
        ruleName: rule.name,
        groupId: group.id,
        filesToKeep: [],
        filesToDelete: [],
        reason: '',
        applied: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private applyKeepLargest(files: FileInfo[]): { filesToKeep: FileInfo[]; filesToDelete: FileInfo[]; reason: string } {
    const largest = files.reduce((a, b) => (a.size > b.size ? a : b));
    return {
      filesToKeep: [largest],
      filesToDelete: files.filter(f => f.path !== largest.path),
      reason: `Keeping largest file: ${largest.name} (${this.formatSize(largest.size)})`,
    };
  }

  private applyKeepNewest(files: FileInfo[]): { filesToKeep: FileInfo[]; filesToDelete: FileInfo[]; reason: string } {
    const newest = files.reduce((a, b) => (a.modified > b.modified ? a : b));
    return {
      filesToKeep: [newest],
      filesToDelete: files.filter(f => f.path !== newest.path),
      reason: `Keeping newest file: ${newest.name}`,
    };
  }

  private applyKeepOldest(files: FileInfo[]): { filesToKeep: FileInfo[]; filesToDelete: FileInfo[]; reason: string } {
    const oldest = files.reduce((a, b) => (a.modified < b.modified ? a : b));
    return {
      filesToKeep: [oldest],
      filesToDelete: files.filter(f => f.path !== oldest.path),
      reason: `Keeping oldest file: ${oldest.name}`,
    };
  }

  private applyKeepSmallest(files: FileInfo[]): { filesToKeep: FileInfo[]; filesToDelete: FileInfo[]; reason: string } {
    const smallest = files.reduce((a, b) => (a.size < b.size ? a : b));
    return {
      filesToKeep: [smallest],
      filesToDelete: files.filter(f => f.path !== smallest.path),
      reason: `Keeping smallest file: ${smallest.name} (${this.formatSize(smallest.size)})`,
    };
  }

  private async applyKeepBestQuality(files: FileInfo[], type: string): Promise<{ filesToKeep: FileInfo[]; filesToDelete: FileInfo[]; reason: string }> {
    const filesWithQuality: { file: FileInfo; quality: number }[] = [];

    for (const file of files) {
      const metadata = await metadataExtractor.extractMetadata(file.path);
      const quality = metadataExtractor.getQualityScore(metadata);
      filesWithQuality.push({ file, quality });
    }

    filesWithQuality.sort((a, b) => b.quality - a.quality);
    const best = filesWithQuality[0];

    return {
      filesToKeep: [best.file],
      filesToDelete: filesWithQuality.slice(1).map(f => f.file),
      reason: `Keeping best quality ${type}: ${best.file.name} (score: ${best.quality})`,
    };
  }

  private applyKeepByPath(files: FileInfo[], priorityPaths: string[]): { filesToKeep: FileInfo[]; filesToDelete: FileInfo[]; reason: string } {
    for (const priorityPath of priorityPaths) {
      const matching = files.find(f => f.path.toLowerCase().includes(priorityPath.toLowerCase()));
      if (matching) {
        return {
          filesToKeep: [matching],
          filesToDelete: files.filter(f => f.path !== matching.path),
          reason: `Keeping file from priority path: ${matching.name}`,
        };
      }
    }

    return this.applyKeepLargest(files);
  }

  private applyDeletePattern(files: FileInfo[], pattern: string): { filesToKeep: FileInfo[]; filesToDelete: FileInfo[]; reason: string } {
    const regex = new RegExp(pattern, 'i');
    const filesToDelete = files.filter(f => regex.test(f.name));
    const filesToKeep = files.filter(f => !regex.test(f.name));

    return {
      filesToKeep,
      filesToDelete,
      reason: `Deleted files matching pattern: ${pattern}`,
    };
  }

  private formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  getRuleDescription(type: RuleType, category: FileCategory): string {
    const categoryText = category === 'all' ? 'files' : `${category} files`;

    switch (type) {
      case 'keep_largest':
        return `Keep the largest ${categoryText} and delete duplicates`;
      case 'keep_newest':
        return `Keep the newest ${categoryText} and delete older duplicates`;
      case 'keep_oldest':
        return `Keep the oldest ${categoryText} and delete newer duplicates`;
      case 'keep_smallest':
        return `Keep the smallest ${categoryText} and delete larger duplicates`;
      case 'keep_best_quality':
        return `Keep the highest quality ${categoryText} and delete lower quality duplicates`;
      case 'keep_by_path':
        return `Keep ${categoryText} from priority paths`;
      case 'delete_pattern':
        return `Delete ${categoryText} matching a specific pattern`;
      default:
        return 'Unknown rule type';
    }
  }
}

export const batchRules = new BatchRules();
