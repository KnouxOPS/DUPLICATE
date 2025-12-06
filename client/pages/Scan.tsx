import { useState, useCallback, useEffect } from "react";
import { useApp, EnhancedDuplicateGroup } from "@/context/AppContext";
import { useNotification } from "@/hooks/useNotification";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronUp,
  Trash2,
  Eye,
  CheckCircle,
  Loader2,
  RefreshCw,
  Star,
  ArrowLeft,
  Sparkles,
  HardDrive,
  Zap,
} from "lucide-react";
import {
  analyzeDuplicates,
  moveToTrash,
  generateDemoFiles,
  formatFileSize,
  type FileInfo,
  type SuggestionResult,
} from "@/lib/api";

interface DuplicateFile {
  id: string;
  name: string;
  path: string;
  size: number;
  sizeFormatted: string;
  type: "image" | "video" | "audio" | "document" | "other";
  created: number;
  modified: number;
  thumbnail?: string;
  isSelected: boolean;
  score?: number;
  reasons?: string[];
}

interface DisplayGroup {
  id: string;
  type: string;
  fileCount: number;
  totalSize: number;
  totalSizeFormatted: string;
  recoverableSize: number;
  recoverableSizeFormatted: string;
  files: DuplicateFile[];
  expanded: boolean;
  bestFileIndex: number;
  similarity: number;
}

