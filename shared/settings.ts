export interface AutoDeleteRule {
  type: "image" | "video" | "document" | "audio";
  keep: "highest_quality" | "latest" | "largest" | "smallest";
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  highlight: string;
  background: string;
}

export interface KnouxSettings {
  version: string;
  scanPaths: string[];
  fileTypes: string[];
  aiSensitivity: "low" | "medium" | "high";
  autoDeleteRules: AutoDeleteRule[];
  trashEnabled: boolean;
  darkMode: boolean;
  themeColors: ThemeColors;
  language: "en" | "ar";
  scanExclusions: string[];
  lastScanTime?: string;
  autoScanInterval: number; // in minutes, 0 = disabled
  showNotifications: boolean;
  previewQuality: "low" | "medium" | "high";
  hashAlgorithm: "md5" | "sha256"; // Not used in frontend but for backend
}

export const DEFAULT_SETTINGS: KnouxSettings = {
  version: "1.0.0",
  scanPaths: [],
  fileTypes: ["jpg", "png", "mp4", "mp3", "pdf", "docx", "xlsx"],
  aiSensitivity: "high",
  autoDeleteRules: [],
  trashEnabled: true,
  darkMode: false,
  themeColors: {
    primary: "#6a0dad",
    secondary: "#ffffff",
    highlight: "#ffcc00",
    background: "#1e1e1e",
  },
  language: "ar",
  scanExclusions: [
    "node_modules",
    ".git",
    ".vscode",
    "dist",
    "build",
    ".cache",
    "Trash",
    "Recycle.Bin",
  ],
  autoScanInterval: 0,
  showNotifications: true,
  previewQuality: "medium",
  hashAlgorithm: "sha256",
};

/**
 * Validate settings object
 */
export function validateSettings(settings: any): settings is KnouxSettings {
  if (!settings || typeof settings !== "object") return false;

  // Check required fields
  if (
    !Array.isArray(settings.scanPaths) ||
    !Array.isArray(settings.fileTypes)
  ) {
    return false;
  }

  // Validate aiSensitivity
  if (!["low", "medium", "high"].includes(settings.aiSensitivity)) {
    return false;
  }

  // Validate language
  if (!["en", "ar"].includes(settings.language)) {
    return false;
  }

  return true;
}

/**
 * Merge settings with defaults
 */
export function mergeWithDefaults(
  partial: Partial<KnouxSettings>,
): KnouxSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...partial,
    themeColors: {
      ...DEFAULT_SETTINGS.themeColors,
      ...partial.themeColors,
    },
  };
}

/**
 * Export settings to JSON string
 */
export function settingsToJSON(settings: KnouxSettings): string {
  return JSON.stringify(settings, null, 2);
}

/**
 * Parse settings from JSON string
 */
export function settingsFromJSON(json: string): KnouxSettings {
  try {
    const parsed = JSON.parse(json);
    if (validateSettings(parsed)) {
      return parsed;
    }
    return mergeWithDefaults(parsed);
  } catch (error) {
    console.error("Failed to parse settings:", error);
    return DEFAULT_SETTINGS;
  }
}
