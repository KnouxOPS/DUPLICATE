import type { FileType, DuplicateGroup, BatchRule, TrashEntry } from "@shared/api";

const API_BASE = "/api";

export interface FileInfo {
  id: string;
  path: string;
  name: string;
  type: FileType;
  size: number;
  modified: number;
  created: number;
  extension?: string;
  hash?: string;
}

export interface ScanAnalysis {
  groups: DuplicateGroup[];
  totalDuplicates: number;
  totalRecoverableSize: number;
}

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

export interface AnalyzeResponse {
  success: boolean;
  data: {
    analysis: ScanAnalysis;
    suggestions: Array<{
      group: DuplicateGroup;
      suggestion: SuggestionResult;
    }>;
  };
}

export interface TrashStatusResponse {
  success: boolean;
  data: {
    entries: TrashEntry[];
    totalSize: number;
    totalCount: number;
  };
}

export interface RulesResponse {
  success: boolean;
  data: {
    rules: BatchRule[];
  };
}

export async function analyzeDuplicates(
  files: FileInfo[],
  sensitivity: "low" | "medium" | "high" = "high"
): Promise<AnalyzeResponse> {
  const response = await fetch(`${API_BASE}/duplicates/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ files, sensitivity }),
  });

  if (!response.ok) {
    throw new Error("Failed to analyze duplicates");
  }

  return response.json();
}

export async function moveToTrash(filePaths: string[]): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE}/trash/move`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ files: filePaths }),
  });

  if (!response.ok) {
    throw new Error("Failed to move files to trash");
  }

  return response.json();
}

export async function restoreFromTrash(trashIds: string[]): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE}/trash/restore`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids: trashIds }),
  });

  if (!response.ok) {
    throw new Error("Failed to restore files from trash");
  }

  return response.json();
}

export async function getTrashStatus(): Promise<TrashStatusResponse> {
  const response = await fetch(`${API_BASE}/trash/status`);

  if (!response.ok) {
    throw new Error("Failed to get trash status");
  }

  return response.json();
}

export async function permanentlyDeleteFromTrash(trashIds: string[]): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE}/trash/delete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids: trashIds }),
  });

  if (!response.ok) {
    throw new Error("Failed to permanently delete files");
  }

  return response.json();
}

export async function emptyTrash(): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE}/trash/empty`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Failed to empty trash");
  }

  return response.json();
}

export async function getRules(): Promise<RulesResponse> {
  const response = await fetch(`${API_BASE}/rules`);

  if (!response.ok) {
    throw new Error("Failed to get rules");
  }

  return response.json();
}

export async function createRule(rule: Omit<BatchRule, "id">): Promise<{ success: boolean; data: BatchRule }> {
  const response = await fetch(`${API_BASE}/rules`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(rule),
  });

  if (!response.ok) {
    throw new Error("Failed to create rule");
  }

  return response.json();
}

export async function updateRule(ruleId: string, updates: Partial<BatchRule>): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE}/rules/${ruleId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    throw new Error("Failed to update rule");
  }

  return response.json();
}

export async function deleteRule(ruleId: string): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE}/rules/${ruleId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete rule");
  }

  return response.json();
}

export async function toggleRule(ruleId: string): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE}/rules/${ruleId}/toggle`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Failed to toggle rule");
  }

  return response.json();
}

export async function generatePreview(filePath: string): Promise<{ success: boolean; data: { preview: string } }> {
  const response = await fetch(`${API_BASE}/preview/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: filePath }),
  });

  if (!response.ok) {
    throw new Error("Failed to generate preview");
  }

  return response.json();
}

export async function compareFiles(
  file1Path: string,
  file2Path: string
): Promise<{ success: boolean; data: { comparison: { similarity: number; differences: string[] } } }> {
  const response = await fetch(`${API_BASE}/preview/compare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file1: file1Path, file2: file2Path }),
  });

  if (!response.ok) {
    throw new Error("Failed to compare files");
  }

  return response.json();
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

export function generateDemoFiles(count: number = 20): FileInfo[] {
  const types: FileType[] = ["image", "video", "document", "audio"];
  const extensions: Record<FileType, string[]> = {
    image: ["jpg", "png", "gif"],
    video: ["mp4", "mkv", "avi"],
    audio: ["mp3", "wav", "flac"],
    document: ["pdf", "docx", "xlsx"],
    other: ["txt"],
  };

  const basePaths = [
    "C:\\Users\\Documents",
    "C:\\Users\\Desktop",
    "C:\\Users\\Downloads",
    "C:\\Users\\Pictures",
    "C:\\Users\\Videos",
  ];

  const files: FileInfo[] = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const ext = extensions[type][Math.floor(Math.random() * extensions[type].length)];
    const basePath = basePaths[Math.floor(Math.random() * basePaths.length)];
    const baseSize = type === "video" ? 50000000 : type === "image" ? 5000000 : type === "audio" ? 10000000 : 1000000;
    const size = Math.floor(baseSize * (0.5 + Math.random()));
    const daysAgo = Math.floor(Math.random() * 365);
    const modified = now - daysAgo * 24 * 60 * 60 * 1000;

    const copyNumber = Math.floor(Math.random() * 3);
    const copyLabel = copyNumber > 0 ? ` (${copyNumber})` : "";
    const name = `file_${Math.floor(i / 3)}${copyLabel}.${ext}`;

    files.push({
      id: `file-${i}`,
      path: `${basePath}\\${name}`,
      name,
      type,
      size,
      modified,
      created: modified - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000),
      extension: ext,
    });
  }

  return files;
}