export default function ScanPage() {
  const { setCurrentPage, t, isRTL, settings, scanState, setScanState, updateScanStats } = useApp();
  const { success, error: notifyError, info } = useNotification();

  const [scanning, setScanning] = useState(false);
  const [groups, setGroups] = useState<DisplayGroup[]>([]);
  const [selectedForDelete, setSelectedForDelete] = useState<Set<string>>(
    new Set()
  );
  const [previewFile, setPreviewFile] = useState<DuplicateFile | null>(null);
  const [scanProgress, setScanProgress] = useState(0);

  useEffect(() => {
    if (scanState.groups.length > 0) {
      const displayGroups = scanState.groups.map((group) => convertToDisplayGroup(group));
      setGroups(displayGroups);
    }
    setSelectedForDelete(new Set(scanState.selectedForDelete));
  }, [scanState.groups, scanState.selectedForDelete]);

  const convertToDisplayGroup = (group: EnhancedDuplicateGroup): DisplayGroup => {
    const files: DuplicateFile[] = group.files.map((file, idx) => ({
      id: `${group.id}-file-${idx}`,
      name: file.name,
      path: file.path,
      size: file.size,
      sizeFormatted: formatFileSize(file.size),
      type: file.type as "image" | "video" | "audio" | "document" | "other",
      created: file.created || file.modified,
      modified: file.modified,
      isSelected: false,
      score: group.suggestion?.bestFile?.fileIndex === idx ? group.suggestion.bestFile.score : 
             group.suggestion?.filesToDelete?.find(f => f.fileIndex === idx)?.score,
      reasons: group.suggestion?.bestFile?.fileIndex === idx ? group.suggestion.bestFile.reasons :
               group.suggestion?.filesToDelete?.find(f => f.fileIndex === idx)?.reasons,
    }));

    return {
      id: group.id,
      type: group.type,
      fileCount: group.files.length,
      totalSize: group.totalSize,
      totalSizeFormatted: formatFileSize(group.totalSize),
      recoverableSize: group.recoverableSize,
      recoverableSizeFormatted: formatFileSize(group.recoverableSize),
      files,
      expanded: group.expanded,
      bestFileIndex: group.bestFileIndex,
      similarity: group.similarity,
    };
  };

  const toggleGroup = useCallback((groupId: string) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, expanded: !g.expanded } : g))
    );
    setScanState((prev) => ({
      ...prev,
      groups: prev.groups.map((g) =>
        g.id === groupId ? { ...g, expanded: !g.expanded } : g
      ),
    }));
  }, [setScanState]);

  const toggleFileSelection = useCallback((fileId: string) => {
    setSelectedForDelete((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        newSet.add(fileId);
      }
      return newSet;
    });
  }, []);

  const keepFile = useCallback(
    (groupId: string, fileIndex: number) => {
      const group = groups.find((g) => g.id === groupId);
      if (!group) return;

      const newSelectedSet = new Set(selectedForDelete);
      newSelectedSet.delete(group.files[fileIndex].id);

      group.files.forEach((file, idx) => {
        if (idx !== fileIndex) {
          newSelectedSet.add(file.id);
        }
      });

      setSelectedForDelete(newSelectedSet);
      success(
        `${group.files[fileIndex].name} ${isRTL ? "تم تحديده للاحتفاظ" : "marked to keep"}`
      );
    },
    [groups, selectedForDelete, success, isRTL]
  );

  const autoSelectForDeletion = useCallback(() => {
    const newSelected = new Set<string>();
    
    groups.forEach((group) => {
      group.files.forEach((file, idx) => {
        if (idx !== group.bestFileIndex) {
          newSelected.add(file.id);
        }
      });
    });

    setSelectedForDelete(newSelected);
    info(
      isRTL
        ? `تم تحديد ${newSelected.size} ملف تلقائيًا للحذف (الاحتفاظ بأفضل نسخة من كل مجموعة)`
        : `Auto-selected ${newSelected.size} files for deletion (keeping best copy from each group)`
    );
  }, [groups, info, isRTL]);

  const handleDeleteFiles = useCallback(async () => {
    if (selectedForDelete.size === 0) {
      notifyError(
        isRTL ? "لم يتم تحديد ملفات للحذف" : "No files selected for deletion"
      );
      return;
    }

    try {
      setScanning(true);
      const filesToDelete = Array.from(selectedForDelete);
      const filePaths: string[] = [];

      groups.forEach((group) => {
        group.files.forEach((file) => {
          if (filesToDelete.includes(file.id)) {
            filePaths.push(file.path);
          }
        });
      });

      await moveToTrash(filePaths);

      setGroups((prev) =>
        prev
          .map((group) => ({
            ...group,
            files: group.files.filter((f) => !filesToDelete.includes(f.id)),
            fileCount: group.files.filter((f) => !filesToDelete.includes(f.id)).length,
          }))
          .filter((group) => group.files.length > 1)
      );

      setScanState((prev) => ({
        ...prev,
        groups: prev.groups
          .map((group) => ({
            ...group,
            files: group.files.filter((_, idx) => 
              !filesToDelete.includes(`${group.id}-file-${idx}`)
            ),
          }))
          .filter((group) => group.files.length > 1),
        selectedForDelete: new Set(),
      }));

      setSelectedForDelete(new Set());

      success(
        isRTL
          ? `تم نقل ${filesToDelete.length} ملف إلى سلة المحذوفات بنجاح`
          : `Successfully moved ${filesToDelete.length} files to trash`,
        {
          description: isRTL
            ? "يمكنك استعادتها من سلة المحذوفات إذا لزم الأمر"
            : "You can restore them from the trash if needed",
        }
      );
    } catch (err) {
      notifyError(isRTL ? "فشل في حذف الملفات" : "Failed to delete files");
    } finally {
      setScanning(false);
    }
  }, [selectedForDelete, groups, success, notifyError, isRTL, setScanState]);

  const handleStartScan = useCallback(async () => {
    try {
      setScanning(true);
      setScanProgress(0);
      info(isRTL ? "جاري بدء فحص التكرارات..." : "Starting duplicate scan...");

      const progressInterval = setInterval(() => {
        setScanProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const demoFiles = generateDemoFiles(30);

      const response = await analyzeDuplicates(
        demoFiles,
        settings.aiSensitivity
      );

      clearInterval(progressInterval);
      setScanProgress(100);

      if (response.success && response.data) {
        const { analysis, suggestions } = response.data;

        const enhancedGroups: EnhancedDuplicateGroup[] = analysis.groups.map(
          (group, idx) => {
            const suggestion = suggestions.find((s) => s.group.id === group.id)?.suggestion;
            const recoverableSize =
              group.totalSize - Math.min(...group.files.map((f) => f.size));

            return {
              ...group,
              expanded: false,
              bestFileIndex: suggestion?.bestFile?.fileIndex ?? 0,
              recoverableSize,
              suggestion,
            };
          }
        );

        updateScanStats(analysis, demoFiles);

        setScanState((prev) => ({
          ...prev,
          groups: enhancedGroups,
          isScanning: false,
          lastScanTime: new Date().toISOString(),
          scannedFiles: demoFiles,
        }));

        const displayGroups = enhancedGroups.map((g) => convertToDisplayGroup(g));
        setGroups(displayGroups);
        setSelectedForDelete(new Set());

        success(
          isRTL
            ? `اكتمل الفحص! تم العثور على ${analysis.groups.length} مجموعات مكررة`
            : `Scan completed! Found ${analysis.groups.length} duplicate groups`
        );
      }
    } catch (err) {
      console.error("Scan error:", err);
      notifyError(isRTL ? "فشل الفحص" : "Scan failed");
    } finally {
      setScanning(false);
      setScanProgress(0);
    }
  }, [success, notifyError, info, isRTL, settings.aiSensitivity, setScanState, updateScanStats]);

  const totalSize = groups.reduce((sum, g) => sum + g.totalSize, 0);
  const totalRecoverable = groups.reduce((sum, g) => sum + g.recoverableSize, 0);
  const totalFiles = groups.reduce((sum, g) => sum + g.fileCount, 0);

  const getTypeEmoji = (type: string) => {
    switch (type) {
      case "image": return "🖼️";
      case "video": return "🎬";
      case "document": return "📄";
      case "audio": return "🎵";
      default: return "📁";
    }
  };

  const getTypeLabel = (type: string) => {
    if (isRTL) {
      switch (type) {
        case "image": return "صور";
        case "video": return "فيديوهات";
        case "document": return "مستندات";
        case "audio": return "صوتيات";
        default: return "أخرى";
      }
    }
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "image": return "from-pink-500 to-rose-500";
      case "video": return "from-blue-500 to-cyan-500";
      case "document": return "from-amber-500 to-orange-500";
      case "audio": return "from-purple-500 to-violet-500";
      default: return "from-gray-500 to-slate-500";
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col">
      <div className="glass-sidebar !border-r-0 border-b border-white/5 p-6">
        <div className="max-w-7xl mx-auto">
          <div className={`flex items-center justify-between mb-6 ${isRTL ? "flex-row-reverse" : ""}`}>
            <div className={isRTL ? "text-right" : ""}>
              <h1 className="text-3xl font-bold gradient-text flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-purple-400" />
                {t.scan.title}
              </h1>
              <p className="text-white/50 mt-2">
                {groups.length > 0
                  ? isRTL
                    ? `تم العثور على ${groups.length} مجموعات مكررة مع ${formatFileSize(totalRecoverable)} من المساحة القابلة للاستعادة`
                    : `Found ${groups.length} duplicate groups with ${formatFileSize(totalRecoverable)} of recoverable space`
                  : isRTL
                    ? "ابدأ الفحص للبحث عن الملفات المكررة"
                    : "Start a scan to find duplicate files"}
              </p>
            </div>

            <div className={`flex gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
              <Button
                onClick={() => setCurrentPage("dashboard")}
                className="glass-button !px-4"
              >
                <ArrowLeft className={`w-4 h-4 ${isRTL ? "ml-2 rotate-180" : "mr-2"}`} />
                {t.scan.back}
              </Button>
              <Button
                onClick={handleStartScan}
                disabled={scanning}
                className="glass-button-primary"
              >
                {scanning ? (
                  <>
                    <Loader2 className={`w-4 h-4 animate-spin ${isRTL ? "ml-2" : "mr-2"}`} />
                    {t.scan.scanning}
                  </>
                ) : (
                  <>
                    <RefreshCw className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                    {t.scan.newScan}
                  </>
                )}
              </Button>
            </div>
          </div>

          {scanning && (
            <div className="mb-6">
              <div className="progress-bar-glass h-2">
                <div
                  className="progress-fill"
                  style={{ width: `${scanProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-white/40 mt-2 text-center">
                {isRTL ? `جاري الفحص... ${scanProgress}%` : `Scanning... ${scanProgress}%`}
              </p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div className="glass-card !p-4">
              <div className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-purple-400" />
                </div>
                <div className={isRTL ? "text-right" : ""}>
                  <p className="text-xs text-white/50">{t.scan.totalDuplicates}</p>
                  <p className="text-2xl font-bold text-white">{totalFiles}</p>
                </div>
              </div>
            </div>
            <div className="glass-card !p-4">
              <div className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <HardDrive className="w-5 h-5 text-blue-400" />
                </div>
                <div className={isRTL ? "text-right" : ""}>
                  <p className="text-xs text-white/50">{t.scan.totalSize}</p>
                  <p className="text-2xl font-bold text-white">{formatFileSize(totalSize)}</p>
                </div>
              </div>
            </div>
            <div className="glass-card !p-4 border-cyan-500/30">
              <div className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                </div>
                <div className={isRTL ? "text-right" : ""}>
                  <p className="text-xs text-white/50">{t.scan.canRecover}</p>
                  <p className="text-2xl font-bold text-cyan-400">{formatFileSize(totalRecoverable)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto scrollbar-glass p-6">
        <div className="max-w-7xl mx-auto space-y-4">
          {groups.length === 0 ? (
            <div className="glass-card text-center py-16">
              <div className="w-20 h-20 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-purple-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">
                {scanning ? (isRTL ? "جاري الفحص..." : "Scanning...") : t.scan.noDuplicatesFound}
              </h2>
              <p className="text-white/50 mb-8 max-w-md mx-auto">
                {scanning 
                  ? (isRTL ? "يرجى الانتظار بينما نبحث عن الملفات المكررة" : "Please wait while we search for duplicates")
                  : t.scan.systemClean}
              </p>
              {!scanning && (
                <Button onClick={handleStartScan} className="glass-button-primary">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {t.scan.runNewScan}
                </Button>
              )}
            </div>
          ) : (
            <>
              {groups.length > 0 && (
                <div className={`flex justify-end mb-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                  <Button
                    onClick={autoSelectForDeletion}
                    className="glass-button"
                  >
                    <Star className="w-4 h-4 mr-2" />
                    {isRTL ? "تحديد تلقائي (حذف النسخ الأقل جودة)" : "Auto-select (delete lower quality copies)"}
                  </Button>
                </div>
              )}

              {groups.map((group) => (
                <div key={group.id} className="glass-card !p-0 overflow-hidden">
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className={`w-full px-6 py-5 hover:bg-white/5 transition-colors flex items-center justify-between ${isRTL ? "flex-row-reverse" : ""}`}
                  >
                    <div className={`flex items-center gap-4 flex-1 ${isRTL ? "flex-row-reverse" : ""}`}>
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getTypeColor(group.type)} flex items-center justify-center text-2xl shadow-lg`}>
                        {getTypeEmoji(group.type)}
                      </div>
                      <div className={isRTL ? "text-right" : "text-left"}>
                        <p className="font-semibold text-white text-lg">
                          {getTypeLabel(group.type)} {t.scan.duplicates}
                        </p>
                        <p className="text-sm text-white/50">
                          {group.fileCount} {isRTL ? "ملفات" : "files"} • {group.totalSizeFormatted}
                          {group.similarity && (
                            <span className="badge-glass ml-2">
                              {Math.round(group.similarity * 100)}% {isRTL ? "تشابه" : "similar"}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className={`flex items-center gap-4 ${isRTL ? "flex-row-reverse" : ""}`}>
                      <div className={isRTL ? "text-left" : "text-right"}>
                        <p className="text-lg font-semibold text-cyan-400">
                          {group.recoverableSizeFormatted}
                        </p>
                        <p className="text-xs text-white/40">{t.scan.recoverable}</p>
                      </div>
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                        {group.expanded ? (
                          <ChevronUp className="w-5 h-5 text-white/60" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-white/60" />
                        )}
                      </div>
                    </div>
                  </button>

                  {group.expanded && (
                    <div className="border-t border-white/5 px-6 py-4 bg-white/[0.02] space-y-3">
                      {group.files.map((file, idx) => (
                        <div
                          key={file.id}
                          className={`flex items-center gap-4 p-4 rounded-xl transition-all ${isRTL ? "flex-row-reverse" : ""} ${
                            selectedForDelete.has(file.id)
                              ? "bg-red-500/10 border border-red-500/30"
                              : idx === group.bestFileIndex
                                ? "bg-purple-500/10 border border-purple-500/30"
                                : "bg-white/5 border border-white/10 hover:border-purple-500/30"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedForDelete.has(file.id)}
                            onChange={() => toggleFileSelection(file.id)}
                            className="w-5 h-5 rounded cursor-pointer accent-purple-500"
                          />

                          <div className={`flex-1 ${isRTL ? "text-right" : ""}`}>
                            <p className="font-medium text-white text-sm flex items-center gap-2">
                              {idx === group.bestFileIndex && (
                                <span className="badge-glass !bg-purple-500/30 !border-purple-500/50 !text-purple-300">
                                  ⭐ {t.scan.best}
                                </span>
                              )}
                              {file.name}
                            </p>
                            <p className="text-xs text-white/40 mt-1">
                              {file.sizeFormatted} • {isRTL ? "آخر تعديل:" : "Modified:"}{" "}
                              {new Date(file.modified).toLocaleDateString(isRTL ? "ar-SA" : "en-US")}
                              {file.score && (
                                <span className="text-purple-400 ml-2">
                                  ({isRTL ? "درجة الجودة:" : "Score:"} {Math.round(file.score)})
                                </span>
                              )}
                            </p>
                            {file.reasons && file.reasons.length > 0 && (
                              <p className="text-xs text-white/30 mt-1">
                                {file.reasons.slice(0, 2).join(" • ")}
                              </p>
                            )}
                          </div>

                          <div className={`flex gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                            <Button
                              size="sm"
                              onClick={() => setPreviewFile(file)}
                              className="glass-button !p-2"
                              title={t.scan.preview}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>

                            {idx !== group.bestFileIndex && (
                              <Button
                                size="sm"
                                onClick={() => keepFile(group.id, idx)}
                                className="glass-button !px-3 !py-2 text-xs"
                                title={t.scan.keep}
                              >
                                {t.scan.keep}
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {groups.length > 0 && (
                <div className="glass-card sticky bottom-4 flex items-center justify-between">
                  <div className={isRTL ? "text-right" : ""}>
                    <p className="text-white">
                      <span className="font-bold text-lg text-purple-400">{selectedForDelete.size}</span>{" "}
                      <span className="text-white/60">{isRTL ? "ملفات محددة للحذف" : "files selected for deletion"}</span>
                    </p>
                    <p className="text-xs text-white/40">
                      {isRTL ? "سيتم نقلها إلى سلة المحذوفات الآمنة" : "Will be moved to Safe Trash"}
                    </p>
                  </div>

                  <Button
                    onClick={handleDeleteFiles}
                    disabled={scanning || selectedForDelete.size === 0}
                    className="glass-button-primary !bg-gradient-to-r !from-red-600 !to-rose-600"
                  >
                    <Trash2 className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                    {isRTL ? `حذف ${selectedForDelete.size} ملفات` : `Delete ${selectedForDelete.size} files`}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
