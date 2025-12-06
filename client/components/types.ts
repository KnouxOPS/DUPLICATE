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
