import { useState, useCallback } from "react";
import { useApp } from "@/context/AppContext";
import { useNotification } from "@/hooks/useNotification";
import { Button } from "@/components/ui/button";
import {
  Settings,
  Plus,
  X,
  Save,
  RotateCcw,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function SettingsPage() {
  const { setCurrentPage, settings, updateSettings, isDarkMode, t, isRTL } = useApp();
  const { success } = useNotification();

  const [expandedSection, setExpandedSection] = useState<string | null>(
    "general",
  );
  const [localSettings, setLocalSettings] = useState({ ...settings });
  const [newFolder, setNewFolder] = useState("");

  const toggleSection = useCallback((section: string) => {
    setExpandedSection((prev) => (prev === section ? null : section));
  }, []);

  const handleAddFolder = useCallback(() => {
    if (newFolder && !localSettings.scanPaths.includes(newFolder)) {
      setLocalSettings((prev) => ({
        ...prev,
        scanPaths: [...prev.scanPaths, newFolder],
      }));
      setNewFolder("");
      success(isRTL ? "تمت إضافة المجلد" : "Folder added");
    }
  }, [newFolder, localSettings.scanPaths, success, isRTL]);

  const handleRemoveFolder = useCallback((folder: string) => {
    setLocalSettings((prev) => ({
      ...prev,
      scanPaths: prev.scanPaths.filter((f) => f !== folder),
    }));
  }, []);

  const handleToggleFileType = useCallback((type: string) => {
    setLocalSettings((prev) => ({
      ...prev,
      fileTypes: prev.fileTypes.includes(type)
        ? prev.fileTypes.filter((t) => t !== type)
        : [...prev.fileTypes, type],
    }));
  }, []);

  const handleSaveSettings = useCallback(() => {
    updateSettings(localSettings);
    success(isRTL ? "تم حفظ الإعدادات بنجاح" : "Settings saved successfully");
  }, [localSettings, updateSettings, success, isRTL]);

  const handleReset = useCallback(() => {
    setLocalSettings({ ...settings });
    success(isRTL ? "تم تجاهل التغييرات" : "Changes discarded");
  }, [settings, success, isRTL]);

  const fileTypeOptions = [
    { id: "jpg", label: isRTL ? "صور JPG" : "JPG Images", category: "images" },
    { id: "png", label: isRTL ? "صور PNG" : "PNG Images", category: "images" },
    { id: "gif", label: isRTL ? "صور GIF" : "GIF Images", category: "images" },
    { id: "mp4", label: isRTL ? "فيديو MP4" : "MP4 Videos", category: "videos" },
    { id: "mkv", label: isRTL ? "فيديو MKV" : "MKV Videos", category: "videos" },
    { id: "avi", label: isRTL ? "فيديو AVI" : "AVI Videos", category: "videos" },
    { id: "mp3", label: isRTL ? "صوت MP3" : "MP3 Audio", category: "audio" },
    { id: "wav", label: isRTL ? "صوت WAV" : "WAV Audio", category: "audio" },
    { id: "flac", label: isRTL ? "صوت FLAC" : "FLAC Audio", category: "audio" },
    { id: "pdf", label: isRTL ? "مستندات PDF" : "PDF Documents", category: "documents" },
    { id: "docx", label: isRTL ? "مستندات Word" : "Word Documents", category: "documents" },
    { id: "xlsx", label: isRTL ? "ملفات Excel" : "Excel Files", category: "documents" },
  ];

  const categoryLabels: Record<string, string> = {
    images: isRTL ? "الصور" : "Images",
    videos: isRTL ? "الفيديوهات" : "Videos",
    audio: isRTL ? "الصوتيات" : "Audio",
    documents: isRTL ? "المستندات" : "Documents",
  };

  const sections = [
    {
      id: "general",
      title: t.settings.generalSettings,
      icon: Settings,
      content: (
        <div className="space-y-6">
          {/* Language */}
          <div className={isRTL ? "text-right" : ""}>
            <label className="block text-sm font-medium text-foreground mb-2">
              {t.settings.language}
            </label>
            <select
              value={localSettings.language}
              onChange={(e) =>
                setLocalSettings((prev) => ({
                  ...prev,
                  language: e.target.value as "en" | "ar",
                }))
              }
              className={`w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${isRTL ? "text-right" : ""}`}
              dir={isRTL ? "rtl" : "ltr"}
            >
              <option value="en">English</option>
              <option value="ar">العربية</option>
            </select>
          </div>

          {/* AI Sensitivity */}
          <div className={isRTL ? "text-right" : ""}>
            <label className="block text-sm font-medium text-foreground mb-3">
              {t.settings.aiSensitivity}
            </label>
            <div className="space-y-2">
              {[
                { level: "low", label: t.settings.low, desc: t.settings.lowDesc },
                { level: "medium", label: t.settings.medium, desc: t.settings.mediumDesc },
                { level: "high", label: t.settings.high, desc: t.settings.highDesc },
              ].map(({ level, label, desc }) => (
                <label
                  key={level}
                  className={`flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-muted transition-colors ${isRTL ? "flex-row-reverse" : ""}`}
                >
                  <input
                    type="radio"
                    name="sensitivity"
                    value={level}
                    checked={localSettings.aiSensitivity === level}
                    onChange={(e) =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        aiSensitivity: e.target.value as
                          | "low"
                          | "medium"
                          | "high",
                      }))
                    }
                    className="w-4 h-4"
                  />
                  <div className={isRTL ? "text-right" : ""}>
                    <p className="font-medium text-foreground">
                      {label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {desc}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Notifications */}
          <div className={`flex items-center justify-between p-4 bg-muted rounded-lg ${isRTL ? "flex-row-reverse" : ""}`}>
            <div className={isRTL ? "text-right" : ""}>
              <p className="font-medium text-foreground">{t.settings.showNotifications}</p>
              <p className="text-xs text-muted-foreground">
                {t.settings.notificationsDesc}
              </p>
            </div>
            <input
              type="checkbox"
              checked={localSettings.showNotifications}
              onChange={(e) =>
                setLocalSettings((prev) => ({
                  ...prev,
                  showNotifications: e.target.checked,
                }))
              }
              className="w-5 h-5 rounded"
            />
          </div>
        </div>
      ),
    },
    {
      id: "folders",
      title: t.settings.scanFolders,
      icon: "📁",
      content: (
        <div className={`space-y-4 ${isRTL ? "text-right" : ""}`}>
          <p className="text-sm text-muted-foreground">
            {t.settings.scanFoldersDesc}
          </p>

          <div className="space-y-2">
            {localSettings.scanPaths.map((folder) => (
              <div
                key={folder}
                className={`flex items-center justify-between p-4 bg-muted rounded-lg border border-border ${isRTL ? "flex-row-reverse" : ""}`}
              >
                <p className="text-sm text-foreground break-all">{folder}</p>
                <button
                  onClick={() => handleRemoveFolder(folder)}
                  className="text-destructive hover:text-destructive/80 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>

          {localSettings.scanPaths.length === 0 && (
            <div className={`p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-900 dark:text-amber-300 ${isRTL ? "flex-row-reverse" : ""}`}>
              <AlertCircle className={`w-4 h-4 inline ${isRTL ? "ml-2" : "mr-2"}`} />
              {t.settings.noFoldersSelected}
            </div>
          )}

          <div className={`flex gap-2 mt-6 ${isRTL ? "flex-row-reverse" : ""}`}>
            <input
              type="text"
              placeholder={isRTL ? "مثال: C:\\Users\\Documents" : "e.g., C:\\Users\\Documents"}
              value={newFolder}
              onChange={(e) => setNewFolder(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAddFolder()}
              className={`flex-1 px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary ${isRTL ? "text-right" : ""}`}
              dir={isRTL ? "rtl" : "ltr"}
            />
            <Button
              onClick={handleAddFolder}
              className={`bg-primary hover:bg-primary/90 text-white flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}
            >
              <Plus className="w-4 h-4" />
              {t.settings.addFolder}
            </Button>
          </div>
        </div>
      ),
    },
    {
      id: "filetypes",
      title: t.settings.fileTypes,
      icon: "📄",
      content: (
        <div className={`space-y-4 ${isRTL ? "text-right" : ""}`}>
          <p className="text-sm text-muted-foreground">
            {t.settings.fileTypesDesc}
          </p>

          {["images", "videos", "audio", "documents"].map((category) => (
            <div key={category}>
              <p className="text-sm font-semibold text-foreground mb-2">
                {categoryLabels[category]}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {fileTypeOptions
                  .filter((opt) => opt.category === category)
                  .map((option) => (
                    <label
                      key={option.id}
                      className={`flex items-center gap-2 p-3 border border-border rounded-lg cursor-pointer hover:bg-muted transition-colors ${isRTL ? "flex-row-reverse" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={localSettings.fileTypes.includes(option.id)}
                        onChange={() => handleToggleFileType(option.id)}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-sm text-foreground">
                        {option.label}
                      </span>
                    </label>
                  ))}
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "theme",
      title: t.settings.themeColors,
      icon: "🎨",
      content: (
        <div className={`space-y-6 ${isRTL ? "text-right" : ""}`}>
          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-sm text-amber-900 dark:text-amber-300">
              {t.settings.currentTheme}:{" "}
              <span className="font-semibold">
                {isDarkMode ? (isRTL ? "الوضع الداكن" : "Dark Mode") : (isRTL ? "الوضع الفاتح" : "Light Mode")}
              </span>
            </p>
            <p className="text-xs text-amber-800 dark:text-amber-400 mt-1">
              {isRTL ? "استخدم زر التبديل في الشريط الجانبي لتغيير السمة" : "Use the toggle in the sidebar to switch themes"}
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground mb-4">
              {t.settings.colorScheme}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  name: t.settings.primary,
                  key: "primary" as const,
                  current: localSettings.themeColors.primary,
                },
                {
                  name: t.settings.secondary,
                  key: "secondary" as const,
                  current: localSettings.themeColors.secondary,
                },
                {
                  name: t.settings.highlight,
                  key: "highlight" as const,
                  current: localSettings.themeColors.highlight,
                },
                {
                  name: t.settings.background,
                  key: "background" as const,
                  current: localSettings.themeColors.background,
                },
              ].map((color) => (
                <div key={color.key}>
                  <p className="text-xs font-medium text-foreground mb-2">
                    {color.name}
                  </p>
                  <input
                    type="color"
                    value={color.current}
                    onChange={(e) =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        themeColors: {
                          ...prev.themeColors,
                          [color.key]: e.target.value,
                        },
                      }))
                    }
                    className="w-full h-10 rounded-lg cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "safety",
      title: t.settings.safetyTrash,
      icon: "🗑️",
      content: (
        <div className={`space-y-6 ${isRTL ? "text-right" : ""}`}>
          <div className={`flex items-center justify-between p-4 bg-muted rounded-lg ${isRTL ? "flex-row-reverse" : ""}`}>
            <div className={isRTL ? "text-right" : ""}>
              <p className="font-medium text-foreground">{t.settings.safeTrashEnabled}</p>
              <p className="text-xs text-muted-foreground">
                {t.settings.safeTrashDesc}
              </p>
            </div>
            <input
              type="checkbox"
              checked={localSettings.trashEnabled}
              onChange={(e) =>
                setLocalSettings((prev) => ({
                  ...prev,
                  trashEnabled: e.target.checked,
                }))
              }
              className="w-5 h-5 rounded"
            />
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-900 dark:text-blue-300 font-medium mb-2">
              💡 {t.settings.safeTrashBenefits}
            </p>
            <ul className="text-xs text-blue-800 dark:text-blue-400 space-y-1">
              <li>✓ {t.settings.recoverFiles}</li>
              <li>✓ {t.settings.reviewBeforeDelete}</li>
              <li>✓ {t.settings.organizeDeleted}</li>
            </ul>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="h-screen w-full bg-background dark:bg-slate-900 flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card p-6">
        <div className={`max-w-4xl mx-auto flex items-center justify-between ${isRTL ? "flex-row-reverse" : ""}`}>
          <div className={isRTL ? "text-right" : ""}>
            <h1 className={`text-3xl font-bold text-foreground flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
              <Settings className="w-8 h-8 text-primary" />
              {t.settings.title}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t.settings.subtitle}
            </p>
          </div>

          <Button onClick={() => setCurrentPage("dashboard")} variant="outline">
            {t.settings.back}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-6 space-y-4">
          {sections.map((section) => (
            <div
              key={section.id}
              className="bg-card border border-border rounded-lg overflow-hidden"
            >
              <button
                onClick={() => toggleSection(section.id)}
                className={`w-full px-6 py-4 hover:bg-muted transition-colors flex items-center justify-between ${isRTL ? "flex-row-reverse" : ""}`}
              >
                <h2 className="text-lg font-semibold text-foreground">
                  {section.title}
                </h2>

                {expandedSection === section.id ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </button>

              {expandedSection === section.id && (
                <div className="border-t border-border px-6 py-4 bg-muted/30">
                  {section.content}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border bg-card p-6">
        <div className={`max-w-4xl mx-auto flex justify-end gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
          <Button onClick={handleReset} variant="outline" className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
            <RotateCcw className="w-4 h-4" />
            {t.settings.discardChanges}
          </Button>
          <Button
            onClick={handleSaveSettings}
            className={`bg-primary hover:bg-primary/90 text-white flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}
          >
            <Save className="w-4 h-4" />
            {t.settings.saveSettings}
          </Button>
        </div>
      </div>
    </div>
  );
}
