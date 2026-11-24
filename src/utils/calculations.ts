import {
  BusinessProfile,
  CurrencyCode,
  Expense,
  MeasurementUnit,
  Order,
  Product,
  ProductMaterialItem,
} from '../types/business';

const UNIT_CONVERSIONS: Record<string, { base: string; factor: number }> = {
  g: { base: 'mass', factor: 1 },
  kg: { base: 'mass', factor: 1000 },
  ml: { base: 'volume', factor: 1 },
  L: { base: 'volume', factor: 1000 },
  cm: { base: 'length', factor: 1 },
  m: { base: 'length', factor: 100 },
  yd: { base: 'length', factor: 91.44 },
  pcs: { base: 'count', factor: 1 },
  skein: { base: 'skein', factor: 1 },
  hr: { base: 'time', factor: 1 },
};

export function convertQuantity(qty: number, fromUnit: MeasurementUnit, toUnit: MeasurementUnit): number {
  if (fromUnit === toUnit) return qty;
  const from = UNIT_CONVERSIONS[fromUnit];
  const to = UNIT_CONVERSIONS[toUnit];
  if (!from || !to || from.base !== to.base) {
    return qty;
  }
  return (qty * from.factor) / to.factor;
}

export function calculateMaterialLineCost(item: ProductMaterialItem): number {
  if (item.purchasedQty <= 0 || item.purchasePrice < 0 || item.usedQty < 0) return 0;
  const purchasedInUsedUnit = convertQuantity(item.purchasedQty, item.purchaseUnit, item.usedUnit);
  if (purchasedInUsedUnit <= 0) return 0;
  return (item.purchasePrice / purchasedInUsedUnit) * item.usedQty;
}

export interface ProductCostBreakdown {
  materialsCost: number;
  wasteCost: number;
  packagingCost: number;
  energyCost: number;
  laborCost: number;
  deliveryCost: number;
  overheadCost: number;
  customExpensesCost: number;
  totalBatchCost: number;
  costPerUnit: number;
}

export function calculateProductCosts(product: Product): ProductCostBreakdown {
  const materialsCost = product.materials.reduce((sum, m) => sum + calculateMaterialLineCost(m), 0);
  const add = product.additionalCosts;
  const wasteCost = materialsCost * (Math.max(0, add.wastePercent) / 100);
  const laborCost = Math.max(0, add.flatLaborCost) + Math.max(0, add.laborHours) * Math.max(0, add.hourlyLaborRate);
  const customExpensesCost = (add.customExpenses ?? []).reduce((s, e) => s + Math.max(0, e.amount), 0);
  const packagingCost = Math.max(0, add.packaging);
  const energyCost = Math.max(0, add.electricityAndGas);
  const deliveryCost = Math.max(0, add.delivery);
  const overheadCost = Math.max(0, add.overhead);

  const totalBatchCost =
    materialsCost +
    wasteCost +
    packagingCost +
    energyCost +
    laborCost +
    deliveryCost +
    overheadCost +
    customExpensesCost;

  const units = Math.max(1, product.unitsPerBatch);
  const costPerUnit = totalBatchCost / units;

  return {
    materialsCost,
    wasteCost,
    packagingCost,
    energyCost,
    laborCost,
    deliveryCost,
    overheadCost,
    customExpensesCost,
    totalBatchCost,
    costPerUnit,
  };
}

export interface PricingScenario {
  targetMargin: number;
  suggestedPriceExclVat: number;
  priceWithVat: number;
  vatCollected: number;
  discountedPriceExclVat: number;
  feesAmount: number;
  grossProfit: number;
  estimatedNetProfit: number;
  actualNetMargin: number;
  markupPercent: number;
}

export function calculateSuggestedPriceFromMargin(unitCost: number, targetMargin: number): number {
  if (unitCost <= 0) return 0;
  const clampedMargin = Math.min(0.95, Math.max(0.01, targetMargin));
  return unitCost / (1 - clampedMargin);
}

