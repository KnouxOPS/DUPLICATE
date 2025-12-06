import { logger } from "./logger";
import { FileInfo } from "./scanner";
import { DuplicateGroup } from "./duplicateEngine";

export type RuleType =
  | "keep_largest"
  | "keep_newest"
  | "keep_smallest"
  | "keep_best_quality"
  | "delete_pattern";
export type FileCategory = "image" | "video" | "document" | "audio" | "all";

export interface BatchRule {
  id: string;
  name: string;
  type: RuleType;
  category: FileCategory;
  enabled: boolean;
  deletePattern?: string;
  description: string;
}

export interface RuleApplication {
  ruleId: string;
  groupId: string;
  filesToKeep: FileInfo[];
  filesToDelete: FileInfo[];
  reason: string;
}

class BatchRules {
  private rules: Map<string, BatchRule> = new Map();
  private ruleCounter = 0;

  /**
   * Create a new rule
   */
  createRule(
    name: string,
    type: RuleType,
    category: FileCategory = "all",
    deletePattern?: string,
  ): BatchRule {
    const rule: BatchRule = {
      id: `rule-${this.ruleCounter++}`,
      name,
      type,
      category,
      enabled: true,
      deletePattern,
      description: this.getRuleDescription(type, category),
    };

    this.rules.set(rule.id, rule);

    logger.info(`Rule created: ${name}`, {
      id: rule.id,
      type,
      category,
    });

    return rule;
  }

  /**
   * Get all rules
   */
  getAllRules(): BatchRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Get rule by ID
   */
  getRule(ruleId: string): BatchRule | null {
    return this.rules.get(ruleId) || null;
  }

  /**
   * Update rule
   */
  updateRule(ruleId: string, updates: Partial<BatchRule>): BatchRule | null {
    const rule = this.rules.get(ruleId);

    if (!rule) {
      logger.warn(`Rule not found: ${ruleId}`);
      return null;
    }

    const updated = { ...rule, ...updates };
    this.rules.set(ruleId, updated);

    logger.info(`Rule updated: ${rule.name}`, { id: ruleId });

    return updated;
  }

  /**
   * Delete rule
   */
  deleteRule(ruleId: string): boolean {
    const deleted = this.rules.delete(ruleId);

    if (deleted) {
      logger.info(`Rule deleted`, { id: ruleId });
    }

    return deleted;
  }

  /**
   * Toggle rule on/off
   */
  toggleRule(ruleId: string): BatchRule | null {
    const rule = this.rules.get(ruleId);

    if (!rule) return null;

    rule.enabled = !rule.enabled;

    logger.info(`Rule toggled: ${rule.name}`, {
      id: ruleId,
      enabled: rule.enabled,
    });

    return rule;
  }

  /**
   * Apply rules to duplicate groups
   */
  applyRulesToGroups(groups: DuplicateGroup[]): RuleApplication[] {
    const applications: RuleApplication[] = [];
    const enabledRules = Array.from(this.rules.values()).filter(
      (r) => r.enabled,
    );

    for (const group of groups) {
      for (const rule of enabledRules) {
        // Skip if rule doesn't apply to this file type
        if (rule.category !== "all" && group.type !== rule.category) {
          continue;
        }

        const application = this.applyRuleToGroup(rule, group);

        if (application.filesToDelete.length > 0) {
          applications.push(application);
          logger.info(`Rule applied to group ${group.id}: ${rule.name}`, {
            ruleId: rule.id,
            filesToDelete: application.filesToDelete.length,
          });
        }
      }
    }

    return applications;
  }

  /**
   * Apply a single rule to a group
   */
  private applyRuleToGroup(
    rule: BatchRule,
    group: DuplicateGroup,
  ): RuleApplication {
    let filesToKeep: FileInfo[] = [];
    let filesToDelete: FileInfo[] = [];
    let reason = "";

    switch (rule.type) {
      case "keep_largest":
        const largest = group.files.reduce((a, b) => (a.size > b.size ? a : b));
        filesToKeep = [largest];
        filesToDelete = group.files.filter((f) => f.path !== largest.path);
        reason = `Keep largest file: ${largest.name}`;
        break;

      case "keep_newest":
        const newest = group.files.reduce((a, b) =>
          a.modified > b.modified ? a : b,
        );
        filesToKeep = [newest];
        filesToDelete = group.files.filter((f) => f.path !== newest.path);
        reason = `Keep newest file: ${newest.name}`;
        break;

      case "keep_smallest":
        const smallest = group.files.reduce((a, b) =>
          a.size < b.size ? a : b,
        );
        filesToKeep = [smallest];
        filesToDelete = group.files.filter((f) => f.path !== smallest.path);
        reason = `Keep smallest file: ${smallest.name}`;
        break;

      case "keep_best_quality":
        // For simplicity, treat as keep_largest
        const best = group.files.reduce((a, b) => (a.size > b.size ? a : b));
        filesToKeep = [best];
        filesToDelete = group.files.filter((f) => f.path !== best.path);
        reason = `Keep best quality file: ${best.name}`;
        break;

      case "delete_pattern":
        if (rule.deletePattern) {
          const pattern = new RegExp(rule.deletePattern);
          filesToDelete = group.files.filter((f) => pattern.test(f.name));
          filesToKeep = group.files.filter((f) => !pattern.test(f.name));
          reason = `Delete files matching pattern: ${rule.deletePattern}`;
        }
        break;
    }

    return {
      ruleId: rule.id,
      groupId: group.id,
      filesToKeep,
      filesToDelete,
      reason,
    };
  }

  /**
   * Get description for a rule type
   */
  private getRuleDescription(type: RuleType, category: FileCategory): string {
    const categoryText = category === "all" ? "files" : `${category} files`;

    switch (type) {
      case "keep_largest":
        return `Keep the largest ${categoryText} and delete duplicates`;
      case "keep_newest":
        return `Keep the newest ${categoryText} and delete older duplicates`;
      case "keep_smallest":
        return `Keep the smallest ${categoryText} and delete larger duplicates`;
      case "keep_best_quality":
        return `Keep the highest quality ${categoryText} and delete lower quality duplicates`;
      case "delete_pattern":
        return `Delete ${categoryText} matching a specific pattern`;
      default:
        return "Unknown rule type";
    }
  }
}

export const batchRules = new BatchRules();
