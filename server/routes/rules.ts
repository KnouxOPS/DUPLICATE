import { RequestHandler } from "express";
import { batchRules, RuleType, FileCategory } from "../modules/batchRules";
import { logger } from "../modules/logger";

export const getAllRules: RequestHandler = async (req, res) => {
  try {
    const rules = batchRules.getAllRules();

    res.json({
      success: true,
      data: rules,
    });
  } catch (error) {
    logger.error("Failed to get rules", { error });
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to get rules",
    });
  }
};

export const createRule: RequestHandler = async (req, res) => {
  try {
    const { name, type, category, deletePattern } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: "Name and type are required" });
    }

    const rule = batchRules.createRule(
      name,
      type as RuleType,
      category as FileCategory,
      deletePattern,
    );

    logger.info(`Rule created: ${name}`);

    res.json({
      success: true,
      data: rule,
    });
  } catch (error) {
    logger.error("Failed to create rule", { error });
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to create rule",
    });
  }
};

export const updateRule: RequestHandler = async (req, res) => {
  try {
    const { ruleId } = req.params;
    const updates = req.body;

    const updated = batchRules.updateRule(ruleId, updates);

    if (!updated) {
      return res.status(404).json({ error: "Rule not found" });
    }

    logger.info(`Rule updated: ${ruleId}`);

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    logger.error("Failed to update rule", { error });
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to update rule",
    });
  }
};

export const deleteRule: RequestHandler = async (req, res) => {
  try {
    const { ruleId } = req.params;

    const deleted = batchRules.deleteRule(ruleId);

    if (!deleted) {
      return res.status(404).json({ error: "Rule not found" });
    }

    logger.info(`Rule deleted: ${ruleId}`);

    res.json({
      success: true,
      message: "Rule deleted",
    });
  } catch (error) {
    logger.error("Failed to delete rule", { error });
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to delete rule",
    });
  }
};

export const toggleRule: RequestHandler = async (req, res) => {
  try {
    const { ruleId } = req.params;

    const rule = batchRules.toggleRule(ruleId);

    if (!rule) {
      return res.status(404).json({ error: "Rule not found" });
    }

    logger.info(`Rule toggled: ${ruleId}`);

    res.json({
      success: true,
      data: rule,
    });
  } catch (error) {
    logger.error("Failed to toggle rule", { error });
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to toggle rule",
    });
  }
};
