import React, { useMemo, useState } from 'react';
import { Bot, Check, Loader2, Send, ShieldAlert, Sparkles, X } from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import { getT } from '../i18n/translations';
import { AdvisorResponse, askBusinessAdvisor } from '../services/apiClient';
import { calculateProductCosts, formatCurrency } from '../utils/calculations';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'error';
  text: string;
  response?: AdvisorResponse;
  actionHandled?: 'confirmed' | 'dismissed';
}

export function BusinessAdvisorView() {
  const {
    language,
    business,
    products,
    orders,
    inventory,
    expenses,
    customers,
    goals,
    financeSummary,
    webhookConfig,
    addExpense,
    addGoal,
    saveProduct,
    updateOrderStatus,
    sendCustomerFollowUp,
    pushToast,
  } = useBusiness();

  const t = getT(language);
  const isAr = language === 'ar';

  const starterQuestions = isAr
    ? [
        'كم صافي الربح الذي حققته هذا الشهر؟',
        'ما هو المنتج الأكثر ربحية لدي؟',
        'لماذا ارتفعت مصاريفي؟',
        'ما هي المواد التي قاربت على النفاد؟',
        'ما هو أفضل سعر بيع لمنتجي الجديد؟',
        'كم أحتاج أن أبيع للوصول إلى هدفي الشهري؟',
        'ما المنتجات التي يجب أن أركز عليها؟',
        'كيف يمكنني تقليل تكاليف الإنتاج؟',
      ]
    : [
        'How much profit did I make this month?',
        'Which product is the most profitable?',
        'Why did my expenses increase?',
        'Which materials are running low?',
        'What is the best selling price for my new product?',
        'How much do I need to sell to reach my monthly goal?',
        'Which products should I focus on?',
        'How can I reduce production costs?',
      ];

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: isAr
        ? `مرحباً! أنا مستشار الأعمال الذكي لـ ${business.name}. أسئلتي وإجاباتي مبنية مباشرة على بيانات نشاطك الفعلية (المبيعات، التكاليف، المخزون، والأهداف). كيف يمكنني مساعدتك اليوم؟`
        : `Hello! I am Business Advisor for ${business.name}. Every answer I give is grounded strictly in your actual products, orders, inventory, expenses, and goals. What would you like to review today?`,
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Build exact business data snapshot so the AI never hallucinates numbers
  const businessSnapshot = useMemo(() => {
    const productStats = products.map((p) => {
      const cost = calculateProductCosts(p);
      const marginPct = p.sellingPrice > 0 ? ((p.sellingPrice - cost.costPerUnit) / p.sellingPrice) * 100 : 0;
      return {
        id: p.id,
        name: p.name,
        sellingUnit: p.sellingUnit,
        unitCost: Number(cost.costPerUnit.toFixed(2)),
        sellingPrice: p.sellingPrice,
        profitPerUnit: Number((p.sellingPrice - cost.costPerUnit).toFixed(2)),
        marginPercent: Number(marginPct.toFixed(1)),
      };
    });

    const lowStock = inventory
      .filter((i) => i.availableQty <= i.reorderLevel)
      .map((i) => ({ name: i.name, availableQty: i.availableQty, reorderLevel: i.reorderLevel, unit: i.unit }));

    return {
      business: {
        name: business.name,
        type: business.type,
        currency: business.currency,
        desiredProfitMarginPercent: Math.round(business.desiredProfitMargin * 100),
        vatRatePercent: Math.round(business.vatRate * 100),
      },
      financeSummary,
      products: productStats,
      lowStockItems: lowStock,
      recentOrders: orders.slice(0, 8).map((o) => ({
        orderNumber: o.orderNumber,
        customerName: o.customerName,
        totalPrice: o.totalPrice,
        expectedProfit: o.expectedProfit,
        status: o.status,
        paymentStatus: o.paymentStatus,
        createdAt: o.createdAt,
      })),
      expenses: expenses.map((e) => ({ title: e.title, category: e.category, amount: e.amount, date: e.date })),
      goals: goals.map((g) => ({
        title: g.title,
        targetValue: g.targetValue,
        currentValue: g.currentValue,
        unit: g.unit,
        deadline: g.deadline,
      })),
      customersCount: customers.length,
    };
  }, [business, products, orders, inventory, expenses, goals, customers.length, financeSummary]);

  const sendQuestion = async (questionText: string) => {
    const trimmed = questionText.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const res = await askBusinessAdvisor(webhookConfig, trimmed, language, businessSnapshot);
    setLoading(false);

    if (!res.ok || !res.data) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'error',
          text: res.error || 'Unable to reach Business Advisor right now.',
        },
      ]);
      return;
    }

    setMessages((prev) => [
      ...prev,
      {
        id: `a-${Date.now()}`,
        role: 'assistant',
        text: res.data!.answer,
        response: res.data,
      },
    ]);
  };

  const handleConfirmAction = async (msgId: string, action: NonNullable<AdvisorResponse['proposedAction']>) => {
    let payload: Record<string, unknown> = {};
    try {
      if (action.payloadJson) payload = JSON.parse(action.payloadJson);
    } catch {
      payload = {};
    }

    let ok = true;
    if (action.type === 'record_expense') {
      ok = await addExpense({
        title: String(payload.title || action.title),
        category: 'other',
        amount: Number(payload.amount || 50),
        date: new Date().toISOString().slice(0, 10),
        paymentMethod: 'bank_transfer',
      });
    } else if (action.type === 'create_goal') {
      addGoal({
        title: String(payload.title || action.title),
        type: 'monthly_profit',
        targetValue: Number(payload.targetValue || 5000),
        currentValue: 0,
        unit: business.currency,
        deadline: '2026-12-31',
        aiSuggested: true,
      });
    } else if (action.type === 'update_product_price' && products[0]) {
      const targetProd = products.find((p) => p.id === payload.productId) ?? products[0];
      const nextPrice = Number(payload.sellingPrice || targetProd.sellingPrice);
      ok = await saveProduct({ ...targetProd, sellingPrice: nextPrice });
    } else if (action.type === 'update_order_status' && orders[0]) {
      const targetOrd = orders.find((o) => o.orderNumber === payload.orderNumber) ?? orders[0];
      ok = await updateOrderStatus(targetOrd.id, 'completed');
    } else if (action.type === 'send_followup' && customers[0]) {
      const targetCust = customers.find((c) => c.id === payload.customerId) ?? customers[0];
      ok = await sendCustomerFollowUp(targetCust.id, String(payload.message || action.description));
    } else {
      pushToast('info', action.title);
    }

    if (ok) {
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, actionHandled: 'confirmed' } : m))
      );
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Main Advisor Chat Area */}
      <div className="lg:col-span-8 bg-[var(--surface)] border border-[var(--border-hairline)] rounded-2xl flex flex-col min-h-[620px] max-h-[760px]">
        <div className="px-5 py-4 border-b border-[var(--border-hairline)] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[var(--blueprint-soft)] flex items-center justify-center text-[var(--positive)]">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--ink-primary)]">
                {isAr ? 'مستشار الأعمال (Business Advisor)' : 'Business Advisor'}
              </h2>
              <p className="text-[11px] text-[var(--ink-secondary)]">
                {isAr
                  ? 'يحلل بيانات نشاطك الفعلية ويطلب موافقتك قبل أي تعديل مالي'
                  : 'Grounded in your live business metrics · Requires approval before modifying records'}
              </p>
            </div>
          </div>
          <span className="text-[11px] font-num text-[var(--ink-secondary)]">
            {formatCurrency(financeSummary.netProfit, business.currency, language)} {isAr ? 'صافي ربح' : 'Net'}
          </span>
        </div>

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[var(--blueprint)] text-white'
                    : msg.role === 'error'
                    ? 'bg-[var(--surface-muted)] border border-[var(--danger)] text-[var(--danger)]'
                    : 'bg-[var(--canvas)] border border-[var(--border-hairline)] text-[var(--ink-primary)]'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>

                {msg.response?.keyMetrics && msg.response.keyMetrics.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[var(--border-hairline)] grid grid-cols-2 gap-2">
                    {msg.response.keyMetrics.map((km, idx) => (
                      <div key={idx} className="bg-[var(--surface-muted)] border border-[var(--border-hairline)] rounded-lg px-2.5 py-2 text-xs">
                        <div className="text-[11px] text-[var(--ink-secondary)]">{km.label}</div>
                        <div className="font-bold font-num text-[var(--ink-primary)] mt-0.5">{km.value}</div>
                      </div>
                    ))}
                  </div>
                )}

                {msg.response?.recommendations && msg.response.recommendations.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[var(--border-hairline)]">
                    <div className="text-xs font-semibold text-[var(--positive)] mb-1.5">
                      {isAr ? 'التوصيات العملية:' : 'Practical Recommendations:'}
                    </div>
                    <ul className="space-y-1 text-xs text-[var(--ink-primary)] list-disc ps-4">
                      {msg.response.recommendations.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {msg.response?.proposedAction &&
                  msg.response.proposedAction.type !== 'none' &&
                  !msg.actionHandled && (
                    <div className="mt-3 p-3 rounded-xl bg-[var(--surface)] border border-[var(--blueprint)]/50 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--blueprint)]">
                        <ShieldAlert className="w-4 h-4" />
                        <span>
                          {isAr ? 'إجراء مقترح يتطلب موافقتك' : 'Confirmation Required Before Action'}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-[var(--ink-primary)]">{msg.response.proposedAction.title}</div>
                      <p className="text-xs text-[var(--ink-secondary)]">{msg.response.proposedAction.description}</p>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleConfirmAction(msg.id, msg.response!.proposedAction!)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--blueprint)] text-white text-xs font-semibold cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{t.common.confirm}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setMessages((prev) =>
                              prev.map((m) => (m.id === msg.id ? { ...m, actionHandled: 'dismissed' } : m))
                            )
                          }
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-xs text-[var(--ink-secondary)] cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>{t.common.dismiss}</span>
                        </button>
                      </div>
                    </div>
                  )}

                {msg.actionHandled && (
                  <div className="mt-2 text-[11px] font-medium text-[var(--positive)]">
                    {msg.actionHandled === 'confirmed'
                      ? isAr
                        ? '✓ تم تنفيذ الإجراء بموافقتك.'
                        : '✓ Action confirmed and executed.'
                      : isAr
                      ? 'تم تجاهل الإجراء المقترح.'
                      : 'Proposed action dismissed.'}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-[var(--ink-secondary)]">
              <Loader2 className="w-4 h-4 animate-spin text-[var(--positive)]" />
              <span>{isAr ? 'جاري تحليل بيانات نشاطك...' : 'Analyzing your business data...'}</span>
            </div>
          )}
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendQuestion(input);
          }}
          className="p-4 border-t border-[var(--border-hairline)] flex items-center gap-2.5"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isAr ? 'اسأل عن أرباحك، تسعير المنتجات، المخزون، أو أهدافك...' : 'Ask about your profits, pricing, inventory, or monthly goal...'
            }
            className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm focus:outline-none focus:ring-2 focus:ring-[#4D8EFF]/30"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[var(--blueprint)] text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>{isAr ? 'إرسال' : 'Ask'}</span>
          </button>
        </form>
      </div>

      {/* Starter Questions & Data Context Sidebar */}
      <div className="lg:col-span-4 space-y-4">
        <div className="bg-[var(--surface)] border border-[var(--border-hairline)] rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-[var(--ink-primary)]">
            <Sparkles className="w-4 h-4 text-[var(--positive)]" />
            <span>{isAr ? 'أسئلة سريعة مقترحة' : 'Suggested Business Questions'}</span>
          </div>
          <div className="space-y-2">
            {starterQuestions.map((q) => (
              <button
                key={q}
                type="button"
                disabled={loading}
                onClick={() => sendQuestion(q)}
                className="w-full text-start px-3.5 py-2.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] hover:bg-[var(--blueprint-soft)] text-xs font-medium text-[var(--ink-primary)] transition-colors cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border-hairline)] rounded-2xl p-5 text-xs space-y-2">
          <div className="font-semibold text-[var(--ink-primary)]">
            {isAr ? 'مصدر البيانات المتصل' : 'Connected Business Context'}
          </div>
          <div className="flex justify-between text-[var(--ink-secondary)]">
            <span>{isAr ? 'المنتجات المحللة' : 'Active Products'}</span>
            <span className="font-num font-semibold text-[var(--ink-primary)]">{products.length}</span>
          </div>
          <div className="flex justify-between text-[var(--ink-secondary)]">
            <span>{isAr ? 'الطلبات المحللة' : 'Orders Analyzed'}</span>
            <span className="font-num font-semibold text-[var(--ink-primary)]">{orders.length}</span>
          </div>
          <div className="flex justify-between text-[var(--ink-secondary)]">
            <span>{isAr ? 'أصناف منخفضة المخزون' : 'Low Stock Items'}</span>
            <span className="font-num font-semibold text-[var(--warning)]">
              {businessSnapshot.lowStockItems.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
