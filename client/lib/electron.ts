declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

interface ElectronAPI {
  dialog: {
    selectFolder: () => Promise<string[]>;
    selectFiles: () => Promise<string[]>;
  };
  scan: {
    start: (options: ScanOptions) => Promise<ScanResult>;
    cancel: () => Promise<{ success: boolean }>;
    onProgress: (callback: (progress: ScanProgress) => void) => () => void;
  };
  hash: {
    calculate: (filePath: string) => Promise<HashResult>;
    calculateBatch: (filePaths: string[]) => Promise<HashResult[]>;
    onProgress: (callback: (progress: HashProgress) => void) => () => void;
  };
  metadata: {
    extract: (filePath: string) => Promise<FileMetadata>;
    extractBatch: (filePaths: string[]) => Promise<FileMetadata[]>;
    onProgress: (callback: (progress: MetadataProgress) => void) => () => void;
  };
  duplicates: {
    detect: (files: FileInfo[], options?: { sensitivity?: string }) => Promise<DuplicateAnalysis>;
    compare: (file1: string, file2: string) => Promise<CompareResult>;
    onProgress: (callback: (progress: DuplicateProgress) => void) => () => void;
  };
  trash: {
    move: (files: FileInfo[]) => Promise<TrashResult>;
    restore: (trashId: string) => Promise<TrashResult>;
    delete: (trashIds: string[]) => Promise<TrashResult>;
    empty: () => Promise<TrashResult>;
    getStatus: () => Promise<TrashStatus>;
    getItems: () => Promise<TrashEntry[]>;
  };
  rules: {
    getAll: () => Promise<BatchRule[]>;
    create: (rule: Partial<BatchRule>) => Promise<BatchRule>;
    update: (ruleId: string, updates: Partial<BatchRule>) => Promise<BatchRule | null>;
    delete: (ruleId: string) => Promise<boolean>;
    toggle: (ruleId: string) => Promise<BatchRule | null>;
    apply: (groups: DuplicateGroup[]) => Promise<RuleApplication[]>;
    onProgress: (callback: (progress: RulesProgress) => void) => () => void;
  };
  ai: {
    analyze: (files: FileInfo[]) => Promise<FileFeatures[]>;
    recommend: (group: DuplicateGroup) => Promise<AIRecommendation>;
    getSummary: (analysis: DuplicateAnalysis) => Promise<AISummary>;
    onProgress: (callback: (progress: AIProgress) => void) => () => void;
  };
  settings: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: any) => Promise<{ success: boolean }>;
    getAll: () => Promise<Record<string, any>>;
    reset: () => Promise<{ success: boolean }>;
  };
  shell: {
    openPath: (filePath: string) => Promise<string>;
    showItemInFolder: (filePath: string) => Promise<{ success: boolean }>;
  };
  app: {
    getVersion: () => Promise<string>;
    getPath: (name: string) => Promise<string>;
  };
  system: {
    getStats: () => Promise<SystemStats>;
  };
}

export interface ScanOptions {
  folders: string[];
  fileTypes?: string[];
  recursive?: boolean;
}

export interface ScanResult {
  totalFiles: number;
  filesScanned: number;
  files: FileInfo[];
  errors: string[];
  duration: number;
  byType: {
    images: number;
    videos: number;
    audio: number;
    documents: number;
    other: number;
  };
}

export interface ScanProgress {
  currentFolder: string;
  filesScanned: number;
  totalFilesFound: number;
  currentFile?: string;
  percentage?: number;
}

export interface FileInfo {
  path: string;
  name: string;
  size: number;
  type: 'image' | 'video' | 'audio' | 'document' | 'other';
  extension: string;
  created: number;
  modified: number;
  hash?: string;
  metadata?: Record<string, any>;
}

export interface HashResult {
  path: string;
  hash: string;
  algorithm: string;
  size: number;
  error?: string;
}

export interface HashProgress {
  current: number;
  total: number;
  currentFile: string;
  percentage: number;
}

export interface FileMetadata {
  path: string;
  type: 'image' | 'video' | 'audio' | 'document' | 'other';
  metadata: Record<string, any> | null;
  error?: string;
}

export interface MetadataProgress {
  current: number;
  total: number;
  currentFile: string;
  percentage: number;
}

export interface DuplicateGroup {
  id: string;
  hash: string;
  files: FileInfo[];
  totalSize: number;
  recoverableSize: number;
  type: string;
  similarity: number;
  aiConfidence?: number;
  recommended?: {
    keep: FileInfo;
    reason: string;
  };
}

export interface DuplicateAnalysis {
  groups: DuplicateGroup[];
  totalDuplicates: number;
  totalFiles: number;
  totalRecoverableSize: number;
  byType: {
    images: number;
    videos: number;
    audio: number;
    documents: number;
    other: number;
  };
  scanDuration: number;
}

export interface DuplicateProgress {
  phase: 'hashing' | 'grouping' | 'analyzing' | 'complete';
  current: number;
  total: number;
  currentFile?: string;
  percentage: number;
  groupsFound?: number;
}

export interface CompareResult {
  identical: boolean;
  similarity: number;
  sizeDiff: number;
  details: string;
}

