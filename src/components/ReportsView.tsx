import React, { useMemo, useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import { getT } from '../i18n/translations';
import { dispatchWebhook } from '../services/apiClient';
import { calculateProductCosts, formatCurrency } from '../utils/calculations';

type ReportTab = 'weekly' | 'monthly' | 'sales' | 'pnl' | 'low_inventory' | 'best_sellers';

export function ReportsView() {
  const { language, business, products, orders, expenses, inventory, financeSummary, webhookConfig, pushToast } =
    useBusiness();
  const t = getT(language);
  const isAr = language === 'ar';

  const [activeTab, setActiveTab] = useState<ReportTab>('weekly');
  const [syncing, setSyncing] = useState(false);

  const lowStock = useMemo(() => inventory.filter((i) => i.availableQty <= i.reorderLevel), [inventory]);

  const bestSellers = useMemo(() => {
    const map: Record<string, { name: string; qty: number; revenue: number; cost: number; profit: number }> = {};
    for (const o of orders) {
      if (o.status === 'cancelled') continue;
      for (const item of o.items) {
        if (!map[item.productId]) {
          map[item.productId] = { name: item.productName, qty: 0, revenue: 0, cost: 0, profit: 0 };
        }
        map[item.productId].qty += item.quantity;
        map[item.productId].revenue += item.quantity * item.unitPrice;
        map[item.productId].cost += item.quantity * item.unitCost;
        map[item.productId].profit += item.quantity * (item.unitPrice - item.unitCost);
      }
    }
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [orders]);

  const handleSyncWeeklyWebhook = async () => {
    setSyncing(true);
    const res = await dispatchWebhook(webhookConfig, 'reportsWeekly', {
      businessId: business.id,
      summary: financeSummary,
      lowStockCount: lowStock.length,
    });
    setSyncing(false);
    if (!res.ok) {
      pushToast('error', res.error || 'Weekly report webhook failed.');
    } else {
      pushToast('success', isAr ? 'تم إنشاء ومزامنة التقرير الأسبوعي' : 'Weekly business report generated & synced');
    }
  };

  const handleExportCsv = () => {
    const rows: string[][] = [
      ['Report Type', activeTab],
      ['Business', business.name],
      ['Currency', business.currency],
      ['Sales Revenue (Excl VAT)', financeSummary.salesRevenueExclVat.toFixed(2)],
      ['VAT Collected', financeSummary.vatCollected.toFixed(2)],
      ['COGS', financeSummary.cogs.toFixed(2)],
      ['Operating Expenses', financeSummary.operatingExpenses.toFixed(2)],
      ['Net Profit', financeSummary.netProfit.toFixed(2)],
      ['Profit Margin %', financeSummary.profitMarginPercent.toFixed(2)],
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bizwise-${activeTab}-report.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabs: { id: ReportTab; label: string }[] = [
    { id: 'weekly', label: isAr ? 'التقرير الأسبوعي' : 'Weekly Business Report' },
    { id: 'monthly', label: isAr ? 'التقرير المالي الشهري' : 'Monthly Financial' },
    { id: 'sales', label: isAr ? 'أداء المبيعات' : 'Sales Performance' },
    { id: 'pnl', label: isAr ? 'الأرباح والخسائر' : 'Profit & Loss' },
    { id: 'low_inventory', label: isAr ? 'نواقص المخزون' : 'Low Inventory' },
    { id: 'best_sellers', label: isAr ? 'الأكثر مبيعاً' : 'Best-Selling Products' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--ink-primary)]">
            {isAr ? 'التقارير والتحليلات' : 'Business Reports'}
          </h2>
          <p className="text-xs text-[var(--ink-secondary)] mt-1">
            {isAr ? 'تقارير أسبوعية وشهرية جاهزة للتصدير والمراجعة.' : 'Structured weekly, monthly, inventory, and profitability reports.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={syncing}
            onClick={handleSyncWeeklyWebhook}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface)] text-xs font-medium text-[var(--ink-primary)] hover:bg-[var(--surface-muted)] cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>{isAr ? 'تحديث التقرير الأسبوعي' : 'Refresh Weekly Report'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--blueprint)] text-white text-xs font-semibold hover:opacity-90 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t.common.exportCsv}</span>
          </button>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="flex flex-wrap gap-1.5 p-1.5 bg-[var(--surface-muted)] rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap cursor-pointer ${
              activeTab === tab.id ? 'bg-[var(--blueprint)] text-white font-semibold' : 'text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Report Content Card */}
      <div className="bg-[var(--surface)] border border-[var(--border-hairline)] rounded-2xl p-6 space-y-5">
        {(activeTab === 'weekly' || activeTab === 'monthly' || activeTab === 'pnl') && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-[var(--ink-primary)]">
              {tabs.find((x) => x.id === activeTab)?.label} — {business.name}
            </h3>
            <div className="divide-y divide-[var(--border-hairline)] text-sm">
              <div className="py-3 flex justify-between">
                <span className="text-[var(--ink-secondary)]">{isAr ? 'إجمالي المبيعات (قبل الضريبة)' : 'Gross Sales Revenue (Excl. VAT)'}</span>
                <span className="font-num font-semibold">{formatCurrency(financeSummary.salesRevenueExclVat, business.currency, language)}</span>
              </div>
              <div className="py-3 flex justify-between">
                <span className="text-[var(--ink-secondary)]">{isAr ? 'تكلفة البضاعة المباعة (COGS)' : 'Cost of Goods Sold (COGS)'}</span>
                <span className="font-num text-[var(--blueprint)]">-{formatCurrency(financeSummary.cogs, business.currency, language)}</span>
              </div>
              <div className="py-3 flex justify-between">
                <span className="font-medium text-[var(--ink-primary)]">{isAr ? 'الربح الإجمالي' : 'Gross Profit'}</span>
                <span className="font-num font-bold">{formatCurrency(financeSummary.grossProfit, business.currency, language)}</span>
              </div>
              <div className="py-3 flex justify-between">
                <span className="text-[var(--ink-secondary)]">{isAr ? 'المصاريف التشغيلية المسجلة' : 'Operating Expenses'}</span>
                <span className="font-num text-[var(--blueprint)]">-{formatCurrency(financeSummary.operatingExpenses, business.currency, language)}</span>
              </div>
              <div className="py-3 flex justify-between text-base font-bold">
                <span>{isAr ? 'صافي الربح المحاسبي' : 'Net Accounting Profit'}</span>
                <span className={`font-num ${financeSummary.netProfit >= 0 ? 'text-[var(--positive)]' : 'text-[var(--danger)]'}`}>
                  {formatCurrency(financeSummary.netProfit, business.currency, language)} ({financeSummary.profitMarginPercent.toFixed(1)}%)
                </span>
              </div>
              <div className="py-3 flex justify-between text-xs text-[var(--ink-secondary)]">
                <span>{isAr ? 'ضريبة القيمة المضافة المحصلة (التزام ضريبي)' : 'VAT Collected (Tax Liability, Excluded from Revenue)'}</span>
                <span className="font-num">{formatCurrency(financeSummary.vatCollected, business.currency, language)}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sales' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-[var(--ink-primary)]">{isAr ? 'أداء الطلبات والمبيعات' : 'Sales Performance Summary'}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-[var(--canvas)] border border-[var(--border-hairline)]">
                <div className="text-[var(--ink-secondary)]">{isAr ? 'إجمالي الطلبات' : 'Total Orders'}</div>
                <div className="mt-1 text-xl font-bold font-num">{financeSummary.totalOrders}</div>
              </div>
              <div className="p-4 rounded-xl bg-[var(--canvas)] border border-[var(--border-hairline)]">
                <div className="text-[var(--ink-secondary)]">{isAr ? 'متوسط قيمة الطلب' : 'Average Order Value'}</div>
                <div className="mt-1 text-xl font-bold font-num">
                  {formatCurrency(
                    financeSummary.totalOrders > 0 ? financeSummary.salesRevenueExclVat / financeSummary.totalOrders : 0,
                    business.currency,
                    language
                  )}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-[var(--canvas)] border border-[var(--border-hairline)]">
                <div className="text-[var(--ink-secondary)]">{isAr ? 'المدفوعات المعلقة' : 'Pending Receivables'}</div>
                <div className="mt-1 text-xl font-bold font-num text-[var(--blueprint)]">
                  {formatCurrency(financeSummary.pendingPayments, business.currency, language)}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'low_inventory' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-[var(--ink-primary)]">{isAr ? 'تقرير النواقص وإعادة الطلب' : 'Low Inventory Reorder Report'}</h3>
            {lowStock.length === 0 ? (
              <p className="text-xs text-[var(--positive)]">{isAr ? 'جميع المواد في مستويات آمنة.' : 'All inventory items are currently above reorder levels.'}</p>
            ) : (
              <table className="w-full text-xs text-start">
                <thead className="bg-[var(--canvas)] border-b border-[var(--border-hairline)]">
                  <tr>
                    <th className="py-2.5 px-3 font-medium">{isAr ? 'المادة' : 'Material'}</th>
                    <th className="py-2.5 px-3 font-medium">{isAr ? 'المورد' : 'Supplier'}</th>
                    <th className="py-2.5 px-3 font-medium text-end">{isAr ? 'المتوفر' : 'Available'}</th>
                    <th className="py-2.5 px-3 font-medium text-end">{isAr ? 'حد التنبيه' : 'Reorder Level'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-hairline)]">
                  {lowStock.map((i) => (
                    <tr key={i.id}>
                      <td className="py-2.5 px-3 font-semibold">{i.name}</td>
                      <td className="py-2.5 px-3 text-[var(--ink-secondary)]">{i.supplier}</td>
                      <td className="py-2.5 px-3 text-end font-num font-bold text-[var(--warning)]">
                        {i.availableQty} {i.unit}
                      </td>
                      <td className="py-2.5 px-3 text-end font-num">
                        {i.reorderLevel} {i.unit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'best_sellers' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-[var(--ink-primary)]">{isAr ? 'المنتجات الأكثر مبيعاً وربحية' : 'Best-Selling & Most Profitable Products'}</h3>
            <table className="w-full text-xs text-start">
              <thead className="bg-[var(--canvas)] border-b border-[var(--border-hairline)]">
                <tr>
                  <th className="py-2.5 px-3 font-medium">{isAr ? 'المنتج' : 'Product'}</th>
                  <th className="py-2.5 px-3 font-medium text-end">{isAr ? 'الكمية المباعة' : 'Units Sold'}</th>
                  <th className="py-2.5 px-3 font-medium text-end">{isAr ? 'المبيعات' : 'Revenue'}</th>
                  <th className="py-2.5 px-3 font-medium text-end">{isAr ? 'الربح' : 'Gross Profit'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-hairline)]">
                {bestSellers.map((row) => (
                  <tr key={row.name}>
                    <td className="py-2.5 px-3 font-semibold">{row.name}</td>
                    <td className="py-2.5 px-3 text-end font-num">{row.qty}</td>
                    <td className="py-2.5 px-3 text-end font-num">{formatCurrency(row.revenue, business.currency, language)}</td>
                    <td className="py-2.5 px-3 text-end font-num font-bold text-[var(--positive)]">
                      {formatCurrency(row.profit, business.currency, language)}
                    </td>
                  </tr>
                ))}
                {bestSellers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-[var(--ink-secondary)]">
                      {products.length > 0
                        ? `${products[0].name} · Unit Cost ${formatCurrency(calculateProductCosts(products[0]).costPerUnit, business.currency, language)}`
                        : t.common.noData}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
