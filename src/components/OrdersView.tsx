import React, { useMemo, useState } from 'react';
import {
  ArrowUpDown,
  CheckCircle2,
  PackageCheck,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import { getT, ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from '../i18n/translations';
import { OrderItem, OrderStatus, PaymentStatus } from '../types/business';
import { calculateProductCosts, formatCurrency } from '../utils/calculations';

const ALL_STATUSES: OrderStatus[] = [
  'new',
  'confirmed',
  'in_production',
  'ready',
  'shipped',
  'completed',
  'cancelled',
];

export function OrdersView() {
  const {
    language,
    business,
    orders,
    products,
    customers,
    createOrder,
    updateOrderStatus,
    updateOrderPayment,
    deleteOrder,
    addCustomer,
    pushToast,
    isBusy,
  } = useBusiness();

  const t = getT(language);
  const isAr = language === 'ar';

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [sortDesc, setSortDesc] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Create order form state
  const [customerId, setCustomerId] = useState<string>(customers[0]?.id ?? 'new');
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [orderItems, setOrderItems] = useState<{ productId: string; quantity: number }[]>(
    products[0] ? [{ productId: products[0].id, quantity: 1 }] : []
  );
  const [discountAmount, setDiscountAmount] = useState(0);
  const [deliveryFee, setDeliveryFee] = useState(business.defaultDeliveryCost || 0);
  const [initialStatus, setInitialStatus] = useState<OrderStatus>('new');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('pending');
  const [orderNotes, setOrderNotes] = useState('');

  const filteredOrders = useMemo(() => {
    return orders
      .filter((o) => {
        if (statusFilter !== 'all' && o.status !== statusFilter) return false;
        if (paymentFilter !== 'all' && o.paymentStatus !== paymentFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const match =
            o.orderNumber.toLowerCase().includes(q) ||
            o.customerName.toLowerCase().includes(q) ||
            o.items.some((i) => i.productName.toLowerCase().includes(q));
          if (!match) return false;
        }
        return true;
      })
      .sort((a, b) =>
        sortDesc ? b.createdAt.localeCompare(a.createdAt) : a.createdAt.localeCompare(b.createdAt)
      );
  }, [orders, statusFilter, paymentFilter, searchQuery, sortDesc]);

  const draftTotals = useMemo(() => {
    let subtotal = 0;
    let estimatedCost = 0;
    const resolvedItems: OrderItem[] = [];

    for (const row of orderItems) {
      const prod = products.find((p) => p.id === row.productId);
      if (!prod) continue;
      const unitCost = Number(calculateProductCosts(prod).costPerUnit.toFixed(2));
      const qty = Math.max(1, row.quantity);
      subtotal += prod.sellingPrice * qty;
      estimatedCost += unitCost * qty;
      resolvedItems.push({
        productId: prod.id,
        productName: prod.name,
        quantity: qty,
        unitPrice: prod.sellingPrice,
        unitCost,
      });
    }

    const taxable = Math.max(0, subtotal - discountAmount + deliveryFee);
    const vatAmount = Number((taxable * business.vatRate).toFixed(2));
    const totalPrice = Number((taxable + vatAmount).toFixed(2));
    const expectedProfit = Number((subtotal - discountAmount - estimatedCost).toFixed(2));

    return { resolvedItems, subtotal, vatAmount, totalPrice, estimatedCost, expectedProfit };
  }, [orderItems, products, discountAmount, deliveryFee, business.vatRate]);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (draftTotals.resolvedItems.length === 0) {
      pushToast('error', isAr ? 'يرجى إضافة منتج واحد على الأقل' : 'Add at least one product to the order.');
      return;
    }

    let resolvedCustomer = customers.find((c) => c.id === customerId);
    if (customerId === 'new' || !resolvedCustomer) {
      if (!newCustName.trim()) {
        pushToast('error', isAr ? 'يرجى إدخال اسم العميل' : 'Please enter the customer name.');
        return;
      }
      resolvedCustomer = addCustomer({
        name: newCustName.trim(),
        phone: newCustPhone.trim() || '-',
        email: '',
        city: '',
        notes: '',
      });
    }

    const paidAmount =
      paymentStatus === 'paid'
        ? draftTotals.totalPrice
        : paymentStatus === 'partial'
        ? Number((draftTotals.totalPrice * 0.5).toFixed(2))
        : 0;

    const ok = await createOrder({
      customerId: resolvedCustomer.id,
      customerName: resolvedCustomer.name,
      customerPhone: resolvedCustomer.phone,
      items: draftTotals.resolvedItems,
      discountAmount,
      deliveryFee,
      vatAmount: draftTotals.vatAmount,
      subtotal: draftTotals.subtotal,
      totalPrice: draftTotals.totalPrice,
      estimatedCost: Number(draftTotals.estimatedCost.toFixed(2)),
      expectedProfit: draftTotals.expectedProfit,
      paymentStatus,
      paidAmount,
      status: initialStatus,
      notes: orderNotes,
      createdAt: new Date().toISOString().slice(0, 10),
      source: 'manual',
    });

    if (ok) {
      setShowCreateForm(false);
      setOrderNotes('');
      setDiscountAmount(0);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--ink-primary)]">
            {isAr ? 'إدارة الطلبات والمبيعات' : 'Orders & Sales Management'}
          </h2>
          <p className="text-xs text-[var(--ink-secondary)] mt-1">
            {isAr
              ? 'يتم خصم المواد الخام من المخزون تلقائياً عند تغيير حالة الطلب إلى "مكتمل" فقط.'
              : 'Raw materials are deducted automatically only when an order is marked Completed—never while pending.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateForm((v) => !v)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--blueprint)] text-white text-xs font-semibold hover:opacity-90 whitespace-nowrap shrink-0 cursor-pointer"
        >
          {showCreateForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span>{showCreateForm ? t.common.cancel : isAr ? 'إنشاء طلب جديد' : 'Create Order'}</span>
        </button>
      </div>

      {/* Create Order Form */}
      {showCreateForm && (
        <form onSubmit={handleCreateOrder} className="bg-[var(--surface)] border border-[var(--border-hairline)] rounded-2xl p-5 sm:p-6 space-y-5">
          <h3 className="text-base font-bold text-[var(--ink-primary)]">
            {isAr ? 'تفاصيل الطلب الجديد' : 'New Manual Order'}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--ink-primary)] mb-1.5">
                {isAr ? 'العميل' : 'Customer'}
              </label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone})
                  </option>
                ))}
                <option value="new">+ {isAr ? 'إضافة عميل جديد' : 'Add New Customer'}</option>
              </select>
            </div>

            {(customerId === 'new' || customers.length === 0) && (
              <>
                <div>
                  <label className="block text-xs font-medium text-[var(--ink-primary)] mb-1.5">
                    {isAr ? 'اسم العميل الجديد *' : 'New Customer Name *'}
                  </label>
                  <input
                    type="text"
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--ink-primary)] mb-1.5">
                    {isAr ? 'رقم الجوال' : 'Phone Number'}
                  </label>
                  <input
                    type="text"
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm font-num"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-[var(--ink-primary)] mb-1.5">
                {isAr ? 'حالة الطلب' : 'Order Status'}
              </label>
              <select
                value={initialStatus}
                onChange={(e) => setInitialStatus(e.target.value as OrderStatus)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm"
              >
                {ALL_STATUSES.filter((s) => s !== 'cancelled').map((st) => (
                  <option key={st} value={st}>
                    {ORDER_STATUS_LABELS[st][language]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--ink-primary)] mb-1.5">
                {isAr ? 'حالة الدفع' : 'Payment Status'}
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm"
              >
                <option value="paid">{PAYMENT_STATUS_LABELS.paid[language]}</option>
                <option value="partial">{PAYMENT_STATUS_LABELS.partial[language]} (50%)</option>
                <option value="pending">{PAYMENT_STATUS_LABELS.pending[language]}</option>
              </select>
            </div>
          </div>

          {/* Order Items */}
          <div className="space-y-2.5 pt-2 border-t border-[var(--border-hairline)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--ink-primary)]">
                {isAr ? 'المنتجات والكميات' : 'Order Products'}
              </span>
              <button
                type="button"
                onClick={() =>
                  products[0] &&
                  setOrderItems([...orderItems, { productId: products[0].id, quantity: 1 }])
                }
                className="text-xs font-medium text-[var(--positive)] hover:underline cursor-pointer"
              >
                + {isAr ? 'إضافة منتج' : 'Add Product Line'}
              </button>
            </div>

            {orderItems.map((row, idx) => (
              <div key={idx} className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
                <select
                  value={row.productId}
                  onChange={(e) =>
                    setOrderItems(
                      orderItems.map((r, i) => (i === idx ? { ...r, productId: e.target.value } : r))
                    )
                  }
                  className="flex-1 min-w-[200px] px-3 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-xs"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {formatCurrency(p.sellingPrice, business.currency, language)}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  value={row.quantity}
                  onChange={(e) =>
                    setOrderItems(
                      orderItems.map((r, i) =>
                        i === idx ? { ...r, quantity: Math.max(1, Number(e.target.value)) } : r
                      )
                    )
                  }
                  className="w-24 px-3 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-xs font-num"
                />
                <button
                  type="button"
                  onClick={() => setOrderItems(orderItems.filter((_, i) => i !== idx))}
                  className="p-2 text-[var(--ink-secondary)] hover:text-[var(--danger)] cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-[var(--border-hairline)]">
            <div>
              <label className="block text-xs font-medium text-[var(--ink-primary)] mb-1">
                {isAr ? `الخصم (${business.currency})` : `Discount (${business.currency})`}
              </label>
              <input
                type="number"
                min={0}
                step="0.5"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-xs font-num"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--ink-primary)] mb-1">
                {isAr ? `رسوم التوصيل (${business.currency})` : `Delivery Fee (${business.currency})`}
              </label>
              <input
                type="number"
                min={0}
                step="0.5"
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-xs font-num"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--ink-primary)] mb-1">
                {isAr ? 'ملاحظات الطلب (اختياري)' : 'Order Notes (Optional)'}
              </label>
              <input
                type="text"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-xs"
              />
            </div>
          </div>

          <div className="bg-[var(--canvas)] border border-[var(--border-hairline)] rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex flex-wrap gap-6">
              <div>
                <span className="text-[var(--ink-secondary)]">{isAr ? 'الإجمالي شامل الضريبة:' : 'Order Total (Incl. VAT):'} </span>
                <span className="font-bold font-num text-[var(--ink-primary)]">
                  {formatCurrency(draftTotals.totalPrice, business.currency, language)}
                </span>
              </div>
              <div>
                <span className="text-[var(--ink-secondary)]">{isAr ? 'التكلفة التقديرية:' : 'Est. Cost:'} </span>
                <span className="font-semibold font-num text-[var(--ink-primary)]">
                  {formatCurrency(draftTotals.estimatedCost, business.currency, language)}
                </span>
              </div>
              <div>
                <span className="text-[var(--ink-secondary)]">{isAr ? 'الربح المتوقع:' : 'Expected Profit:'} </span>
                <span className="font-bold font-num text-[var(--positive)]">
                  {formatCurrency(draftTotals.expectedProfit, business.currency, language)}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isBusy}
              className="px-5 py-2 rounded-lg bg-[var(--blueprint)] text-white font-semibold hover:opacity-90 disabled:opacity-60 cursor-pointer"
            >
              {isAr ? 'حفظ الطلب' : 'Create Order'}
            </button>
          </div>
        </form>
      )}

      {/* Search, Filters & Sorting */}
      <div className="bg-[var(--surface)] border border-[var(--border-hairline)] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-[var(--ink-secondary)] absolute start-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isAr ? 'ابحث برقم الطلب أو اسم العميل أو المنتج...' : 'Search order #, customer, or product...'}
            className="w-full ps-9 pe-3 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-xs"
          >
            <option value="all">{isAr ? 'كل الحالات' : 'All Statuses'}</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {ORDER_STATUS_LABELS[s][language]}
              </option>
            ))}
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-xs"
          >
            <option value="all">{isAr ? 'كل المدفوعات' : 'All Payments'}</option>
            <option value="paid">{PAYMENT_STATUS_LABELS.paid[language]}</option>
            <option value="partial">{PAYMENT_STATUS_LABELS.partial[language]}</option>
            <option value="pending">{PAYMENT_STATUS_LABELS.pending[language]}</option>
          </select>

          <button
            type="button"
            onClick={() => setSortDesc((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-xs font-medium hover:bg-[var(--surface-muted)] cursor-pointer"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-[var(--blueprint)]" />
            <span>{sortDesc ? (isAr ? 'الأحدث أولاً' : 'Newest First') : isAr ? 'الأقدم أولاً' : 'Oldest First'}</span>
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-[var(--surface)] border border-[var(--border-hairline)] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead className="bg-[var(--canvas)] text-[var(--ink-secondary)] border-b border-[var(--border-hairline)]">
              <tr>
                <th className="py-3 px-4 font-medium">{isAr ? 'الطلب والتاريخ' : 'Order & Date'}</th>
                <th className="py-3 px-4 font-medium">{isAr ? 'العميل' : 'Customer'}</th>
                <th className="py-3 px-4 font-medium">{isAr ? 'المنتجات' : 'Products'}</th>
                <th className="py-3 px-4 font-medium text-end">{isAr ? 'الإجمالي' : 'Total'}</th>
                <th className="py-3 px-4 font-medium text-end">{isAr ? 'التكلفة / الربح' : 'Cost / Profit'}</th>
                <th className="py-3 px-4 font-medium">{isAr ? 'الدفع' : 'Payment'}</th>
                <th className="py-3 px-4 font-medium">{isAr ? 'حالة الطلب' : 'Status'}</th>
                <th className="py-3 px-4 font-medium text-end">{isAr ? 'حذف' : 'Remove'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-hairline)]">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-[var(--ink-secondary)]">
                    {t.common.noData}
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => {
                  const qtyTotal = ord.items.reduce((s, i) => s + i.quantity, 0);
                  return (
                    <tr key={ord.id} className="hover:bg-[var(--surface-muted)]/60">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-num font-bold text-[var(--ink-primary)]">{ord.orderNumber}</div>
                        <div className="text-[11px] font-num text-[var(--ink-secondary)]">{ord.createdAt}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-[var(--ink-primary)]">{ord.customerName}</div>
                        <div className="text-[11px] font-num text-[var(--ink-secondary)]">{ord.customerPhone}</div>
                      </td>
                      <td className="py-3 px-4 max-w-[230px]">
                        <div className="truncate font-medium text-[var(--ink-primary)]">
                          {ord.items.map((i) => `${i.quantity}× ${i.productName}`).join(', ')}
                        </div>
                        <div className="text-[11px] text-[var(--ink-secondary)] font-num">
                          {qtyTotal} {isAr ? 'وحدة' : 'items'}
                          {ord.inventoryDeducted && (
                            <>
                              <span aria-hidden="true"> · </span>
                              <span className="text-[var(--positive)] inline-flex items-center gap-1">
                                <PackageCheck className="w-3 h-3" />
                                {isAr ? 'تم خصم المخزون' : 'Materials deducted'}
                              </span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-end font-num font-semibold text-[var(--ink-primary)] whitespace-nowrap">
                        {formatCurrency(ord.totalPrice, business.currency, language)}
                      </td>
                      <td className="py-3 px-4 text-end whitespace-nowrap">
                        <div className="font-num text-[var(--ink-secondary)]">
                          {formatCurrency(ord.estimatedCost, business.currency, language)}
                        </div>
                        <div className="font-num font-semibold text-[var(--positive)]">
                          +{formatCurrency(ord.expectedProfit, business.currency, language)}
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-medium ${
                              ord.paymentStatus === 'paid'
                                ? 'text-[var(--positive)]'
                                : ord.paymentStatus === 'partial'
                                ? 'text-[var(--warning)]'
                                : 'text-[var(--danger)]'
                            }`}
                          >
                            {PAYMENT_STATUS_LABELS[ord.paymentStatus][language]}
                          </span>
                          {ord.paymentStatus !== 'paid' && (
                            <button
                              type="button"
                              onClick={() => updateOrderPayment(ord.id, ord.totalPrice)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-[11px] hover:bg-[var(--blueprint-soft)] cursor-pointer"
                              title={isAr ? 'تسجيل السداد الكامل' : 'Mark fully paid'}
                            >
                              <CheckCircle2 className="w-3 h-3 text-[var(--positive)]" />
                              <span>{isAr ? 'تحصيل' : 'Collect'}</span>
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <select
                          value={ord.status}
                          disabled={isBusy}
                          onChange={(e) => updateOrderStatus(ord.id, e.target.value as OrderStatus)}
                          className="px-2.5 py-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-xs font-medium text-[var(--ink-primary)] cursor-pointer"
                        >
                          {ALL_STATUSES.map((st) => (
                            <option key={st} value={st}>
                              {ORDER_STATUS_LABELS[st][language]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-4 text-end whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => deleteOrder(ord.id)}
                          className="p-1.5 rounded-lg text-[var(--ink-secondary)] hover:text-[var(--danger)] hover:bg-[var(--surface-muted)] cursor-pointer"
                          title={t.common.delete}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
