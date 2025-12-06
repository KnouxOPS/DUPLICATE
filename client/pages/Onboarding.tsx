import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, Check } from "lucide-react";

type OnboardingStep = "folders" | "filetypes" | "ai";

export default function Onboarding() {
  const {
    setCurrentPage,
    updateSettings,
    settings,
    setHasCompletedOnboarding,
    t,
    isRTL,
  } = useApp();
  const [step, setStep] = useState<OnboardingStep>("folders");
  const [selectedFolders, setSelectedFolders] = useState<string[]>(
    settings.scanPaths,
  );
  const [selectedFileTypes, setSelectedFileTypes] = useState<string[]>(
    settings.fileTypes,
  );
  const [aiSensitivity, setAiSensitivity] = useState(settings.aiSensitivity);

  const fileTypeOptions = [
    { id: "jpg", label: isRTL ? "صور JPG" : "JPG Images", color: "bg-yellow-400" },
    { id: "png", label: isRTL ? "صور PNG" : "PNG Images", color: "bg-yellow-400" },
    { id: "mp4", label: isRTL ? "فيديو MP4" : "MP4 Videos", color: "bg-blue-500" },
    { id: "mp3", label: isRTL ? "صوت MP3" : "MP3 Audio", color: "bg-orange-500" },
    { id: "pdf", label: isRTL ? "مستندات PDF" : "PDF Documents", color: "bg-green-500" },
    { id: "docx", label: isRTL ? "مستندات Word" : "Word Documents", color: "bg-green-500" },
    { id: "xlsx", label: isRTL ? "ملفات Excel" : "Excel Files", color: "bg-green-500" },
  ];

  const toggleFileType = (id: string) => {
    setSelectedFileTypes((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  };

  const handleNext = () => {
    if (step === "folders") {
      setStep("filetypes");
    } else if (step === "filetypes") {
      setStep("ai");
    } else if (step === "ai") {
      updateSettings({
        scanPaths: selectedFolders,
        fileTypes: selectedFileTypes,
        aiSensitivity: aiSensitivity,
      });
      setHasCompletedOnboarding(true);
      localStorage.setItem("knoux_onboarding_completed", "true");
      setCurrentPage("dashboard");
    }
  };

  const handleBack = () => {
    if (step === "filetypes") {
      setStep("folders");
    } else if (step === "ai") {
      setStep("filetypes");
    }
  };

  const getStepNumber = () => {
    if (step === "folders") return 1;
    if (step === "filetypes") return 2;
    return 3;
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-background to-muted dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className={`max-w-2xl mx-auto px-6 py-8 ${isRTL ? "text-right" : ""}`}>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {isRTL ? "مرحبًا بك في Knoux" : "Welcome to Knoux"}
          </h1>
          <p className="text-muted-foreground">
            {isRTL ? "لنبدأ معك في 3 خطوات بسيطة" : "Let's get you started in just 3 simple steps"}
          </p>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className={`flex justify-between mb-8 ${isRTL ? "flex-row-reverse" : ""}`}>
          {[1, 2, 3].map((num) => (
            <div key={num} className={`flex items-center flex-1 ${isRTL ? "flex-row-reverse" : ""}`}>
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  num <= getStepNumber()
                    ? "bg-primary text-white"
                    : "bg-border text-muted-foreground"
                }`}
              >
                {num < getStepNumber() ? <Check className="w-5 h-5" /> : num}
              </div>
              {num < 3 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    num < getStepNumber() ? "bg-primary" : "bg-border"
                  }`}
                ></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 pb-16">
        <div className={`bg-card rounded-lg border border-border p-8 animate-fade-in-up ${isRTL ? "text-right" : ""}`}>
          {step === "folders" && (
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                {isRTL ? "الخطوة 1: اختر المجلدات للفحص" : "Step 1: Select Folders to Scan"}
              </h2>
              <p className="text-muted-foreground mb-6">
                {isRTL 
                  ? "اختر المجلدات التي تريد فحصها للبحث عن الملفات المكررة. يمكنك إضافة المزيد من المجلدات لاحقًا في الإعدادات."
                  : "Choose which folders you want to scan for duplicate files. You can add more folders later in settings."}
              </p>

              <div className="space-y-3">
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors">
                  <p className="text-sm text-muted-foreground mb-2">
                    {isRTL ? "انقر للتصفح أو اسحب المجلدات هنا" : "Click to browse or drag folders here"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isRTL ? "(يمكنك إضافة مسار مثال)" : "(For now, you can add a sample path)"}
                  </p>
                  <input
                    type="text"
                    placeholder={isRTL ? "مثال: C:\\Users\\Documents" : "e.g., C:\\Users\\Documents"}
                    className={`mt-4 w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary ${isRTL ? "text-right" : ""}`}
                    dir={isRTL ? "rtl" : "ltr"}
                    value={selectedFolders[0] || ""}
                    onChange={(e) =>
                      setSelectedFolders([e.target.value].filter(Boolean))
                    }
                  />
                </div>

                {selectedFolders.length > 0 && (
                  <div className="space-y-2">
                    {selectedFolders.map((folder, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between p-3 bg-muted rounded-lg ${isRTL ? "flex-row-reverse" : ""}`}
                      >
                        <span className="text-sm text-foreground">
                          {folder}
                        </span>
                        <button
                          onClick={() =>
                            setSelectedFolders(
                              selectedFolders.filter((_, i) => i !== idx),
                            )
                          }
                          className="text-destructive hover:text-destructive text-sm"
                        >
                          {isRTL ? "إزالة" : "Remove"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === "filetypes" && (
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                {isRTL ? "الخطوة 2: اختر أنواع الملفات" : "Step 2: Select File Types"}
              </h2>
              <p className="text-muted-foreground mb-6">
                {isRTL 
                  ? "اختر أنواع الملفات التي تريد فحصها للبحث عن التكرارات. يمكنك تفعيل أو تعطيل هذه الأنواع في أي وقت."
                  : "Choose which file types you want to scan for duplicates. You can enable or disable these types at any time."}
              </p>

              <div className="grid grid-cols-2 gap-3">
                {fileTypeOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => toggleFileType(option.id)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedFileTypes.includes(option.id)
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card hover:border-muted-foreground"
                    }`}
                  >
                    <div className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
                      <div
                        className={`w-3 h-3 rounded-full ${option.color}`}
                      ></div>
                      <div className={isRTL ? "text-right" : "text-left"}>
                        <p className="text-sm font-medium text-foreground">
                          {option.label}
                        </p>
                      </div>
                      {selectedFileTypes.includes(option.id) && (
                        <Check className={`w-5 h-5 text-primary ${isRTL ? "mr-auto" : "ml-auto"}`} />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === "ai" && (
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                {isRTL ? "الخطوة 3: مستوى حساسية الذكاء الاصطناعي" : "Step 3: AI Sensitivity Level"}
              </h2>
              <p className="text-muted-foreground mb-8">
                {isRTL 
                  ? "اختر مدى حساسية الذكاء الاصطناعي عند اكتشاف الملفات المكررة. الحساسية الأعلى تعني اكتشاف المزيد من التكرارات ولكن قد تتضمن نتائج خاطئة."
                  : "Choose how sensitive the AI should be when detecting duplicate files. Higher sensitivity means more duplicates detected but may include false positives."}
              </p>

              <div className="space-y-4">
                {[
                  { level: "low", label: isRTL ? "حساسية منخفضة" : "Low Sensitivity", desc: isRTL ? "البحث عن التكرارات الواضحة فقط" : "Find only obvious duplicates" },
                  { level: "medium", label: isRTL ? "حساسية متوسطة" : "Medium Sensitivity", desc: isRTL ? "توازن بين الكشف والدقة" : "Balanced detection and accuracy" },
                  { level: "high", label: isRTL ? "حساسية عالية" : "High Sensitivity", desc: isRTL ? "البحث عن جميع التكرارات الممكنة" : "Find all possible duplicates" },
                ].map(({ level, label, desc }) => (
                  <button
                    key={level}
                    onClick={() =>
                      setAiSensitivity(level as "low" | "medium" | "high")
                    }
                    className={`w-full p-6 rounded-lg border-2 transition-all ${isRTL ? "text-right" : "text-left"} ${
                      aiSensitivity === level
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card hover:border-muted-foreground"
                    }`}
                  >
                    <div className={`flex items-center justify-between ${isRTL ? "flex-row-reverse" : ""}`}>
                      <div>
                        <p className="font-semibold text-foreground">
                          {label}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {desc}
                        </p>
                      </div>
                      {aiSensitivity === level && (
                        <Check className="w-6 h-6 text-primary" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <div className={`mt-8 p-4 bg-secondary/20 rounded-lg border border-secondary ${isRTL ? "text-right" : ""}`}>
                <p className="text-sm text-foreground">
                  <span className="font-semibold">💡 {isRTL ? "نصيحة:" : "Tip:"}</span>{" "}
                  {isRTL 
                    ? "يمكنك تغيير مستوى حساسية الذكاء الاصطناعي في أي وقت من الإعدادات."
                    : "You can change the AI sensitivity level at any time in settings."}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className={`flex justify-between gap-4 mt-8 ${isRTL ? "flex-row-reverse" : ""}`}>
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === "folders"}
            className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}
          >
            {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            {isRTL ? "السابق" : "Back"}
          </Button>

          <div className={`flex gap-4 ${isRTL ? "flex-row-reverse" : ""}`}>
            <Button
              variant="outline"
              onClick={() => {
                setHasCompletedOnboarding(true);
                localStorage.setItem("knoux_onboarding_completed", "true");
                setCurrentPage("dashboard");
              }}
            >
              {isRTL ? "تخطي" : "Skip"}
            </Button>
            <Button
              onClick={handleNext}
              className={`flex items-center gap-2 bg-primary hover:bg-primary/90 text-white ${isRTL ? "flex-row-reverse" : ""}`}
            >
              {step === "ai" ? (
                <>
                  {isRTL ? "ابدأ الآن" : "Get Started"}
                  <Check className="w-4 h-4" />
                </>
              ) : (
                <>
                  {isRTL ? "التالي" : "Next"}
                  {isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
