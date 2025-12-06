import { useState, useCallback } from "react";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Book,
  FileText,
} from "lucide-react";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export default function HelpPage() {
  const { setCurrentPage, t, isRTL } = useApp();
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const toggleFAQ = useCallback((id: string) => {
    setExpandedFAQ((prev) => (prev === id ? null : id));
  }, []);

  const faqs: FAQItem[] = isRTL ? [
    {
      id: "1",
      category: "getting-started",
      question: "كيف أبدأ فحص التكرارات؟",
      answer: "أولاً، أضف المجلدات للفحص من الإعدادات. ثم انقر على 'فحص الآن' في لوحة التحكم. سيقوم Knoux بتحليل جميع الملفات واكتشاف التكرارات باستخدام الذكاء الاصطناعي المتقدم. قد تستغرق العملية بضع لحظات حسب حجم المجلد.",
    },
    {
      id: "2",
      category: "getting-started",
      question: "ما أنواع الملفات التي يدعمها Knoux؟",
      answer: "يدعم Knoux الصور (JPG, PNG, GIF)، الفيديوهات (MP4, MKV, AVI)، الصوتيات (MP3, WAV, FLAC)، والمستندات (PDF, DOCX, XLSX). يمكنك تفعيل أو تعطيل أنواع الملفات من الإعدادات.",
    },
    {
      id: "3",
      category: "duplicates",
      question: "كيف يكتشف Knoux التكرارات؟",
      answer: "يستخدم Knoux نهجًا هجينًا: الكشف بالتجزئة (MD5/SHA256) للتطابق التام والتعرف على المحتوى بالذكاء الاصطناعي للملفات المتشابهة. هذا يضمن دقة عالية مع تقليل النتائج الخاطئة.",
    },
    {
      id: "4",
      category: "duplicates",
      question: "هل يمكن أن يفوت Knoux بعض التكرارات؟",
      answer: "Knoux دقيق للغاية، لكن الكشف يعتمد على إعداد حساسية الذكاء الاصطناعي. اضبطه على 'عالي' للكشف الأقصى. قد لا يتم اكتشاف بعض الملفات المعدلة بشكل غامض - وهذا توازن لتجنب النتائج الخاطئة.",
    },
    {
      id: "5",
      category: "safety",
      question: "ما هي سلة المحذوفات الآمنة؟",
      answer: "سلة المحذوفات الآمنة هي ميزة تنقل الملفات إلى منطقة محمية بدلاً من حذفها نهائيًا. يمكنك مراجعة واستعادة الملفات إذا لزم الأمر. فعّلها من الإعدادات لأقصى أمان.",
    },
    {
      id: "6",
      category: "safety",
      question: "هل يمكنني استعادة الملفات المحذوفة؟",
      answer: "نعم! إذا كانت سلة المحذوفات الآمنة مفعلة، تذهب الملفات المحذوفة إلى منطقة المحذوفات حيث يمكنك استعادتها. حتى لو حذفت نهائيًا من السلة، قد تتمكن من الاستعادة باستخدام أدوات استعادة النظام.",
    },
    {
      id: "7",
      category: "features",
      question: "ما هي القواعد وكيف أستخدمها؟",
      answer: "القواعد تؤتمت معالجة التكرارات. أنشئ قاعدة 'احتفظ بأكبر صورة' وستحدد تلقائيًا التكرارات الأصغر للحذف. يمكنك إنشاء قواعد متعددة لأنواع ملفات مختلفة.",
    },
    {
      id: "8",
      category: "features",
      question: "كيف تعمل ميزة الاقتراحات الذكية؟",
      answer: "عند العثور على تكرارات، يحلل Knoux بيانات الملف الوصفية (الحجم، التاريخ، الجودة) لاقتراح أفضل ملف للاحتفاظ به. يراعي الاقتراح الحداثة وحجم الملف وأنماط التسمية.",
    },
    {
      id: "9",
      category: "privacy",
      question: "هل بياناتي آمنة مع Knoux؟",
      answer: "بالتأكيد! يعمل Knoux بالكامل بدون اتصال على جهازك. لا ترسل ملفات إلى السحابة ولا تُجمع بيانات شخصية. جميع العمليات تحدث محليًا لخصوصية 100%.",
    },
    {
      id: "10",
      category: "privacy",
      question: "هل يحتاج Knoux إلى إنترنت؟",
      answer: "لا! Knoux تطبيق يعمل بالكامل بدون اتصال. لا يحتاج اتصال إنترنت للعمل. جميع عمليات كشف التكرارات والملفات تحدث محليًا على جهازك.",
    },
  ] : [
    {
      id: "1",
      category: "getting-started",
      question: "How do I start scanning for duplicates?",
      answer: "First, add folders to scan in Settings. Then click 'Scan Now' on the Dashboard. Knoux will analyze all files and detect duplicates using advanced AI. The process may take a few moments depending on your folder size.",
    },
    {
      id: "2",
      category: "getting-started",
      question: "What file types does Knoux support?",
      answer: "Knoux supports Images (JPG, PNG, GIF), Videos (MP4, MKV, AVI), Audio (MP3, WAV, FLAC), and Documents (PDF, DOCX, XLSX). You can enable or disable file types in Settings.",
    },
    {
      id: "3",
      category: "duplicates",
      question: "How does Knoux detect duplicates?",
      answer: "Knoux uses a hybrid approach: Hash-based detection (MD5/SHA256) for exact matches and AI-powered content recognition for similar files. This ensures high accuracy while minimizing false positives.",
    },
    {
      id: "4",
      category: "duplicates",
      question: "Can Knoux miss duplicates?",
      answer: "Knoux is highly accurate, but detection depends on your AI sensitivity setting. Set it to 'High' for maximum detection. Some obscurely modified files might not be detected - this is a trade-off to avoid false positives.",
    },
    {
      id: "5",
      category: "safety",
      question: "What is Safe Trash?",
      answer: "Safe Trash is a feature that moves files to a protected trash area instead of permanently deleting them. You can review and restore files if needed. Enable it in Settings for maximum safety.",
    },
    {
      id: "6",
      category: "safety",
      question: "Can I recover deleted files?",
      answer: "Yes! If Safe Trash is enabled, deleted files go to a trash area where you can restore them. Even if you permanently delete from trash, you may be able to recover using system recovery tools.",
    },
    {
      id: "7",
      category: "features",
      question: "What are Rules and how do I use them?",
      answer: "Rules automate duplicate handling. Create a rule to 'Keep Largest Image' and it will automatically mark smaller duplicates for deletion. You can create multiple rules for different file types.",
    },
    {
      id: "8",
      category: "features",
      question: "How does the Smart Suggestion feature work?",
      answer: "When duplicates are found, Knoux analyzes file metadata (size, date, quality) to suggest the best file to keep. The suggestion considers recency, file size, and naming patterns.",
    },
    {
      id: "9",
      category: "privacy",
      question: "Is my data safe with Knoux?",
      answer: "Absolutely! Knoux works completely offline on your computer. No files are sent to the cloud, and no personal data is collected. All operations happen locally for 100% privacy.",
    },
    {
      id: "10",
      category: "privacy",
      question: "Does Knoux require internet?",
      answer: "No! Knoux is a fully offline application. It doesn't require internet connection to function. All duplicate detection and file operations happen locally on your computer.",
    },
  ];

  const categories = isRTL ? [
    { id: "all", name: "جميع المواضيع" },
    { id: "getting-started", name: "البداية" },
    { id: "duplicates", name: "كشف التكرارات" },
    { id: "safety", name: "الأمان والمحذوفات" },
    { id: "features", name: "الميزات" },
    { id: "privacy", name: "الخصوصية والأمان" },
  ] : [
    { id: "all", name: "All Topics" },
    { id: "getting-started", name: "Getting Started" },
    { id: "duplicates", name: "Duplicate Detection" },
    { id: "safety", name: "Safety & Trash" },
    { id: "features", name: "Features" },
    { id: "privacy", name: "Privacy & Security" },
  ];

  const filteredFAQs =
    selectedCategory === "all"
      ? faqs
      : faqs.filter((faq) => faq.category === selectedCategory);

  return (
    <div className="h-screen w-full bg-background dark:bg-slate-900 flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card p-6">
        <div className={`max-w-4xl mx-auto flex items-center justify-between ${isRTL ? "flex-row-reverse" : ""}`}>
          <div className={isRTL ? "text-right" : ""}>
            <h1 className={`text-3xl font-bold text-foreground flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
              <HelpCircle className="w-8 h-8 text-primary" />
              {t.help.title}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isRTL ? "ابحث عن إجابات وتعلم كيفية استخدام Knoux بفعالية" : "Find answers and learn how to use Knoux effectively"}
            </p>
          </div>

          <Button onClick={() => setCurrentPage("dashboard")} variant="outline">
            {t.help.back}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-6 space-y-8">
          {/* About Section */}
          <section className={`bg-card border border-border rounded-lg p-8 ${isRTL ? "text-right" : ""}`}>
            <h2 className={`text-2xl font-bold text-foreground mb-4 flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
              <FileText className="w-6 h-6 text-primary" />
              {isRTL ? "حول Knoux Duplicate AI" : "About Knoux Duplicate AI"}
            </h2>

            <div className="space-y-4 text-foreground">
              <p>
                <span className="font-semibold">Knoux Duplicate AI</span>{" "}
                {isRTL 
                  ? "هو أداة احترافية لكشف وإزالة الملفات المكررة لأنظمة Windows و macOS و Linux."
                  : "is a professional-grade duplicate file detection and removal tool for Windows, macOS, and Linux."}
              </p>

              <div className="bg-primary/10 border border-primary rounded-lg p-4">
                <p className="text-sm font-semibold text-primary mb-2">
                  🎯 {isRTL ? "مهمتنا" : "Our Mission"}
                </p>
                <p className="text-sm">
                  "الذكاء في التنظيم، لا للتكرار" {isRTL ? "- نؤمن بأن جهازك يجب أن يكون منظمًا وفعالًا." : "(Intelligence in Organization, No Duplicates) - We believe your computer should be organized and efficient."}
                </p>
              </div>

              <div>
                <p className="font-semibold mb-2">{isRTL ? "الميزات الرئيسية:" : "Key Features:"}</p>
                <ul className="space-y-2 text-sm">
                  <li>✓ {isRTL ? "كشف التكرارات بالذكاء الاصطناعي بدقة 99%+" : "AI-powered duplicate detection with 99%+ accuracy"}</li>
                  <li>✓ {isRTL ? "دعم جميع أنواع الملفات الرئيسية" : "Support for all major file types"}</li>
                  <li>✓ {isRTL ? "سلة محذوفات آمنة للحذف المحمي" : "Safe Trash for protected deletion"}</li>
                  <li>✓ {isRTL ? "اقتراحات ذكية لاختيار الملفات" : "Smart suggestions for file selection"}</li>
                  <li>✓ {isRTL ? "قواعد مجمعة للأتمتة" : "Batch rules for automation"}</li>
                  <li>✓ {isRTL ? "يعمل بالكامل بدون اتصال - لا يحتاج إنترنت" : "100% offline - no internet required"}</li>
                  <li>✓ {isRTL ? "خصوصية كاملة - لا جمع بيانات" : "Complete privacy - no data collection"}</li>
                </ul>
              </div>

              <div className="text-xs text-muted-foreground pt-4 border-t border-border">
                <p>
                  {isRTL ? "الإصدار 1.0.0 • مبني بـ React و TypeScript و TailwindCSS" : "Version 1.0.0 • Built with React, TypeScript & TailwindCSS"}
                </p>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section className={isRTL ? "text-right" : ""}>
            <h2 className={`text-2xl font-bold text-foreground mb-4 flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
              <MessageSquare className="w-6 h-6 text-primary" />
              {isRTL ? "الأسئلة الشائعة" : "Frequently Asked Questions"}
            </h2>

            {/* Category Filter */}
            <div className={`flex flex-wrap gap-2 mb-6 ${isRTL ? "justify-end" : ""}`}>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                    selectedCategory === cat.id
                      ? "bg-primary text-white"
                      : "bg-muted text-foreground hover:bg-border"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* FAQ Items */}
            <div className="space-y-3">
              {filteredFAQs.map((faq) => (
                <div
                  key={faq.id}
                  className="bg-card border border-border rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => toggleFAQ(faq.id)}
                    className={`w-full px-6 py-4 hover:bg-muted transition-colors flex items-center justify-between ${isRTL ? "flex-row-reverse text-right" : "text-left"}`}
                  >
                    <h3 className="font-semibold text-foreground text-sm">
                      {faq.question}
                    </h3>

                    {expandedFAQ === faq.id ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    )}
                  </button>

                  {expandedFAQ === faq.id && (
                    <div className="border-t border-border px-6 py-4 bg-muted/30">
                      <p className="text-sm text-foreground leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Resources Section */}
          <section className={`bg-card border border-border rounded-lg p-8 ${isRTL ? "text-right" : ""}`}>
            <h2 className={`text-2xl font-bold text-foreground mb-4 flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
              <Book className="w-6 h-6 text-primary" />
              {isRTL ? "مصادر التعلم" : "Learning Resources"}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-border rounded-lg hover:border-primary transition-colors cursor-pointer">
                <p className="font-semibold text-foreground mb-2">
                  📚 {isRTL ? "دليل المستخدم" : "User Guide"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isRTL ? "توثيق كامل حول كيفية استخدام ميزات Knoux" : "Complete documentation on how to use Knoux features"}
                </p>
              </div>

              <div className="p-4 border border-border rounded-lg hover:border-primary transition-colors cursor-pointer">
                <p className="font-semibold text-foreground mb-2">
                  🎓 {isRTL ? "فيديوهات تعليمية" : "Video Tutorials"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isRTL ? "أدلة فيديو خطوة بخطوة للمهام الشائعة" : "Step-by-step video guides for common tasks"}
                </p>
              </div>

              <div className="p-4 border border-border rounded-lg hover:border-primary transition-colors cursor-pointer">
                <p className="font-semibold text-foreground mb-2">
                  ⚙️ {isRTL ? "الإعدادات المتقدمة" : "Advanced Settings"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isRTL ? "تعرف على خيارات التكوين المتقدمة" : "Learn about advanced configuration options"}
                </p>
              </div>

              <div className="p-4 border border-border rounded-lg hover:border-primary transition-colors cursor-pointer">
                <p className="font-semibold text-foreground mb-2">
                  🐛 {isRTL ? "الإبلاغ عن مشاكل" : "Report Issues"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isRTL ? "وجدت خطأ؟ ساعدنا في تحسين Knoux" : "Found a bug? Help us improve Knoux"}
                </p>
              </div>
            </div>
          </section>

          {/* Contact Section */}
          <section className={`bg-secondary/20 border border-secondary rounded-lg p-8 ${isRTL ? "text-right" : ""}`}>
            <h2 className="text-xl font-bold text-foreground mb-4">
              {isRTL ? "تحتاج مزيد من المساعدة؟" : "Need More Help?"}
            </h2>

            <p className="text-sm text-foreground mb-6">
              {isRTL 
                ? "نحن هنا للمساعدة! إذا لم تجد إجابة سؤالك، لا تتردد في التواصل مع فريق الدعم."
                : "We're here to help! If you can't find the answer to your question, feel free to reach out to our support team."}
            </p>

            <div className={`flex gap-3 flex-wrap ${isRTL ? "flex-row-reverse" : ""}`}>
              <Button
                className="bg-primary hover:bg-primary/90 text-white"
                onClick={() =>
                  alert(
                    isRTL 
                      ? "البريد الإلكتروني للدعم: support@knoux.com\nهذا عرض توضيحي - استخدم نموذج الاتصال في النسخة الكاملة"
                      : "Email support: support@knoux.com\nThis is a demo - use the contact form in the full version",
                  )
                }
              >
                📧 {isRTL ? "اتصل بالدعم" : "Contact Support"}
              </Button>
              <Button variant="outline">🌐 {isRTL ? "زيارة الموقع" : "Visit Website"}</Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
