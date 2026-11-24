import {
  ActivityEvent,
  AppNotification,
  BusinessGoal,
  BusinessProfile,
  BusinessType,
  Customer,
  Expense,
  InventoryItem,
  Order,
  Product,
  StockMovement,
  TeamMember,
  WebhookConfig,
} from '../types/business';

export interface DemoDataset {
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

export const DEFAULT_WEBHOOK_CONFIG: WebhookConfig = {
  mode: (import.meta.env.VITE_N8N_WEBHOOK_BASE_URL ? 'live' : 'demo') as 'demo' | 'live',
  baseUrl: import.meta.env.VITE_N8N_WEBHOOK_BASE_URL || '',
  useServerProxy: true,
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
  supabaseAnonKeySet: Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY),
  endpoints: {
    businessCreate: '/webhook/business/create',
    productCreate: '/webhook/product/create',
    productCalculateCost: '/webhook/product/calculate-cost',
    productPricing: '/webhook/product/pricing',
    orderCreate: '/webhook/order/create',
    orderUpdateStatus: '/webhook/order/update-status',
    inventoryUpdate: '/webhook/inventory/update',
    expenseCreate: '/webhook/expense/create',
    financeSummary: '/webhook/finance/summary',
    aiAsk: '/webhook/ai/ask',
    reportsWeekly: '/webhook/reports/weekly',
    customerFollowUp: '/webhook/customer/follow-up',
  },
};

