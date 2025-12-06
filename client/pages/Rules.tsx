import { useState, useCallback, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { useNotification } from "@/hooks/useNotification";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, ToggleLeft, ChevronDown, ChevronUp, Play, Loader2, RefreshCw } from "lucide-react";
import * as api from "@/lib/api";
import type { BatchRule } from "@shared/api";

export default function RulesPage() {
  const { setCurrentPage, t, isRTL, rules, setRules, scanState, setScanState } = useApp();
  const { success, info, error: notifyError } = useNotification();

  const [showNewRuleForm, setShowNewRuleForm] = useState(false);
  const [expandedRule, setExpandedRule] = useState<string | null>(null);
  const [applyingRules, setApplyingRules] = useState(false);
  const [loadingRules, setLoadingRules] = useState(false);
  const [savingRule, setSavingRule] = useState(false);
  const [newRule, setNewRule] = useState<{
    name: string;
    type: "keep_largest" | "keep_newest" | "keep_smallest" | "keep_best_quality" | "delete_pattern";
    category: "image" | "video" | "document" | "audio" | "all";
  }>({
    name: "",
    type: "keep_largest",
    category: "all",
  });

  const ruleTypes = [
    {
      id: "keep_largest",
      name: isRTL ? "احتفظ بالأكبر" : "Keep Largest File",
      description: isRTL ? "حذف التكرارات الأصغر" : "Delete smaller duplicates",
    },
    {
      id: "keep_newest",
      name: isRTL ? "احتفظ بالأحدث" : "Keep Newest File",
      description: isRTL ? "حذف التكرارات الأقدم" : "Delete older duplicates",
    },
    {
      id: "keep_smallest",
      name: isRTL ? "احتفظ بالأصغر" : "Keep Smallest File",
      description: isRTL ? "حذف التكرارات الأكبر" : "Delete larger duplicates",
    },
    {
      id: "keep_best_quality",
      name: isRTL ? "احتفظ بأفضل جودة" : "Keep Best Quality",
      description: isRTL ? "استخدام الذكاء الاصطناعي لاختيار أفضل نسخة" : "Use AI to select the best version",
    },
  ];

  const categories = [
    { id: "all", name: isRTL ? "جميع الملفات" : "All Files" },
    { id: "image", name: isRTL ? "الصور" : "Images" },
    { id: "video", name: isRTL ? "الفيديوهات" : "Videos" },
    { id: "document", name: isRTL ? "المستندات" : "Documents" },
    { id: "audio", name: isRTL ? "الصوتيات" : "Audio Files" },
  ];

  const fetchRules = useCallback(async () => {
    setLoadingRules(true);
    try {
      const response = await api.getRules();
      if (response.success && response.data) {
        const fetchedRules = Array.isArray(response.data) ? response.data : (response.data.rules || []);
        setRules(fetchedRules);
      }
    } catch (err) {
      console.error("Failed to fetch rules:", err);
    } finally {
      setLoadingRules(false);
    }
  }, [setRules]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const handleAddRule = useCallback(async () => {
    if (!newRule.name) {
      info(isRTL ? "الرجاء إدخال اسم القاعدة" : "Please enter a rule name");
      return;
    }

    setSavingRule(true);
    try {
      const ruleTypeInfo = ruleTypes.find(r => r.id === newRule.type);
      const categoryInfo = categories.find(c => c.id === newRule.category);

      const response = await api.createRule({
        name: newRule.name,
        type: newRule.type,
        category: newRule.category,
        enabled: true,
        description: `${ruleTypeInfo?.name} - ${categoryInfo?.name}`,
      });

      if (response.success && response.data) {
        setRules((prev) => [...prev, response.data]);
        setShowNewRuleForm(false);
        setNewRule({ name: "", type: "keep_largest", category: "all" });
        success(isRTL ? `تم إنشاء القاعدة "${response.data.name}"` : `Rule "${response.data.name}" created`);
      }
    } catch (err) {
      notifyError(isRTL ? "فشل في إنشاء القاعدة" : "Failed to create rule");
    } finally {
      setSavingRule(false);
    }
  }, [newRule, success, info, notifyError, isRTL, ruleTypes, categories, setRules]);

  const handleDeleteRule = useCallback(
    async (ruleId: string) => {
      const rule = rules.find((r) => r.id === ruleId);
      try {
        await api.deleteRule(ruleId);
        setRules((prev) => prev.filter((r) => r.id !== ruleId));
        success(isRTL ? `تم حذف القاعدة "${rule?.name}"` : `Rule "${rule?.name}" deleted`);
      } catch (err) {
        notifyError(isRTL ? "فشل في حذف القاعدة" : "Failed to delete rule");
      }
    },
    [rules, success, notifyError, isRTL, setRules]
  );

  const handleToggleRule = useCallback(async (ruleId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await api.toggleRule(ruleId);
      if (response.success) {
        setRules((prev) =>
          prev.map((r) => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r))
        );
      }
    } catch (err) {
      notifyError(isRTL ? "فشل في تبديل القاعدة" : "Failed to toggle rule");
    }
  }, [setRules, notifyError, isRTL]);

  const applyRulesToGroups = useCallback(() => {
    const enabledRules = rules.filter((r) => r.enabled);
    
    if (enabledRules.length === 0) {
      info(isRTL ? "فعّل قاعدة واحدة على الأقل للتطبيق" : "Enable at least one rule to apply");
      return;
    }

    if (scanState.groups.length === 0) {
      info(isRTL ? "لا توجد مجموعات مكررة. قم بفحص الملفات أولاً" : "No duplicate groups found. Scan files first");
      return;
    }

    setApplyingRules(true);

    try {
      const newSelectedForDelete = new Set<string>();

      scanState.groups.forEach((group) => {
        const applicableRules = enabledRules.filter(
          (rule) => rule.category === "all" || rule.category === group.type
        );

        if (applicableRules.length === 0) return;

        const primaryRule = applicableRules[0];
        let bestFileIndex = 0;

        switch (primaryRule.type) {
          case "keep_largest":
            bestFileIndex = group.files.reduce(
              (best, file, idx) => (file.size > group.files[best].size ? idx : best),
              0
            );
            break;
          case "keep_newest":
            bestFileIndex = group.files.reduce(
              (best, file, idx) => (file.modified > group.files[best].modified ? idx : best),
              0
            );
            break;
          case "keep_smallest":
            bestFileIndex = group.files.reduce(
              (best, file, idx) => (file.size < group.files[best].size ? idx : best),
              0
            );
            break;
          case "keep_best_quality":
            bestFileIndex = group.bestFileIndex;
            break;
        }

        group.files.forEach((_, idx) => {
          if (idx !== bestFileIndex) {
            newSelectedForDelete.add(`${group.id}-file-${idx}`);
          }
        });
      });

      setScanState((prev) => ({
        ...prev,
        selectedForDelete: newSelectedForDelete,
      }));

      success(
        isRTL
          ? `تم تطبيق ${enabledRules.length} قاعدة على ${scanState.groups.length} مجموعة. تم تحديد ${newSelectedForDelete.size} ملف للحذف`
          : `Applied ${enabledRules.length} rule(s) to ${scanState.groups.length} groups. ${newSelectedForDelete.size} files selected for deletion`,
        {
          description: isRTL
            ? "انتقل إلى صفحة الفحص لمراجعة وتأكيد الحذف"
            : "Go to Scan page to review and confirm deletion",
        }
      );
    } catch (err) {
      notifyError(isRTL ? "فشل في تطبيق القواعد" : "Failed to apply rules");
    } finally {
      setApplyingRules(false);
    }
  }, [rules, scanState.groups, setScanState, success, info, notifyError, isRTL]);

  const handleApplyRules = useCallback(() => {
    applyRulesToGroups();
  }, [applyRulesToGroups]);

  return (
    <div className="h-screen w-full bg-background dark:bg-slate-900 flex flex-col">
      <div className="border-b border-border bg-card p-6">
        <div className={`max-w-5xl mx-auto flex items-center justify-between ${isRTL ? "flex-row-reverse" : ""}`}>
          <div className={isRTL ? "text-right" : ""}>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              {t.rules.title}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t.rules.subtitle}
            </p>
          </div>

          <div className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
            <Button onClick={fetchRules} variant="outline" size="icon" disabled={loadingRules}>
              <RefreshCw className={`w-4 h-4 ${loadingRules ? "animate-spin" : ""}`} />
            </Button>
            <Button onClick={() => setCurrentPage("dashboard")} variant="outline">
              {t.rules.back}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto p-6 space-y-6">
          <div className={`bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 ${isRTL ? "text-right" : ""}`}>
            <p className="text-sm text-blue-900 dark:text-blue-300">
              <span className="font-semibold">💡 {isRTL ? "كيف تعمل القواعد:" : "How Rules Work:"}</span>{" "}
              {isRTL
                ? "أنشئ قواعد تحدد تلقائيًا الملفات التي يجب الاحتفاظ بها عند اكتشاف التكرارات. يتم تطبيق القواعد أثناء أو بعد الفحص."
                : "Create rules that automatically select which files to keep when duplicates are found. Rules are applied during or after scanning."}
            </p>
          </div>

          {scanState.groups.length > 0 && (
            <div className={`bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4 ${isRTL ? "text-right" : ""}`}>
              <p className="text-sm text-green-900 dark:text-green-300">
                <span className="font-semibold">✓ </span>
                {isRTL
                  ? `تم العثور على ${scanState.groups.length} مجموعة مكررة. يمكنك تطبيق القواعد عليها الآن.`
                  : `${scanState.groups.length} duplicate groups found. You can apply rules to them now.`}
              </p>
            </div>
          )}

          {showNewRuleForm && (
            <div className={`bg-card border border-border rounded-lg p-6 space-y-4 animate-fade-in-up ${isRTL ? "text-right" : ""}`}>
              <h2 className="text-lg font-bold text-foreground">
                {t.rules.createNewRule}
              </h2>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t.rules.ruleName}
                </label>
                <input
                  type="text"
                  placeholder={isRTL ? "مثال: حذف النسخ الاحتياطية القديمة" : "e.g., Delete Old Backups"}
                  value={newRule.name}
                  onChange={(e) =>
                    setNewRule((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className={`w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary ${isRTL ? "text-right" : ""}`}
                  dir={isRTL ? "rtl" : "ltr"}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t.rules.ruleType}
                  </label>
                  <select
                    value={newRule.type}
                    onChange={(e) =>
                      setNewRule((prev) => ({
                        ...prev,
                        type: e.target.value as typeof newRule.type,
                      }))
                    }
                    className={`w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${isRTL ? "text-right" : ""}`}
                    dir={isRTL ? "rtl" : "ltr"}
                  >
                    {ruleTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t.rules.fileCategory}
                  </label>
                  <select
                    value={newRule.category}
                    onChange={(e) =>
                      setNewRule((prev) => ({
                        ...prev,
                        category: e.target.value as typeof newRule.category,
                      }))
                    }
                    className={`w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${isRTL ? "text-right" : ""}`}
                    dir={isRTL ? "rtl" : "ltr"}
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={`flex gap-3 pt-4 ${isRTL ? "flex-row-reverse" : ""}`}>
                <Button
                  onClick={() => setShowNewRuleForm(false)}
                  variant="outline"
                  disabled={savingRule}
                >
                  {t.rules.cancel}
                </Button>
                <Button
                  onClick={handleAddRule}
                  disabled={savingRule}
                  className={`flex-1 bg-primary hover:bg-primary/90 text-white flex items-center justify-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}
                >
                  {savingRule ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  {t.rules.createRule}
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className={`flex items-center justify-between ${isRTL ? "flex-row-reverse" : ""}`}>
              <h2 className="text-lg font-bold text-foreground">
                {t.rules.yourRules} ({rules.length})
              </h2>
              <Button
                onClick={() => setShowNewRuleForm(!showNewRuleForm)}
                className={`bg-primary hover:bg-primary/90 text-white flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}
              >
                <Plus className="w-4 h-4" />
                {isRTL ? "قاعدة جديدة" : "New Rule"}
              </Button>
            </div>

            {loadingRules && (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            )}

            {!loadingRules && rules.length === 0 && !showNewRuleForm && (
              <div className="bg-card border border-dashed border-border rounded-lg p-12 text-center">
                <p className="text-muted-foreground mb-4">
                  {t.rules.noRulesYet}
                </p>
                <Button
                  onClick={() => setShowNewRuleForm(true)}
                  className={`bg-primary hover:bg-primary/90 text-white ${isRTL ? "flex-row-reverse" : ""}`}
                >
                  <Plus className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                  {isRTL ? "أنشئ قاعدتك الأولى" : "Create Your First Rule"}
                </Button>
              </div>
            )}

            {!loadingRules && rules.map((rule) => (
              <div
                key={rule.id}
                className="bg-card border border-border rounded-lg overflow-hidden animate-fade-in-up"
              >
                <div
                  onClick={() =>
                    setExpandedRule(expandedRule === rule.id ? null : rule.id)
                  }
                  className={`w-full px-6 py-4 hover:bg-muted transition-colors flex items-center justify-between cursor-pointer ${isRTL ? "flex-row-reverse" : ""}`}
                >
                  <div className={`flex items-center gap-4 flex-1 ${isRTL ? "flex-row-reverse text-right" : "text-left"}`}>
                    <div
                      className={`w-3 h-3 rounded-full ${
                        rule.enabled ? "bg-primary" : "bg-muted-foreground"
                      }`}
                    ></div>

                    <div>
                      <p className="font-semibold text-foreground">
                        {rule.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {rule.description}
                      </p>
                    </div>
                  </div>

                  <div className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                    <div
                      onClick={(e) => handleToggleRule(rule.id, e)}
                      className={`p-2 rounded-lg transition-colors cursor-pointer ${
                        rule.enabled
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                      title={rule.enabled ? (isRTL ? "تعطيل القاعدة" : "Disable rule") : (isRTL ? "تفعيل القاعدة" : "Enable rule")}
                    >
                      <ToggleLeft className="w-5 h-5" />
                    </div>

                    {expandedRule === rule.id ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {expandedRule === rule.id && (
                  <div className={`border-t border-border px-6 py-4 bg-muted/30 space-y-4 ${isRTL ? "text-right" : ""}`}>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          {isRTL ? "النوع" : "Type"}
                        </p>
                        <p className="font-medium text-foreground">
                          {ruleTypes.find((t) => t.id === rule.type)?.name || rule.type}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          {isRTL ? "الفئة" : "Category"}
                        </p>
                        <p className="font-medium text-foreground">
                          {categories.find((c) => c.id === rule.category)?.name || rule.category}
                        </p>
                      </div>
                    </div>

                    <div className={`pt-4 border-t border-border flex gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
                      <Button
                        onClick={() => handleDeleteRule(rule.id)}
                        variant="outline"
                        className={`flex-1 text-destructive hover:text-destructive flex items-center justify-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}
                      >
                        <Trash2 className="w-4 h-4" />
                        {isRTL ? "حذف القاعدة" : "Delete Rule"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {rules.filter((r) => r.enabled).length > 0 && (
            <div className={`bg-secondary/20 border border-secondary rounded-lg p-6 ${isRTL ? "text-right" : ""}`}>
              <h2 className="font-semibold text-foreground mb-4">
                📋 {isRTL ? "ملخص القواعد النشطة" : "Active Rules Summary"}
              </h2>
              <ul className="space-y-2">
                {rules
                  .filter((r) => r.enabled)
                  .map((rule) => (
                    <li key={rule.id} className="text-sm text-foreground">
                      ✓ <span className="font-medium">{rule.name}</span> -{" "}
                      <span className="text-muted-foreground">
                        {rule.description}
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {rules.filter((r) => r.enabled).length > 0 && (
        <div className="border-t border-border bg-card p-6">
          <div className={`max-w-5xl mx-auto flex justify-end gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
            <Button
              onClick={() => setCurrentPage("dashboard")}
              variant="outline"
            >
              {t.rules.cancel}
            </Button>
            <Button
              onClick={handleApplyRules}
              disabled={applyingRules || scanState.groups.length === 0}
              className={`bg-primary hover:bg-primary/90 text-white px-6 flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}
            >
              {applyingRules ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              {isRTL ? "تطبيق القواعد على التكرارات" : "Apply Rules to Duplicates"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