export interface TrashEntry {
  id: string;
  originalPath: string;
  trashPath: string;
  fileName: string;
  size: number;
  deletedAt: string;
  type: string;
  hash?: string;
  canRestore: boolean;
}

export interface TrashStatus {
  totalItems: number;
  totalSize: number;
  trashPath: string;
  items: TrashEntry[];
}

export interface TrashResult {
  success: boolean;
  entries?: TrashEntry[];
  errors?: string[];
}

export interface BatchRule {
  id: string;
  name: string;
  type: string;
  category: string;
  action: string;
  enabled: boolean;
  priority: number;
  deletePattern?: string;
  priorityPaths?: string[];
  description: string;
  createdAt: string;
  lastUsed?: string;
  timesApplied: number;
}

export interface RuleApplication {
  ruleId: string;
  ruleName: string;
  groupId: string;
  filesToKeep: FileInfo[];
  filesToDelete: FileInfo[];
  reason: string;
  applied: boolean;
  error?: string;
}

export interface RulesProgress {
  current: number;
  total: number;
  currentRule: string;
  groupsProcessed: number;
  filesProcessed: number;
  percentage: number;
}

export interface FileFeatures {
  path: string;
  name: string;
  size: number;
  sizeScore: number;
  ageScore: number;
  qualityScore: number;
  pathScore: number;
  overallScore: number;
}

export interface AIRecommendation {
  action: string;
  confidence: number;
  reason: string;
  keepFile: FileInfo;
  deleteFiles: FileInfo[];
  riskLevel: 'low' | 'medium' | 'high';
  details: string[];
}

export interface AISummary {
  totalGroups: number;
  totalDuplicates: number;
  totalRecoverableSpace: number;
  recommendations: {
    autoCleanSafe: number;
    reviewRecommended: number;
    highRisk: number;
  };
  byType: {
    images: { count: number; space: number };
    videos: { count: number; space: number };
    audio: { count: number; space: number };
    documents: { count: number; space: number };
    other: { count: number; space: number };
  };
  topSuggestions: string[];
  estimatedTimeToClean: number;
}

export interface AIProgress {
  current: number;
  total: number;
  currentFile?: string;
  phase: 'analyzing' | 'scoring' | 'recommending' | 'complete';
  percentage: number;
}

export interface SystemStats {
  platform: string;
  arch: string;
  cpus: number;
  totalMemory: number;
  freeMemory: number;
  hostname: string;
  uptime: number;
}

export function isElectron(): boolean {
  return typeof window !== 'undefined' && window.electronAPI !== undefined;
}

export function getElectronAPI(): ElectronAPI | null {
  if (isElectron()) {
    return window.electronAPI!;
  }
  return null;
}

export async function selectFolders(): Promise<string[]> {
  const api = getElectronAPI();
  if (api) {
    return api.dialog.selectFolder();
  }
  return [];
}

export async function startScan(options: ScanOptions): Promise<ScanResult | null> {
  const api = getElectronAPI();
  if (api) {
    return api.scan.start(options);
  }
  return null;
}

export async function detectDuplicates(
  files: FileInfo[],
  options?: { sensitivity?: string }
): Promise<DuplicateAnalysis | null> {
  const api = getElectronAPI();
  if (api) {
    return api.duplicates.detect(files, options);
  }
  return null;
}

export async function moveToTrash(files: FileInfo[]): Promise<TrashResult | null> {
  const api = getElectronAPI();
  if (api) {
    return api.trash.move(files);
  }
  return null;
}

export async function getTrashStatus(): Promise<TrashStatus | null> {
  const api = getElectronAPI();
  if (api) {
    return api.trash.getStatus();
  }
  return null;
}

export async function getRules(): Promise<BatchRule[]> {
  const api = getElectronAPI();
  if (api) {
    return api.rules.getAll();
  }
  return [];
}

export async function applyRules(groups: DuplicateGroup[]): Promise<RuleApplication[]> {
  const api = getElectronAPI();
  if (api) {
    return api.rules.apply(groups);
  }
  return [];
}

export async function getAIRecommendation(group: DuplicateGroup): Promise<AIRecommendation | null> {
  const api = getElectronAPI();
  if (api) {
    return api.ai.recommend(group);
  }
  return null;
}

export async function getAISummary(analysis: DuplicateAnalysis): Promise<AISummary | null> {
  const api = getElectronAPI();
  if (api) {
    return api.ai.getSummary(analysis);
  }
  return null;
}

export async function getSetting(key: string): Promise<any> {
  const api = getElectronAPI();
  if (api) {
    return api.settings.get(key);
  }
  return null;
}

export async function setSetting(key: string, value: any): Promise<boolean> {
  const api = getElectronAPI();
  if (api) {
    const result = await api.settings.set(key, value);
    return result.success;
  }
  return false;
}

export async function getSystemStats(): Promise<SystemStats | null> {
  const api = getElectronAPI();
  if (api) {
    return api.system.getStats();
  }
  return null;
}

export async function openInFolder(filePath: string): Promise<void> {
  const api = getElectronAPI();
  if (api) {
    await api.shell.showItemInFolder(filePath);
  }
}

export async function openFile(filePath: string): Promise<void> {
  const api = getElectronAPI();
  if (api) {
    await api.shell.openPath(filePath);
  }
}
