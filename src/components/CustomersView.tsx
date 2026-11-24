import React, { useMemo, useState } from 'react';
import { Calendar, ChevronDown, Edit3, Mail, MessageSquare, Phone, Plus, Search, Send, Trash2, Users } from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import { getT } from '../i18n/translations';
import { Customer } from '../types/business';
import { formatCurrency } from '../utils/calculations';

export function CustomersView() {
  const {
    language,
    business,
    customers,
    orders,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    sendCustomerFollowUp,
    pushToast,
    isBusy,
  } = useBusiness();

  const t = getT(language);
  const isAr = language === 'ar';

  const [segment, setSegment] = useState<'all' | 'frequent' | 'inactive' | 'pending_payment'>('all');
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [expandedCustId, setExpandedCustId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [notes, setNotes] = useState('');

  const [followUpTarget, setFollowUpTarget] = useState<Customer | null>(null);
  const [followUpMsg, setFollowUpMsg] = useState('');

  const enrichedCustomers = useMemo(() => {
    const now = new Date('2026-11-24').getTime();
    return customers.map((c) => {
      const custOrders = orders.filter((o) => o.customerId === c.id && o.status !== 'cancelled');
      const totalSpent = custOrders.reduce((s, o) => s + o.totalPrice, 0);
      const pendingBalance = custOrders.reduce((s, o) => s + Math.max(0, o.totalPrice - o.paidAmount), 0);
      const sortedDates = custOrders.map((o) => o.createdAt).sort((a, b) => b.localeCompare(a));
      const lastPurchaseDate = sortedDates[0] ?? null;
      const daysSinceLast = lastPurchaseDate
        ? Math.floor((now - new Date(lastPurchaseDate).getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      return {
        ...c,
        ordersCount: custOrders.length,
        custOrders,
        totalSpent,
        pendingBalance,
        lastPurchaseDate,
        isFrequent: custOrders.length >= 2,
        isInactive: daysSinceLast >= 30,
        hasPending: pendingBalance > 0.01,
      };
    });
  }, [customers, orders]);

  const filtered = useMemo(() => {
    return enrichedCustomers.filter((c) => {
      if (segment === 'frequent' && !c.isFrequent) return false;
      if (segment === 'inactive' && !c.isInactive) return false;
      if (segment === 'pending_payment' && !c.hasPending) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (
          !c.name.toLowerCase().includes(q) &&
          !c.phone.toLowerCase().includes(q) &&
          !c.city.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [enrichedCustomers, segment, search]);

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      pushToast('error', isAr ? 'يرجى إدخال اسم العميل' : 'Please enter customer name.');
      return;
    }
    if (editingCustomerId) {
      const existing = customers.find((c) => c.id === editingCustomerId);
      if (existing) {
        updateCustomer({ ...existing, name: name.trim(), phone, email, city, notes });
      }
      setEditingCustomerId(null);
      setShowAdd(false);
    } else {
      addCustomer({ name: name.trim(), phone, email, city, notes });
      setShowAdd(false);
    }
    setName('');
    setPhone('');
    setEmail('');
    setCity('');
    setNotes('');
  };

  const openEditCustomer = (c: Customer) => {
    setEditingCustomerId(c.id);
    setName(c.name);
    setPhone(c.phone);
    setEmail(c.email);
    setCity(c.city);
    setNotes(c.notes);
    setShowAdd(true);
  };

  const handleSendFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpTarget || !followUpMsg.trim()) return;
    const ok = await sendCustomerFollowUp(followUpTarget.id, followUpMsg.trim());
    if (ok) {
      setFollowUpTarget(null);
      setFollowUpMsg('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--ink-primary)]">
            {isAr ? 'إدارة العملاء والمتابعة' : 'Customer Management (CRM)'}
          </h2>
          <p className="text-xs text-[var(--ink-secondary)] mt-1">
            {isAr
              ? 'تعرف على العملاء المتكررين، والذين لم يطلبوا مؤخراً، والمدفوعات المعلقة.'
              : 'Monitor frequent buyers, inactive customers, pending balances, and scheduled follow-ups.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAdd((v) => !v)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--blueprint)] text-white text-xs font-semibold hover:opacity-90 whitespace-nowrap cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{isAr ? 'إضافة عميل' : 'Add Customer'}</span>
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAddCustomer} className="bg-[var(--surface)] border border-[var(--border-hairline)] rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium mb-1">{isAr ? 'الاسم *' : 'Full Name *'}</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">{isAr ? 'الجوال (اختياري)' : 'Phone (Optional)'}</label>
            <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm font-num" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">{isAr ? 'البريد (اختياري)' : 'Email (Optional)'}</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">{isAr ? 'المدينة (اختياري)' : 'City (Optional)'}</label>
            <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium mb-1">{isAr ? 'ملاحظات (اختياري)' : 'Notes (Optional)'}</label>
            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm" />
          </div>
          <div className="sm:col-span-2 lg:col-span-3 flex justify-end gap-2">
            <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-lg border border-[var(--border-hairline)] text-xs font-medium">
              {t.common.cancel}
            </button>
            <button type="submit" className="px-5 py-2 rounded-lg bg-[var(--blueprint)] text-white text-xs font-semibold cursor-pointer">
              {t.common.save}
            </button>
          </div>
        </form>
      )}

      {/* Segments + Search */}
      <div className="bg-[var(--surface)] border border-[var(--border-hairline)] rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-[var(--ink-secondary)] absolute start-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isAr ? 'ابحث باسم العميل أو الجوال أو المدينة...' : 'Search customer, phone, or city...'}
            className="w-full ps-9 pe-3 py-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-xs"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'all', label: t.common.all },
            { id: 'frequent', label: isAr ? 'عملاء متكررون' : 'Frequent Buyers' },
            { id: 'inactive', label: isAr ? 'لم يطلب مؤخراً' : 'Inactive (30d+)' },
            { id: 'pending_payment', label: isAr ? 'مدفوعات معلقة' : 'Pending Payments' },
          ].map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSegment(s.id as typeof segment)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                segment === s.id ? 'bg-[var(--blueprint-soft)] text-[var(--ink-primary)] font-semibold' : 'text-[var(--ink-secondary)] hover:bg-[var(--surface-muted)]'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Follow-up Composer */}
      {followUpTarget && (
        <form onSubmit={handleSendFollowUp} className="bg-[var(--surface)] border border-[var(--blueprint)] rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[var(--ink-primary)]">
              {isAr ? `متابعة العميل: ${followUpTarget.name}` : `Follow-up Message: ${followUpTarget.name}`}
            </h3>
            <button
              type="button"
              onClick={() => setFollowUpTarget(null)}
              className="text-xs text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
            >
              {t.common.cancel}
            </button>
          </div>
          <textarea
            rows={3}
            value={followUpMsg}
            onChange={(e) => setFollowUpMsg(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-xs"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isBusy}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--blueprint)] text-white text-xs font-semibold cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isAr ? 'إرسال وتسجيل المتابعة' : 'Send & Log Follow-up'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Customer Cards Grid */}
      {filtered.length === 0 ? (
        <div className="bg-[var(--surface)] border border-[var(--border-hairline)] rounded-2xl p-10 text-center space-y-2">
          <Users className="w-8 h-8 text-[var(--blueprint)] mx-auto opacity-80" />
          <p className="text-sm font-medium text-[var(--ink-primary)]">
            {isAr ? 'لا يوجد عملاء مطابقون' : 'No customers found'}
          </p>
          <p className="text-xs text-[var(--ink-secondary)]">
            {isAr ? 'أضف أول عميل لتتبع طلباته ومشترياته بسهولة.' : 'Add your first customer to track their purchases and order history.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((c) => {
            const isExpanded = expandedCustId === c.id;
            return (
              <div key={c.id} className="bg-[var(--surface)] border border-[var(--border-hairline)] rounded-2xl p-5 flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-[var(--ink-primary)]">{c.name}</h3>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[var(--ink-secondary)]">
                        <span className="flex items-center gap-1 font-num">
                          <Phone className="w-3 h-3" /> {c.phone}
                        </span>
                        {c.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {c.email}
                          </span>
                        )}
                        {c.city && <span>{c.city}</span>}
                      </div>
                    </div>
                    <div className="flex items-start gap-2 shrink-0">
                      <div className="text-end">
                        <div className="text-xs text-[var(--ink-secondary)]">{isAr ? 'إجمالي المشتريات' : 'Total Purchases'}</div>
                        <div className="text-sm font-bold font-num text-[var(--ink-primary)]">
                          {formatCurrency(c.totalSpent, business.currency, language)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => openEditCustomer(c)}
                        className="p-1.5 rounded-lg text-[var(--ink-secondary)] hover:text-[var(--blueprint)] hover:bg-[var(--surface-muted)] cursor-pointer"
                        title={t.common.edit}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteCustomer(c.id)}
                        className="p-1.5 rounded-lg text-[var(--ink-secondary)] hover:text-[var(--danger)] hover:bg-[var(--surface-muted)] cursor-pointer"
                        title={t.common.delete}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-[var(--ink-secondary)]">
                    <button
                      type="button"
                      onClick={() => setExpandedCustId(isExpanded ? null : c.id)}
                      className="inline-flex items-center gap-1 font-num font-semibold text-[var(--blueprint)] hover:underline cursor-pointer"
                    >
                      <span>{c.ordersCount} {isAr ? 'طلبات (عرض السجل)' : 'orders (view history)'}</span>
                      <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                    <span aria-hidden="true">·</span>
                    <span>
                      {isAr ? 'آخر شراء:' : 'Last order:'}{' '}
                      <span className="font-num">{c.lastPurchaseDate || (isAr ? 'لا يوجد' : 'None')}</span>
                    </span>
                    {c.hasPending && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-semibold text-[var(--danger)] font-num">
                          {isAr ? 'متبقي عليه:' : 'Due:'} {formatCurrency(c.pendingBalance, business.currency, language)}
                        </span>
                      </>
                    )}
                  </div>

                  {isExpanded && (
                    <div className="mt-3 p-3 rounded-xl bg-[var(--canvas)] border border-[var(--border-hairline)] space-y-1.5 text-xs">
                      {c.custOrders.length === 0 ? (
                        <div className="text-[var(--ink-secondary)]">{isAr ? 'لا توجد طلبات لهذا العميل بعد' : 'No orders for this customer yet.'}</div>
                      ) : (
                        c.custOrders.map((ord) => (
                          <div key={ord.id} className="flex items-center justify-between gap-2">
                            <span className="font-num font-medium text-[var(--ink-primary)]">
                              {ord.orderNumber} · {ord.createdAt}
                            </span>
                            <span className="font-num font-semibold text-[var(--ink-primary)]">
                              {formatCurrency(ord.totalPrice, business.currency, language)}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {c.notes && (
                    <p className="mt-3 text-xs text-[var(--ink-secondary)] bg-[var(--canvas)] px-3 py-2 rounded-lg">{c.notes}</p>
                  )}
                </div>

                <div className="pt-3 border-t border-[var(--border-hairline)] flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-[11px] text-[var(--ink-secondary)]">
                    <Calendar className="w-3.5 h-3.5 text-[var(--blueprint)]" />
                    <span>{isAr ? 'تذكير متابعة:' : 'Reminder:'}</span>
                    <input
                      type="date"
                      value={c.followUpDate ?? ''}
                      onChange={(e) => updateCustomer({ ...c, followUpDate: e.target.value })}
                      className="px-2 py-1 rounded border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-[11px] font-num text-[var(--ink-primary)]"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setFollowUpTarget(c);
                      setFollowUpMsg(
                        c.hasPending
                          ? isAr
                            ? `مرحباً ${c.name}، نود تذكيرك بلطف بالرصيد المتبقي لطلبك.`
                            : `Hi ${c.name}, friendly reminder regarding your open balance with ${business.name}.`
                          : isAr
                          ? `مرحباً ${c.name}، نشتاق لتواصلك! لدينا تشكيلة جديدة في ${business.name}.`
                          : `Hi ${c.name}, we hope you're doing well! Thought you'd love our latest batch at ${business.name}.`
                      );
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-xs font-medium text-[var(--ink-primary)] hover:bg-[var(--blueprint-soft)] cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-[var(--positive)]" />
                    <span>{isAr ? 'بدء متابعة' : 'Initiate Follow-up'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
