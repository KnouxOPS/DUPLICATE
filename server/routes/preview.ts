import { RequestHandler } from "express";
import { previewEngine } from "../modules/previewEngine";
import { logger } from "../modules/logger";
import { FileInfo } from "../modules/scanner";

export const generatePreview: RequestHandler = async (req, res) => {
  try {
    const { file } = req.body;

    if (!file || !file.path) {
      return res.status(400).json({ error: "File path is required" });
    }

    const preview = previewEngine.generatePreview(file);

    res.json({
      success: true,
      data: preview,
    });
  } catch (error) {
    logger.error("Failed to generate preview", { error });
    res.status(500).json({
      error:
        error instanceof Error ? error.message : "Failed to generate preview",
    });
  }
};

export const compareFiles: RequestHandler = async (req, res) => {
  try {
    const { file1, file2 } = req.body;

    if (!file1 || !file2) {
      return res
        .status(400)
        .json({ error: "Both files are required for comparison" });
    }

    const comparison = previewEngine.compareFiles(file1, file2);

    res.json({
      success: true,
      data: comparison,
    });
  } catch (error) {
    logger.error("Failed to compare files", { error });
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to compare files",
    });
  }
};

export const generateBatchPreviews: RequestHandler = async (req, res) => {
  try {
    const { files } = req.body;

    if (!Array.isArray(files)) {
      return res.status(400).json({ error: "Files must be an array" });
    }

    const previews = files.map((file: FileInfo) =>
      previewEngine.generatePreview(file),
    );

    res.json({
      success: true,
      data: previews,
    });
  } catch (error) {
    logger.error("Failed to generate batch previews", { error });
    res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to generate batch previews",
    });
  }
};
