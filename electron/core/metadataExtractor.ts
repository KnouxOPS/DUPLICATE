import fs from 'fs';
import path from 'path';
import { logger } from './logger.js';

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  channels?: number;
  depth?: number;
  density?: number;
  hasAlpha?: boolean;
  orientation?: number;
  exif?: Record<string, any>;
}

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  codec: string;
  bitrate: number;
  framerate: number;
  format: string;
}

export interface AudioMetadata {
  duration: number;
  bitrate: number;
  sampleRate: number;
  channels: number;
  codec: string;
  format: string;
  title?: string;
  artist?: string;
  album?: string;
  year?: number;
  genre?: string;
}

export interface DocumentMetadata {
  pages?: number;
  wordCount?: number;
  author?: string;
  title?: string;
  subject?: string;
  createdDate?: string;
  modifiedDate?: string;
  format: string;
}

export interface FileMetadata {
  path: string;
  type: 'image' | 'video' | 'audio' | 'document' | 'other';
  metadata: ImageMetadata | VideoMetadata | AudioMetadata | DocumentMetadata | null;
  error?: string;
}

export interface MetadataProgress {
  current: number;
  total: number;
  currentFile: string;
  percentage: number;
}

class MetadataExtractor {
  async extractMetadata(filePath: string): Promise<FileMetadata> {
    const ext = path.extname(filePath).toLowerCase().slice(1);
    const type = this.getFileType(ext);

    try {
      let metadata: any = null;

      switch (type) {
        case 'image':
          metadata = await this.extractImageMetadata(filePath);
          break;
        case 'video':
          metadata = await this.extractVideoMetadata(filePath);
          break;
        case 'audio':
          metadata = await this.extractAudioMetadata(filePath);
          break;
        case 'document':
          metadata = await this.extractDocumentMetadata(filePath, ext);
          break;
      }

      return { path: filePath, type, metadata };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.warn(`Metadata extraction failed for ${filePath}`, { error: errorMsg });
      return { path: filePath, type, metadata: null, error: errorMsg };
    }
  }

  private async extractImageMetadata(filePath: string): Promise<ImageMetadata | null> {
    try {
      const sharp = await import('sharp');
      const image = sharp.default(filePath);
      const metadata = await image.metadata();

      return {
        width: metadata.width || 0,
        height: metadata.height || 0,
        format: metadata.format || 'unknown',
        channels: metadata.channels,
        depth: metadata.depth ? parseInt(metadata.depth) : undefined,
        density: metadata.density,
        hasAlpha: metadata.hasAlpha,
        orientation: metadata.orientation,
        exif: metadata.exif ? this.parseExif(metadata.exif) : undefined,
      };
    } catch (error) {
      logger.warn(`Sharp metadata extraction failed for ${filePath}`, { error: String(error) });
      return this.extractBasicImageMetadata(filePath);
    }
  }

  private extractBasicImageMetadata(filePath: string): ImageMetadata {
    const ext = path.extname(filePath).toLowerCase().slice(1);
    const stats = fs.statSync(filePath);
    
    return {
      width: 0,
      height: 0,
      format: ext,
    };
  }

  private parseExif(exifBuffer: Buffer): Record<string, any> {
    try {
      return { raw: exifBuffer.toString('base64').substring(0, 100) };
    } catch {
      return {};
    }
  }

  private async extractVideoMetadata(filePath: string): Promise<VideoMetadata | null> {
    const ext = path.extname(filePath).toLowerCase().slice(1);
    const stats = fs.statSync(filePath);
    
    return {
      duration: 0,
      width: 0,
      height: 0,
      codec: 'unknown',
      bitrate: Math.round((stats.size * 8) / 1000),
      framerate: 0,
      format: ext,
    };
  }

  private async extractAudioMetadata(filePath: string): Promise<AudioMetadata | null> {
    try {
      const mm = await import('music-metadata');
      const metadata = await mm.parseFile(filePath);

      return {
        duration: metadata.format.duration || 0,
        bitrate: metadata.format.bitrate || 0,
        sampleRate: metadata.format.sampleRate || 0,
        channels: metadata.format.numberOfChannels || 0,
        codec: metadata.format.codec || 'unknown',
        format: metadata.format.container || path.extname(filePath).slice(1),
        title: metadata.common.title,
        artist: metadata.common.artist,
        album: metadata.common.album,
        year: metadata.common.year,
        genre: metadata.common.genre?.[0],
      };
    } catch (error) {
      logger.warn(`Audio metadata extraction failed for ${filePath}`, { error: String(error) });
      return this.extractBasicAudioMetadata(filePath);
    }
  }

