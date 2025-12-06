import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Settings,
  HelpCircle,
  Moon,
  Sun,
  Menu,
  Scan,
  Grid3x3,
  Trash2,
  FileText,
  Clock,
  Sparkles,
  Zap,
  Shield,
  TrendingUp,
  Mail,
} from "lucide-react";
import { useState } from "react";
import { formatFileSize } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

export default function Dashboard() {
  const { setCurrentPage, isDarkMode, setIsDarkMode, t, isRTL, scanState } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const { stats, lastScanTime } = scanState;

  const navigationItems = [
    {
      id: "dashboard",
      label: t.nav.dashboard,
      icon: BarChart3,
      current: true,
    },
    {
      id: "scan",
      label: t.nav.scanNow,
      icon: Scan,
      current: false,
    },
    {
      id: "rules",
      label: t.nav.rules,
      icon: Grid3x3,
      current: false,
    },
    {
      id: "settings",
      label: t.nav.settings,
      icon: Settings,
      current: false,
    },
    {
      id: "help",
      label: t.nav.help,
      icon: HelpCircle,
      current: false,
    },
    {
      id: "contact",
      label: isRTL ? "تواصل معنا" : "Contact",
      icon: Mail,
      current: false,
    },
  ];

  const totalTypeFiles = stats.byType.images + stats.byType.videos + stats.byType.documents + stats.byType.audio;
  const getTypePercentage = (count: number) => {
    if (totalTypeFiles === 0) return 0;
    return (count / totalTypeFiles) * 100;
  };

  const formatLastScan = () => {
    if (!lastScanTime) return isRTL ? "لم يتم الفحص بعد" : "Not scanned yet";
    const date = new Date(lastScanTime);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return isRTL ? "الآن" : "Just now";
    if (diffMins < 60) return isRTL ? `منذ ${diffMins} دقيقة` : `${diffMins} minutes ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return isRTL ? `منذ ${diffHours} ساعة` : `${diffHours} hours ago`;
    
    return date.toLocaleDateString(isRTL ? "ar-SA" : "en-US");
  };

  return (
    <div className={`h-screen flex ${isRTL ? "flex-row-reverse" : ""}`}>
      <aside
        className={`${
          sidebarOpen ? "w-72" : "w-20"
        } glass-sidebar transition-all duration-300 flex flex-col`}
      >
        <div className="p-6 border-b border-white/5">
          <div className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-purple-500/25">
              K
            </div>
            {sidebarOpen && (
              <div className={isRTL ? "text-right" : ""}>
                <p className="font-bold text-white text-lg">Knoux</p>
                <p className="text-xs text-white/50">AI Duplicate Cleaner</p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id as any)}
                className={`w-full nav-item ${item.current ? "active" : ""} ${isRTL ? "flex-row-reverse text-right" : ""}`}
                title={sidebarOpen ? "" : item.label}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && (
                  <span className="text-sm font-medium">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5 space-y-2">
          <motion.button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`w-full nav-item group relative overflow-hidden ${isRTL ? "flex-row-reverse" : ""}`}
            title={sidebarOpen ? "" : isDarkMode ? t.nav.lightMode : t.nav.darkMode}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="relative w-5 h-5 flex-shrink-0">
              <AnimatePresence mode="wait">
                {isDarkMode ? (
                  <motion.div
                    key="sun"
                    initial={{ rotate: -90, scale: 0, opacity: 0 }}
                    animate={{ rotate: 0, scale: 1, opacity: 1 }}
                    exit={{ rotate: 90, scale: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="absolute inset-0"
                  >
                    <Sun className="w-5 h-5 text-yellow-400" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="moon"
                    initial={{ rotate: 90, scale: 0, opacity: 0 }}
                    animate={{ rotate: 0, scale: 1, opacity: 1 }}
                    exit={{ rotate: -90, scale: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="absolute inset-0"
                  >
                    <Moon className="w-5 h-5 text-blue-400" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {sidebarOpen && (
              <motion.span 
                className="text-sm font-medium"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                {isDarkMode ? t.nav.lightMode : t.nav.darkMode}
              </motion.span>
            )}
            <motion.div
              className={`absolute inset-0 bg-gradient-to-r ${isDarkMode ? "from-yellow-500/10 to-orange-500/10" : "from-blue-500/10 to-purple-500/10"} opacity-0 group-hover:opacity-100 transition-opacity rounded-xl`}
              layoutId="theme-glow"
            />
          </motion.button>

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`w-full nav-item ${isRTL ? "flex-row-reverse" : ""}`}
            title={sidebarOpen ? "" : t.nav.expand}
          >
            <Menu className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && (
              <span className="text-sm font-medium">
                {sidebarOpen ? t.nav.collapse : t.nav.expand}
              </span>
            )}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto scrollbar-glass">
        <div className="p-8">
          <div className="max-w-6xl mx-auto">
            <div className={`mb-8 ${isRTL ? "text-right" : ""}`}>
              <div className={`flex items-center justify-between ${isRTL ? "flex-row-reverse" : ""}`}>
                <div>
                  <h1 className="text-4xl font-bold gradient-text mb-2">
                    {t.dashboard.title}
                  </h1>
                  <p className="text-white/60">
                    {t.dashboard.subtitle}
                  </p>
                </div>
                {lastScanTime && (
                  <div className={`glass-card !p-3 flex items-center gap-2 text-sm text-white/70 ${isRTL ? "flex-row-reverse" : ""}`}>
                    <Clock className="w-4 h-4 text-purple-400" />
                    <span>{isRTL ? "آخر فحص:" : "Last scan:"} {formatLastScan()}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="stat-card group">
                <div className={`flex items-center justify-between mb-4 ${isRTL ? "flex-row-reverse" : ""}`}>
                  <p className="text-sm text-white/60 font-medium">
                    {t.dashboard.totalFiles}
                  </p>
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FileText className="w-5 h-5 text-purple-400" />
                  </div>
                </div>
                <p className={`text-4xl font-bold text-white ${isRTL ? "text-right" : ""}`}>
                  {stats.totalFiles.toLocaleString(isRTL ? "ar-SA" : "en-US")}
                </p>
                <p className={`text-xs text-white/40 mt-2 ${isRTL ? "text-right" : ""}`}>
                  {t.dashboard.acrossAllFolders}
                </p>
              </div>

              <div className="stat-card group">
                <div className={`flex items-center justify-between mb-4 ${isRTL ? "flex-row-reverse" : ""}`}>
                  <p className="text-sm text-white/60 font-medium">
                    {t.dashboard.duplicatesFound}
                  </p>
                  <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Scan className="w-5 h-5 text-red-400" />
                  </div>
                </div>
                <p className={`text-4xl font-bold ${stats.duplicatesFound > 0 ? "text-red-400" : "text-white"} ${isRTL ? "text-right" : ""}`}>
                  {stats.duplicatesFound.toLocaleString(isRTL ? "ar-SA" : "en-US")}
                </p>
                <p className={`text-xs text-white/40 mt-2 ${isRTL ? "text-right" : ""}`}>
                  {t.dashboard.duplicateCopies}
                </p>
              </div>

              <div className="stat-card group">
                <div className={`flex items-center justify-between mb-4 ${isRTL ? "flex-row-reverse" : ""}`}>
                  <p className="text-sm text-white/60 font-medium">
                    {t.dashboard.totalSize}
                  </p>
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Trash2 className="w-5 h-5 text-cyan-400" />
                  </div>
                </div>
                <p className={`text-4xl font-bold text-cyan-400 ${isRTL ? "text-right" : ""}`}>
                  {formatFileSize(stats.recoverableSpace)}
                </p>
                <p className={`text-xs text-white/40 mt-2 ${isRTL ? "text-right" : ""}`}>
                  {t.dashboard.possibleSavings}
                </p>
              </div>

              <div className="stat-card group">
                <div className={`flex items-center justify-between mb-4 ${isRTL ? "flex-row-reverse" : ""}`}>
                  <p className="text-sm text-white/60 font-medium">
                    {t.dashboard.storageEfficiency}
                  </p>
                  <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                  </div>
                </div>
                <p className={`text-4xl font-bold ${stats.storageEfficiency >= 90 ? "text-green-400" : stats.storageEfficiency >= 70 ? "text-yellow-400" : "text-red-400"} ${isRTL ? "text-right" : ""}`}>
                  {stats.storageEfficiency}%
                </p>
                <p className={`text-xs text-white/40 mt-2 ${isRTL ? "text-right" : ""}`}>
                  {stats.duplicatesFound === 0 ? t.dashboard.noDuplicatesYet : (isRTL ? "نسبة الكفاءة الحالية" : "Current efficiency")}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="glass-card">
                <h2 className={`text-lg font-semibold text-white mb-6 flex items-center gap-2 ${isRTL ? "flex-row-reverse text-right" : ""}`}>
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                  {t.dashboard.fileTypeDistribution}
                </h2>

                <div className="space-y-5">
                  <div>
                    <div className={`flex items-center justify-between mb-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                      <div className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-pink-500 to-rose-500"></div>
                        <span className="text-sm text-white/80">{t.dashboard.images}</span>
                      </div>
                      <span className="text-sm font-medium text-white">
                        {stats.byType.images} {t.dashboard.files}
                      </span>
                    </div>
                    <div className="progress-bar-glass">
                      <div 
                        className="progress-fill"
                        style={{ width: `${getTypePercentage(stats.byType.images)}%`, background: 'linear-gradient(90deg, #ec4899, #f43f5e)' }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className={`flex items-center justify-between mb-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                      <div className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"></div>
                        <span className="text-sm text-white/80">{t.dashboard.videos}</span>
                      </div>
                      <span className="text-sm font-medium text-white">
                        {stats.byType.videos} {t.dashboard.files}
                      </span>
                    </div>
                    <div className="progress-bar-glass">
                      <div 
                        className="progress-fill"
                        style={{ width: `${getTypePercentage(stats.byType.videos)}%`, background: 'linear-gradient(90deg, #3b82f6, #06b6d4)' }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className={`flex items-center justify-between mb-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                      <div className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500"></div>
                        <span className="text-sm text-white/80">
                          {t.dashboard.documents}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-white">
                        {stats.byType.documents} {t.dashboard.files}
                      </span>
                    </div>
                    <div className="progress-bar-glass">
                      <div 
                        className="progress-fill"
                        style={{ width: `${getTypePercentage(stats.byType.documents)}%`, background: 'linear-gradient(90deg, #f59e0b, #f97316)' }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className={`flex items-center justify-between mb-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                      <div className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-violet-500"></div>
                        <span className="text-sm text-white/80">{t.dashboard.audio}</span>
                      </div>
                      <span className="text-sm font-medium text-white">
                        {stats.byType.audio} {t.dashboard.files}
                      </span>
                    </div>
                    <div className="progress-bar-glass">
                      <div 
                        className="progress-fill"
                        style={{ width: `${getTypePercentage(stats.byType.audio)}%`, background: 'linear-gradient(90deg, #a855f7, #8b5cf6)' }}
                      ></div>
                    </div>
                  </div>
                </div>

                {totalTypeFiles === 0 && (
                  <p className={`text-sm text-white/40 mt-6 text-center`}>
                    {isRTL ? "لم يتم الفحص بعد. ابدأ فحصًا للبدء!" : "No scan performed yet. Start a scan to begin!"}
                  </p>
                )}
              </div>

              <div className="glass-card">
                <h2 className={`text-lg font-semibold text-white mb-6 flex items-center gap-2 ${isRTL ? "flex-row-reverse text-right" : ""}`}>
                  <Sparkles className="w-5 h-5 text-yellow-400" />
                  {t.dashboard.quickTips}
                </h2>

                <div className="space-y-4">
                  <div className={`flex gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-colors ${isRTL ? "flex-row-reverse text-right" : ""}`}>
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                      <Scan className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {t.dashboard.startScan}
                      </p>
                      <p className="text-xs text-white/50 mt-1">
                        {t.dashboard.startScanDesc}
                      </p>
                    </div>
                  </div>

                  <div className={`flex gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-blue-500/30 transition-colors ${isRTL ? "flex-row-reverse text-right" : ""}`}>
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <Zap className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {t.dashboard.aiDetection}
                      </p>
                      <p className="text-xs text-white/50 mt-1">
                        {t.dashboard.aiDetectionDesc}
                      </p>
                    </div>
                  </div>

                  <div className={`flex gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-green-500/30 transition-colors ${isRTL ? "flex-row-reverse text-right" : ""}`}>
                    <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <Shield className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {t.dashboard.safeDeletion}
                      </p>
                      <p className="text-xs text-white/50 mt-1">
                        {t.dashboard.safeDeletionDesc}
                      </p>
                    </div>
                  </div>

                  <div className={`flex gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-colors ${isRTL ? "flex-row-reverse text-right" : ""}`}>
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                      <Grid3x3 className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {t.dashboard.batchActions}
                      </p>
                      <p className="text-xs text-white/50 mt-1">
                        {t.dashboard.batchActionsDesc}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-cyan-600/20"></div>
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500"></div>
              <div className="relative z-10 flex items-center justify-between flex-wrap gap-6">
                <div className={isRTL ? "text-right" : ""}>
                  <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-yellow-400" />
                    {stats.duplicatesFound > 0 
                      ? (isRTL ? `تم العثور على ${stats.duplicatesFound} ملفات مكررة!` : `Found ${stats.duplicatesFound} duplicate files!`)
                      : t.dashboard.readyToClean
                    }
                  </h2>
                  <p className="text-white/70 max-w-xl">
                    {stats.duplicatesFound > 0
                      ? (isRTL 
                          ? `يمكنك توفير ${formatFileSize(stats.recoverableSpace)} من مساحة التخزين. انتقل إلى صفحة الفحص لإدارة التكرارات.`
                          : `You can recover ${formatFileSize(stats.recoverableSpace)} of storage space. Go to Scan to manage duplicates.`)
                      : t.dashboard.readyToCleanDesc
                    }
                  </p>
                </div>
                <Button
                  onClick={() => setCurrentPage("scan")}
                  className="glass-button-primary !px-8 !py-4 text-lg"
                >
                  <Scan className={`w-5 h-5 ${isRTL ? "ml-2" : "mr-2"}`} />
                  {stats.duplicatesFound > 0 
                    ? (isRTL ? "إدارة التكرارات" : "Manage Duplicates")
                    : t.dashboard.startScanNow
                  }
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
