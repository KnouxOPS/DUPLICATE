import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { KnouxSettings, DEFAULT_SETTINGS } from "@shared/settings";
import { translations, Language } from "@/lib/i18n";
import type { FileType, DuplicateGroup, BatchRule, TrashEntry } from "@shared/api";
import type { FileInfo, ScanAnalysis, SuggestionResult } from "@/lib/api";

export type AppPage =
  | "splash"
  | "onboarding"
  | "dashboard"
  | "scan"
  | "settings"
  | "rules"
  | "help"
  | "contact";

export type AppSettings = KnouxSettings;

export const defaultSettings: AppSettings = DEFAULT_SETTINGS;

export interface ScanStats {
  totalFiles: number;
  duplicatesFound: number;
  totalDuplicatesSize: number;
  recoverableSpace: number;
  storageEfficiency: number;
  byType: {
    images: number;
    videos: number;
    documents: number;
    audio: number;
  };
}

export interface EnhancedDuplicateGroup extends DuplicateGroup {
  expanded: boolean;
  bestFileIndex: number;
  recoverableSize: number;
  suggestion?: SuggestionResult;
}

export interface ScanState {
  isScanning: boolean;
  lastScanTime: string | null;
  stats: ScanStats;
  groups: EnhancedDuplicateGroup[];
  selectedForDelete: Set<string>;
  scannedFiles: FileInfo[];
}

const defaultScanState: ScanState = {
  isScanning: false,
  lastScanTime: null,
  stats: {
    totalFiles: 0,
    duplicatesFound: 0,
    totalDuplicatesSize: 0,
    recoverableSpace: 0,
    storageEfficiency: 100,
    byType: {
      images: 0,
      videos: 0,
      documents: 0,
      audio: 0,
    },
  },
  groups: [],
  selectedForDelete: new Set(),
  scannedFiles: [],
};

interface AppContextType {
  currentPage: AppPage;
  setCurrentPage: (page: AppPage) => void;
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;
  isDarkMode: boolean;
  setIsDarkMode: (dark: boolean) => void;
  hasCompletedOnboarding: boolean;
  setHasCompletedOnboarding: (completed: boolean) => void;
  language: Language;
  t: typeof translations.ar;
  isRTL: boolean;
  scanState: ScanState;
  setScanState: React.Dispatch<React.SetStateAction<ScanState>>;
  updateScanStats: (analysis: ScanAnalysis, files: FileInfo[]) => void;
  rules: BatchRule[];
  setRules: React.Dispatch<React.SetStateAction<BatchRule[]>>;
  trashEntries: TrashEntry[];
  setTrashEntries: React.Dispatch<React.SetStateAction<TrashEntry[]>>;
  clearScanResults: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentPage, setCurrentPage] = useState<AppPage>("splash");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [scanState, setScanState] = useState<ScanState>(defaultScanState);
  const [rules, setRules] = useState<BatchRule[]>([]);
  const [trashEntries, setTrashEntries] = useState<TrashEntry[]>([]);

  useEffect(() => {
    const savedSettings = localStorage.getItem("knoux_settings");
    const savedDarkMode = localStorage.getItem("knoux_dark_mode");
    const savedOnboarding = localStorage.getItem("knoux_onboarding_completed");
    const savedScanState = localStorage.getItem("knoux_scan_state");
    const savedRules = localStorage.getItem("knoux_rules");

    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error("Failed to load settings:", e);
      }
    }

    if (savedDarkMode) {
      setIsDarkMode(JSON.parse(savedDarkMode));
    }

    if (savedOnboarding) {
      setHasCompletedOnboarding(JSON.parse(savedOnboarding));
    }

    if (savedScanState) {
      try {
        const parsed = JSON.parse(savedScanState);
        const selectedArray = Array.isArray(parsed.selectedForDelete) 
          ? parsed.selectedForDelete 
          : [];
        setScanState({
          ...parsed,
          selectedForDelete: new Set(selectedArray),
          isScanning: false,
        });
      } catch (e) {
        console.error("Failed to load scan state:", e);
      }
    }

    if (savedRules) {
      try {
        setRules(JSON.parse(savedRules));
      } catch (e) {
        console.error("Failed to load rules:", e);
      }
    }
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("knoux_dark_mode", JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    const toSave = {
      ...scanState,
      selectedForDelete: Array.from(scanState.selectedForDelete),
    };
    localStorage.setItem("knoux_scan_state", JSON.stringify(toSave));
  }, [scanState]);

  useEffect(() => {
    localStorage.setItem("knoux_rules", JSON.stringify(rules));
  }, [rules]);

  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem("knoux_settings", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updateScanStats = useCallback((analysis: ScanAnalysis, files: FileInfo[]) => {
    const byType = {
      images: 0,
      videos: 0,
      documents: 0,
      audio: 0,
    };

    for (const group of analysis.groups) {
      const fileType = group.type as FileType;
      if (fileType === "image") byType.images += group.files.length;
      else if (fileType === "video") byType.videos += group.files.length;
      else if (fileType === "document") byType.documents += group.files.length;
      else if (fileType === "audio") byType.audio += group.files.length;
    }

    const totalDuplicateFiles = analysis.groups.reduce((sum, g) => sum + g.files.length, 0);
    const totalSize = analysis.groups.reduce((sum, g) => sum + g.totalSize, 0);
    const duplicateRatio = files.length > 0 ? (analysis.totalDuplicates / files.length) * 100 : 0;
    const efficiency = Math.max(0, 100 - duplicateRatio);

    setScanState((prev) => ({
      ...prev,
      stats: {
        totalFiles: files.length,
        duplicatesFound: analysis.totalDuplicates,
        totalDuplicatesSize: totalSize,
        recoverableSpace: analysis.totalRecoverableSize,
        storageEfficiency: Math.round(efficiency),
        byType,
      },
      lastScanTime: new Date().toISOString(),
      scannedFiles: files,
    }));
  }, []);

  const clearScanResults = useCallback(() => {
    setScanState(defaultScanState);
    localStorage.removeItem("knoux_scan_state");
  }, []);

  const language = settings.language as Language;
  const t = translations[language];
  const isRTL = language === "ar";

  useEffect(() => {
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [language, isRTL]);

  return (
    <AppContext.Provider
      value={{
        currentPage,
        setCurrentPage,
        settings,
        updateSettings,
        isDarkMode,
        setIsDarkMode,
        hasCompletedOnboarding,
        setHasCompletedOnboarding,
        language,
        t,
        isRTL,
        scanState,
        setScanState,
        updateScanStats,
        rules,
        setRules,
        trashEntries,
        setTrashEntries,
        clearScanResults,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
