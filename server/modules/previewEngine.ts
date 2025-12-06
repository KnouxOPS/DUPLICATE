import { logger } from "./logger";
import { FileInfo } from "./scanner";

export interface FilePreview {
  path: string;
  name: string;
  type: "image" | "video" | "audio" | "document" | "other";
  size: number;
  sizeFormatted: string;
  created: number;
  modified: number;
  extension: string;
  preview?: {
    thumbnail?: string;
    duration?: number;
    pages?: number;
    resolution?: string;
    bitrate?: string;
  };
}

export interface ComparisonResult {
  file1: FilePreview;
  file2: FilePreview;
  similarities: string[];
  differences: string[];
  recommendation: string;
}

class PreviewEngine {
  /**
   * Generate preview for a file
   */
  generatePreview(file: FileInfo): FilePreview {
    const sizeFormatted = this.formatFileSize(file.size);

    const preview: FilePreview = {
      path: file.path,
      name: file.name,
      type: this.getFileType(file.extension),
      size: file.size,
      sizeFormatted,
      created: file.created,
      modified: file.modified,
      extension: file.extension,
      preview: this.generatePreviewData(file),
    };

    logger.debug(`Preview generated for ${file.name}`);

    return preview;
  }

  /**
   * Compare two files
   */
  compareFiles(file1: FileInfo, file2: FileInfo): ComparisonResult {
    const preview1 = this.generatePreview(file1);
    const preview2 = this.generatePreview(file2);

    const similarities = this.findSimilarities(file1, file2);
    const differences = this.findDifferences(file1, file2);
    const recommendation = this.getRecommendation(file1, file2);

    logger.debug(`Comparison generated for ${file1.name} and ${file2.name}`);

    return {
      file1: preview1,
      file2: preview2,
      similarities,
      differences,
      recommendation,
    };
  }

  /**
   * Get file type
   */
  private getFileType(
    extension: string,
  ): "image" | "video" | "audio" | "document" | "other" {
    const ext = extension.toLowerCase();

    if (
      ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg", "ico"].includes(ext)
    ) {
      return "image";
    }
    if (
      ["mp4", "avi", "mkv", "mov", "flv", "wmv", "webm", "m4v"].includes(ext)
    ) {
      return "video";
    }
    if (
      ["mp3", "wav", "flac", "aac", "ogg", "wma", "aiff", "alac"].includes(ext)
    ) {
      return "audio";
    }
    if (
      [
        "pdf",
        "docx",
        "doc",
        "xlsx",
        "xls",
        "pptx",
        "ppt",
        "txt",
        "rtf",
      ].includes(ext)
    ) {
      return "document";
    }

    return "other";
  }

  /**
   * Generate preview data based on file type
   */
  private generatePreviewData(file: FileInfo) {
    const type = this.getFileType(file.extension);

    // Simulated preview data
    const preview: any = {};

    if (type === "image") {
      preview.thumbnail = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23f0f0f0' width='100' height='100'/%3E%3C/svg%3E`;
      preview.resolution = "1920x1080"; // Mock resolution
    } else if (type === "video") {
      preview.duration = Math.floor(file.size / 1000000); // Mock duration
      preview.bitrate = "5000 kbps"; // Mock bitrate
    } else if (type === "audio") {
      preview.duration = Math.floor(file.size / 128000); // Mock duration
      preview.bitrate = "128 kbps"; // Mock bitrate
    } else if (type === "document") {
      preview.pages = Math.ceil(file.size / 50000); // Mock page count
    }

    return preview;
  }

  /**
   * Find similarities between two files
   */
  private findSimilarities(file1: FileInfo, file2: FileInfo): string[] {
    const similarities: string[] = [];

    if (file1.extension === file2.extension) {
      similarities.push("Same file format");
    }

    if (Math.abs(file1.size - file2.size) < 1000) {
      similarities.push("Similar file size");
    }

    if (file1.name.split(".")[0] === file2.name.split(".")[0]) {
      similarities.push("Same filename");
    }

    const similarChars =
      file1.name.split("").filter((char) => file2.name.includes(char)).length /
      Math.max(file1.name.length, file2.name.length);

    if (similarChars > 0.7) {
      similarities.push("Very similar names");
    }

    return similarities.length > 0
      ? similarities
      : ["Files appear to be duplicates"];
  }

  /**
   * Find differences between two files
   */
  private findDifferences(file1: FileInfo, file2: FileInfo): string[] {
    const differences: string[] = [];

    if (file1.size !== file2.size) {
      const sizeDiff = Math.abs(file1.size - file2.size);
      differences.push(`Size difference: ${this.formatFileSize(sizeDiff)}`);
    }

    if (file1.modified !== file2.modified) {
      const date1 = new Date(file1.modified).toLocaleDateString();
      const date2 = new Date(file2.modified).toLocaleDateString();
      differences.push(`Modified dates differ: ${date1} vs ${date2}`);
    }

    if (file1.name !== file2.name) {
      differences.push(`Different filenames`);
    }

    return differences.length > 0 ? differences : ["Files are identical"];
  }

  /**
   * Get recommendation for which file to keep
   */
  private getRecommendation(file1: FileInfo, file2: FileInfo): string {
    if (file1.size > file2.size) {
      return `Keep "${file1.name}" - larger file size (usually better quality)`;
    } else if (file2.size > file1.size) {
      return `Keep "${file2.name}" - larger file size (usually better quality)`;
    }

    if (file1.modified > file2.modified) {
      return `Keep "${file1.name}" - more recent file`;
    } else if (file2.modified > file1.modified) {
      return `Keep "${file2.name}" - more recent file`;
    }

    return `Either file can be kept - they appear identical`;
  }

  /**
   * Format file size to human-readable format
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  }
}

export const previewEngine = new PreviewEngine();
