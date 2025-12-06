import { logger } from "./logger";

export interface FileInfo {
  path: string;
  name: string;
  size: number;
  type: string;
  extension: string;
  created: number;
  modified: number;
  hash?: string;
}

export interface ScanResult {
  totalFiles: number;
  filesScanned: number;
  files: FileInfo[];
  errors: string[];
  duration: number;
}

class FileScanner {
  private supportedFormats = {
    images: ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg", "ico"],
    videos: ["mp4", "avi", "mkv", "mov", "flv", "wmv", "webm", "m4v"],
    audio: ["mp3", "wav", "flac", "aac", "ogg", "wma", "aiff", "alac"],
    documents: [
      "pdf",
      "docx",
      "doc",
      "xlsx",
      "xls",
      "pptx",
      "ppt",
      "txt",
      "rtf",
    ],
  };

  async scanFolder(
    folderPath: string,
    fileTypes: string[] = [],
  ): Promise<ScanResult> {
    const startTime = Date.now();
    const result: ScanResult = {
      totalFiles: 0,
      filesScanned: 0,
      files: [],
      errors: [],
      duration: 0,
    };

    try {
      logger.info(`Starting folder scan: ${folderPath}`);

      // In a real implementation, this would scan the actual filesystem
      // For now, return mock data structure
      result.files = [];
      result.filesScanned = 0;
      result.totalFiles = 0;
      result.duration = Date.now() - startTime;

      logger.info(`Scan completed for ${folderPath}`, {
        filesScanned: result.filesScanned,
        duration: result.duration,
      });

      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      result.errors.push(errorMsg);
      logger.error(`Scan failed for ${folderPath}`, { error: errorMsg });
      throw error;
    }
  }

  getFileType(
    extension: string,
  ): "image" | "video" | "audio" | "document" | "other" {
    const ext = extension.toLowerCase();

    if (this.supportedFormats.images.includes(ext)) return "image";
    if (this.supportedFormats.videos.includes(ext)) return "video";
    if (this.supportedFormats.audio.includes(ext)) return "audio";
    if (this.supportedFormats.documents.includes(ext)) return "document";

    return "other";
  }

  filterByFileTypes(files: FileInfo[], types: string[]): FileInfo[] {
    if (types.length === 0) return files;

    return files.filter((file) => {
      const ext = file.extension.toLowerCase();
      return types.includes(ext);
    });
  }
}

export const scanner = new FileScanner();