export function createDemoDataset(businessType: BusinessType = 'food_bakery'): DemoDataset {
  const baseTeam: TeamMember[] = [
    { id: 'tm-1', name: 'Noura Al-Mansour', email: 'noura@bloomstudio.sa', role: 'owner', active: true },
    { id: 'tm-2', name: 'Lama Al-Harbi', email: 'lama@bloomstudio.sa', role: 'operations', active: true },
  ];

  const baseCustomers: Customer[] = [
    {
      id: 'cust-1',
      name: 'Reem Al-Otaibi',
      phone: '+966 55 312 8890',
      email: 'reem.otaibi@example.com',
      city: 'Riyadh',
      notes: 'Prefers ribbon gift wrapping and Friday afternoon delivery.',
      followUpDate: '2026-11-28',
      createdAt: '2026-08-14',
    },
    {
      id: 'cust-2',
      name: 'Sara Al-Dosari',
      phone: '+966 50 984 1120',
      email: 'sara.d@example.com',
      city: 'Jeddah',
      notes: 'Corporate event organizer; orders monthly gift sets.',
      lastFollowUpAt: '2026-11-10',
      createdAt: '2026-07-02',
    },
    {
      id: 'cust-3',
      name: 'Maha Al-Qahtani',
      phone: '+966 54 771 4509',
      email: 'maha.q@example.com',
      city: 'Khobar',
      notes: 'Pending balance on bulk order; send gentle reminder.',
      followUpDate: '2026-11-25',
      createdAt: '2026-09-20',
    },
    {
      id: 'cust-4',
      name: 'Layla Al-Subaie',
      phone: '+966 56 203 7714',
      email: 'layla.s@example.com',
      city: 'Riyadh',
      notes: 'Has not ordered in 45 days — send seasonal menu preview.',
      createdAt: '2026-06-11',
    },
  ];

  if (businessType === 'candles_fragrances') {
    const products: Product[] = [
      {
        id: 'prod-c1',
        businessType: 'candles_fragrances',
        name: 'Amber & Sage Soy Candle (8 oz)',
        category: 'Botanical Collection',
        imageUrl: '/src/assets/images/product_soy_candle_1795519115052.jpg',
        sellingUnit: 'jar',
        unitsPerBatch: 10,
        variantLabel: '8 oz Amber Jar · Sage & Cedar',
        materials: [
          { id: 'm1', inventoryItemId: 'inv-c1', name: 'Natural Soy Wax 464', materialKind: 'wax', purchasedQty: 5, purchaseUnit: 'kg', purchasePrice: 220, usedQty: 2200, usedUnit: 'g' },
          { id: 'm2', inventoryItemId: 'inv-c2', name: 'Amber & Sage Fragrance Oil', materialKind: 'fragrance', purchasedQty: 500, purchaseUnit: 'ml', purchasePrice: 195, usedQty: 220, usedUnit: 'ml' },
          { id: 'm3', inventoryItemId: 'inv-c3', name: 'Cotton Core Wicks (ECO-10)', materialKind: 'accessory', purchasedQty: 50, purchaseUnit: 'pcs', purchasePrice: 45, usedQty: 10, usedUnit: 'pcs' },
          { id: 'm4', inventoryItemId: 'inv-c4', name: '8 oz Amber Glass Jars', materialKind: 'container', purchasedQty: 24, purchaseUnit: 'pcs', purchasePrice: 216, usedQty: 10, usedUnit: 'pcs' },
        ],
        additionalCosts: { packaging: 45, electricityAndGas: 12, laborHours: 2.5, hourlyLaborRate: 35, flatLaborCost: 0, delivery: 0, overhead: 18, wastePercent: 3, customExpenses: [] },
        sellingPrice: 89,
        targetMargin: 0.4,
        isActive: true,
        updatedAt: '2026-11-22',
      },
      {
        id: 'prod-c2',
        businessType: 'candles_fragrances',
        name: 'Oud & Vanilla Reed Diffuser (150 ml)',
        category: 'Home Fragrance',
        sellingUnit: 'bottle',
        unitsPerBatch: 8,
        variantLabel: '150 ml Frosted Glass',
        materials: [
          { id: 'm5', inventoryItemId: 'inv-c2', name: 'Oud Vanilla Fragrance Blend', materialKind: 'fragrance', purchasedQty: 500, purchaseUnit: 'ml', purchasePrice: 240, usedQty: 280, usedUnit: 'ml' },
          { id: 'm6', name: 'Diffuser Base Oil', materialKind: 'custom', purchasedQty: 1, purchaseUnit: 'L', purchasePrice: 120, usedQty: 920, usedUnit: 'ml' },
          { id: 'm7', name: 'Diffuser Glass Bottles & Reeds', materialKind: 'container', purchasedQty: 20, purchaseUnit: 'pcs', purchasePrice: 220, usedQty: 8, usedUnit: 'pcs' },
        ],
        additionalCosts: { packaging: 32, electricityAndGas: 4, laborHours: 1.5, hourlyLaborRate: 35, flatLaborCost: 0, delivery: 0, overhead: 10, wastePercent: 2, customExpenses: [] },
        sellingPrice: 115,
        targetMargin: 0.45,
        isActive: true,
        updatedAt: '2026-11-20',
      },
    ];
    return buildDatasetForBusiness(
      {
        id: 'biz-candles',
        name: 'Aroma Atelier Home Scents',
        type: 'candles_fragrances',
        country: 'Saudi Arabia',
        currency: 'SAR',
        language: 'en',
        description: 'Small-batch hand-poured botanical soy candles and home diffusers.',
        startDate: '2025-10-01',
        initialBudget: 12000,
        fixedMonthlyExpenses: 1400,
        variableMonthlyExpenses: 950,
        defaultLaborRatePerHour: 35,
        defaultPackagingCost: 4.5,
        defaultDeliveryCost: 22,
        desiredProfitMargin: 0.4,
        vatRate: 0.15,
        paymentFeeRate: 0.025,
        channelFeeRate: 0,
        requirements: { pourMethod: 'Small batch hand-poured', fragranceLoad: '10%' },
      },
      products,
      [
        { id: 'inv-c1', name: 'Natural Soy Wax 464', category: 'raw_material', unit: 'g', availableQty: 8400, reservedQty: 880, purchasePricePerUnit: 0.044, supplier: 'Al-Noor Candle Supply', reorderLevel: 3000, lastUpdated: '2026-11-22' },
        { id: 'inv-c2', name: 'Amber & Sage Fragrance Oil', category: 'raw_material', unit: 'ml', availableQty: 310, reservedQty: 88, purchasePricePerUnit: 0.39, supplier: 'Grasse Aromatics KSA', reorderLevel: 400, lastUpdated: '2026-11-22' },
        { id: 'inv-c3', name: 'Cotton Core Wicks (ECO-10)', category: 'raw_material', unit: 'pcs', availableQty: 64, reservedQty: 4, purchasePricePerUnit: 0.9, supplier: 'Al-Noor Candle Supply', reorderLevel: 30, lastUpdated: '2026-11-18' },
        { id: 'inv-c4', name: '8 oz Amber Glass Jars', category: 'packaging', unit: 'pcs', availableQty: 18, reservedQty: 4, purchasePricePerUnit: 9, supplier: 'Riyadh Glassware', reorderLevel: 24, lastUpdated: '2026-11-21' },
      ],
      baseCustomers,
      baseTeam
    );
  }

  if (businessType === 'crochet_knitting') {
    const products: Product[] = [
      {
        id: 'prod-k1',
        businessType: 'crochet_knitting',
        name: 'Sage Stripe Cotton Crochet Tote',
        category: 'Bags & Totes',
        imageUrl: '/src/assets/images/product_crochet_tote_1795519114119.jpg',
        sellingUnit: 'tote',
        unitsPerBatch: 1,
        isPatternTemplate: true,
        materials: [
          { id: 'k1', inventoryItemId: 'inv-k1', name: 'Organic Cotton Yarn (Cream, 100g skein)', materialKind: 'yarn', brandOrType: 'Drops Paris', purchasedQty: 100, purchaseUnit: 'g', purchasePrice: 22, usedQty: 260, usedUnit: 'g', colorCount: 2 },
          { id: 'k2', inventoryItemId: 'inv-k2', name: 'Organic Cotton Yarn (Sage, 100g skein)', materialKind: 'yarn', brandOrType: 'Drops Paris', purchasedQty: 100, purchaseUnit: 'g', purchasePrice: 22, usedQty: 140, usedUnit: 'g', colorCount: 1 },
          { id: 'k3', inventoryItemId: 'inv-k3', name: 'Leather Handmade Tag & Cotton Lining', materialKind: 'accessory', purchasedQty: 10, purchaseUnit: 'pcs', purchasePrice: 95, usedQty: 1, usedUnit: 'pcs' },
        ],
        additionalCosts: { packaging: 9, electricityAndGas: 2, laborHours: 4.5, hourlyLaborRate: 30, flatLaborCost: 0, delivery: 0, overhead: 5, wastePercent: 2, customExpenses: [] },
        sellingPrice: 310,
        targetMargin: 0.3,
        isActive: true,
        updatedAt: '2026-11-22',
      },
    ];
    return buildDatasetForBusiness(
      {
        id: 'biz-crochet',
        name: 'Loop & Loom Handknits',
        type: 'crochet_knitting',
        country: 'Saudi Arabia',
        currency: 'SAR',
        language: 'en',
        description: 'Hand-crocheted organic cotton bags, baby blankets, and cozy home accessories.',
        startDate: '2025-09-01',
        initialBudget: 6500,
        fixedMonthlyExpenses: 600,
        variableMonthlyExpenses: 450,
        defaultLaborRatePerHour: 30,
        defaultPackagingCost: 9,
        defaultDeliveryCost: 24,
        desiredProfitMargin: 0.3,
        vatRate: 0.15,
        paymentFeeRate: 0.025,
        channelFeeRate: 0,
        requirements: { savePatterns: true, customSizing: true },
      },
      products,
      [
        { id: 'inv-k1', name: 'Organic Cotton Yarn (Cream)', category: 'raw_material', unit: 'g', availableQty: 1400, reservedQty: 260, purchasePricePerUnit: 0.22, supplier: 'Gulf Yarn House', reorderLevel: 800, lastUpdated: '2026-11-21' },
        { id: 'inv-k2', name: 'Organic Cotton Yarn (Sage)', category: 'raw_material', unit: 'g', availableQty: 320, reservedQty: 140, purchasePricePerUnit: 0.22, supplier: 'Gulf Yarn House', reorderLevel: 500, lastUpdated: '2026-11-21' },
        { id: 'inv-k3', name: 'Leather Tag & Lining Kit', category: 'packaging', unit: 'pcs', availableQty: 14, reservedQty: 1, purchasePricePerUnit: 9.5, supplier: 'Craft Box Studio', reorderLevel: 10, lastUpdated: '2026-11-19' },
      ],
      baseCustomers,
      baseTeam
    );
  }

  if (businessType === 'clothing_fashion') {
    const products: Product[] = [
      {
        id: 'prod-f1',
        businessType: 'clothing_fashion',
        name: 'Sand Tailored Linen Jacket',
        category: 'Outerwear',
        imageUrl: '/src/assets/images/product_linen_abaya_1795519115681.jpg',
        sellingUnit: 'garment',
        unitsPerBatch: 1,
        materials: [
          { id: 'f1', inventoryItemId: 'inv-f1', name: 'Belgian Washed Linen (Sand)', materialKind: 'fabric', purchasedQty: 10, purchaseUnit: 'm', purchasePrice: 680, usedQty: 2.4, usedUnit: 'm' },
          { id: 'f2', inventoryItemId: 'inv-f2', name: 'Horn Buttons & Gutermann Thread', materialKind: 'accessory', purchasedQty: 20, purchaseUnit: 'pcs', purchasePrice: 90, usedQty: 6, usedUnit: 'pcs' },
        ],
        additionalCosts: { packaging: 18, electricityAndGas: 4, laborHours: 0, hourlyLaborRate: 0, flatLaborCost: 115, delivery: 0, overhead: 12, wastePercent: 5, customExpenses: [] },
        sellingPrice: 495,
        targetMargin: 0.35,
        isActive: true,
        updatedAt: '2026-11-21',
      },
    ];
    return buildDatasetForBusiness(
      {
        id: 'biz-fashion',
        name: 'Safa Linen Studio',
        type: 'clothing_fashion',
        country: 'Saudi Arabia',
        currency: 'SAR',
        language: 'en',
        description: 'Made-to-order breathable linen jackets, abayas, and everyday resort wear.',
        startDate: '2025-11-01',
        initialBudget: 18000,
        fixedMonthlyExpenses: 2100,
        variableMonthlyExpenses: 1100,
        defaultLaborRatePerHour: 45,
        defaultPackagingCost: 18,
        defaultDeliveryCost: 28,
        desiredProfitMargin: 0.35,
        vatRate: 0.15,
        paymentFeeRate: 0.025,
        channelFeeRate: 0,
        requirements: { tailoringType: 'In-house + Seamstress', customMeasurements: true },
      },
      products,
      [
        { id: 'inv-f1', name: 'Belgian Washed Linen (Sand)', category: 'raw_material', unit: 'm', availableQty: 18.5, reservedQty: 2.4, purchasePricePerUnit: 68, supplier: 'Al-Jazeera Textiles', reorderLevel: 10, lastUpdated: '2026-11-22' },
        { id: 'inv-f2', name: 'Horn Buttons & Thread Kit', category: 'raw_material', unit: 'pcs', availableQty: 22, reservedQty: 6, purchasePricePerUnit: 4.5, supplier: 'Tailor Craft', reorderLevel: 30, lastUpdated: '2026-11-20' },
      ],
      baseCustomers,
      baseTeam
    );
  }

  // Default: Food & Bakery ("Bloom & Crumb Handmade Bakery")
  const bakeryProducts: Product[] = [
    {
      id: 'prod-1',
      businessType: 'food_bakery',
      name: 'Sea-Salt Dark Chocolate Box',
      category: 'Cookies & Brownies',
      imageUrl: '/src/assets/images/product_chocolate_truffle_box_1795519114061.jpg',
      sellingUnit: 'box',
      unitsPerBatch: 4,
      materials: [
        { id: 'ing-1', inventoryItemId: 'inv-1', name: 'Belgian Dark Chocolate 70%', materialKind: 'ingredient', purchasedQty: 1, purchaseUnit: 'kg', purchasePrice: 80, usedQty: 640, usedUnit: 'g' },
        { id: 'ing-2', inventoryItemId: 'inv-2', name: 'Cultured European Butter', materialKind: 'ingredient', purchasedQty: 500, purchaseUnit: 'g', purchasePrice: 25, usedQty: 360, usedUnit: 'g' },
        { id: 'ing-3', inventoryItemId: 'inv-3', name: 'Organic Pastry Flour', materialKind: 'ingredient', purchasedQty: 1, purchaseUnit: 'kg', purchasePrice: 8, usedQty: 240, usedUnit: 'g' },
        { id: 'ing-4', inventoryItemId: 'inv-4', name: 'Kraft Bakery Gift Boxes', materialKind: 'packaging', purchasedQty: 25, purchaseUnit: 'pcs', purchasePrice: 125, usedQty: 4, usedUnit: 'pcs' },
      ],
      additionalCosts: {
        packaging: 8,
        electricityAndGas: 12,
        laborHours: 1.5,
        hourlyLaborRate: 30,
        flatLaborCost: 0,
        delivery: 0,
        overhead: 8,
        wastePercent: 4,
        customExpenses: [],
      },
      sellingPrice: 68,
      targetMargin: 0.35,
      isActive: true,
      updatedAt: '2026-11-23',
    },
    {
      id: 'prod-2',
      businessType: 'food_bakery',
      name: 'Cardamom Honey Babka Loaf',
      category: 'Artisan Loaves',
      sellingUnit: 'loaf',
      unitsPerBatch: 3,
      materials: [
        { id: 'ing-5', inventoryItemId: 'inv-3', name: 'Organic Pastry Flour', materialKind: 'ingredient', purchasedQty: 1, purchaseUnit: 'kg', purchasePrice: 8, usedQty: 750, usedUnit: 'g' },
        { id: 'ing-6', inventoryItemId: 'inv-2', name: 'Cultured European Butter', materialKind: 'ingredient', purchasedQty: 500, purchaseUnit: 'g', purchasePrice: 25, usedQty: 250, usedUnit: 'g' },
        { id: 'ing-7', inventoryItemId: 'inv-5', name: 'Sidr Blossom Honey', materialKind: 'ingredient', purchasedQty: 500, purchaseUnit: 'g', purchasePrice: 65, usedQty: 150, usedUnit: 'g' },
      ],
      additionalCosts: {
        packaging: 9,
        electricityAndGas: 10,
        laborHours: 1.2,
        hourlyLaborRate: 30,
        flatLaborCost: 0,
        delivery: 0,
        overhead: 6,
        wastePercent: 3,
        customExpenses: [],
      },
      sellingPrice: 48,
      targetMargin: 0.35,
      isActive: true,
      updatedAt: '2026-11-21',
    },
    {
      id: 'prod-3',
      businessType: 'food_bakery',
      name: 'Pistachio Rose Financier Tray (12 pcs)',
      category: 'Event Trays',
      sellingUnit: 'tray',
      unitsPerBatch: 2,
      materials: [
        { id: 'ing-8', inventoryItemId: 'inv-6', name: 'Roasted Green Pistachio Flour', materialKind: 'ingredient', purchasedQty: 1, purchaseUnit: 'kg', purchasePrice: 135, usedQty: 380, usedUnit: 'g' },
        { id: 'ing-9', inventoryItemId: 'inv-2', name: 'Cultured European Butter', materialKind: 'ingredient', purchasedQty: 500, purchaseUnit: 'g', purchasePrice: 25, usedQty: 300, usedUnit: 'g' },
      ],
      additionalCosts: {
        packaging: 16,
        electricityAndGas: 9,
        laborHours: 1.4,
        hourlyLaborRate: 30,
        flatLaborCost: 0,
        delivery: 0,
        overhead: 7,
        wastePercent: 3,
        customExpenses: [],
      },
      sellingPrice: 112,
      targetMargin: 0.35,
      isActive: true,
      updatedAt: '2026-11-19',
    },
  ];

  const bakeryInventory: InventoryItem[] = [
    { id: 'inv-1', name: 'Belgian Dark Chocolate 70%', category: 'raw_material', unit: 'g', availableQty: 2400, reservedQty: 320, purchasePricePerUnit: 0.08, supplier: 'Riyadh Pastry Supply', reorderLevel: 1500, lastUpdated: '2026-11-22' },
    { id: 'inv-2', name: 'Cultured European Butter', category: 'raw_material', unit: 'g', availableQty: 950, reservedQty: 180, purchasePricePerUnit: 0.05, supplier: 'Fresh Dairy Co.', reorderLevel: 1200, lastUpdated: '2026-11-23' },
    { id: 'inv-3', name: 'Organic Pastry Flour', category: 'raw_material', unit: 'g', availableQty: 4800, reservedQty: 480, purchasePricePerUnit: 0.008, supplier: 'Al-Qassim Mills', reorderLevel: 2000, lastUpdated: '2026-11-20' },
    { id: 'inv-4', name: 'Kraft Bakery Gift Boxes', category: 'packaging', unit: 'pcs', availableQty: 14, reservedQty: 4, purchasePricePerUnit: 5, supplier: 'PackCraft KSA', reorderLevel: 20, lastUpdated: '2026-11-22' },
    { id: 'inv-5', name: 'Sidr Blossom Honey', category: 'raw_material', unit: 'g', availableQty: 850, reservedQty: 100, purchasePricePerUnit: 0.13, supplier: 'Mountain Apiary', reorderLevel: 500, lastUpdated: '2026-11-18' },
    { id: 'inv-6', name: 'Roasted Green Pistachio Flour', category: 'raw_material', unit: 'g', availableQty: 620, reservedQty: 190, purchasePricePerUnit: 0.135, supplier: 'Riyadh Pastry Supply', reorderLevel: 700, lastUpdated: '2026-11-21' },
  ];

  const businessProfile: BusinessProfile = {
    id: 'biz-bakery',
    name: 'Bloom & Crumb Handmade Bakery',
    type: businessType,
    country: 'Saudi Arabia',
    currency: 'SAR',
    language: 'en',
    description: 'Home-based artisan chocolate cookie boxes, cardamom loaves, and boutique event trays.',
    startDate: '2025-08-15',
    initialBudget: 15000,
    fixedMonthlyExpenses: 1250,
    variableMonthlyExpenses: 850,
    defaultLaborRatePerHour: 30,
    defaultPackagingCost: 5,
    defaultDeliveryCost: 20,
    desiredProfitMargin: 0.35,
    vatRate: 0.15,
    paymentFeeRate: 0.025,
    channelFeeRate: 0,
    requirements: {
      kitchenSetup: 'Home certified kitchen',
      orderLeadTime: '24 hours advance notice',
      allergenTracking: true,
    },
  };

  return buildDatasetForBusiness(businessProfile, bakeryProducts, bakeryInventory, baseCustomers, baseTeam);
}