  private extractBasicAudioMetadata(filePath: string): AudioMetadata {
    const ext = path.extname(filePath).toLowerCase().slice(1);
    const stats = fs.statSync(filePath);
    
    return {
      duration: 0,
      bitrate: Math.round((stats.size * 8) / 1000),
      sampleRate: 0,
      channels: 0,
      codec: 'unknown',
      format: ext,
    };
  }

  private async extractDocumentMetadata(filePath: string, ext: string): Promise<DocumentMetadata | null> {
    if (ext === 'pdf') {
      return await this.extractPdfMetadata(filePath);
    }
    
    if (ext === 'txt') {
      return await this.extractTextMetadata(filePath);
    }

    return {
      format: ext,
    };
  }

  private async extractPdfMetadata(filePath: string): Promise<DocumentMetadata | null> {
    try {
      const pdfParseModule = await import('pdf-parse');
      const pdfParse = (pdfParseModule as any).default || pdfParseModule;
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);

      return {
        pages: data.numpages,
        wordCount: data.text ? data.text.split(/\s+/).filter(Boolean).length : 0,
        author: data.info?.Author,
        title: data.info?.Title,
        subject: data.info?.Subject,
        createdDate: data.info?.CreationDate,
        modifiedDate: data.info?.ModDate,
        format: 'pdf',
      };
    } catch (error) {
      logger.warn(`PDF metadata extraction failed for ${filePath}`, { error: String(error) });
      return { format: 'pdf' };
    }
  }

  private async extractTextMetadata(filePath: string): Promise<DocumentMetadata> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const words = content.split(/\s+/).filter(Boolean);
      const lines = content.split('\n');

      return {
        pages: Math.ceil(lines.length / 50),
        wordCount: words.length,
        format: 'txt',
      };
    } catch {
      return { format: 'txt' };
    }
  }

  async extractBatch(
    filePaths: string[],
    onProgress?: (progress: MetadataProgress) => void
  ): Promise<FileMetadata[]> {
    const results: FileMetadata[] = [];
    const total = filePaths.length;

    for (let i = 0; i < filePaths.length; i++) {
      const filePath = filePaths[i];
      
      onProgress?.({
        current: i + 1,
        total,
        currentFile: path.basename(filePath),
        percentage: Math.round(((i + 1) / total) * 100),
      });

      const result = await this.extractMetadata(filePath);
      results.push(result);
    }

    logger.info(`Extracted metadata for ${results.length} files`);
    return results;
  }

  private getFileType(ext: string): 'image' | 'video' | 'audio' | 'document' | 'other' {
    const imageFormats = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico', 'tiff', 'tif', 'heic', 'heif'];
    const videoFormats = ['mp4', 'avi', 'mkv', 'mov', 'flv', 'wmv', 'webm', 'm4v'];
    const audioFormats = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma', 'aiff', 'm4a'];
    const documentFormats = ['pdf', 'docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt', 'txt', 'rtf'];

    if (imageFormats.includes(ext)) return 'image';
    if (videoFormats.includes(ext)) return 'video';
    if (audioFormats.includes(ext)) return 'audio';
    if (documentFormats.includes(ext)) return 'document';
    return 'other';
  }

  getQualityScore(metadata: FileMetadata): number {
    if (!metadata.metadata) return 50;

    switch (metadata.type) {
      case 'image': {
        const imgMeta = metadata.metadata as ImageMetadata;
        const pixels = imgMeta.width * imgMeta.height;
        if (pixels >= 4000000) return 100;
        if (pixels >= 2000000) return 85;
        if (pixels >= 1000000) return 70;
        if (pixels >= 500000) return 55;
        return 40;
      }
      case 'video': {
        const vidMeta = metadata.metadata as VideoMetadata;
        const resolution = vidMeta.width * vidMeta.height;
        if (resolution >= 3840 * 2160) return 100;
        if (resolution >= 1920 * 1080) return 85;
        if (resolution >= 1280 * 720) return 70;
        return 50;
      }
      case 'audio': {
        const audMeta = metadata.metadata as AudioMetadata;
        if (audMeta.bitrate >= 320000) return 100;
        if (audMeta.bitrate >= 256000) return 85;
        if (audMeta.bitrate >= 192000) return 70;
        if (audMeta.bitrate >= 128000) return 55;
        return 40;
      }
      default:
        return 50;
    }
  }
}

export const metadataExtractor = new MetadataExtractor();
