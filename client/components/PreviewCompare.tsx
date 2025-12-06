import { FilePreview } from "@/components/types";
import { Button } from "@/components/ui/button";
import { X, Download, Trash2, Copy } from "lucide-react";

interface PreviewCompareProps {
  file1: any;
  file2?: any;
  onClose: () => void;
  onKeep?: (fileId: string) => void;
  onDelete?: (fileId: string) => void;
}

export function PreviewCompare({
  file1,
  file2,
  onClose,
  onKeep,
  onDelete,
}: PreviewCompareProps) {
  const getFileIcon = (type: string) => {
    switch (type) {
      case "image":
        return "🖼️";
      case "video":
        return "🎬";
      case "audio":
        return "🎵";
      case "document":
        return "📄";
      default:
        return "📁";
    }
  };

  const renderFilePreview = (file: any) => (
    <div className="space-y-4">
      <div className="bg-muted rounded-lg p-4 flex items-center justify-center h-32">
        <div className="text-5xl">{getFileIcon(file.type)}</div>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Name</p>
          <p className="font-mono text-sm text-foreground break-all">
            {file.name}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Size</p>
            <p className="font-semibold text-foreground">
              {formatFileSize(file.size)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Type</p>
            <p className="font-semibold text-foreground capitalize">
              {file.type}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Created</p>
            <p className="font-semibold text-foreground text-sm">
              {new Date(file.created).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Modified</p>
            <p className="font-semibold text-foreground text-sm">
              {new Date(file.modified).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-1">Path</p>
          <p className="font-mono text-xs text-muted-foreground break-all p-2 bg-background rounded">
            {file.path}
          </p>
        </div>

        {file.preview && (
          <div className="pt-4 border-t border-border space-y-2">
            {file.preview.resolution && (
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Resolution:</span>
                <span className="text-foreground font-medium">
                  {file.preview.resolution}
                </span>
              </div>
            )}
            {file.preview.duration && (
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Duration:</span>
                <span className="text-foreground font-medium">
                  {formatDuration(file.preview.duration)}
                </span>
              </div>
            )}
            {file.preview.bitrate && (
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Bitrate:</span>
                <span className="text-foreground font-medium">
                  {file.preview.bitrate}
                </span>
              </div>
            )}
            {file.preview.pages && (
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Pages:</span>
                <span className="text-foreground font-medium">
                  {file.preview.pages}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-card rounded-lg w-full max-w-4xl max-h-96 overflow-auto animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card">
          <h2 className="text-lg font-bold text-foreground">
            {file2 ? "Compare Files" : "File Preview"}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {file2 ? (
            // Comparison View
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">File 1</h3>
                {renderFilePreview(file1)}
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">File 2</h3>
                {renderFilePreview(file2)}
              </div>

              {/* Comparison Results */}
              <div className="col-span-2 pt-4 border-t border-border space-y-4">
                <div>
                  <p className="font-semibold text-foreground mb-2">
                    Similarities
                  </p>
                  <ul className="space-y-1">
                    {["Same file format", "Similar file size"].map((sim) => (
                      <li
                        key={sim}
                        className="text-sm text-foreground flex items-center gap-2"
                      >
                        <span className="text-green-500">✓</span> {sim}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="font-semibold text-foreground mb-2">
                    Differences
                  </p>
                  <ul className="space-y-1">
                    {[
                      `Size difference: ${Math.abs(file1.size - file2.size) / 1000}KB`,
                      `Modified dates differ`,
                    ].map((diff) => (
                      <li
                        key={diff}
                        className="text-sm text-foreground flex items-center gap-2"
                      >
                        <span className="text-amber-500">!</span> {diff}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 bg-primary/10 rounded-lg border border-primary">
                  <p className="text-sm font-semibold text-primary mb-2">
                    💡 Recommendation
                  </p>
                  <p className="text-sm text-foreground">
                    Keep{" "}
                    <span className="font-semibold">
                      "{file1.size > file2.size ? file1.name : file2.name}"
                    </span>{" "}
                    - larger file size (usually better quality)
                  </p>
                </div>
              </div>
            </div>
          ) : (
            // Single File View
            <div className="max-w-sm mx-auto">{renderFilePreview(file1)}</div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border p-6 bg-muted/30 flex gap-3 flex-wrap justify-end">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>

          {!file2 && onKeep && (
            <>
              <Button
                onClick={() => {
                  onDelete?.(file1.id);
                  onClose();
                }}
                className="text-destructive hover:text-destructive flex items-center gap-2"
                variant="outline"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>

              <Button
                onClick={() => {
                  onKeep(file1.id);
                  onClose();
                }}
                className="bg-primary hover:bg-primary/90 text-white flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Keep This File
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}
