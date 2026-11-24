import React, { useState } from 'react';
import { Check, Edit3, Loader2, Plus, Sparkles, Target, Trash2, X } from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import { getT } from '../i18n/translations';
import { askBusinessAdvisor } from '../services/apiClient';
import { BusinessGoal, GoalType } from '../types/business';
import { formatNumber } from '../utils/calculations';

export function GoalsView() {
  const {
    language,
    business,
    goals,
    orders,
    products,
    financeSummary,
    webhookConfig,
    addGoal,
    updateGoal,
    deleteGoal,
    pushToast,
  } = useBusiness();

  const t = getT(language);
  const isAr = language === 'ar';

  const [showAdd, setShowAdd] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<GoalType>('monthly_profit');
  const [targetValue, setTargetValue] = useState<number>(5000);
  const [currentValue, setCurrentValue] = useState<number>(0);
  const [deadline, setDeadline] = useState('2026-12-31');

  const [suggesting, setSuggesting] = useState(false);
  const [aiSuggestedGoal, setAiSuggestedGoal] = useState<{
    title: string;
    type: GoalType;
    targetValue: number;
    rationale: string;
  } | null>(null);

  const unitByType: Record<GoalType, string> = {
    monthly_revenue: business.currency,
    monthly_profit: business.currency,
    order_count: isAr ? 'طلب' : 'orders',
    customer_count: isAr ? 'عميل' : 'customers',
    cost_reduction: '%',
    custom: isAr ? 'وحدة' : 'units',
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || targetValue <= 0) {
      pushToast('error', isAr ? 'أدخل عنوان الهدف وقيمة مستهدفة صحيحة' : 'Enter a goal title and positive target.');
      return;
    }
    if (editingGoalId) {
      const existing = goals.find((g) => g.id === editingGoalId);
      if (existing) {
        updateGoal({
          ...existing,
          title: title.trim(),
          type,
          targetValue,
          currentValue,
          unit: unitByType[type],
          deadline,
        });
      }
      setEditingGoalId(null);
      setShowAdd(false);
      setTitle('');
      return;
    }
    addGoal({
      title: title.trim(),
      type,
      targetValue,
      currentValue,
      unit: unitByType[type],
      deadline,
    });
    setShowAdd(false);
    setTitle('');
  };

  const openEditGoal = (g: BusinessGoal) => {
    setEditingGoalId(g.id);
    setTitle(g.title);
    setType(g.type);
    setTargetValue(g.targetValue);
    setCurrentValue(g.currentValue);
    setDeadline(g.deadline);
    setShowAdd(true);
  };

  const handleSuggestGoal = async () => {
    setSuggesting(true);
    const question = isAr
      ? 'بناءً على مبيعاتنا وأرباحنا الحالية، ما هو أفضل هدف شهري واقعي وقابل للتحقيق للشهر القادم؟'
      : 'Based on our current monthly revenue, net profit, and order volume, suggest one specific achievable monthly profit or revenue target for next month.';

    const res = await askBusinessAdvisor(configOrDemo(), question, language, {
      business: { name: business.name, type: business.type, currency: business.currency },
      financeSummary,
      ordersCount: orders.length,
      productsCount: products.length,
      existingGoals: goals,
    });

    setSuggesting(false);

    if (!res.ok || !res.data) {
      pushToast('error', res.error || 'Could not generate AI goal suggestion.');
      return;
    }

    const baseProfit = Math.max(1000, Math.round(financeSummary.netProfit * 1.2 / 100) * 100);
    setAiSuggestedGoal({
      title: isAr
        ? `تحقيق صافي ربح شهري ${formatNumber(baseProfit)} ${business.currency} (نمو +20%)`
        : `Reach ${formatNumber(baseProfit)} ${business.currency} Monthly Net Profit (+20% growth)`,
      type: 'monthly_profit',
      targetValue: baseProfit,
      rationale: res.data.answer,
    });
  };

  function configOrDemo() {
    return webhookConfig;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--ink-primary)]">
            {isAr ? 'أهداف النمو وتتبع الإنجاز' : 'Business Goals & Growth Tracking'}
          </h2>
          <p className="text-xs text-[var(--ink-secondary)] mt-1">
            {isAr
              ? 'حدد أهداف الأرباح والمبيعات والعملاء وتابع نسبة الإنجاز يومياً.'
              : 'Set measurable profit, revenue, order, customer, or cost-reduction goals and track progress automatically.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={suggesting}
            onClick={handleSuggestGoal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface)] text-xs font-medium text-[var(--ink-primary)] hover:bg-[var(--surface-muted)] disabled:opacity-60 whitespace-nowrap cursor-pointer"
          >
            {suggesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-[var(--positive)]" />}
            <span>{isAr ? 'اقتراح هدف ذكي' : 'AI Suggest Goal'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAdd((v) => !v)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--blueprint)] text-white text-xs font-semibold hover:opacity-90 whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? 'هدف جديد' : 'New Goal'}</span>
          </button>
        </div>
      </div>

      {/* AI Suggested Goal Approval Banner */}
      {aiSuggestedGoal && (
        <div className="bg-[var(--blueprint-soft)] border border-[var(--blueprint)]/50 rounded-2xl p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-[var(--positive)]">
                {isAr ? 'هدف مقترح من مستشار الأعمال (بانتظار موافقتك)' : 'Suggested by Business Advisor (Owner Approval Required)'}
              </div>
              <h3 className="mt-1 text-base font-bold text-[var(--ink-primary)]">{aiSuggestedGoal.title}</h3>
              <p className="mt-1.5 text-xs text-[var(--ink-primary)]/80 leading-relaxed">{aiSuggestedGoal.rationale}</p>
            </div>
            <button type="button" onClick={() => setAiSuggestedGoal(null)} className="p-1 text-[var(--ink-secondary)]">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                addGoal({
                  title: aiSuggestedGoal.title,
                  type: aiSuggestedGoal.type,
                  targetValue: aiSuggestedGoal.targetValue,
                  currentValue: 0,
                  unit: business.currency,
                  deadline: '2026-12-31',
                  aiSuggested: true,
                });
                setAiSuggestedGoal(null);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--blueprint)] text-white text-xs font-semibold cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isAr ? 'اعتماد وإضافة الهدف' : 'Approve & Add Goal'}</span>
            </button>
            <button
              type="button"
              onClick={() => setAiSuggestedGoal(null)}
              className="px-3 py-2 rounded-lg border border-[var(--blueprint)]/50 bg-[var(--surface-muted)] text-xs font-medium text-[var(--ink-primary)] cursor-pointer"
            >
              {t.common.dismiss}
            </button>
          </div>
        </div>
      )}

      {showAdd && (
        <form onSubmit={handleAddGoal} className="bg-[var(--surface)] border border-[var(--border-hairline)] rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium mb-1">{isAr ? 'عنوان الهدف' : 'Goal Title'}</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Reach 8,000 SAR monthly revenue" className="w-full px-3 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">{isAr ? 'نوع الهدف' : 'Goal Metric'}</label>
            <select value={type} onChange={(e) => setType(e.target.value as GoalType)} className="w-full px-3 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm">
              <option value="monthly_profit">{isAr ? 'صافي الربح الشهري' : 'Monthly Profit Target'}</option>
              <option value="monthly_revenue">{isAr ? 'الإيرادات الشهرية' : 'Monthly Revenue Target'}</option>
              <option value="order_count">{isAr ? 'عدد الطلبات' : 'Number of Orders'}</option>
              <option value="customer_count">{isAr ? 'عدد العملاء' : 'Number of Customers'}</option>
              <option value="cost_reduction">{isAr ? 'نسبة خفض التكاليف' : 'Cost Reduction Target (%)'}</option>
              <option value="custom">{isAr ? 'هدف مخصص' : 'Custom Goal'}</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">{isAr ? 'القيمة المستهدفة' : 'Target Value'}</label>
            <input type="number" min={1} value={targetValue} onChange={(e) => setTargetValue(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm font-num" />
          </div>
          {(type === 'cost_reduction' || type === 'custom') && (
            <div>
              <label className="block text-xs font-medium mb-1">{isAr ? 'التقدم الحالي' : 'Current Progress'}</label>
              <input type="number" min={0} value={currentValue} onChange={(e) => setCurrentValue(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm font-num" />
            </div>
          )}
          <div>
            <label className="block text-xs font-medium mb-1">{isAr ? 'تاريخ الاستحقاق' : 'Deadline'}</label>
            <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm font-num" />
          </div>
          <div className="sm:col-span-2 lg:col-span-4 flex justify-end gap-2">
            <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-lg border border-[var(--border-hairline)] text-xs font-medium">
              {t.common.cancel}
            </button>
            <button type="submit" className="px-5 py-2 rounded-lg bg-[var(--blueprint)] text-white text-xs font-semibold cursor-pointer">
              {t.common.save}
            </button>
          </div>
        </form>
      )}

      {/* Goals Cards */}
      {goals.length === 0 ? (
        <div className="bg-[var(--surface)] border border-[var(--border-hairline)] rounded-2xl p-10 text-center space-y-2">
          <Target className="w-8 h-8 text-[var(--blueprint)] mx-auto opacity-80" />
          <p className="text-sm font-medium text-[var(--ink-primary)]">
            {isAr ? 'لم تحدد أهداف عمل بعد' : 'No business goals set yet'}
          </p>
          <p className="text-xs text-[var(--ink-secondary)]">
            {isAr ? 'حدد هدفاً شهرياً للمبيعات أو الأرباح لتتابع تقدمك.' : 'Set a monthly revenue or profit target to track your business growth.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {goals.map((g) => {
            const pct = Math.min(100, Math.round((g.currentValue / Math.max(1, g.targetValue)) * 100));
            const rem = Math.max(0, g.targetValue - g.currentValue);
            const avgOrderProfit =
              orders.length > 0
                ? Math.max(25, orders.reduce((s, o) => s + Math.max(0, o.expectedProfit), 0) / orders.length)
                : 50;
            const estOrdersNeeded =
              rem > 0 && (g.type === 'monthly_profit' || g.type === 'monthly_revenue')
                ? Math.ceil(rem / avgOrderProfit)
                : null;

            return (
              <div key={g.id} className="bg-[var(--surface)] border border-[var(--border-hairline)] rounded-2xl p-5 flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs text-[var(--ink-secondary)]">
                      <Target className="w-4 h-4 text-[var(--positive)]" />
                      <span className="font-num">{g.deadline}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditGoal(g)}
                        className="p-1 text-[var(--ink-secondary)] hover:text-[var(--blueprint)] cursor-pointer"
                        aria-label="Edit goal"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteGoal(g.id)}
                        className="p-1 text-[var(--ink-secondary)] hover:text-[var(--danger)] cursor-pointer"
                        aria-label="Delete goal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="mt-2 text-base font-bold text-[var(--ink-primary)]">{g.title}</h3>

                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-[var(--ink-secondary)]">{t.common.completed}</span>
                      <span className="font-bold font-num text-[var(--positive)]">{pct}%</span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-[var(--surface-muted)] overflow-hidden">
                      <div className="h-full rounded-full bg-[var(--blueprint)]" style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  {estOrdersNeeded !== null && (
                    <p className="mt-3 text-[11px] text-[var(--ink-secondary)] bg-[var(--canvas)] px-3 py-2 rounded-lg">
                      {isAr
                        ? `تلميح: تحتاج تقريباً إلى ${estOrdersNeeded} طلبات إضافية للوصول إلى هذا الهدف.`
                        : `Tip: About ${estOrdersNeeded} more average orders will reach this target.`}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-[var(--border-hairline)] grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <div className="text-[11px] text-[var(--ink-secondary)]">{t.common.current}</div>
                    <div className="font-semibold font-num text-[var(--ink-primary)]">
                      {formatNumber(g.currentValue)} {g.unit}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-[var(--ink-secondary)]">{t.common.target}</div>
                    <div className="font-semibold font-num text-[var(--ink-primary)]">
                      {formatNumber(g.targetValue)} {g.unit}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-[var(--ink-secondary)]">{t.common.remaining}</div>
                    <div className="font-semibold font-num text-[var(--blueprint)]">
                      {formatNumber(rem)} {g.unit}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
