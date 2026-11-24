import React, { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Calculator, FileBarChart2, Info, Receipt } from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import { getT } from '../i18n/translations';
import { formatCurrency } from '../utils/calculations';

const PIE_COLORS = ['#3B82F6', '#34D399', '#F59E0B', '#A78BFA', '#38BDF8', '#FB7185', '#94A3B8', '#60A5FA'];

export function FinanceView() {
  const { language, business, orders, expenses, financeSummary, setActiveSection } = useBusiness();
  const t = getT(language);
  const isAr = language === 'ar';

  const [reportPeriod, setReportPeriod] = useState<'weekly' | 'monthly' | 'annual'>('monthly');

  const expenseBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    for (const exp of expenses) {
      map[exp.category] = (map[exp.category] ?? 0) + exp.amount;
    }
    return Object.entries(map).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value: Number(value.toFixed(2)),
    }));
  }, [expenses]);

  const periodStats = useMemo(() => {
    const refDates = [
      new Date().toISOString().slice(0, 10),
      ...orders.map((o) => o.createdAt),
      ...expenses.map((e) => e.date),
    ]
      .filter(Boolean)
      .map((d) => new Date(d).getTime())
      .filter((n) => !Number.isNaN(n));
    const refDate = refDates.length > 0 ? Math.max(...refDates) : Date.now();
    const daysLimit = reportPeriod === 'weekly' ? 7 : reportPeriod === 'monthly' ? 30 : 365;

    const inRange = (dStr: string) => {
      const diff = (refDate - new Date(dStr).getTime()) / (1000 * 60 * 60 * 24);
      return diff >= -1 && diff <= daysLimit;
    };

    const periodOrders = orders.filter((o) => o.status !== 'cancelled' && inRange(o.createdAt));
    const periodExpenses = expenses.filter((e) => inRange(e.date));

    const revenue = periodOrders.reduce((s, o) => s + o.subtotal - o.discountAmount + o.deliveryFee, 0);
    const cogs = periodOrders.reduce((s, o) => s + o.estimatedCost, 0);
    const opex = periodExpenses.reduce((s, e) => s + e.amount, 0);
    const totalOut = cogs + opex;
    const netProfit = revenue - totalOut;
    const marginPct = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    return { revenue, cogs, opex, totalOut, netProfit, marginPct, count: periodOrders.length };
  }, [orders, expenses, reportPeriod]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--ink-primary)]">
            {t.nav.finance}
          </h2>
          <p className="text-xs text-[var(--ink-secondary)] mt-1">
            {isAr
              ? 'ملخص واضح لإيراداتك ومصاريفك وصافي أرباحك.'
              : 'A clear picture of your earnings, business costs, and real profit.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center p-1 bg-[var(--surface)] border border-[var(--border-hairline)] rounded-xl">
            {(['weekly', 'monthly', 'annual'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setReportPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                  reportPeriod === p ? 'bg-[var(--blueprint)] text-white font-semibold' : 'text-[var(--ink-secondary)]'
                }`}
              >
                {p === 'weekly' ? (isAr ? 'أسبوعي' : 'Weekly') : p === 'monthly' ? (isAr ? 'شهري' : 'Monthly') : isAr ? 'سنوي' : 'Annual'}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setActiveSection('expenses')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface)] text-xs font-medium text-[var(--ink-primary)] hover:border-[var(--blueprint)]/50 cursor-pointer"
          >
            <Receipt className="w-3.5 h-3.5 text-[var(--blueprint)]" />
            <span>{t.nav.expenses}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('pricing')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface)] text-xs font-medium text-[var(--ink-primary)] hover:border-[var(--blueprint)]/50 cursor-pointer"
          >
            <Calculator className="w-3.5 h-3.5 text-[var(--blueprint)]" />
            <span>{t.nav.pricing}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('reports')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--blueprint)] text-white text-xs font-semibold hover:opacity-90 cursor-pointer"
          >
            <FileBarChart2 className="w-3.5 h-3.5" />
            <span>{t.nav.reports}</span>
          </button>
        </div>
      </div>

      {/* Plain-Language Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[var(--surface)] border border-[var(--border-hairline)] rounded-2xl p-5">
          <div className="text-xs text-[var(--ink-secondary)]">{isAr ? 'إجمالي الإيرادات' : 'Total Revenue'}</div>
          <div className="mt-2 text-2xl font-bold font-num text-[var(--ink-primary)]">
            {formatCurrency(periodStats.revenue, business.currency, language)}
          </div>
          <div className="mt-1.5 text-[11px] text-[var(--ink-secondary)] font-num">
            {periodStats.count} {isAr ? 'طلبات' : 'orders'} · {isAr ? 'الضريبة:' : 'VAT:'}{' '}
            {formatCurrency(financeSummary.vatCollected, business.currency, language)}
          </div>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border-hairline)] rounded-2xl p-5">
          <div className="text-xs text-[var(--ink-secondary)]">{isAr ? 'إجمالي التكاليف والمصاريف' : 'Total Costs & Expenses'}</div>
          <div className="mt-2 text-2xl font-bold font-num text-[var(--ink-primary)]">
            {formatCurrency(periodStats.totalOut, business.currency, language)}
          </div>
          <div className="mt-1.5 text-[11px] text-[var(--ink-secondary)] font-num">
            {isAr ? 'تكلفة المنتجات:' : 'Products:'} {formatCurrency(periodStats.cogs, business.currency, language)} ·{' '}
            {isAr ? 'فواتير:' : 'Bills:'} {formatCurrency(periodStats.opex, business.currency, language)}
          </div>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border-hairline)] rounded-2xl p-5">
          <div className="text-xs text-[var(--ink-secondary)]">{isAr ? 'صافي ربحك' : 'Your Net Profit'}</div>
          <div className={`mt-2 text-2xl font-bold font-num ${periodStats.netProfit >= 0 ? 'text-[var(--positive)]' : 'text-[var(--danger)]'}`}>
            {formatCurrency(periodStats.netProfit, business.currency, language)}
          </div>
          <div className="mt-1.5 text-[11px] text-[var(--ink-secondary)] font-num">
            {isAr ? 'هامش الربح:' : 'Profit margin:'}{' '}
            <strong className="text-[var(--ink-primary)]">{periodStats.marginPct.toFixed(1)}%</strong>
          </div>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border-hairline)] rounded-2xl p-5">
          <div className="text-xs text-[var(--ink-secondary)]">{isAr ? 'السيولة النقدية الفعلية' : 'Cash Received vs Paid'}</div>
          <div className="mt-2 text-2xl font-bold font-num text-[var(--blueprint)]">
            {formatCurrency(financeSummary.netCashFlow, business.currency, language)}
          </div>
          <div className="mt-1.5 text-[11px] text-[var(--ink-secondary)] font-num">
            {isAr ? 'مستحقات قيد التحصيل:' : 'Unpaid invoices:'}{' '}
            {formatCurrency(financeSummary.pendingPayments, business.currency, language)}
          </div>
        </div>
      </div>

      {/* Plain-Language Explainer */}
      <div className="bg-[var(--surface)] border border-[var(--border-hairline)] rounded-2xl p-4 flex items-start gap-3 text-xs text-[var(--ink-secondary)]">
        <Info className="w-4 h-4 text-[var(--blueprint)] shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-[var(--ink-primary)]">
            {isAr ? 'ملاحظة مبسطة: ' : 'Simple tip: '}
          </span>
          <span>{t.explainers.cashVsProfit}</span>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-[var(--surface)] border border-[var(--border-hairline)] rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-[var(--ink-primary)] mb-4">
            {isAr ? 'الدخل مقابل المصروفات والربح' : 'Revenue, Costs & Net Profit'}
          </h3>
          <div className="h-64 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: isAr ? 'الإيرادات' : 'Revenue', amount: Number(periodStats.revenue.toFixed(2)) },
                  { name: isAr ? 'تكلفة المنتجات' : 'Product Cost', amount: Number(periodStats.cogs.toFixed(2)) },
                  { name: isAr ? 'المصروفات' : 'Expenses', amount: Number(periodStats.opex.toFixed(2)) },
                  { name: isAr ? 'صافي الربح' : 'Net Profit', amount: Number(periodStats.netProfit.toFixed(2)) },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-hairline)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--ink-secondary)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--ink-secondary)' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border-hairline)',
                    color: 'var(--ink-primary)',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="amount" fill="#3B82F6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-5 bg-[var(--surface)] border border-[var(--border-hairline)] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[var(--ink-primary)]">
              {isAr ? 'توزيع المصروفات' : 'Where Your Expenses Go'}
            </h3>
            <button
              type="button"
              onClick={() => setActiveSection('expenses')}
              className="text-xs font-medium text-[var(--blueprint)] hover:underline cursor-pointer"
            >
              {isAr ? 'إدارة المصروفات' : 'Manage Expenses'}
            </button>
          </div>
          <div className="h-52 w-full" dir="ltr">
            {expenseBreakdown.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-[var(--ink-secondary)]">{t.common.noData}</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={expenseBreakdown} dataKey="value" nameKey="name" innerRadius={48} outerRadius={78} paddingAngle={3}>
                    {expenseBreakdown.map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-[var(--ink-secondary)]">
            {expenseBreakdown.map((item, idx) => (
              <span key={item.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                <span>
                  {item.name}: <strong className="font-num text-[var(--ink-primary)]">{item.value}</strong>
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
