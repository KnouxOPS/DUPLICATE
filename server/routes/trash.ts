import { RequestHandler } from "express";
import { safeTrash } from "../modules/safeTrash";
import { logger } from "../modules/logger";
import { FileInfo } from "../modules/scanner";

export const getTrashStatus: RequestHandler = async (req, res) => {
  try {
    const status = safeTrash.getTrashStatus();

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    logger.error("Failed to get trash status", { error });
    res.status(500).json({
      error:
        error instanceof Error ? error.message : "Failed to get trash status",
    });
  }
};

export const moveToTrash: RequestHandler = async (req, res) => {
  try {
    const { files } = req.body;

    if (!Array.isArray(files)) {
      return res.status(400).json({ error: "Files must be an array" });
    }

    const trashEntries = safeTrash.moveMultipleToTrash(files);

    logger.info(`${files.length} files moved to trash`);

    res.json({
      success: true,
      data: {
        trashEntries,
        count: trashEntries.length,
      },
    });
  } catch (error) {
    logger.error("Failed to move files to trash", { error });
    res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to move files to trash",
    });
  }
};

export const restoreFromTrash: RequestHandler = async (req, res) => {
  try {
    const { trashId } = req.body;

    if (!trashId) {
      return res.status(400).json({ error: "Trash ID is required" });
    }

    const entry = safeTrash.restoreFromTrash(trashId);

    if (!entry) {
      return res.status(404).json({ error: "Trash entry not found" });
    }

    logger.info(`File restored from trash: ${entry.fileName}`);

    res.json({
      success: true,
      data: entry,
    });
  } catch (error) {
    logger.error("Failed to restore file", { error });
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to restore file",
    });
  }
};

export const permanentlyDeleteFromTrash: RequestHandler = async (req, res) => {
  try {
    const { trashIds } = req.body;

    if (!Array.isArray(trashIds)) {
      return res.status(400).json({ error: "Trash IDs must be an array" });
    }

    const deleted = safeTrash.permanentlyDelete(trashIds);

    logger.info(`${deleted.length} files permanently deleted`);

    res.json({
      success: true,
      data: {
        deletedIds: deleted,
        count: deleted.length,
      },
    });
  } catch (error) {
    logger.error("Failed to permanently delete files", { error });
    res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to permanently delete files",
    });
  }
};

export const emptyTrash: RequestHandler = async (req, res) => {
  try {
    const count = safeTrash.emptyTrash();

    logger.info(`Trash emptied - ${count} files deleted`);

    res.json({
      success: true,
      data: {
        deletedCount: count,
        message: `Emptied ${count} files from trash`,
      },
    });
  } catch (error) {
    logger.error("Failed to empty trash", { error });
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to empty trash",
    });
  }
};
