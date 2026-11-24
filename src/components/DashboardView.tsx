import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  CheckCircle2,
  ClipboardList,
  DollarSign,
  LogIn,
  LogOut,
  Package,
  Plus,
  Receipt,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  UserPlus,
  X,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useBusiness } from '../context/BusinessContext';
import { BUSINESS_TYPE_META, getT } from '../i18n/translations';
import {
  BusinessType,
  CurrencyCode,
  Expense,
  InventoryItem,
  OrderStatus,
  PaymentStatus,
  Product,
} from '../types/business';
import {
  calculateProductCosts,
  formatCurrency,
  formatNumber,
} from '../utils/calculations';

const CURRENCIES: CurrencyCode[] = ['SAR', 'AED', 'KWD', 'QAR', 'EGP', 'USD', 'EUR', 'GBP'];

type DateRangeFilter = 'today' | 'week' | 'month';
type ChartPeriod = 'weekly' | 'monthly' | 'yearly';
type QuickModalType = null | 'order' | 'product' | 'expense' | 'customer' | 'stock';

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

function mapFriendlyStatus(status: OrderStatus, isAr: boolean): { label: string; tone: 'warning' | 'blue' | 'positive' | 'danger' } {
  if (status === 'completed') {
    return { label: isAr ? 'مكتمل' : 'Completed', tone: 'positive' };
  }
  if (status === 'cancelled') {
    return { label: isAr ? 'ملغي' : 'Cancelled', tone: 'danger' };
  }
  if (status === 'in_production' || status === 'ready' || status === 'shipped') {
    return { label: isAr ? 'قيد التنفيذ' : 'In Progress', tone: 'blue' };
  }
  return { label: isAr ? 'قيد الانتظار' : 'Pending', tone: 'warning' };
}

