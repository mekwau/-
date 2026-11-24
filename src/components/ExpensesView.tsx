import React, { useMemo, useState } from 'react';
import {
  Edit3,
  FileText,
  Paperclip,
  Plus,
  Receipt,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import { getT } from '../i18n/translations';
import { Expense } from '../types/business';
import { formatCurrency } from '../utils/calculations';

const EXPENSE_CATEGORIES: Expense['category'][] = [
  'materials',
  'packaging',
  'utilities',
  'marketing',
  'delivery',
  'labor',
  'equipment',
  'other',
];

export function ExpensesView() {
  const {
    language,
    business,
    expenses,
    addExpense,
    updateExpense,
    deleteExpense,
    pushToast,
    isBusy,
  } = useBusiness();

  const t = getT(language);
  const isAr = language === 'ar';

  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Expense['category']>('materials');
  const [amount, setAmount] = useState<number>(0);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState<Expense['paymentMethod']>('bank_transfer');
  const [notes, setNotes] = useState('');
  const [receiptName, setReceiptName] = useState('');
  const [receiptDataUrl, setReceiptDataUrl] = useState('');

  const categoryLabels: Record<Expense['category'], string> = {
    materials: isAr ? 'مواد خام' : 'Materials',
    packaging: isAr ? 'تغليف' : 'Packaging',
    utilities: isAr ? 'كهرباء ومياه' : 'Utilities',
    marketing: isAr ? 'تسويق' : 'Marketing',
    delivery: isAr ? 'توصيل وشحن' : 'Delivery',
    labor: isAr ? 'عمالة' : 'Labor',
    equipment: isAr ? 'معدات' : 'Equipment',
    other: isAr ? 'أخرى' : 'Other',
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setCategory('materials');
    setAmount(0);
    setDate(new Date().toISOString().slice(0, 10));
    setPaymentMethod('bank_transfer');
    setNotes('');
    setReceiptName('');
    setReceiptDataUrl('');
  };

  const openAdd = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (exp: Expense) => {
    setEditingId(exp.id);
    setTitle(exp.title);
    setCategory(exp.category);
    setAmount(exp.amount);
    setDate(exp.date);
    setPaymentMethod(exp.paymentMethod);
    setNotes(exp.notes || '');
    setReceiptName(exp.receiptName || '');
    setReceiptDataUrl(exp.receiptDataUrl || '');
    setShowForm(true);
  };

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReceiptName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setReceiptDataUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || amount <= 0) {
      pushToast('error', isAr ? 'يرجى إدخال اسم المصروف ومبلغاً أكبر من صفر' : 'Enter an expense name and positive amount.');
      return;
    }

    if (editingId) {
      updateExpense({
        id: editingId,
        title: title.trim(),
        category,
        amount,
        date,
        paymentMethod,
        receiptName: receiptName || undefined,
        receiptDataUrl: receiptDataUrl || undefined,
        notes: notes.trim() || undefined,
      });
      setShowForm(false);
      resetForm();
      return;
    }

    const ok = await addExpense({
      title: title.trim(),
      category,
      amount,
      date,
      paymentMethod,
      receiptName: receiptName || undefined,
      receiptDataUrl: receiptDataUrl || undefined,
      notes: notes.trim() || undefined,
    });
    if (ok) {
      setShowForm(false);
      resetForm();
    }
  };

  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((e) => {
        if (catFilter !== 'all' && e.category !== catFilter) return false;
        if (search.trim()) {
          const q = search.toLowerCase();
          if (!e.title.toLowerCase().includes(q) && !(e.notes || '').toLowerCase().includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [expenses, catFilter, search]);

  const totalAmount = useMemo(
    () => expenses.reduce((s, e) => s + e.amount, 0),
    [expenses]
  );

  const topCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of expenses) {
      map[e.category] = (map[e.category] ?? 0) + e.amount;
    }
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] as Expense['category'] | undefined;
  }, [expenses]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--ink-primary)]">
            {isAr ? 'تتبع المصروفات' : 'Expenses'}
          </h2>
          <p className="text-xs text-[var(--ink-secondary)] mt-1">
            {isAr
              ? 'سجل فواتير المواد والتغليف والتوصيل والتسويق لمعرفة أين تذهب أموالك.'
              : 'Keep track of every business bill—materials, packaging, shipping, and marketing—in one place.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => (showForm ? setShowForm(false) : openAdd())}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[var(--blueprint)] text-white text-xs font-semibold hover:opacity-90 whitespace-nowrap shrink-0 cursor-pointer"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span>{showForm ? t.common.cancel : t.dashboard.recordExpense}</span>
        </button>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[var(--surface)] border border-[var(--border-hairline)] rounded-2xl p-4">
          <div className="text-xs text-[var(--ink-secondary)]">
            {isAr ? 'إجمالي المصروفات المسجلة' : 'Total Recorded Expenses'}
          </div>
          <div className="mt-1.5 text-xl font-bold font-num text-[var(--ink-primary)]">
            {formatCurrency(totalAmount, business.currency, language)}
          </div>
        </div>
        <div className="bg-[var(--surface)] border border-[var(--border-hairline)] rounded-2xl p-4">
          <div className="text-xs text-[var(--ink-secondary)]">
            {isAr ? 'عدد الفواتير المسجلة' : 'Number of Entries'}
          </div>
          <div className="mt-1.5 text-xl font-bold font-num text-[var(--ink-primary)]">
            {expenses.length}
          </div>
        </div>
        <div className="bg-[var(--surface)] border border-[var(--border-hairline)] rounded-2xl p-4">
          <div className="text-xs text-[var(--ink-secondary)]">
            {isAr ? 'أعلى فئة إنفاق' : 'Top Spending Category'}
          </div>
          <div className="mt-1.5 text-xl font-bold text-[var(--blueprint)]">
            {topCategory ? categoryLabels[topCategory] : '—'}
          </div>
        </div>
      </div>

      {/* Add / Edit Expense Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-[var(--surface)] border border-[var(--border-hairline)] rounded-2xl p-5 sm:p-6 space-y-4"
        >
          <h3 className="text-sm font-bold text-[var(--ink-primary)]">
            {editingId
              ? isAr ? 'تعديل المصروف' : 'Edit Expense'
              : isAr ? 'تسجيل مصروف جديد' : 'New Expense'}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">
                {isAr ? 'اسم المصروف *' : 'Expense Name *'}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={isAr ? 'مثال: علب تغليف' : 'e.g. Shipping boxes'}
                className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">
                {isAr ? 'الفئة *' : 'Category *'}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Expense['category'])}
                className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm"
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {categoryLabels[c]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">
                {isAr ? `المبلغ (${business.currency}) *` : `Amount (${business.currency}) *`}
              </label>
              <input
                type="number"
                min={0}
                step="0.5"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm font-num"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">
                {isAr ? 'التاريخ *' : 'Date *'}
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm font-num"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">
                {isAr ? 'طريقة الدفع *' : 'Payment Method *'}
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as Expense['paymentMethod'])}
                className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm"
              >
                <option value="bank_transfer">{isAr ? 'تحويل بنكي' : 'Bank Transfer'}</option>
                <option value="card">{isAr ? 'بطاقة' : 'Card'}</option>
                <option value="cash">{isAr ? 'نقداً' : 'Cash'}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">
                {isAr ? 'إيصال (اختياري)' : 'Receipt (Optional)'}
              </label>
              <label className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-dashed border-[var(--border-hairline)] bg-[var(--canvas)] text-xs cursor-pointer truncate">
                <Paperclip className="w-3.5 h-3.5 text-[var(--blueprint)] shrink-0" />
                <span className="truncate">{receiptName || (isAr ? 'إرفاق صورة أو PDF' : 'Attach image or PDF')}</span>
                <input type="file" accept="image/*,.pdf" onChange={handleReceiptChange} className="hidden" />
              </label>
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-medium mb-1">
                {isAr ? 'ملاحظات (اختياري)' : 'Notes (Optional)'}
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={isAr ? 'أي تفاصيل إضافية...' : 'Any extra details...'}
                className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="px-4 py-2 rounded-xl border border-[var(--border-hairline)] text-xs font-medium cursor-pointer"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              disabled={isBusy}
              className="px-5 py-2 rounded-xl bg-[var(--blueprint)] text-white text-xs font-semibold hover:opacity-90 cursor-pointer"
            >
              {editingId ? (isAr ? 'تحديث المصروف' : 'Update Expense') : (isAr ? 'حفظ المصروف' : 'Save Expense')}
            </button>
          </div>
        </form>
      )}

      {/* Search & Category Filter */}
      <div className="bg-[var(--surface)] border border-[var(--border-hairline)] rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-[var(--ink-secondary)] absolute start-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isAr ? 'ابحث في المصروفات...' : 'Search expenses...'}
            className="w-full ps-9 pe-3 py-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-xs"
          />
        </div>

        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-xs"
        >
          <option value="all">{isAr ? 'جميع الفئات' : 'All Categories'}</option>
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {categoryLabels[c]}
            </option>
          ))}
        </select>
      </div>

      {/* Expenses List */}
      <div className="bg-[var(--surface)] border border-[var(--border-hairline)] rounded-2xl overflow-hidden">
        {filteredExpenses.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <Receipt className="w-8 h-8 text-[var(--blueprint)] mx-auto opacity-80" />
            <p className="text-sm font-medium text-[var(--ink-primary)]">
              {isAr ? 'لا توجد مصروفات مطابقة' : 'No expenses recorded yet'}
            </p>
            <p className="text-xs text-[var(--ink-secondary)]">
              {isAr ? 'اضغط على "تسجيل مصروف" لإضافة أول فاتورة.' : 'Click "Record Expense" above to add your first business expense.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead className="bg-[var(--canvas)] text-[var(--ink-secondary)] border-b border-[var(--border-hairline)]">
                <tr>
                  <th className="py-3 px-4 font-medium">{isAr ? 'التاريخ' : 'Date'}</th>
                  <th className="py-3 px-4 font-medium">{isAr ? 'المصروف' : 'Expense'}</th>
                  <th className="py-3 px-4 font-medium">{isAr ? 'الفئة' : 'Category'}</th>
                  <th className="py-3 px-4 font-medium">{isAr ? 'الدفع' : 'Method'}</th>
                  <th className="py-3 px-4 font-medium text-end">{isAr ? 'المبلغ' : 'Amount'}</th>
                  <th className="py-3 px-4 font-medium text-end">{isAr ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-hairline)]">
                {filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-[var(--surface-muted)]/60">
                    <td className="py-3.5 px-4 font-num text-[var(--ink-secondary)] whitespace-nowrap">
                      {exp.date}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[var(--ink-primary)]">{exp.title}</div>
                      {(exp.notes || exp.receiptName) && (
                        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-[var(--ink-secondary)]">
                          {exp.notes && <span className="truncate max-w-[220px]">{exp.notes}</span>}
                          {exp.receiptName && (
                            <span className="inline-flex items-center gap-1 text-[var(--positive)]">
                              <FileText className="w-3 h-3" />
                              <span className="truncate max-w-[110px]">{exp.receiptName}</span>
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-[var(--ink-secondary)]">{categoryLabels[exp.category]}</td>
                    <td className="py-3.5 px-4 text-[var(--ink-secondary)]">
                      {exp.paymentMethod === 'bank_transfer'
                        ? isAr ? 'تحويل بنكي' : 'Bank Transfer'
                        : exp.paymentMethod === 'card'
                        ? isAr ? 'بطاقة' : 'Card'
                        : isAr ? 'نقداً' : 'Cash'}
                    </td>
                    <td className="py-3.5 px-4 text-end font-num font-bold text-[var(--ink-primary)] whitespace-nowrap">
                      {formatCurrency(exp.amount, business.currency, language)}
                    </td>
                    <td className="py-3.5 px-4 text-end whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEdit(exp)}
                          className="p-1.5 rounded-lg text-[var(--ink-secondary)] hover:text-[var(--blueprint)] hover:bg-[var(--surface-muted)] cursor-pointer"
                          title={t.common.edit}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteExpense(exp.id)}
                          className="p-1.5 rounded-lg text-[var(--ink-secondary)] hover:text-[var(--danger)] hover:bg-[var(--surface-muted)] cursor-pointer"
                          title={t.common.delete}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