export function evaluatePricingScenario(
  unitCost: number,
  targetMargin: number,
  options: {
    vatRate: number;
    discountRate: number;
    paymentFeeRate: number;
    channelFeeRate: number;
    overridePrice?: number;
  }
): PricingScenario {
  const suggestedPriceExclVat =
    options.overridePrice !== undefined
      ? Math.max(0, options.overridePrice)
      : calculateSuggestedPriceFromMargin(unitCost, targetMargin);

  const discountedPriceExclVat = suggestedPriceExclVat * (1 - Math.max(0, Math.min(0.9, options.discountRate)));
  const vatCollected = discountedPriceExclVat * Math.max(0, options.vatRate);
  const priceWithVat = discountedPriceExclVat + vatCollected;

  // Payment & platform fees typically apply to the total charged amount
  const feesAmount = priceWithVat * (Math.max(0, options.paymentFeeRate) + Math.max(0, options.channelFeeRate));

  // VAT collected is passed to tax authority, never treated as revenue
  const grossProfit = discountedPriceExclVat - unitCost;
  const estimatedNetProfit = grossProfit - feesAmount;
  const actualNetMargin = discountedPriceExclVat > 0 ? estimatedNetProfit / discountedPriceExclVat : 0;
  const markupPercent = unitCost > 0 ? (discountedPriceExclVat - unitCost) / unitCost : 0;

  return {
    targetMargin,
    suggestedPriceExclVat,
    priceWithVat,
    vatCollected,
    discountedPriceExclVat,
    feesAmount,
    grossProfit,
    estimatedNetProfit,
    actualNetMargin,
    markupPercent,
  };
}

export interface FinanceSummary {
  salesRevenueExclVat: number;
  vatCollected: number;
  totalBilledInclVat: number;
  cogs: number;
  operatingExpenses: number;
  grossProfit: number;
  netProfit: number;
  profitMarginPercent: number;
  cashInflows: number;
  cashOutflows: number;
  netCashFlow: number;
  pendingPayments: number;
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
}

export function computeFinanceSummary(
  orders: Order[],
  expenses: Expense[],
  business: BusinessProfile
): FinanceSummary {
  const activeOrders = orders.filter((o) => o.status !== 'cancelled');
  const salesRevenueExclVat = activeOrders.reduce((s, o) => s + o.subtotal - o.discountAmount + o.deliveryFee, 0);
  const vatCollected = activeOrders.reduce((s, o) => s + o.vatAmount, 0);
  const totalBilledInclVat = activeOrders.reduce((s, o) => s + o.totalPrice, 0);
  const cogs = activeOrders.reduce((s, o) => s + o.estimatedCost, 0);
  const operatingExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  const grossProfit = salesRevenueExclVat - cogs;
  const netProfit = grossProfit - operatingExpenses;
  const profitMarginPercent = salesRevenueExclVat > 0 ? (netProfit / salesRevenueExclVat) * 100 : 0;

  // Cash flow tracks actual cash received vs cash paid out (distinct from accounting profit!)
  const cashInflows = activeOrders.reduce((s, o) => s + o.paidAmount, 0);
  const cashOutflows = operatingExpenses + business.fixedMonthlyExpenses * 0; // recorded expenses represent cash outflows
  const netCashFlow = cashInflows - cashOutflows;

  const pendingPayments = activeOrders.reduce((s, o) => s + Math.max(0, o.totalPrice - o.paidAmount), 0);

  const totalOrders = orders.length;
  const completedOrders = orders.filter((o) => o.status === 'completed').length;
  const pendingOrders = orders.filter((o) => o.status !== 'completed' && o.status !== 'cancelled').length;

  return {
    salesRevenueExclVat,
    vatCollected,
    totalBilledInclVat,
    cogs,
    operatingExpenses,
    grossProfit,
    netProfit,
    profitMarginPercent,
    cashInflows,
    cashOutflows,
    netCashFlow,
    pendingPayments,
    totalOrders,
    completedOrders,
    pendingOrders,
  };
}

export function formatCurrency(amount: number, currency: CurrencyCode, language: 'en' | 'ar' = 'en'): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  const formatted = new Intl.NumberFormat(language === 'ar' ? 'en-US' : 'en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safe);

  const symbols: Record<CurrencyCode, { en: string; ar: string }> = {
    SAR: { en: 'SAR', ar: 'ر.س' },
    AED: { en: 'AED', ar: 'د.إ' },
    KWD: { en: 'KWD', ar: 'د.ك' },
    QAR: { en: 'QAR', ar: 'ر.ق' },
    EGP: { en: 'EGP', ar: 'ج.م' },
    USD: { en: '$', ar: '$' },
    EUR: { en: '€', ar: '€' },
    GBP: { en: '£', ar: '£' },
  };

  const label = symbols[currency]?.[language] ?? currency;
  if (currency === 'USD' || currency === 'EUR' || currency === 'GBP') {
    return `${label}${formatted}`;
  }
  return `${formatted} ${label}`;
}

export function formatNumber(n: number, decimals = 0): string {
  const safe = Number.isFinite(n) ? n : 0;
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(safe);
}