export function DashboardView() {
  const {
    language,
    user,
    business,
    products,
    orders,
    expenses,
    inventory,
    customers,
    setActiveSection,
    setAuthScreen,
    createOrder,
    saveProduct,
    addExpense,
    addCustomer,
    adjustInventory,
    savedWorkspaces,
    signInWithBusinessIdea,
    switchWorkspace,
    signOutToSample,
    pushToast,
    isBusy,
  } = useBusiness();

  const t = getT(language);
  const isAr = language === 'ar';

  const [dateRange, setDateRange] = useState<DateRangeFilter>('month');
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('monthly');
  const [activeModal, setActiveModal] = useState<QuickModalType>(null);

  // Home page open business-idea sign-in state
  const [showIdeaSignIn, setShowIdeaSignIn] = useState(false);
  const [hideDemoSignIn, setHideDemoSignIn] = useState(false);
  const [ideaOwnerName, setIdeaOwnerName] = useState('');
  const [ideaEmail, setIdeaEmail] = useState('');
  const [ideaBizName, setIdeaBizName] = useState('');
  const [ideaType, setIdeaType] = useState<BusinessType>('food_bakery');
  const [ideaCurrency, setIdeaCurrency] = useState<CurrencyCode>(business.currency || 'SAR');
  const [ideaDesc, setIdeaDesc] = useState('');
  const [ideaWithSample, setIdeaWithSample] = useState(false);

  const isIdeaCardVisible = (user.isDemo && !hideDemoSignIn) || showIdeaSignIn;

  // Quick Order modal state
  const [orderCustId, setOrderCustId] = useState<string>(customers[0]?.id ?? 'new');
  const [orderNewCustName, setOrderNewCustName] = useState('');
  const [orderNewCustPhone, setOrderNewCustPhone] = useState('');
  const [orderProdId, setOrderProdId] = useState<string>(products[0]?.id ?? '');
  const [orderQty, setOrderQty] = useState<number>(1);
  const [orderPayment, setOrderPayment] = useState<PaymentStatus>('paid');

  // Quick Product modal state
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState('');
  const [prodCost, setProdCost] = useState<number>(25);
  const [prodPrice, setProdPrice] = useState<number>(45);
  const [prodUnit, setProdUnit] = useState('piece');

  // Quick Expense modal state
  const [expTitle, setExpTitle] = useState('');
  const [expCategory, setExpCategory] = useState<Expense['category']>('materials');
  const [expAmount, setExpAmount] = useState<number>(0);
  const [expDate, setExpDate] = useState(new Date().toISOString().slice(0, 10));
  const [expPayment, setExpPayment] = useState<Expense['paymentMethod']>('bank_transfer');
  const [expNotes, setExpNotes] = useState('');

  // Quick Customer modal state
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custCity, setCustCity] = useState('');
  const [custNotes, setCustNotes] = useState('');

  // Quick Stock Update modal state
  const [stockItem, setStockItem] = useState<InventoryItem | null>(null);
  const [stockDelta, setStockDelta] = useState<number>(50);
  const [stockReason, setStockReason] = useState('Restock from supplier');

  const handleIdeaSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await signInWithBusinessIdea({
      fullName: ideaOwnerName,
      email: ideaEmail,
      businessName: ideaBizName,
      businessType: ideaType,
      businessIdea: ideaDesc,
      currency: ideaCurrency,
      startWithSampleData: ideaWithSample,
    });
    if (ok) {
      setShowIdeaSignIn(false);
      setHideDemoSignIn(false);
      setIdeaOwnerName('');
      setIdeaEmail('');
      setIdeaBizName('');
      setIdeaDesc('');
    }
  };

  const ownerFirstName = useMemo(() => {
    const raw = (user.fullName || '').trim();
    if (!raw) return isAr ? 'صاحب المشروع' : 'there';
    return raw.split(/\s+/)[0];
  }, [user.fullName, isAr]);

  const greetingText = useMemo(() => {
    const hour = new Date().getHours();
    if (isAr) {
      return hour < 12 ? `صباح الخير، ${ownerFirstName}!` : `مرحباً، ${ownerFirstName}!`;
    }
    if (hour < 12) return `Good morning, ${ownerFirstName}!`;
    if (hour < 17) return `Good afternoon, ${ownerFirstName}!`;
    return `Good evening, ${ownerFirstName}!`;
  }, [ownerFirstName, isAr]);

  // Anchor reference date to the latest record or today so demo data and live actions both work intuitively
  const referenceDateMs = useMemo(() => {
    const todayIso = new Date().toISOString().slice(0, 10);
    const dates = [
      todayIso,
      ...orders.map((o) => o.createdAt),
      ...expenses.map((e) => e.date),
    ]
      .filter(Boolean)
      .map((d) => new Date(d).getTime())
      .filter((n) => !Number.isNaN(n));
    return dates.length > 0 ? Math.max(...dates) : Date.now();
  }, [orders, expenses]);

  const periodKpis = useMemo(() => {
    const daysWindow = dateRange === 'today' ? 1 : dateRange === 'week' ? 7 : 30;
    const msPerDay = 1000 * 60 * 60 * 24;

    const inWindow = (dateStr: string, offsetDays: number) => {
      const ts = new Date(dateStr).getTime();
      if (Number.isNaN(ts)) return false;
      const diff = (referenceDateMs - ts) / msPerDay;
      return diff >= offsetDays && diff < offsetDays + daysWindow;
    };

    const currentOrders = orders.filter((o) => o.status !== 'cancelled' && inWindow(o.createdAt, 0));
    const previousOrders = orders.filter((o) => o.status !== 'cancelled' && inWindow(o.createdAt, daysWindow));
    const currentExpenses = expenses.filter((e) => inWindow(e.date, 0));
    const previousExpenses = expenses.filter((e) => inWindow(e.date, daysWindow));

    const totalRevenue = currentOrders.reduce((s, o) => s + o.subtotal - o.discountAmount + o.deliveryFee, 0);
    const prevRevenue = previousOrders.reduce((s, o) => s + o.subtotal - o.discountAmount + o.deliveryFee, 0);

    const cogs = currentOrders.reduce((s, o) => s + o.estimatedCost, 0);
    const recordedExpenses = currentExpenses.reduce((s, e) => s + e.amount, 0);
    const totalExpenses = cogs + recordedExpenses;

    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    const pendingOrdersCount = orders.filter(
      (o) => o.status !== 'completed' && o.status !== 'cancelled'
    ).length;

    const revenueChangePct =
      prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : totalRevenue > 0 ? 100 : 0;

    return {
      totalRevenue,
      prevRevenue,
      revenueChangePct,
      hasPrevComparison: previousOrders.length > 0 || previousExpenses.length > 0,
      totalExpenses,
      recordedExpenses,
      cogs,
      netProfit,
      profitMargin,
      pendingOrdersCount,
      periodOrdersCount: currentOrders.length,
    };
  }, [orders, expenses, dateRange, referenceDateMs]);

  const lowStockItems = useMemo(
    () => inventory.filter((i) => i.availableQty <= i.reorderLevel),
    [inventory]
  );

  const recentOrders = useMemo(
    () => [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6),
    [orders]
  );

  const performanceChartData = useMemo(() => {
    const buckets: Record<string, { label: string; revenue: number; expenses: number }> = {};
    const ensure = (key: string) => {
      if (!buckets[key]) buckets[key] = { label: key, revenue: 0, expenses: 0 };
      return buckets[key];
    };

    const getBucketKey = (dateStr: string) => {
      if (chartPeriod === 'yearly') return dateStr.slice(0, 4);
      if (chartPeriod === 'monthly') return dateStr.slice(0, 7);
      const day = Number(dateStr.slice(8, 10)) || 1;
      const weekNum = Math.min(4, Math.ceil(day / 7));
      return `${dateStr.slice(5, 7)} W${weekNum}`;
    };

    for (const o of orders) {
      if (o.status === 'cancelled') continue;
      const b = ensure(getBucketKey(o.createdAt));
      b.revenue += o.subtotal - o.discountAmount + o.deliveryFee;
      b.expenses += o.estimatedCost;
    }

    for (const e of expenses) {
      const b = ensure(getBucketKey(e.date));
      b.expenses += e.amount;
    }

    return Object.values(buckets)
      .sort((a, b) => a.label.localeCompare(b.label))
      .map((item) => ({
        label: item.label,
        revenue: Number(item.revenue.toFixed(2)),
        expenses: Number(item.expenses.toFixed(2)),
      }));
  }, [orders, expenses, chartPeriod]);

  // Quick Modal Handlers
  const handleQuickOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedProduct = products.find((p) => p.id === orderProdId) || products[0];
    if (!selectedProduct) {
      pushToast('error', isAr ? 'أضف منتجاً واحداً على الأقل أولاً' : 'Please add a product first.');
      return;
    }
    let cust = customers.find((c) => c.id === orderCustId);
    if (orderCustId === 'new' || !cust) {
      if (!orderNewCustName.trim()) {
        pushToast('error', isAr ? 'يرجى إدخال اسم العميل' : 'Please enter customer name.');
        return;
      }
      cust = addCustomer({
        name: orderNewCustName.trim(),
        phone: orderNewCustPhone.trim() || '-',
        email: '',
        city: '',
        notes: '',
      });
    }
    const qty = Math.max(1, orderQty);
    const unitCost = Number(calculateProductCosts(selectedProduct).costPerUnit.toFixed(2));
    const subtotal = selectedProduct.sellingPrice * qty;
    const deliveryFee = business.defaultDeliveryCost || 0;
    const taxable = subtotal + deliveryFee;
    const vatAmount = Number((taxable * business.vatRate).toFixed(2));
    const totalPrice = Number((taxable + vatAmount).toFixed(2));
    const estimatedCost = Number((unitCost * qty).toFixed(2));
    const paidAmount =
      orderPayment === 'paid' ? totalPrice : orderPayment === 'partial' ? Number((totalPrice * 0.5).toFixed(2)) : 0;

    const ok = await createOrder({
      customerId: cust.id,
      customerName: cust.name,
      customerPhone: cust.phone,
      items: [
        {
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          quantity: qty,
          unitPrice: selectedProduct.sellingPrice,
          unitCost,
        },
      ],
      discountAmount: 0,
      deliveryFee,
      vatAmount,
      subtotal,
      totalPrice,
      estimatedCost,
      expectedProfit: Number((subtotal - estimatedCost).toFixed(2)),
      paymentStatus: orderPayment,
      paidAmount,
      status: 'new',
      createdAt: new Date().toISOString().slice(0, 10),
      source: 'manual',
    });

    if (ok) {
      setActiveModal(null);
      setOrderNewCustName('');
      setOrderNewCustPhone('');
      setOrderQty(1);
    }
  };

  const handleQuickProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim() || prodPrice <= 0) {
      pushToast('error', isAr ? 'أدخل اسم المنتج وسعر البيع' : 'Enter product name and selling price.');
      return;
    }
    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      businessType: business.type,
      name: prodName.trim(),
      category: prodCategory.trim() || 'Standard',
      sellingUnit: prodUnit.trim() || 'piece',
      unitsPerBatch: 1,
      materials: [
        {
          id: `mat-${Date.now()}`,
          name: isAr ? 'تكلفة المواد الأساسية' : 'Primary Materials',
          materialKind: 'custom',
          purchasedQty: 1,
          purchaseUnit: 'pcs',
          purchasePrice: Math.max(0, prodCost),
          usedQty: 1,
          usedUnit: 'pcs',
        },
      ],
      additionalCosts: {
        packaging: 0,
        electricityAndGas: 0,
        laborHours: 0,
        hourlyLaborRate: business.defaultLaborRatePerHour,
        flatLaborCost: 0,
        delivery: 0,
        overhead: 0,
        wastePercent: 0,
        customExpenses: [],
      },
      sellingPrice: prodPrice,
      targetMargin: prodPrice > 0 ? Math.max(0.05, (prodPrice - prodCost) / prodPrice) : 0.3,
      isActive: true,
      updatedAt: new Date().toISOString().slice(0, 10),
    };
    const ok = await saveProduct(newProduct);
    if (ok) {
      setActiveModal(null);
      setProdName('');
      setProdCategory('');
    }
  };

  const handleQuickExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expTitle.trim() || expAmount <= 0) {
      pushToast('error', isAr ? 'أدخل اسم المصروف والمبلغ' : 'Enter an expense name and positive amount.');
      return;
    }
    const ok = await addExpense({
      title: expTitle.trim(),
      category: expCategory,
      amount: expAmount,
      date: expDate,
      paymentMethod: expPayment,
      notes: expNotes.trim() || undefined,
    });
    if (ok) {
      setActiveModal(null);
      setExpTitle('');
      setExpAmount(0);
      setExpNotes('');
    }
  };

  const handleQuickCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim()) {
      pushToast('error', isAr ? 'أدخل اسم العميل' : 'Please enter customer name.');
      return;
    }
    addCustomer({
      name: custName.trim(),
      phone: custPhone.trim() || '-',
      email: '',
      city: custCity.trim(),
      notes: custNotes.trim(),
    });
    setActiveModal(null);
    setCustName('');
    setCustPhone('');
    setCustCity('');
    setCustNotes('');
  };

  const handleQuickStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockItem || stockDelta === 0) return;
    const ok = await adjustInventory(
      stockItem.id,
      stockDelta,
      stockReason.trim() || 'Quick stock update',
      stockDelta > 0 ? 'restock' : 'manual_adjustment'
    );
    if (ok) {
      setActiveModal(null);
      setStockItem(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section + Date Range Selector + Account / Business Idea Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-2xl font-bold tracking-tight text-[var(--ink-primary)]">{greetingText}</h2>
          <p className="mt-1 text-sm text-[var(--ink-secondary)]">
            {user.isDemo ? (
              <>
                {isAr ? 'إليك نظرة عامة على مساحة العمل التجريبية.' : "Here’s how your sample workspace is doing today."}
                <span className="mx-1.5" aria-hidden="true">·</span>
                <span className="text-[var(--blueprint)]">
                  {isAr ? 'سجّل دخولك بفكرة مشروعك أدناه' : 'Sign in with your own business idea below'}
                </span>
              </>
            ) : (
              <>
                <span className="font-medium text-[var(--ink-primary)]">{business.name}</span>
                {business.description && (
                  <>
                    <span className="mx-1.5" aria-hidden="true">·</span>
                    <span>{business.description}</span>
                  </>
                )}
              </>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
          {!isIdeaCardVisible && (
            <button
              type="button"
              onClick={() => {
                setHideDemoSignIn(false);
                setShowIdeaSignIn(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[var(--blueprint)]/50 bg-[var(--blueprint-soft)] text-[var(--blueprint)] text-xs font-semibold hover:opacity-90 transition-opacity whitespace-nowrap shrink-0 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>
                {user.isDemo
                  ? isAr
                    ? 'سجّل بفكرة مشروعك'
                    : 'Sign In with Your Idea'
                  : isAr
                  ? 'فكرة مشروع جديدة'
                  : 'New Business Idea'}
              </span>
            </button>
          )}

          {!user.isDemo && (
            <button
              type="button"
              onClick={signOutToSample}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface)] text-xs font-medium text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{isAr ? 'تسجيل الخروج' : 'Sign Out'}</span>
            </button>
          )}

          <div className="inline-flex items-center p-1 rounded-xl bg-[var(--surface)] border border-[var(--border-hairline)]">
            {(
              [
                { id: 'today', label: isAr ? 'اليوم' : 'Today' },
                { id: 'week', label: isAr ? 'هذا الأسبوع' : 'This Week' },
                { id: 'month', label: isAr ? 'هذا الشهر' : 'This Month' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setDateRange(opt.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  dateRange === opt.id
                    ? 'bg-[var(--blueprint)] text-white font-semibold'
                    : 'text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Open Home Page Sign-In with Your Own Business Idea */}
      {isIdeaCardVisible && (
        <section className="bg-[var(--surface)] border border-[var(--blueprint)]/40 rounded-2xl p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-[var(--border-hairline)]">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--blueprint-soft)] text-[var(--blueprint)] flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--ink-primary)]">
                  {isAr ? 'ابدأ وسجّل دخولك بفكرة مشروعك' : 'Sign in with your own business idea'}
                </h3>
                <p className="mt-0.5 text-xs text-[var(--ink-secondary)]">
                  {isAr
                    ? 'يمكن للجميع الدخول فوراً بدون كلمة مرور—أدخل اسمك وفكرة مشروعك لإنشاء مساحة عملك الخاصة.'
                    : 'Everybody is welcome—enter your name, business name, and idea to launch your own personalized workspace immediately.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (user.isDemo) setHideDemoSignIn(true);
                setShowIdeaSignIn(false);
              }}
              className="self-end sm:self-start flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--surface-muted)] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>{isAr ? 'إخفاء مؤقتاً' : 'Explore sample first'}</span>
            </button>
          </div>

          <form onSubmit={handleIdeaSignInSubmit} className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-4">
              <label className="block text-xs font-medium text-[var(--ink-primary)] mb-1.5">
                {isAr ? 'اسمك *' : 'Your Name *'}
              </label>
              <input
                type="text"
                value={ideaOwnerName}
                onChange={(e) => setIdeaOwnerName(e.target.value)}
                placeholder={isAr ? 'مثال: سارة القحطاني' : 'e.g. Sara Al-Qahtani'}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm text-[var(--ink-primary)]"
              />
            </div>

            <div className="md:col-span-4">
              <label className="block text-xs font-medium text-[var(--ink-primary)] mb-1.5">
                {isAr ? 'اسم المشروع *' : 'Business Name *'}
              </label>
              <input
                type="text"
                value={ideaBizName}
                onChange={(e) => setIdeaBizName(e.target.value)}
                placeholder={isAr ? 'مثال: مخبز سارة المنزلي' : 'e.g. Sara Home Bakery'}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm text-[var(--ink-primary)]"
              />
            </div>

            <div className="md:col-span-4">
              <label className="block text-xs font-medium text-[var(--ink-primary)] mb-1.5">
                {isAr ? 'البريد الإلكتروني (اختياري)' : 'Email (Optional)'}
              </label>
              <input
                type="email"
                value={ideaEmail}
                onChange={(e) => setIdeaEmail(e.target.value)}
                placeholder="you@yourbusiness.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm text-[var(--ink-primary)]"
              />
            </div>

            <div className="md:col-span-4">
              <label className="block text-xs font-medium text-[var(--ink-primary)] mb-1.5">
                {isAr ? 'نوع النشاط *' : 'Business Category *'}
              </label>
              <select
                value={ideaType}
                onChange={(e) => setIdeaType(e.target.value as BusinessType)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm text-[var(--ink-primary)]"
              >
                {(Object.keys(BUSINESS_TYPE_META) as BusinessType[]).map((bt) => (
                  <option key={bt} value={bt}>
                    {BUSINESS_TYPE_META[bt][language].title}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-[var(--ink-primary)] mb-1.5">
                {isAr ? 'العملة' : 'Currency'}
              </label>
              <select
                value={ideaCurrency}
                onChange={(e) => setIdeaCurrency(e.target.value as CurrencyCode)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm text-[var(--ink-primary)]"
              >
                {CURRENCIES.map((cur) => (
                  <option key={cur} value={cur}>
                    {cur}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-6">
              <label className="block text-xs font-medium text-[var(--ink-primary)] mb-1.5">
                {isAr ? 'فكرة مشروعك باختصار *' : 'Your Business Idea *'}
              </label>
              <input
                type="text"
                value={ideaDesc}
                onChange={(e) => setIdeaDesc(e.target.value)}
                placeholder={
                  isAr
                    ? 'مثال: صنع كيك المناسبات وعلب البراونيز في المنزل'
                    : 'e.g. Custom birthday cakes and gift brownie boxes made from home'
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm text-[var(--ink-primary)]"
              />
            </div>

            <div className="md:col-span-12 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIdeaWithSample(false)}
                  className={`px-3.5 py-2 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
                    !ideaWithSample
                      ? 'bg-[var(--blueprint-soft)] border-[var(--blueprint)] text-[var(--ink-primary)] font-semibold'
                      : 'bg-[var(--surface-muted)] border-[var(--border-hairline)] text-[var(--ink-secondary)]'
                  }`}
                >
                  {isAr ? 'ابدأ بمساحة عمل نظيفة' : 'Start with a clean workspace'}
                </button>
                <button
                  type="button"
                  onClick={() => setIdeaWithSample(true)}
                  className={`px-3.5 py-2 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
                    ideaWithSample
                      ? 'bg-[var(--blueprint-soft)] border-[var(--blueprint)] text-[var(--ink-primary)] font-semibold'
                      : 'bg-[var(--surface-muted)] border-[var(--border-hairline)] text-[var(--ink-secondary)]'
                  }`}
                >
                  {isAr ? 'تعبئة بمنتجات استرشادية لهذا النوع' : 'Load sample products for this category'}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setAuthScreen('onboarding')}
                  className="text-xs font-medium text-[var(--blueprint)] hover:underline whitespace-nowrap cursor-pointer"
                >
                  {isAr ? 'أو الإعداد المالي التفصيلي (5 خطوات)' : 'Or use 5-step guided setup'}
                </button>
                <button
                  type="submit"
                  disabled={isBusy}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--blueprint)] text-white text-xs font-semibold hover:opacity-90 disabled:opacity-60 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{isAr ? 'دخول وبدء مشروعي' : 'Sign In & Start My Business'}</span>
                </button>
              </div>
            </div>
          </form>

          {savedWorkspaces.length > 0 && (
            <div className="mt-5 pt-4 border-t border-[var(--border-hairline)]">
              <div className="text-xs font-semibold text-[var(--ink-secondary)] mb-2.5">
                {isAr ? 'أو تابع العمل على أحد مشاريعك المحفوظة:' : 'Or continue a saved business workspace:'}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {savedWorkspaces.map((ws) => {
                  const isCurrent = !user.isDemo && ws.id === business.id;
                  return (
                    <button
                      key={ws.id}
                      type="button"
                      onClick={() => {
                        switchWorkspace(ws.id);
                        setShowIdeaSignIn(false);
                      }}
                      className={`p-3 rounded-xl border text-start transition-colors cursor-pointer ${
                        isCurrent
                          ? 'bg-[var(--blueprint-soft)] border-[var(--blueprint)]'
                          : 'bg-[var(--surface-muted)] border-[var(--border-hairline)] hover:border-[var(--blueprint)]/50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--ink-primary)] truncate">
                          <Briefcase className="w-3.5 h-3.5 text-[var(--blueprint)] shrink-0" />
                          <span className="truncate">{ws.businessName}</span>
                        </span>
                        <span className="text-[11px] font-num text-[var(--ink-secondary)] shrink-0">
                          {ws.currency}
                        </span>
                      </div>
                      <div className="mt-1 text-[11px] text-[var(--ink-secondary)] truncate">
                        {ws.ownerName}
                        {ws.businessIdea ? ` · ${ws.businessIdea}` : ''}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      )}

      {/* 4 Clear Business Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* 1. Total Revenue */}
        <div className="bg-[var(--surface)] border border-[var(--border-hairline)] rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--ink-secondary)]">{t.dashboard.totalSales}</span>
            <div className="w-8 h-8 rounded-lg bg-[var(--blueprint-soft)] text-[var(--blueprint)] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold font-num text-[var(--ink-primary)]">
            {formatCurrency(periodKpis.totalRevenue, business.currency, language)}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            {periodKpis.hasPrevComparison ? (
              <>
                {periodKpis.revenueChangePct >= 0 ? (
                  <ArrowUpRight className="w-3.5 h-3.5 text-[var(--positive)]" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5 text-[var(--danger)]" />
                )}
                <span
                  className={`font-num font-semibold ${
                    periodKpis.revenueChangePct >= 0 ? 'text-[var(--positive)]' : 'text-[var(--danger)]'
                  }`}
                >
                  {periodKpis.revenueChangePct >= 0 ? '+' : ''}
                  {periodKpis.revenueChangePct.toFixed(1)}%
                </span>
                <span className="text-[var(--ink-secondary)]">
                  {isAr ? 'مقارنة بالفترة السابقة' : 'vs previous period'}
                </span>
              </>
            ) : (
              <span className="text-[var(--ink-secondary)] font-num">
                {periodKpis.periodOrdersCount} {isAr ? 'طلبات في هذه الفترة' : 'orders in selected period'}
              </span>
            )}
          </div>
        </div>

        {/* 2. Total Expenses */}
        <div className="bg-[var(--surface)] border border-[var(--border-hairline)] rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--ink-secondary)]">{t.dashboard.totalExpenses}</span>
            <div className="w-8 h-8 rounded-lg bg-[var(--surface-muted)] text-[var(--warning)] flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold font-num text-[var(--ink-primary)]">
            {formatCurrency(periodKpis.totalExpenses, business.currency, language)}
          </div>
          <div className="mt-2 text-xs text-[var(--ink-secondary)] font-num">
            {isAr ? 'مصاريف مسجلة:' : 'Recorded bills:'}{' '}
            {formatCurrency(periodKpis.recordedExpenses, business.currency, language)}
          </div>
        </div>

        {/* 3. Net Profit */}
        <div className="bg-[var(--surface)] border border-[var(--border-hairline)] rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--ink-secondary)]">{t.dashboard.netProfit}</span>
            <div className="w-8 h-8 rounded-lg bg-[var(--surface-muted)] text-[var(--positive)] flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`mt-3 text-2xl font-bold font-num ${
              periodKpis.netProfit >= 0 ? 'text-[var(--positive)]' : 'text-[var(--danger)]'
            }`}
          >
            {formatCurrency(periodKpis.netProfit, business.currency, language)}
          </div>
          <div className="mt-2 text-xs text-[var(--ink-secondary)] font-num">
            {isAr ? 'هامش الربح:' : 'Profit margin:'}{' '}
            <strong className="text-[var(--ink-primary)]">{periodKpis.profitMargin.toFixed(1)}%</strong>
          </div>
        </div>

        {/* 4. Pending Orders */}
        <button
          type="button"
          onClick={() => setActiveSection('orders')}
          className="text-start bg-[var(--surface)] border border-[var(--border-hairline)] hover:border-[var(--blueprint)]/50 rounded-2xl p-5 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--ink-secondary)]">{t.dashboard.pendingOrders}</span>
            <div className="w-8 h-8 rounded-lg bg-[var(--blueprint-soft)] text-[var(--blueprint)] flex items-center justify-center">
              <ClipboardList className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold font-num text-[var(--ink-primary)]">
            {periodKpis.pendingOrdersCount}
          </div>
          <div className="mt-2 text-xs text-[var(--blueprint)] flex items-center gap-1">
            <span>{isAr ? 'طلبات بانتظار المتابعة' : 'Orders needing attention'}</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </button>
      </div>

      {/* Quick Actions */}
      <section className="bg-[var(--surface)] border border-[var(--border-hairline)] rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-[var(--ink-primary)] mb-3.5">{t.dashboard.quickActions}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => setActiveModal('order')}
            className="flex items-center gap-3 p-3.5 rounded-xl bg-[var(--blueprint)] text-white text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
              <Plus className="w-4 h-4" />
            </div>
            <span className="truncate">{t.dashboard.addOrder}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveModal('product')}
            className="flex items-center gap-3 p-3.5 rounded-xl bg-[var(--surface-muted)] border border-[var(--border-hairline)] hover:border-[var(--blueprint)]/60 text-sm font-semibold text-[var(--ink-primary)] transition-colors cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-[var(--blueprint-soft)] text-[var(--blueprint)] flex items-center justify-center shrink-0">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <span className="truncate">{t.dashboard.addProduct}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveModal('expense')}
            className="flex items-center gap-3 p-3.5 rounded-xl bg-[var(--surface-muted)] border border-[var(--border-hairline)] hover:border-[var(--blueprint)]/60 text-sm font-semibold text-[var(--ink-primary)] transition-colors cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-[var(--blueprint-soft)] text-[var(--warning)] flex items-center justify-center shrink-0">
              <Receipt className="w-4 h-4" />
            </div>
            <span className="truncate">{t.dashboard.recordExpense}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveModal('customer')}
            className="flex items-center gap-3 p-3.5 rounded-xl bg-[var(--surface-muted)] border border-[var(--border-hairline)] hover:border-[var(--blueprint)]/60 text-sm font-semibold text-[var(--ink-primary)] transition-colors cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-[var(--blueprint-soft)] text-[var(--positive)] flex items-center justify-center shrink-0">
              <UserPlus className="w-4 h-4" />
            </div>
            <span className="truncate">{t.dashboard.addCustomer}</span>
          </button>
        </div>
      </section>

      {/* Main Content Split: Recent Orders + Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Orders */}
        <section className="lg:col-span-8 bg-[var(--surface)] border border-[var(--border-hairline)] rounded-2xl overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-[var(--border-hairline)] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--ink-primary)]">{t.dashboard.recentActivity}</h3>
            <button
              type="button"
              onClick={() => setActiveSection('orders')}
              className="text-xs font-medium text-[var(--blueprint)] hover:underline cursor-pointer"
            >
              {isAr ? 'عرض جميع الطلبات' : 'View All Orders'}
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            {recentOrders.length === 0 ? (
              <div className="p-10 text-center text-sm text-[var(--ink-secondary)]">
                {isAr ? 'لا توجد طلبات مسجلة بعد. أضف أول طلب للبدء.' : 'No orders yet. Click "Add New Order" above to get started.'}
              </div>
            ) : (
              <table className="w-full text-xs text-start">
                <thead className="bg-[var(--canvas)] text-[var(--ink-secondary)] border-b border-[var(--border-hairline)]">
                  <tr>
                    <th className="py-3 px-4 font-medium">{isAr ? 'رقم الطلب' : 'Order #'}</th>
                    <th className="py-3 px-4 font-medium">{isAr ? 'العميل' : 'Customer'}</th>
                    <th className="py-3 px-4 font-medium">{isAr ? 'التاريخ' : 'Date'}</th>
                    <th className="py-3 px-4 font-medium text-end">{isAr ? 'الإجمالي' : 'Total'}</th>
                    <th className="py-3 px-4 font-medium text-end">{isAr ? 'الحالة' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-hairline)]">
                  {recentOrders.map((ord) => {
                    const st = mapFriendlyStatus(ord.status, isAr);
                    const toneClass =
                      st.tone === 'positive'
                        ? 'text-[var(--positive)] bg-[var(--positive)]/10'
                        : st.tone === 'danger'
                        ? 'text-[var(--danger)] bg-[var(--danger)]/10'
                        : st.tone === 'blue'
                        ? 'text-[var(--blueprint)] bg-[var(--blueprint-soft)]'
                        : 'text-[var(--warning)] bg-[var(--warning)]/10';
                    return (
                      <tr
                        key={ord.id}
                        onClick={() => setActiveSection('orders')}
                        className="hover:bg-[var(--surface-muted)]/60 cursor-pointer"
                      >
                        <td className="py-3.5 px-4 font-num font-semibold text-[var(--ink-primary)] whitespace-nowrap">
                          {ord.orderNumber}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-[var(--ink-primary)]">{ord.customerName}</td>
                        <td className="py-3.5 px-4 font-num text-[var(--ink-secondary)] whitespace-nowrap">
                          {ord.createdAt}
                        </td>
                        <td className="py-3.5 px-4 text-end font-num font-semibold text-[var(--ink-primary)] whitespace-nowrap">
                          {formatCurrency(ord.totalPrice, business.currency, language)}
                        </td>
                        <td className="py-3.5 px-4 text-end whitespace-nowrap">
                          <span className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-semibold ${toneClass}`}>
                            {st.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Stock Alerts */}
        <section className="lg:col-span-4 bg-[var(--surface)] border border-[var(--border-hairline)] rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[var(--ink-primary)] flex items-center gap-2">
                <Package className="w-4 h-4 text-[var(--blueprint)]" />
                <span>{t.dashboard.lowStockItems}</span>
              </h3>
              <button
                type="button"
                onClick={() => setActiveSection('inventory')}
                className="text-xs font-medium text-[var(--blueprint)] hover:underline cursor-pointer"
              >
                {isAr ? 'المخزون' : 'Inventory'}
              </button>
            </div>

            {lowStockItems.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="w-7 h-7 text-[var(--positive)] mx-auto" />
                <p className="text-xs font-medium text-[var(--ink-primary)]">
                  {isAr ? 'جميع المواد متوفرة بكميات جيدة' : 'All stock levels look healthy'}
                </p>
                <p className="text-[11px] text-[var(--ink-secondary)]">
                  {isAr ? 'لا توجد مواد منخفضة حالياً.' : 'No items are currently running low.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {lowStockItems.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-[var(--surface-muted)] border border-[var(--border-hairline)] flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-[var(--warning)] shrink-0" />
                        <span className="text-xs font-semibold text-[var(--ink-primary)] truncate">
                          {item.name}
                        </span>
                      </div>
                      <div className="mt-1 text-[11px] font-num text-[var(--warning)]">
                        {isAr ? 'المتبقي:' : 'Remaining:'} {formatNumber(item.availableQty, 1)} {item.unit}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setStockItem(item);
                        setStockDelta(Math.max(10, item.reorderLevel));
                        setStockReason(isAr ? 'إعادة تعبئة المخزون' : 'Supplier restock');
                        setActiveModal('stock');
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-[var(--blueprint)] text-white text-[11px] font-semibold hover:opacity-90 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      {t.dashboard.checkInventory}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Business Performance Chart */}
      <section className="bg-[var(--surface)] border border-[var(--border-hairline)] rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-[var(--ink-primary)]">{t.dashboard.revenueVsExpenses}</h3>
            <p className="text-xs text-[var(--ink-secondary)] mt-0.5">
              {isAr ? 'مقارنة بسيطة بين دخلك ومصاريفك' : 'A simple look at what you earned vs. what you spent'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3 text-xs text-[var(--ink-secondary)]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#3B82F6]" />
                {isAr ? 'الإيرادات' : 'Revenue'}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#94A3B8]" />
                {isAr ? 'المصروفات' : 'Expenses'}
              </span>
            </div>

            <div className="inline-flex p-1 rounded-xl bg-[var(--surface-muted)] border border-[var(--border-hairline)]">
              {(
                [
                  { id: 'weekly', label: isAr ? 'أسبوعي' : 'Weekly' },
                  { id: 'monthly', label: isAr ? 'شهري' : 'Monthly' },
                  { id: 'yearly', label: isAr ? 'سنوي' : 'Yearly' },
                ] as const
              ).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setChartPeriod(p.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer ${
                    chartPeriod === p.id
                      ? 'bg-[var(--blueprint)] text-white font-semibold'
                      : 'text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="h-64 w-full" dir="ltr">
          {performanceChartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-[var(--ink-secondary)]">
              {t.common.noData}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceChartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-hairline)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: 'var(--ink-secondary)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'var(--ink-secondary)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border-hairline)',
                    color: 'var(--ink-primary)',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Bar
                  dataKey="revenue"
                  name={isAr ? 'الإيرادات' : 'Revenue'}
                  fill="#3B82F6"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="expenses"
                  name={isAr ? 'المصروفات' : 'Expenses'}
                  fill="#94A3B8"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* Instant Quick Action Modals */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-[var(--surface)] border border-[var(--border-hairline)] rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-hairline)]">
              <h3 className="text-base font-bold text-[var(--ink-primary)]">
                {activeModal === 'order' && t.dashboard.addOrder}
                {activeModal === 'product' && t.dashboard.addProduct}
                {activeModal === 'expense' && t.dashboard.recordExpense}
                {activeModal === 'customer' && t.dashboard.addCustomer}
                {activeModal === 'stock' && `${t.dashboard.checkInventory}: ${stockItem?.name ?? ''}`}
              </h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-lg text-[var(--ink-secondary)] hover:bg-[var(--surface-muted)] cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {activeModal === 'order' && (
              <form onSubmit={handleQuickOrderSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5">
                    {isAr ? 'العميل *' : 'Customer *'}
                  </label>
                  <select
                    value={orderCustId}
                    onChange={(e) => setOrderCustId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone})
                      </option>
                    ))}
                    <option value="new">+ {isAr ? 'عميل جديد' : 'New Customer'}</option>
                  </select>
                </div>

                {(orderCustId === 'new' || customers.length === 0) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">
                        {isAr ? 'اسم العميل *' : 'Customer Name *'}
                      </label>
                      <input
                        type="text"
                        value={orderNewCustName}
                        onChange={(e) => setOrderNewCustName(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">
                        {isAr ? 'رقم الجوال (اختياري)' : 'Phone (Optional)'}
                      </label>
                      <input
                        type="text"
                        value={orderNewCustPhone}
                        onChange={(e) => setOrderNewCustPhone(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm font-num"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium mb-1.5">
                      {isAr ? 'المنتج *' : 'Product *'}
                    </label>
                    <select
                      value={orderProdId}
                      onChange={(e) => setOrderProdId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({formatCurrency(p.sellingPrice, business.currency, language)})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5">
                      {isAr ? 'الكمية *' : 'Quantity *'}
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={orderQty}
                      onChange={(e) => setOrderQty(Math.max(1, Number(e.target.value)))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm font-num"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1.5">
                    {isAr ? 'حالة الدفع *' : 'Payment Status *'}
                  </label>
                  <select
                    value={orderPayment}
                    onChange={(e) => setOrderPayment(e.target.value as PaymentStatus)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm"
                  >
                    <option value="paid">{isAr ? 'مدفوع بالكامل' : 'Paid in full'}</option>
                    <option value="partial">{isAr ? 'دفعة جزئية (50%)' : 'Partial (50%)'}</option>
                    <option value="pending">{isAr ? 'بانتظار الدفع' : 'Pending'}</option>
                  </select>
                </div>

                <div className="pt-3 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2 rounded-xl border border-[var(--border-hairline)] text-xs font-medium cursor-pointer"
                  >
                    {t.common.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={isBusy}
                    className="px-5 py-2 rounded-xl bg-[var(--blueprint)] text-white text-xs font-semibold hover:opacity-90 cursor-pointer"
                  >
                    {isAr ? 'حفظ الطلب' : 'Save Order'}
                  </button>
                </div>
              </form>
            )}

            {activeModal === 'product' && (
              <form onSubmit={handleQuickProductSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5">
                    {isAr ? 'اسم المنتج *' : 'Product Name *'}
                  </label>
                  <input
                    type="text"
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    placeholder={isAr ? 'مثال: علبة ترافل الشوكولاتة' : 'e.g. Classic Chocolate Box'}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1.5">
                      {isAr ? 'التصنيف (اختياري)' : 'Category (Optional)'}
                    </label>
                    <input
                      type="text"
                      value={prodCategory}
                      onChange={(e) => setProdCategory(e.target.value)}
                      placeholder={isAr ? 'مثال: حلويات' : 'e.g. Sweets'}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5">
                      {isAr ? 'وحدة البيع *' : 'Selling Unit *'}
                    </label>
                    <input
                      type="text"
                      value={prodUnit}
                      onChange={(e) => setProdUnit(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1.5">
                      {isAr ? `تكلفة الإنتاج (${business.currency}) *` : `Production Cost (${business.currency}) *`}
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="0.5"
                      value={prodCost}
                      onChange={(e) => setProdCost(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm font-num"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5">
                      {isAr ? `سعر البيع (${business.currency}) *` : `Selling Price (${business.currency}) *`}
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="0.5"
                      value={prodPrice}
                      onChange={(e) => setProdPrice(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm font-num"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[var(--canvas)] border border-[var(--border-hairline)] flex items-center justify-between text-xs">
                  <span className="text-[var(--ink-secondary)]">
                    {isAr ? 'الربح التقديري لكل وحدة:' : 'Estimated profit per unit:'}
                  </span>
                  <span className="font-bold font-num text-[var(--positive)]">
                    {formatCurrency(Math.max(0, prodPrice - prodCost), business.currency, language)}
                  </span>
                </div>

                <div className="pt-2 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveModal(null);
                      setActiveSection('products');
                    }}
                    className="text-xs text-[var(--blueprint)] hover:underline cursor-pointer"
                  >
                    {isAr ? 'أو افتح حاسبة المكونات المفصلة' : 'Or use detailed recipe calculator'}
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="px-4 py-2 rounded-xl border border-[var(--border-hairline)] text-xs font-medium cursor-pointer"
                    >
                      {t.common.cancel}
                    </button>
                    <button
                      type="submit"
                      disabled={isBusy}
                      className="px-5 py-2 rounded-xl bg-[var(--blueprint)] text-white text-xs font-semibold hover:opacity-90 cursor-pointer"
                    >
                      {t.common.save}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {activeModal === 'expense' && (
              <form onSubmit={handleQuickExpenseSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5">
                    {isAr ? 'اسم المصروف *' : 'Expense Name *'}
                  </label>
                  <input
                    type="text"
                    value={expTitle}
                    onChange={(e) => setExpTitle(e.target.value)}
                    placeholder={isAr ? 'مثال: شراء علب تغليف' : 'e.g. Packaging boxes'}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1.5">
                      {isAr ? 'الفئة *' : 'Category *'}
                    </label>
                    <select
                      value={expCategory}
                      onChange={(e) => setExpCategory(e.target.value as Expense['category'])}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm"
                    >
                      {EXPENSE_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c.charAt(0).toUpperCase() + c.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5">
                      {isAr ? `المبلغ (${business.currency}) *` : `Amount (${business.currency}) *`}
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="0.5"
                      value={expAmount}
                      onChange={(e) => setExpAmount(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm font-num"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5">
                      {isAr ? 'التاريخ *' : 'Date *'}
                    </label>
                    <input
                      type="date"
                      value={expDate}
                      onChange={(e) => setExpDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm font-num"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5">
                      {isAr ? 'طريقة الدفع *' : 'Payment Method *'}
                    </label>
                    <select
                      value={expPayment}
                      onChange={(e) => setExpPayment(e.target.value as Expense['paymentMethod'])}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm"
                    >
                      <option value="bank_transfer">{isAr ? 'تحويل بنكي' : 'Bank Transfer'}</option>
                      <option value="card">{isAr ? 'بطاقة' : 'Card'}</option>
                      <option value="cash">{isAr ? 'نقداً' : 'Cash'}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1.5">
                    {isAr ? 'ملاحظات (اختياري)' : 'Notes (Optional)'}
                  </label>
                  <input
                    type="text"
                    value={expNotes}
                    onChange={(e) => setExpNotes(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2 rounded-xl border border-[var(--border-hairline)] text-xs font-medium cursor-pointer"
                  >
                    {t.common.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={isBusy}
                    className="px-5 py-2 rounded-xl bg-[var(--blueprint)] text-white text-xs font-semibold hover:opacity-90 cursor-pointer"
                  >
                    {t.common.save}
                  </button>
                </div>
              </form>
            )}

            {activeModal === 'customer' && (
              <form onSubmit={handleQuickCustomerSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5">
                    {isAr ? 'اسم العميل *' : 'Customer Name *'}
                  </label>
                  <input
                    type="text"
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1.5">
                      {isAr ? 'رقم الجوال (اختياري)' : 'Phone Number (Optional)'}
                    </label>
                    <input
                      type="text"
                      value={custPhone}
                      onChange={(e) => setCustPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm font-num"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5">
                      {isAr ? 'المدينة (اختياري)' : 'City (Optional)'}
                    </label>
                    <input
                      type="text"
                      value={custCity}
                      onChange={(e) => setCustCity(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5">
                    {isAr ? 'ملاحظات (اختياري)' : 'Notes (Optional)'}
                  </label>
                  <input
                    type="text"
                    value={custNotes}
                    onChange={(e) => setCustNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm"
                  />
                </div>
                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2 rounded-xl border border-[var(--border-hairline)] text-xs font-medium cursor-pointer"
                  >
                    {t.common.cancel}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[var(--blueprint)] text-white text-xs font-semibold hover:opacity-90 cursor-pointer"
                  >
                    {t.common.save}
                  </button>
                </div>
              </form>
            )}

            {activeModal === 'stock' && stockItem && (
              <form onSubmit={handleQuickStockSubmit} className="mt-4 space-y-4">
                <div className="p-3 rounded-xl bg-[var(--canvas)] border border-[var(--border-hairline)] flex items-center justify-between text-xs">
                  <span className="text-[var(--ink-secondary)]">
                    {isAr ? 'الكمية المتوفرة حالياً:' : 'Current available stock:'}
                  </span>
                  <span className="font-bold font-num text-[var(--ink-primary)]">
                    {formatNumber(stockItem.availableQty, 1)} {stockItem.unit}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1.5">
                    {isAr
                      ? `الكمية المضافة (${stockItem.unit}) *`
                      : `Quantity to Add (${stockItem.unit}) *`}
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={stockDelta}
                    onChange={(e) => setStockDelta(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm font-num"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1.5">
                    {isAr ? 'السبب (اختياري)' : 'Reason (Optional)'}
                  </label>
                  <input
                    type="text"
                    value={stockReason}
                    onChange={(e) => setStockReason(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2 rounded-xl border border-[var(--border-hairline)] text-xs font-medium cursor-pointer"
                  >
                    {t.common.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={isBusy}
                    className="px-5 py-2 rounded-xl bg-[var(--blueprint)] text-white text-xs font-semibold hover:opacity-90 cursor-pointer"
                  >
                    {t.dashboard.checkInventory}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
