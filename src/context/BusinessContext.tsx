import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  ActivityEvent,
  AppNotification,
  AppSection,
  AuthScreen,
  BusinessGoal,
  BusinessIdeaSignInInput,
  BusinessProfile,
  BusinessType,
  Customer,
  Expense,
  InventoryItem,
  Language,
  NotificationPreferences,
  Order,
  OrderStatus,
  Product,
  SavedWorkspaceSummary,
  StockMovement,
  TeamMember,
  UserProfile,
  WebhookConfig,
} from '../types/business';
import { createDemoDataset, DEFAULT_WEBHOOK_CONFIG } from '../data/demoPresets';
import { calculateProductCosts, computeFinanceSummary, convertQuantity, FinanceSummary } from '../utils/calculations';
import { dispatchWebhook, RequestLogEntry } from '../services/apiClient';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}

interface BusinessContextValue {
  // Navigation & Auth state
  activeSection: AppSection;
  setActiveSection: (s: AppSection) => void;
  authScreen: AuthScreen;
  setAuthScreen: (s: AuthScreen) => void;
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  // Language & Locale & Theme
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  // Business Domain Data
  business: BusinessProfile;
  setBusiness: React.Dispatch<React.SetStateAction<BusinessProfile>>;
  products: Product[];
  inventory: InventoryItem[];
  stockMovements: StockMovement[];
  customers: Customer[];
  orders: Order[];
  expenses: Expense[];
  goals: BusinessGoal[];
  notifications: AppNotification[];
  activities: ActivityEvent[];
  team: TeamMember[];
  setTeam: React.Dispatch<React.SetStateAction<TeamMember[]>>;
  notificationPrefs: NotificationPreferences;
  setNotificationPrefs: React.Dispatch<React.SetStateAction<NotificationPreferences>>;
  webhookConfig: WebhookConfig;
  setWebhookConfig: React.Dispatch<React.SetStateAction<WebhookConfig>>;
  requestLogs: RequestLogEntry[];
  financeSummary: FinanceSummary;
  toasts: ToastMessage[];
  pushToast: (type: ToastMessage['type'], text: string) => void;
  dismissToast: (id: string) => void;
  isBusy: boolean;
  // Actions
  switchDemoPreset: (type: BusinessType) => void;
  completeOnboarding: (profile: BusinessProfile, firstGoal?: Omit<BusinessGoal, 'id' | 'createdAt' | 'currentValue'>) => Promise<boolean>;
  saveProduct: (product: Product) => Promise<boolean>;
  deleteProduct: (id: string) => void;
  createOrder: (orderInput: Omit<Order, 'id' | 'orderNumber' | 'inventoryDeducted'>) => Promise<boolean>;
  updateOrderStatus: (orderId: string, nextStatus: OrderStatus) => Promise<boolean>;
  updateOrderPayment: (orderId: string, paidAmount: number) => void;
  deleteOrder: (orderId: string) => void;
  adjustInventory: (itemId: string, deltaQty: number, reason: string, mode?: 'restock' | 'manual_adjustment') => Promise<boolean>;
  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'lastUpdated'>) => Promise<boolean>;
  updateInventoryItem: (item: InventoryItem) => void;
  deleteInventoryItem: (id: string) => void;
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<boolean>;
  updateExpense: (expense: Expense) => void;
  deleteExpense: (id: string) => void;
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => Customer;
  updateCustomer: (customer: Customer) => void;
  deleteCustomer: (id: string) => void;
  sendCustomerFollowUp: (customerId: string, message: string) => Promise<boolean>;
  addGoal: (goal: Omit<BusinessGoal, 'id' | 'createdAt'>) => void;
  updateGoal: (goal: BusinessGoal) => void;
  deleteGoal: (id: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  savedWorkspaces: SavedWorkspaceSummary[];
  signInWithBusinessIdea: (input: BusinessIdeaSignInInput) => Promise<boolean>;
  switchWorkspace: (workspaceId: string) => void;
  signOutToSample: () => void;
}

const STORAGE_KEY = 'small_business_os_state_v1';
const WORKSPACES_KEY = 'bizwise_workspaces_v1';

interface StoredWorkspaceSnapshot {
  summary: SavedWorkspaceSummary;
  user: UserProfile;
  business: BusinessProfile;
  products: Product[];
  inventory: InventoryItem[];
  stockMovements: StockMovement[];
  customers: Customer[];
  orders: Order[];
  expenses: Expense[];
  goals: BusinessGoal[];
  notifications: AppNotification[];
  activities: ActivityEvent[];
  team: TeamMember[];
}

