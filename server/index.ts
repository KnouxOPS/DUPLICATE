import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import * as duplicateRoutes from "./routes/duplicate";
import * as trashRoutes from "./routes/trash";
import * as rulesRoutes from "./routes/rules";
import * as previewRoutes from "./routes/preview";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Duplicate Detection Routes
  app.post("/api/duplicates/analyze", duplicateRoutes.analyzeDuplicates);
  app.post("/api/duplicates/file-type", duplicateRoutes.getFileType);
  app.post("/api/duplicates/clear-cache", duplicateRoutes.clearDuplicateCache);

  // Safe Trash Routes
  app.get("/api/trash/status", trashRoutes.getTrashStatus);
  app.post("/api/trash/move", trashRoutes.moveToTrash);
  app.post("/api/trash/restore", trashRoutes.restoreFromTrash);
  app.post("/api/trash/delete", trashRoutes.permanentlyDeleteFromTrash);
  app.post("/api/trash/empty", trashRoutes.emptyTrash);

  // Rules Routes
  app.get("/api/rules", rulesRoutes.getAllRules);
  app.post("/api/rules", rulesRoutes.createRule);
  app.put("/api/rules/:ruleId", rulesRoutes.updateRule);
  app.delete("/api/rules/:ruleId", rulesRoutes.deleteRule);
  app.post("/api/rules/:ruleId/toggle", rulesRoutes.toggleRule);

  // Preview Routes
  app.post("/api/preview/generate", previewRoutes.generatePreview);
  app.post("/api/preview/compare", previewRoutes.compareFiles);
  app.post("/api/preview/batch", previewRoutes.generateBatchPreviews);

  return app;
}
