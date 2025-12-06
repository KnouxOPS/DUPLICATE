import { RequestHandler } from "express";
import { scanner, FileInfo } from "../modules/scanner";
import { duplicateEngine } from "../modules/duplicateEngine";
import { smartSuggest } from "../modules/smartSuggest";
import { logger } from "../modules/logger";

export const analyzeDuplicates: RequestHandler = async (req, res) => {
  try {
    const { files, sensitivity = "high" } = req.body;

    if (!Array.isArray(files)) {
      return res.status(400).json({ error: "Files must be an array" });
    }

    logger.info("Starting duplicate analysis", { fileCount: files.length });

    // Detect duplicates
    const analysis = duplicateEngine.detectDuplicates(files, sensitivity);

    // Get smart suggestions for each group
    const suggestions = analysis.groups.map((group) => ({
      group,
      suggestion: smartSuggest.suggestBestFile(group),
    }));

    res.json({
      success: true,
      data: {
        analysis,
        suggestions,
      },
    });
  } catch (error) {
    logger.error("Duplicate analysis failed", { error });
    res.status(500).json({
      error:
        error instanceof Error ? error.message : "Duplicate analysis failed",
    });
  }
};

export const getFileType: RequestHandler = async (req, res) => {
  try {
    const { extension } = req.body;

    if (!extension) {
      return res.status(400).json({ error: "Extension is required" });
    }

    const type = scanner.getFileType(extension);

    res.json({
      success: true,
      data: { extension, type },
    });
  } catch (error) {
    logger.error("Failed to get file type", { error });
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to get file type",
    });
  }
};

export const clearDuplicateCache: RequestHandler = async (req, res) => {
  try {
    duplicateEngine.clearCache();
    logger.info("Duplicate cache cleared");

    res.json({
      success: true,
      message: "Cache cleared",
    });
  } catch (error) {
    logger.error("Failed to clear cache", { error });
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to clear cache",
    });
  }
};
