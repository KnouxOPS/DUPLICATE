/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * File type categories
 */
export type FileType = "image" | "video" | "audio" | "document" | "other";

/**
 * File interface for duplicate detection
 */
export interface File {
  path: string;
  name: string;
  type: FileType;
  size: number;
  modified: number;
  created?: number;
  extension?: string;
  hash?: string;
}

/**
 * File type icons mapping
 */
export const FILE_ICONS: Record<FileType, string> = {
  image: "🖼️",
  video: "🎬",
  audio: "🎵",
  document: "📄",
  other: "📁",
};

/**
 * File extensions by category
 */
export const FILE_EXTENSIONS: Record<FileType, string[]> = {
  image: ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg", "ico", "tiff"],
  video: ["mp4", "avi", "mkv", "mov", "flv", "wmv", "webm", "m4v", "mpeg"],
  audio: ["mp3", "wav", "flac", "aac", "ogg", "wma", "aiff", "alac", "m4a"],
  document: ["pdf", "docx", "doc", "xlsx", "xls", "pptx", "ppt", "txt", "rtf", "odt"],
  other: [],
};

/**
 * Detect file type from extension
 */
export function detectFileType(filename: string): FileType {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  
  for (const [type, extensions] of Object.entries(FILE_EXTENSIONS)) {
    if (extensions.includes(ext)) {
      return type as FileType;
    }
  }
  
  return "other";
}

/**
 * Format file size to human readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

/**
 * Scan result interface
 */
export interface ScanResult {
  files: File[];
  stats: {
    total: number;
    duplicates: number;
    recoverable: number;
  };
}

/**
 * Duplicate group interface
 */
export interface DuplicateGroup {
  id: string;
  hash: string;
  files: File[];
  totalSize: number;
  type: FileType;
  similarity: number;
}

/**
 * Trash entry interface
 */
export interface TrashEntry {
  id: string;
  originalPath: string;
  fileName: string;
  size: number;
  deletedAt: string;
  type: FileType;
}

/**
 * Batch rule interface
 */
export interface BatchRule {
  id: string;
  name: string;
  type: "keep_largest" | "keep_newest" | "keep_smallest" | "keep_best_quality" | "delete_pattern";
  category: FileType | "all";
  enabled: boolean;
  deletePattern?: string;
  description: string;
}
