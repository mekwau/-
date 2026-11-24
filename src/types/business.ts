export type Language = 'en' | 'ar';

export type BusinessType =
  | 'food_bakery'
  | 'clothing_fashion'
  | 'handmade'
  | 'crochet_knitting'
  | 'candles_fragrances'
  | 'beauty_skincare'
  | 'other';

export type CurrencyCode = 'SAR' | 'AED' | 'KWD' | 'QAR' | 'EGP' | 'USD' | 'EUR' | 'GBP';

export type OrderStatus =
  | 'new'
  | 'confirmed'
  | 'in_production'
  | 'ready'
  | 'shipped'
  | 'completed'
  | 'cancelled';

export type PaymentStatus = 'paid' | 'pending' | 'partial';

export type MeasurementUnit = 'g' | 'kg' | 'ml' | 'L' | 'm' | 'cm' | 'yd' | 'pcs' | 'skein' | 'hr';

export type InventoryCategory = 'raw_material' | 'finished_product' | 'packaging';

export type GoalType =
  | 'monthly_revenue'
  | 'monthly_profit'
  | 'order_count'
  | 'customer_count'
  | 'cost_reduction'
  | 'custom';

export type AppSection =
  | 'dashboard'
  | 'orders'
  | 'products'
  | 'inventory'
  | 'customers'
  | 'expenses'
  | 'finance'
  | 'pricing'
  | 'goals'
  | 'reports'
  | 'advisor'
  | 'settings';

export type AuthScreen = 'none' | 'login' | 'signup' | 'forgot_password' | 'onboarding';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  role: 'owner' | 'operations' | 'accountant' | 'staff';
  isDemo: boolean;
}

export interface SavedWorkspaceSummary {
  id: string;
  ownerName: string;
  email: string;
  businessName: string;
  businessType: BusinessType;
  businessIdea: string;
  currency: CurrencyCode;
  updatedAt: string;
}

export interface BusinessIdeaSignInInput {
  fullName: string;
  email: string;
  businessName: string;
  businessType: BusinessType;
  businessIdea: string;
  currency: CurrencyCode;
  startWithSampleData: boolean;
}

export interface BusinessProfile {
  id: string;
  name: string;
  type: BusinessType;
  country: string;
  currency: CurrencyCode;
  language: Language;
  description: string;
  startDate: string;
  // Financial & Tax configuration
  initialBudget: number;
  fixedMonthlyExpenses: number;
  variableMonthlyExpenses: number;
  defaultLaborRatePerHour: number;
  defaultPackagingCost: number;
  defaultDeliveryCost: number;
  desiredProfitMargin: number; // e.g., 0.30 for 30%
  vatRate: number; // e.g., 0.15 for 15% VAT
  paymentFeeRate: number; // e.g., 0.025
  channelFeeRate: number; // e.g., 0.0
  // Business type specific answers from onboarding
  requirements: Record<string, string | boolean | number>;
}

export interface ProductMaterialItem {
  id: string;
  inventoryItemId?: string;
  name: string;
  materialKind?: 'ingredient' | 'fabric' | 'accessory' | 'yarn' | 'wax' | 'fragrance' | 'container' | 'packaging' | 'custom';
  brandOrType?: string;
  purchasedQty: number;
  purchaseUnit: MeasurementUnit;
  purchasePrice: number;
  usedQty: number;
  usedUnit: MeasurementUnit;
  colorCount?: number;
}

export interface ProductAdditionalCosts {
  packaging: number;
  electricityAndGas: number;
  laborHours: number;
  hourlyLaborRate: number;
  flatLaborCost: number;
  delivery: number;
  overhead: number;
  wastePercent: number;
  customExpenses: { id: string; label: string; amount: number }[];
}

export interface Product {
  id: string;
  businessType: BusinessType;
  name: string;
  category: string;
  imageUrl?: string;
  sellingUnit: string; // piece, box, tray, jar, garment, etc.
  unitsPerBatch: number;
  variantLabel?: string; // e.g., size / fragrance variation for candles
  materials: ProductMaterialItem[];
  additionalCosts: ProductAdditionalCosts;
  sellingPrice: number; // excl. VAT
  targetMargin: number; // 0.30 = 30%
  isActive: boolean;
  isPatternTemplate?: boolean; // for Crochet & Knitting reusable patterns
  updatedAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  discountAmount: number;
  deliveryFee: number;
  vatAmount: number;
  subtotal: number;
  totalPrice: number;
  estimatedCost: number;
  expectedProfit: number;
  paymentStatus: PaymentStatus;
  paidAmount: number;
  status: OrderStatus;
  inventoryDeducted: boolean;
  notes?: string;
  createdAt: string;
  source?: 'manual' | 'external_webhook';
}

export interface InventoryItem {
  id: string;
  name: string;
  category: InventoryCategory;
  unit: MeasurementUnit;
  availableQty: number;
  reservedQty: number;
  purchasePricePerUnit: number;
  supplier: string;
  reorderLevel: number;
  lastUpdated: string;
}

export interface StockMovement {
  id: string;
  inventoryItemId: string;
  itemName: string;
  changeQty: number; // negative for deduction, positive for restock
  unit: MeasurementUnit;
  type: 'order_fulfillment' | 'manual_adjustment' | 'restock';
  reason: string;
  orderNumber?: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  notes: string;
  followUpDate?: string;
  lastFollowUpAt?: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  title: string;
  category: 'materials' | 'packaging' | 'utilities' | 'marketing' | 'delivery' | 'labor' | 'equipment' | 'other';
  amount: number;
  date: string;
  paymentMethod: 'cash' | 'bank_transfer' | 'card';
  receiptName?: string;
  receiptDataUrl?: string;
  notes?: string;
}

export interface BusinessGoal {
  id: string;
  title: string;
  type: GoalType;
  targetValue: number;
  currentValue: number;
  unit: string;
  deadline: string;
  createdAt: string;
  aiSuggested?: boolean;
}

export interface AppNotification {
  id: string;
  type: 'new_order' | 'order_status' | 'low_inventory' | 'pending_payment' | 'weekly_report' | 'goal_milestone';
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  targetSection?: AppSection;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'operations' | 'accountant' | 'staff';
  active: boolean;
}

export interface WebhookConfig {
  mode: 'demo' | 'live';
  baseUrl: string;
  useServerProxy: boolean;
  supabaseUrl: string;
  supabaseAnonKeySet: boolean;
  endpoints: {
    businessCreate: string;
    productCreate: string;
    productCalculateCost: string;
    productPricing: string;
    orderCreate: string;
    orderUpdateStatus: string;
    inventoryUpdate: string;
    expenseCreate: string;
    financeSummary: string;
    aiAsk: string;
    reportsWeekly: string;
    customerFollowUp: string;
  };
}

export interface NotificationPreferences {
  newOrders: boolean;
  lowInventory: boolean;
  pendingPayments: boolean;
  weeklyReports: boolean;
  goalMilestones: boolean;
}

export interface ActivityEvent {
  id: string;
  title: string;
  subtitle: string;
  timestamp: string;
  category: 'order' | 'product' | 'inventory' | 'expense' | 'goal' | 'customer';
}