const BusinessContext = createContext<BusinessContextValue | null>(null);

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const initialDemo = useMemo(() => createDemoDataset('food_bakery'), []);

  const loadSaved = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  const saved = useMemo(() => loadSaved(), []);

  const [activeSection, setActiveSection] = useState<AppSection>('dashboard');
  const [authScreen, setAuthScreen] = useState<AuthScreen>('none');
  const [user, setUser] = useState<UserProfile>(
    saved?.user ?? {
      id: 'user-demo',
      fullName: 'Noura Al-Mansour',
      email: 'noura@bloomstudio.sa',
      role: 'owner',
      isDemo: true,
    }
  );
  const [business, setBusiness] = useState<BusinessProfile>(saved?.business ?? initialDemo.business);
  const [products, setProducts] = useState<Product[]>(saved?.products ?? initialDemo.products);
  const [inventory, setInventory] = useState<InventoryItem[]>(saved?.inventory ?? initialDemo.inventory);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(
    saved?.stockMovements ?? initialDemo.stockMovements
  );
  const [customers, setCustomers] = useState<Customer[]>(saved?.customers ?? initialDemo.customers);
  const [orders, setOrders] = useState<Order[]>(saved?.orders ?? initialDemo.orders);
  const [expenses, setExpenses] = useState<Expense[]>(saved?.expenses ?? initialDemo.expenses);
  const [goals, setGoals] = useState<BusinessGoal[]>(saved?.goals ?? initialDemo.goals);
  const [notifications, setNotifications] = useState<AppNotification[]>(
    saved?.notifications ?? initialDemo.notifications
  );
  const [activities, setActivities] = useState<ActivityEvent[]>(saved?.activities ?? initialDemo.activities);
  const [team, setTeam] = useState<TeamMember[]>(saved?.team ?? initialDemo.team);
  const [webhookConfig, setWebhookConfig] = useState<WebhookConfig>(
    saved?.webhookConfig ?? DEFAULT_WEBHOOK_CONFIG
  );
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>(
    saved?.notificationPrefs ?? {
      newOrders: true,
      lowInventory: true,
      pendingPayments: true,
      weeklyReports: true,
      goalMilestones: true,
    }
  );

  const [theme, setTheme] = useState<'dark' | 'light'>(saved?.theme === 'light' ? 'light' : 'dark');
  const [requestLogs, setRequestLogs] = useState<RequestLogEntry[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isBusy, setIsBusy] = useState(false);

  const [workspaceSnapshots, setWorkspaceSnapshots] = useState<Record<string, StoredWorkspaceSnapshot>>(() => {
    try {
      const raw = localStorage.getItem(WORKSPACES_KEY);
      if (!raw) return {};
      return JSON.parse(raw);
    } catch {
      return {};
    }
  });

  const savedWorkspaces = useMemo(
    () =>
      Object.values(workspaceSnapshots)
        .map((w) => w.summary)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [workspaceSnapshots]
  );

  const language: Language = business.language || 'en';

  // Apply RTL/LTR direction and document language cleanly
  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  // Apply Dark Grey / Light Blueprint theme class
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Persist state in localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          user,
          business,
          products,
          inventory,
          stockMovements,
          customers,
          orders,
          expenses,
          goals,
          notifications,
          activities,
          team,
          webhookConfig,
          notificationPrefs,
          theme,
        })
      );
    } catch {
      // ignore quota errors
    }
  }, [
    user,
    business,
    products,
    inventory,
    stockMovements,
    customers,
    orders,
    expenses,
    goals,
    notifications,
    activities,
    team,
    webhookConfig,
    notificationPrefs,
    theme,
  ]);

  // Keep active non-demo workspace synced in saved workspaces directory
  useEffect(() => {
    if (user.isDemo) return;
    const summary: SavedWorkspaceSummary = {
      id: business.id,
      ownerName: user.fullName,
      email: user.email,
      businessName: business.name,
      businessType: business.type,
      businessIdea: business.description,
      currency: business.currency,
      updatedAt: new Date().toISOString(),
    };
    const nextSnap: StoredWorkspaceSnapshot = {
      summary,
      user,
      business,
      products,
      inventory,
      stockMovements,
      customers,
      orders,
      expenses,
      goals,
      notifications,
      activities,
      team,
    };
    setWorkspaceSnapshots((prev) => {
      const updated = { ...prev, [business.id]: nextSnap };
      try {
        localStorage.setItem(WORKSPACES_KEY, JSON.stringify(updated));
      } catch {
        // ignore quota errors
      }
      return updated;
    });
  }, [
    user,
    business,
    products,
    inventory,
    stockMovements,
    customers,
    orders,
    expenses,
    goals,
    notifications,
    activities,
    team,
  ]);

  const financeSummary = useMemo(
    () => computeFinanceSummary(orders, expenses, business),
    [orders, expenses, business]
  );

  // Keep dynamic goal progress synced with live financial metrics
  const syncedGoals = useMemo(() => {
    return goals.map((g) => {
      if (g.type === 'monthly_revenue') {
        return { ...g, currentValue: Number(financeSummary.salesRevenueExclVat.toFixed(2)) };
      }
      if (g.type === 'monthly_profit') {
        return { ...g, currentValue: Number(Math.max(0, financeSummary.netProfit).toFixed(2)) };
      }
      if (g.type === 'order_count') {
        return { ...g, currentValue: orders.filter((o) => o.status !== 'cancelled').length };
      }
      if (g.type === 'customer_count') {
        return { ...g, currentValue: customers.length };
      }
      return g;
    });
  }, [goals, financeSummary, orders, customers]);

  const pushToast = (type: ToastMessage['type'], text: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev.slice(-3), { id, type, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const addLog = (entry: RequestLogEntry) => {
    setRequestLogs((prev) => [entry, ...prev].slice(0, 40));
  };

  const setLanguage = (lang: Language) => {
    setBusiness((prev) => ({ ...prev, language: lang }));
  };

  const pushActivity = (title: string, subtitle: string, category: ActivityEvent['category']) => {
    const event: ActivityEvent = {
      id: `act-${Date.now()}`,
      title,
      subtitle,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      category,
    };
    setActivities((prev) => [event, ...prev].slice(0, 20));
  };

  const switchDemoPreset = (type: BusinessType) => {
    const preset = createDemoDataset(type);
    setBusiness((prev) => ({ ...preset.business, language: prev.language }));
    setProducts(preset.products);
    setInventory(preset.inventory);
    setStockMovements(preset.stockMovements);
    setCustomers(preset.customers);
    setOrders(preset.orders);
    setExpenses(preset.expenses);
    setGoals(preset.goals);
    setNotifications(preset.notifications);
    setActivities(preset.activities);
    setTeam(preset.team);
    pushToast(
      'success',
      language === 'ar' ? `تم تبديل مساحة العمل إلى: ${preset.business.name}` : `Switched demo workspace to ${preset.business.name}`
    );
  };

  const completeOnboarding = async (
    profile: BusinessProfile,
    firstGoal?: Omit<BusinessGoal, 'id' | 'createdAt' | 'currentValue'>
  ): Promise<boolean> => {
    setIsBusy(true);
    const res = await dispatchWebhook(webhookConfig, 'businessCreate', profile, addLog);
    setIsBusy(false);

    if (!res.ok) {
      pushToast('error', res.error || 'Failed to save business profile to backend.');
      return false;
    }

    // Load starter templates tailored to selected business type
    const preset = createDemoDataset(profile.type);
    setBusiness(profile);
    if (user.isDemo) {
      setProducts(preset.products);
      setInventory(preset.inventory);
      setOrders(preset.orders);
      setExpenses(preset.expenses);
      setCustomers(preset.customers);
    }
    if (firstGoal) {
      const createdGoal: BusinessGoal = {
        ...firstGoal,
        id: `goal-${Date.now()}`,
        currentValue: 0,
        createdAt: new Date().toISOString().slice(0, 10),
      };
      setGoals([createdGoal]);
    }
    setAuthScreen('none');
    setActiveSection('dashboard');
    pushActivity('Business workspace initialized', `${profile.name} (${profile.type})`, 'goal');
    pushToast(
      'success',
      profile.language === 'ar' ? 'تم إعداد نشاطك التجاري بنجاح!' : `${profile.name} is ready!`
    );
    return true;
  };

  const saveProduct = async (product: Product): Promise<boolean> => {
    setIsBusy(true);
    const costs = calculateProductCosts(product);
    const res = await dispatchWebhook(
      webhookConfig,
      'productCreate',
      { product, calculatedCost: costs },
      addLog
    );
    setIsBusy(false);

    if (!res.ok) {
      pushToast('error', res.error || 'Failed to save product to backend.');
      return false;
    }

    setProducts((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      return exists ? prev.map((p) => (p.id === product.id ? product : p)) : [product, ...prev];
    });
    pushActivity('Product saved', `${product.name} · Unit cost ${costs.costPerUnit.toFixed(2)} ${business.currency}`, 'product');
    pushToast('success', language === 'ar' ? 'تم حفظ المنتج بنجاح' : `Saved "${product.name}"`);
    return true;
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    pushToast('info', language === 'ar' ? 'تم حذف المنتج' : 'Product removed');
  };

  const deductInventoryForOrder = (order: Order) => {
    if (order.inventoryDeducted) return;
    const movementsToAdd: StockMovement[] = [];

    setInventory((prevInv) => {
      const updated = prevInv.map((inv) => ({ ...inv }));
      for (const item of order.items) {
        const product = products.find((p) => p.id === item.productId);
        if (!product) continue;
        const batchesUsed = item.quantity / Math.max(1, product.unitsPerBatch);

        for (const mat of product.materials) {
          const targetInv = updated.find(
            (i) =>
              (mat.inventoryItemId && i.id === mat.inventoryItemId) ||
              i.name.toLowerCase() === mat.name.toLowerCase()
          );
          if (!targetInv) continue;

          const usedInInvUnit = convertQuantity(mat.usedQty * batchesUsed, mat.usedUnit, targetInv.unit);
          const deducted = Number(usedInInvUnit.toFixed(2));
          targetInv.availableQty = Math.max(0, Number((targetInv.availableQty - deducted).toFixed(2)));
          targetInv.lastUpdated = new Date().toISOString().slice(0, 10);

          movementsToAdd.push({
            id: `mov-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            inventoryItemId: targetInv.id,
            itemName: targetInv.name,
            changeQty: -deducted,
            unit: targetInv.unit,
            type: 'order_fulfillment',
            reason: `Fulfilled Order ${order.orderNumber}`,
            orderNumber: order.orderNumber,
            createdAt: new Date().toISOString().slice(0, 10),
          });
        }
      }

      // Check for newly triggered low stock alerts
      const lowNow = updated.filter((i) => i.availableQty <= i.reorderLevel);
      if (lowNow.length > 0 && notificationPrefs.lowInventory) {
        setNotifications((prevN) => [
          {
            id: `notif-low-${Date.now()}`,
            type: 'low_inventory',
            title: language === 'ar' ? 'تنبيه انخفاض المخزون' : `Low Stock Alert (${lowNow.length} items)`,
            message: lowNow.map((i) => `${i.name} (${i.availableQty} ${i.unit})`).join(', '),
            createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
            read: false,
            targetSection: 'inventory',
          },
          ...prevN,
        ]);
      }

      return updated;
    });

    if (movementsToAdd.length > 0) {
      setStockMovements((prev) => [...movementsToAdd, ...prev]);
    }
  };

  const createOrder = async (
    orderInput: Omit<Order, 'id' | 'orderNumber' | 'inventoryDeducted'>
  ): Promise<boolean> => {
    setIsBusy(true);
    const nextNumber = `ORD-${1041 + orders.length}`;
    const shouldDeductNow = orderInput.status === 'completed';

    const newOrder: Order = {
      ...orderInput,
      id: `ord-${Date.now()}`,
      orderNumber: nextNumber,
      inventoryDeducted: shouldDeductNow,
    };

    const res = await dispatchWebhook(webhookConfig, 'orderCreate', newOrder, addLog);
    setIsBusy(false);

    if (!res.ok) {
      pushToast('error', res.error || 'Failed to create order in backend.');
      return false;
    }

    setOrders((prev) => [newOrder, ...prev]);

    if (shouldDeductNow) {
      deductInventoryForOrder(newOrder);
    }

    if (notificationPrefs.newOrders) {
      setNotifications((prev) => [
        {
          id: `notif-ord-${Date.now()}`,
          type: 'new_order',
          title: `${newOrder.orderNumber} · ${newOrder.customerName}`,
          message: `${newOrder.totalPrice.toFixed(2)} ${business.currency}`,
          createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
          read: false,
          targetSection: 'orders',
        },
        ...prev,
      ]);
    }

    pushActivity(
      `Order ${newOrder.orderNumber} created`,
      `${newOrder.customerName} · ${newOrder.totalPrice.toFixed(2)} ${business.currency}`,
      'order'
    );
    pushToast('success', language === 'ar' ? `تم إنشاء الطلب ${newOrder.orderNumber}` : `Order ${newOrder.orderNumber} created`);
    return true;
  };

  const updateOrderStatus = async (orderId: string, nextStatus: OrderStatus): Promise<boolean> => {
    const existing = orders.find((o) => o.id === orderId);
    if (!existing) return false;

    setIsBusy(true);
    const res = await dispatchWebhook(
      webhookConfig,
      'orderUpdateStatus',
      { orderId, orderNumber: existing.orderNumber, status: nextStatus },
      addLog
    );
    setIsBusy(false);

    if (!res.ok) {
      pushToast('error', res.error || 'Failed to update order status.');
      return false;
    }

    const shouldDeduct = nextStatus === 'completed' && !existing.inventoryDeducted;
    if (shouldDeduct) {
      deductInventoryForOrder(existing);
    }

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: nextStatus,
              inventoryDeducted: o.inventoryDeducted || shouldDeduct,
            }
          : o
      )
    );

    pushActivity(
      `Order ${existing.orderNumber} → ${nextStatus.replace('_', ' ')}`,
      shouldDeduct ? 'Raw materials deducted from inventory' : existing.customerName,
      shouldDeduct ? 'inventory' : 'order'
    );
    pushToast(
      'success',
      shouldDeduct
        ? language === 'ar'
          ? `اكتمل الطلب ${existing.orderNumber} وتم خصم المواد الخام تلقائياً`
          : `Order ${existing.orderNumber} completed & raw materials deducted`
        : language === 'ar'
        ? `تم تحديث حالة الطلب ${existing.orderNumber}`
        : `Order ${existing.orderNumber} updated`
    );
    return true;
  };

  const updateOrderPayment = (orderId: string, paidAmount: number) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const clamped = Math.max(0, Math.min(o.totalPrice, paidAmount));
        const paymentStatus = clamped >= o.totalPrice - 0.01 ? 'paid' : clamped > 0 ? 'partial' : 'pending';
        return { ...o, paidAmount: clamped, paymentStatus };
      })
    );
    pushToast('success', language === 'ar' ? 'تم تحديث الدفعة' : 'Payment record updated');
  };

  const adjustInventory = async (
    itemId: string,
    deltaQty: number,
    reason: string,
    mode: 'restock' | 'manual_adjustment' = 'manual_adjustment'
  ): Promise<boolean> => {
    const item = inventory.find((i) => i.id === itemId);
    if (!item) return false;

    setIsBusy(true);
    const res = await dispatchWebhook(
      webhookConfig,
      'inventoryUpdate',
      { itemId, itemName: item.name, deltaQty, reason, mode },
      addLog
    );
    setIsBusy(false);

    if (!res.ok) {
      pushToast('error', res.error || 'Failed to update inventory in backend.');
      return false;
    }

    const nextQty = Math.max(0, Number((item.availableQty + deltaQty).toFixed(2)));
    setInventory((prev) =>
      prev.map((i) =>
        i.id === itemId ? { ...i, availableQty: nextQty, lastUpdated: new Date().toISOString().slice(0, 10) } : i
      )
    );
    setStockMovements((prev) => [
      {
        id: `mov-${Date.now()}`,
        inventoryItemId: item.id,
        itemName: item.name,
        changeQty: deltaQty,
        unit: item.unit,
        type: mode,
        reason,
        createdAt: new Date().toISOString().slice(0, 10),
      },
      ...prev,
    ]);
    pushActivity('Inventory adjusted', `${item.name}: ${deltaQty > 0 ? '+' : ''}${deltaQty} ${item.unit} (${reason})`, 'inventory');
    pushToast('success', language === 'ar' ? 'تم تحديث المخزون' : `Updated stock for ${item.name}`);
    return true;
  };

  const addInventoryItem = async (item: Omit<InventoryItem, 'id' | 'lastUpdated'>): Promise<boolean> => {
    setIsBusy(true);
    const created: InventoryItem = {
      ...item,
      id: `inv-${Date.now()}`,
      lastUpdated: new Date().toISOString().slice(0, 10),
    };
    const res = await dispatchWebhook(webhookConfig, 'inventoryUpdate', { action: 'create', item: created }, addLog);
    setIsBusy(false);

    if (!res.ok) {
      pushToast('error', res.error || 'Failed to add inventory item.');
      return false;
    }

    setInventory((prev) => [created, ...prev]);
    setStockMovements((prev) => [
      {
        id: `mov-${Date.now()}`,
        inventoryItemId: created.id,
        itemName: created.name,
        changeQty: created.availableQty,
        unit: created.unit,
        type: 'restock',
        reason: 'Initial inventory entry',
        createdAt: created.lastUpdated,
      },
      ...prev,
    ]);
    pushToast('success', language === 'ar' ? 'تمت إضافة الصنف للمخزون' : `Added ${created.name} to inventory`);
    return true;
  };

  const deleteOrder = (orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    pushToast('info', language === 'ar' ? 'تم حذف الطلب' : 'Order deleted');
  };

  const updateInventoryItem = (item: InventoryItem) => {
    setInventory((prev) =>
      prev.map((i) => (i.id === item.id ? { ...item, lastUpdated: new Date().toISOString().slice(0, 10) } : i))
    );
    pushToast('success', language === 'ar' ? 'تم تحديث الصنف' : `Updated "${item.name}"`);
  };

  const deleteInventoryItem = (id: string) => {
    setInventory((prev) => prev.filter((i) => i.id !== id));
    pushToast('info', language === 'ar' ? 'تم حذف الصنف من المخزون' : 'Inventory item removed');
  };

  const addExpense = async (expense: Omit<Expense, 'id'>): Promise<boolean> => {
    setIsBusy(true);
    const created: Expense = { ...expense, id: `exp-${Date.now()}` };
    const res = await dispatchWebhook(webhookConfig, 'expenseCreate', created, addLog);
    setIsBusy(false);

    if (!res.ok) {
      pushToast('error', res.error || 'Failed to record expense in backend.');
      return false;
    }

    setExpenses((prev) => [created, ...prev]);
    pushActivity('Expense recorded', `${created.title} · ${created.amount.toFixed(2)} ${business.currency}`, 'expense');
    pushToast('success', language === 'ar' ? 'تم تسجيل المصروف بنجاح' : `Recorded "${created.title}"`);
    return true;
  };

  const updateExpense = (expense: Expense) => {
    setExpenses((prev) => prev.map((e) => (e.id === expense.id ? expense : e)));
    pushToast('success', language === 'ar' ? 'تم تحديث المصروف' : `Updated "${expense.title}"`);
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    pushToast('info', language === 'ar' ? 'تم حذف المصروف' : 'Expense deleted');
  };

  const addCustomer = (customer: Omit<Customer, 'id' | 'createdAt'>): Customer => {
    const created: Customer = {
      ...customer,
      id: `cust-${Date.now()}`,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setCustomers((prev) => [created, ...prev]);
    pushActivity('Customer added', created.name, 'customer');
    pushToast('success', language === 'ar' ? 'تمت إضافة العميل' : `Added customer ${created.name}`);
    return created;
  };

  const updateCustomer = (customer: Customer) => {
    setCustomers((prev) => prev.map((c) => (c.id === customer.id ? customer : c)));
    pushToast('success', language === 'ar' ? 'تم تحديث بيانات العميل' : 'Customer profile updated');
  };

  const deleteCustomer = (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    pushToast('info', language === 'ar' ? 'تم حذف العميل' : 'Customer removed');
  };

  const sendCustomerFollowUp = async (customerId: string, message: string): Promise<boolean> => {
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) return false;

    setIsBusy(true);
    const res = await dispatchWebhook(
      webhookConfig,
      'customerFollowUp',
      { customerId, customerName: customer.name, phone: customer.phone, email: customer.email, message },
      addLog
    );
    setIsBusy(false);

    if (!res.ok) {
      pushToast('error', res.error || 'Failed to trigger customer follow-up.');
      return false;
    }

    const today = new Date().toISOString().slice(0, 10);
    setCustomers((prev) =>
      prev.map((c) => (c.id === customerId ? { ...c, lastFollowUpAt: today, followUpDate: undefined } : c))
    );
    pushActivity('Customer follow-up sent', `${customer.name} · ${message.slice(0, 40)}...`, 'customer');
    pushToast('success', language === 'ar' ? `تم إرسال المتابعة إلى ${customer.name}` : `Follow-up logged for ${customer.name}`);
    return true;
  };

  const addGoal = (goal: Omit<BusinessGoal, 'id' | 'createdAt'>) => {
    const created: BusinessGoal = {
      ...goal,
      id: `goal-${Date.now()}`,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setGoals((prev) => [created, ...prev]);
    pushActivity('New business goal set', created.title, 'goal');
    pushToast('success', language === 'ar' ? 'تمت إضافة الهدف بنجاح' : 'Business goal added');
  };

  const updateGoal = (goal: BusinessGoal) => {
    setGoals((prev) => prev.map((g) => (g.id === goal.id ? goal : g)));
    pushToast('success', language === 'ar' ? 'تم تحديث الهدف' : 'Goal updated');
  };

  const deleteGoal = (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
    pushToast('info', language === 'ar' ? 'تم حذف الهدف' : 'Goal removed');
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const signInWithBusinessIdea = async (input: BusinessIdeaSignInInput): Promise<boolean> => {
    const cleanName = input.fullName.trim();
    const cleanBiz = input.businessName.trim();
    const cleanIdea = input.businessIdea.trim();
    const cleanEmail = input.email.trim().toLowerCase() || `${cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '.') || 'owner'}@bizwise.local`;

    if (!cleanName || !cleanBiz) {
      pushToast(
        'error',
        language === 'ar'
          ? 'يرجى إدخال اسمك واسم مشروعك للبدء'
          : 'Please enter your name and business name to sign in.'
      );
      return false;
    }

    // Re-open existing saved workspace if matching email + business name
    const existingEntry = Object.values(workspaceSnapshots).find(
      (snap) =>
        snap.summary.email.toLowerCase() === cleanEmail &&
        snap.summary.businessName.toLowerCase() === cleanBiz.toLowerCase()
    );

    if (existingEntry) {
      setUser({ ...existingEntry.user, fullName: cleanName, isDemo: false });
      setBusiness({
        ...existingEntry.business,
        description: cleanIdea || existingEntry.business.description,
        type: input.businessType,
        currency: input.currency,
      });
      setProducts(existingEntry.products);
      setInventory(existingEntry.inventory);
      setStockMovements(existingEntry.stockMovements);
      setCustomers(existingEntry.customers);
      setOrders(existingEntry.orders);
      setExpenses(existingEntry.expenses);
      setGoals(existingEntry.goals);
      setNotifications(existingEntry.notifications);
      setActivities(existingEntry.activities);
      setTeam(existingEntry.team);
      setAuthScreen('none');
      setActiveSection('dashboard');
      pushToast(
        'success',
        language === 'ar' ? `مرحباً بعودتك، ${cleanName}!` : `Welcome back to ${cleanBiz}, ${cleanName}!`
      );
      return true;
    }

    const preset = createDemoDataset(input.businessType);
    const bizId = `biz-${Date.now()}`;
    const newUser: UserProfile = {
      id: `user-${Date.now()}`,
      fullName: cleanName,
      email: cleanEmail,
      role: 'owner',
      isDemo: false,
    };
    const newBusiness: BusinessProfile = {
      ...preset.business,
      id: bizId,
      name: cleanBiz,
      type: input.businessType,
      currency: input.currency,
      language,
      description: cleanIdea || preset.business.description,
      startDate: new Date().toISOString().slice(0, 10),
    };

    setIsBusy(true);
    await dispatchWebhook(webhookConfig, 'businessCreate', newBusiness, addLog);
    setIsBusy(false);

    const starterGoal: BusinessGoal = {
      id: `goal-${Date.now()}`,
      title:
        language === 'ar'
          ? `تحقيق صافي ربح شهري 5,000 ${input.currency}`
          : `Reach 5,000 ${input.currency} Monthly Net Profit`,
      type: 'monthly_profit',
      targetValue: 5000,
      currentValue: 0,
      unit: input.currency,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      createdAt: new Date().toISOString().slice(0, 10),
    };

    const nextTeam: TeamMember[] = [
      { id: 'tm-owner', name: cleanName, email: cleanEmail, role: 'owner', active: true },
    ];

    setUser(newUser);
    setBusiness(newBusiness);
    if (input.startWithSampleData) {
      setProducts(preset.products);
      setInventory(preset.inventory);
      setStockMovements(preset.stockMovements);
      setCustomers(preset.customers);
      setOrders(preset.orders);
      setExpenses(preset.expenses);
      setGoals(preset.goals);
      setNotifications(preset.notifications);
    } else {
      setProducts([]);
      setInventory([]);
      setStockMovements([]);
      setCustomers([]);
      setOrders([]);
      setExpenses([]);
      setGoals([starterGoal]);
      setNotifications([]);
    }
    setActivities([
      {
        id: `act-${Date.now()}`,
        title: language === 'ar' ? `تم إطلاق مساحة عمل ${cleanBiz}` : `${cleanBiz} workspace created`,
        subtitle: cleanIdea || (language === 'ar' ? 'جاهز للبدء' : 'Ready to manage your business'),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        category: 'goal',
      },
    ]);
    setTeam(nextTeam);
    setAuthScreen('none');
    setActiveSection('dashboard');

    pushToast(
      'success',
      language === 'ar'
        ? `أهلاً بك ${cleanName}! مساحة عمل "${cleanBiz}" جاهزة الآن.`
        : `Welcome ${cleanName}! Your "${cleanBiz}" workspace is live.`
    );
    return true;
  };

  const switchWorkspace = (workspaceId: string) => {
    const snap = workspaceSnapshots[workspaceId];
    if (!snap) return;
    setUser(snap.user);
    setBusiness({ ...snap.business, language });
    setProducts(snap.products);
    setInventory(snap.inventory);
    setStockMovements(snap.stockMovements);
    setCustomers(snap.customers);
    setOrders(snap.orders);
    setExpenses(snap.expenses);
    setGoals(snap.goals);
    setNotifications(snap.notifications);
    setActivities(snap.activities);
    setTeam(snap.team);
    setAuthScreen('none');
    setActiveSection('dashboard');
    pushToast(
      'success',
      language === 'ar' ? `تم التبديل إلى ${snap.business.name}` : `Switched to ${snap.business.name}`
    );
  };

  const signOutToSample = () => {
    const demo = createDemoDataset('food_bakery');
    setUser({
      id: 'user-demo',
      fullName: 'Noura Al-Mansour',
      email: 'noura@bloomstudio.sa',
      role: 'owner',
      isDemo: true,
    });
    setBusiness({ ...demo.business, language });
    setProducts(demo.products);
    setInventory(demo.inventory);
    setStockMovements(demo.stockMovements);
    setCustomers(demo.customers);
    setOrders(demo.orders);
    setExpenses(demo.expenses);
    setGoals(demo.goals);
    setNotifications(demo.notifications);
    setActivities(demo.activities);
    setTeam(demo.team);
    setActiveSection('dashboard');
    pushToast(
      'info',
      language === 'ar' ? 'تم تسجيل الخروج. يمكنك تسجيل الدخول بأي فكرة مشروع جديدة.' : 'Signed out. Anyone can sign in with a business idea from the home page.'
    );
  };

  return (
    <BusinessContext.Provider
      value={{
        activeSection,
        setActiveSection,
        authScreen,
        setAuthScreen,
        user,
        setUser,
        language,
        setLanguage,
        theme,
        setTheme,
        business,
        setBusiness,
        products,
        inventory,
        stockMovements,
        customers,
        orders,
        expenses,
        goals: syncedGoals,
        notifications,
        activities,
        team,
        setTeam,
        notificationPrefs,
        setNotificationPrefs,
        webhookConfig,
        setWebhookConfig,
        requestLogs,
        financeSummary,
        toasts,
        pushToast,
        dismissToast,
        isBusy,
        switchDemoPreset,
        completeOnboarding,
        saveProduct,
        deleteProduct,
        createOrder,
        updateOrderStatus,
        updateOrderPayment,
        deleteOrder,
        adjustInventory,
        addInventoryItem,
        updateInventoryItem,
        deleteInventoryItem,
        addExpense,
        updateExpense,
        deleteExpense,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        sendCustomerFollowUp,
        addGoal,
        updateGoal,
        deleteGoal,
        markNotificationRead,
        markAllNotificationsRead,
        savedWorkspaces,
        signInWithBusinessIdea,
        switchWorkspace,
        signOutToSample,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  const ctx = useContext(BusinessContext);
  if (!ctx) throw new Error('useBusiness must be used inside BusinessProvider');
  return ctx;
}