function buildDatasetForBusiness(
  business: BusinessProfile,
  products: Product[],
  inventory: InventoryItem[],
  customers: Customer[],
  team: TeamMember[]
): DemoDataset {
  const p0 = products[0];
  const p1 = products[1] ?? products[0];
  const p2 = products[2] ?? products[0];

  const unitCost0 = estimateUnitCostQuick(p0);
  const unitCost1 = estimateUnitCostQuick(p1);
  const unitCost2 = estimateUnitCostQuick(p2);

  const orders: Order[] = [
    {
      id: 'ord-1',
      orderNumber: 'ORD-1041',
      customerId: customers[0].id,
      customerName: customers[0].name,
      customerPhone: customers[0].phone,
      items: [
        { productId: p0.id, productName: p0.name, quantity: 6, unitPrice: p0.sellingPrice, unitCost: unitCost0 },
        { productId: p1.id, productName: p1.name, quantity: 2, unitPrice: p1.sellingPrice, unitCost: unitCost1 },
      ],
      discountAmount: 0,
      deliveryFee: 20,
      vatAmount: Number(((6 * p0.sellingPrice + 2 * p1.sellingPrice + 20) * business.vatRate).toFixed(2)),
      subtotal: 6 * p0.sellingPrice + 2 * p1.sellingPrice,
      totalPrice: Number(((6 * p0.sellingPrice + 2 * p1.sellingPrice + 20) * (1 + business.vatRate)).toFixed(2)),
      estimatedCost: Number((6 * unitCost0 + 2 * unitCost1).toFixed(2)),
      expectedProfit: Number(((6 * p0.sellingPrice + 2 * p1.sellingPrice) - (6 * unitCost0 + 2 * unitCost1)).toFixed(2)),
      paymentStatus: 'paid',
      paidAmount: Number(((6 * p0.sellingPrice + 2 * p1.sellingPrice + 20) * (1 + business.vatRate)).toFixed(2)),
      status: 'completed',
      inventoryDeducted: true,
      createdAt: '2026-11-04',
      source: 'manual',
    },
    {
      id: 'ord-2',
      orderNumber: 'ORD-1042',
      customerId: customers[1].id,
      customerName: customers[1].name,
      customerPhone: customers[1].phone,
      items: [{ productId: p2.id, productName: p2.name, quantity: 8, unitPrice: p2.sellingPrice, unitCost: unitCost2 }],
      discountAmount: 40,
      deliveryFee: 25,
      vatAmount: Number(((8 * p2.sellingPrice - 40 + 25) * business.vatRate).toFixed(2)),
      subtotal: 8 * p2.sellingPrice,
      totalPrice: Number(((8 * p2.sellingPrice - 40 + 25) * (1 + business.vatRate)).toFixed(2)),
      estimatedCost: Number((8 * unitCost2).toFixed(2)),
      expectedProfit: Number(((8 * p2.sellingPrice - 40) - 8 * unitCost2).toFixed(2)),
      paymentStatus: 'paid',
      paidAmount: Number(((8 * p2.sellingPrice - 40 + 25) * (1 + business.vatRate)).toFixed(2)),
      status: 'completed',
      inventoryDeducted: true,
      createdAt: '2026-11-11',
      source: 'manual',
    },
    {
      id: 'ord-3',
      orderNumber: 'ORD-1043',
      customerId: customers[2].id,
      customerName: customers[2].name,
      customerPhone: customers[2].phone,
      items: [{ productId: p0.id, productName: p0.name, quantity: 10, unitPrice: p0.sellingPrice, unitCost: unitCost0 }],
      discountAmount: 0,
      deliveryFee: 20,
      vatAmount: Number(((10 * p0.sellingPrice + 20) * business.vatRate).toFixed(2)),
      subtotal: 10 * p0.sellingPrice,
      totalPrice: Number(((10 * p0.sellingPrice + 20) * (1 + business.vatRate)).toFixed(2)),
      estimatedCost: Number((10 * unitCost0).toFixed(2)),
      expectedProfit: Number((10 * p0.sellingPrice - 10 * unitCost0).toFixed(2)),
      paymentStatus: 'partial',
      paidAmount: Number(((10 * p0.sellingPrice + 20) * 0.5).toFixed(2)),
      status: 'in_production',
      inventoryDeducted: false,
      notes: '50% deposit received; balance due on delivery.',
      createdAt: '2026-11-19',
      source: 'manual',
    },
    {
      id: 'ord-4',
      orderNumber: 'ORD-1044',
      customerId: customers[0].id,
      customerName: customers[0].name,
      customerPhone: customers[0].phone,
      items: [
        { productId: p0.id, productName: p0.name, quantity: 5, unitPrice: p0.sellingPrice, unitCost: unitCost0 },
        { productId: p2.id, productName: p2.name, quantity: 3, unitPrice: p2.sellingPrice, unitCost: unitCost2 },
      ],
      discountAmount: 0,
      deliveryFee: 20,
      vatAmount: Number(((5 * p0.sellingPrice + 3 * p2.sellingPrice + 20) * business.vatRate).toFixed(2)),
      subtotal: 5 * p0.sellingPrice + 3 * p2.sellingPrice,
      totalPrice: Number(((5 * p0.sellingPrice + 3 * p2.sellingPrice + 20) * (1 + business.vatRate)).toFixed(2)),
      estimatedCost: Number((5 * unitCost0 + 3 * unitCost2).toFixed(2)),
      expectedProfit: Number(((5 * p0.sellingPrice + 3 * p2.sellingPrice) - (5 * unitCost0 + 3 * unitCost2)).toFixed(2)),
      paymentStatus: 'paid',
      paidAmount: Number(((5 * p0.sellingPrice + 3 * p2.sellingPrice + 20) * (1 + business.vatRate)).toFixed(2)),
      status: 'completed',
      inventoryDeducted: true,
      createdAt: '2026-11-21',
      source: 'manual',
    },
    {
      id: 'ord-5',
      orderNumber: 'ORD-1045',
      customerId: customers[3].id,
      customerName: customers[3].name,
      customerPhone: customers[3].phone,
      items: [{ productId: p1.id, productName: p1.name, quantity: 4, unitPrice: p1.sellingPrice, unitCost: unitCost1 }],
      discountAmount: 0,
      deliveryFee: 20,
      vatAmount: Number(((4 * p1.sellingPrice + 20) * business.vatRate).toFixed(2)),
      subtotal: 4 * p1.sellingPrice,
      totalPrice: Number(((4 * p1.sellingPrice + 20) * (1 + business.vatRate)).toFixed(2)),
      estimatedCost: Number((4 * unitCost1).toFixed(2)),
      expectedProfit: Number((4 * p1.sellingPrice - 4 * unitCost1).toFixed(2)),
      paymentStatus: 'pending',
      paidAmount: 0,
      status: 'confirmed',
      inventoryDeducted: false,
      createdAt: '2026-11-23',
      source: 'manual',
    },
  ];

  const expenses: Expense[] = [
    { id: 'exp-1', title: 'Monthly Studio Utilities & Gas', category: 'utilities', amount: 280, date: '2026-11-03', paymentMethod: 'bank_transfer', notes: 'Electricity and kitchen/studio utilities' },
    { id: 'exp-2', title: 'Instagram Seasonal Promotion', category: 'marketing', amount: 350, date: '2026-11-08', paymentMethod: 'card', notes: 'Weekend reel campaign' },
    { id: 'exp-3', title: 'Kraft Boxes & Ribbons Restock', category: 'packaging', amount: 245, date: '2026-11-12', paymentMethod: 'bank_transfer', receiptName: 'packcraft_inv_884.pdf' },
    { id: 'exp-4', title: 'Local Courier Delivery Settlement', category: 'delivery', amount: 185, date: '2026-11-18', paymentMethod: 'cash' },
  ];

  const totalRevenue = orders.reduce((s, o) => s + o.subtotal - o.discountAmount + o.deliveryFee, 0);
  const totalCost = orders.reduce((s, o) => s + o.estimatedCost, 0) + expenses.reduce((s, e) => s + e.amount, 0);
  const netProfit = Math.max(0, totalRevenue - totalCost);

  const goals: BusinessGoal[] = [
    {
      id: 'goal-1',
      title: `Reach Monthly Net Profit of 5,000 ${business.currency}`,
      type: 'monthly_profit',
      targetValue: 5000,
      currentValue: Number(netProfit.toFixed(0)),
      unit: business.currency,
      deadline: '2026-11-30',
      createdAt: '2026-11-01',
    },
    {
      id: 'goal-2',
      title: 'Complete 30 Customer Orders This Month',
      type: 'order_count',
      targetValue: 30,
      currentValue: orders.filter((o) => o.status !== 'cancelled').length,
      unit: 'orders',
      deadline: '2026-11-30',
      createdAt: '2026-11-01',
    },
    {
      id: 'goal-3',
      title: 'Reduce Unit Production Cost by 10%',
      type: 'cost_reduction',
      targetValue: 10,
      currentValue: 6,
      unit: '%',
      deadline: '2026-12-15',
      createdAt: '2026-11-05',
    },
  ];

  const stockMovements: StockMovement[] = [
    {
      id: 'mov-1',
      inventoryItemId: inventory[0].id,
      itemName: inventory[0].name,
      changeQty: -640,
      unit: inventory[0].unit,
      type: 'order_fulfillment',
      reason: 'Fulfilled Order ORD-1041',
      orderNumber: 'ORD-1041',
      createdAt: '2026-11-04',
    },
    {
      id: 'mov-2',
      inventoryItemId: inventory[1].id,
      itemName: inventory[1].name,
      changeQty: 1500,
      unit: inventory[1].unit,
      type: 'restock',
      reason: 'Weekly supplier delivery',
      createdAt: '2026-11-12',
    },
  ];

  const lowItems = inventory.filter((i) => i.availableQty <= i.reorderLevel);

  const notifications: AppNotification[] = [
    {
      id: 'notif-1',
      type: 'new_order',
      title: 'New Order Confirmed · ORD-1045',
      message: `${customers[3].name} placed a new order awaiting payment.`,
      createdAt: '2026-11-23 14:20',
      read: false,
      targetSection: 'orders',
    },
    ...(lowItems.length > 0
      ? [
          {
            id: 'notif-2',
            type: 'low_inventory' as const,
            title: `Low Stock Alert (${lowItems.length} items)`,
            message: `${lowItems.map((i) => i.name).join(', ')} dropped below reorder level.`,
            createdAt: '2026-11-23 09:15',
            read: false,
            targetSection: 'inventory' as const,
          },
        ]
      : []),
    {
      id: 'notif-3',
      type: 'pending_payment',
      title: 'Pending Balance Follow-up',
      message: `${customers[2].name} has an open balance on ORD-1043.`,
      createdAt: '2026-11-22 17:40',
      read: true,
      targetSection: 'customers',
    },
  ];

  const activities: ActivityEvent[] = [
    { id: 'act-1', title: 'Order ORD-1045 confirmed', subtitle: `${customers[3].name} · Payment pending`, timestamp: 'Today, 2:20 PM', category: 'order' },
    { id: 'act-2', title: 'Order ORD-1044 completed', subtitle: 'Inventory materials automatically deducted', timestamp: 'Nov 21, 5:10 PM', category: 'inventory' },
    { id: 'act-3', title: 'Expense recorded', subtitle: 'Local Courier Delivery Settlement', timestamp: 'Nov 18, 1:05 PM', category: 'expense' },
    { id: 'act-4', title: 'Pricing updated', subtitle: `${p0.name} saved at ${p0.sellingPrice} ${business.currency}`, timestamp: 'Nov 16, 11:30 AM', category: 'product' },
  ];

  return {
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
}

function estimateUnitCostQuick(product: Product): number {
  const mat = product.materials.reduce((sum, m) => {
    const factor =
      m.purchaseUnit === 'kg' && m.usedUnit === 'g'
        ? 1000
        : m.purchaseUnit === 'L' && m.usedUnit === 'ml'
        ? 1000
        : 1;
    const denom = m.purchasedQty * factor;
    return sum + (denom > 0 ? (m.purchasePrice / denom) * m.usedQty : 0);
  }, 0);
  const add = product.additionalCosts;
  const labor = add.flatLaborCost + add.laborHours * add.hourlyLaborRate;
  const waste = mat * (add.wastePercent / 100);
  const total = mat + waste + add.packaging + add.electricityAndGas + labor + add.delivery + add.overhead;
  return Number((total / Math.max(1, product.unitsPerBatch)).toFixed(2));
}
