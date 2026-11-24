import { BusinessType, Language, OrderStatus, PaymentStatus } from '../types/business';

export const BUSINESS_TYPE_META: Record<
  BusinessType,
  {
    en: { title: string; subtitle: string; materialLabel: string; unitPlaceholder: string };
    ar: { title: string; subtitle: string; materialLabel: string; unitPlaceholder: string };
    defaultUnit: string;
  }
> = {
  food_bakery: {
    en: {
      title: 'Food & Bakery',
      subtitle: 'Recipes, ingredients, batch yield, and oven overhead',
      materialLabel: 'Recipe Ingredients',
      unitPlaceholder: 'box / tray / piece',
    },
    ar: {
      title: 'المأكولات والمخبوزات',
      subtitle: 'إدارة الوصفات والمكونات وإنتاجية الدفعة وتكاليف التشغيل',
      materialLabel: 'مكونات الوصفة',
      unitPlaceholder: 'علبة / صينية / قطعة',
    },
    defaultUnit: 'box',
  },
  clothing_fashion: {
    en: {
      title: 'Clothing & Fashion',
      subtitle: 'Fabrics, sewing notions, tailoring labor, and garment sizing',
      materialLabel: 'Fabrics & Sewing Accessories',
      unitPlaceholder: 'garment / piece',
    },
    ar: {
      title: 'الملابس والأزياء',
      subtitle: 'حاسبة الأقمشة وإكسسوارات الخياطة وتكلفة التفصيل',
      materialLabel: 'الأقمشة وإكسسوارات الخياطة',
      unitPlaceholder: 'قطعة / فستان / عباية',
    },
    defaultUnit: 'piece',
  },
  handmade: {
    en: {
      title: 'Handmade Products',
      subtitle: 'Resin, wood crafts, custom gifts, and hourly studio labor',
      materialLabel: 'Craft Materials & Supplies',
      unitPlaceholder: 'piece / set',
    },
    ar: {
      title: 'المنتجات اليدوية',
      subtitle: 'الريزن والحرف الخشبية والهدايا المخصصة وساعات العمل',
      materialLabel: 'المواد والخامات الحرفية',
      unitPlaceholder: 'قطعة / طقم',
    },
    defaultUnit: 'piece',
  },
  crochet_knitting: {
    en: {
      title: 'Crochet & Knitting',
      subtitle: 'Skein weight, yarn usage, colorwork, and reusable patterns',
      materialLabel: 'Yarns & Craft Accessories',
      unitPlaceholder: 'piece / tote / blanket',
    },
    ar: {
      title: 'الكروشيه والحياكة',
      subtitle: 'حاسبة الخيوط ووزن الشلة وساعات الحياكة وحفظ الباترونات',
      materialLabel: 'الخيوط وإكسسوارات الحياكة',
      unitPlaceholder: 'قطعة / حقيبة',
    },
    defaultUnit: 'piece',
  },
  candles_fragrances: {
    en: {
      title: 'Candles & Fragrances',
      subtitle: 'Wax, fragrance oil ratios, wicks, jars, and batch costing',
      materialLabel: 'Wax, Fragrance Oils & Jars',
      unitPlaceholder: 'jar / candle',
    },
    ar: {
      title: 'الشموع والعطور المنزلية',
      subtitle: 'حاسبة الشمع والزيوت العطرية والفتيل والعبوات للدفعات',
      materialLabel: 'الشمع والزيوت العطرية والعبوات',
      unitPlaceholder: 'شمعة / عبوة',
    },
    defaultUnit: 'jar',
  },
  beauty_skincare: {
    en: {
      title: 'Beauty & Skincare',
      subtitle: 'Active botanicals, batch formulation, jars, and labeling',
      materialLabel: 'Formulation Ingredients & Packaging',
      unitPlaceholder: 'bottle / jar',
    },
    ar: {
      title: 'التجميل والعناية بالبشرة',
      subtitle: 'مكونات التركيبة وتكلفة العبوات والملصقات وتكلفة الدفعة',
      materialLabel: 'مكونات التركيبة والتغليف',
      unitPlaceholder: 'عبوة / زجاجة',
    },
    defaultUnit: 'jar',
  },
  other: {
    en: {
      title: 'Other Small Business',
      subtitle: 'Flexible materials, labor, and custom overhead builder',
      materialLabel: 'Custom Materials & Inputs',
      unitPlaceholder: 'unit / item',
    },
    ar: {
      title: 'نشاط تجاري مخصص',
      subtitle: 'حاسبة مرنة للمواد وساعات العمل والمصاريف التشغيلية',
      materialLabel: 'المواد والمدخلات المخصصة',
      unitPlaceholder: 'وحدة / منتج',
    },
    defaultUnit: 'unit',
  },
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, { en: string; ar: string }> = {
  new: { en: 'New', ar: 'جديد' },
  confirmed: { en: 'Confirmed', ar: 'مؤكد' },
  in_production: { en: 'In Production', ar: 'قيد التحضير' },
  ready: { en: 'Ready', ar: 'جاهز' },
  shipped: { en: 'Shipped', ar: 'تم الشحن' },
  completed: { en: 'Completed', ar: 'مكتمل' },
  cancelled: { en: 'Cancelled', ar: 'ملغي' },
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, { en: string; ar: string }> = {
  paid: { en: 'Paid', ar: 'مدفوع' },
  pending: { en: 'Pending', ar: 'معلق' },
  partial: { en: 'Partial', ar: 'جزئي' },
};

export function getT(lang: Language) {
  const isAr = lang === 'ar';
  return {
    appTitle: 'Bizwise',
    demoMode: isAr ? 'بيانات تجريبية' : 'Sample Data',
    liveMode: isAr ? 'متصل' : 'Live Sync',
    nav: {
      dashboard: isAr ? 'لوحة التحكم' : 'Dashboard',
      orders: isAr ? 'الطلبات' : 'Orders',
      products: isAr ? 'المنتجات' : 'Products',
      inventory: isAr ? 'المخزون' : 'Inventory',
      customers: isAr ? 'العملاء' : 'Customers',
      expenses: isAr ? 'المصروفات' : 'Expenses',
      finance: isAr ? 'الملخص المالي' : 'Financial Overview',
      pricing: isAr ? 'حاسبة التسعير' : 'Pricing Helper',
      goals: isAr ? 'أهداف العمل' : 'Business Goals',
      reports: isAr ? 'التقارير' : 'Reports',
      advisor: isAr ? 'مساعد الأعمال' : 'Business Advisor',
      settings: isAr ? 'الإعدادات' : 'Settings',
    },
    topbar: {
      notifications: isAr ? 'الإشعارات' : 'Notifications',
      setupWizard: isAr ? 'إعداد النشاط' : 'Business Setup',
      account: isAr ? 'الحساب' : 'Account',
      askAdvisor: isAr ? 'مساعد الأعمال' : 'Business Advisor',
    },
    dashboard: {
      financialOverview: isAr ? 'ملخص الأداء' : 'Business Overview',
      businessOverview: isAr ? 'نظرة سريعة' : 'At a Glance',
      totalSales: isAr ? 'إجمالي الإيرادات' : 'Total Revenue',
      totalExpenses: isAr ? 'إجمالي المصروفات' : 'Total Expenses',
      netProfit: isAr ? 'صافي الربح' : 'Net Profit',
      profitMargin: isAr ? 'هامش الربح' : 'Profit Margin',
      pendingPayments: isAr ? 'مدفوعات قيد الانتظار' : 'Pending Payments',
      totalOrders: isAr ? 'إجمالي الطلبات' : 'Total Orders',
      completedOrders: isAr ? 'طلبات مكتملة' : 'Completed Orders',
      pendingOrders: isAr ? 'طلبات قيد الانتظار' : 'Pending Orders',
      activeProducts: isAr ? 'منتجات متاحة' : 'Active Products',
      lowStockItems: isAr ? 'تنبيهات المخزون' : 'Stock Alerts',
      revenueVsExpenses: isAr ? 'أداء الإيرادات والمصروفات' : 'Business Performance',
      salesByProduct: isAr ? 'المبيعات حسب المنتج' : 'Sales by Product',
      bestSelling: isAr ? 'الأكثر مبيعاً' : 'Top Products',
      goalProgress: isAr ? 'هدف العمل' : 'Business Goal',
      recentActivity: isAr ? 'أحدث الطلبات' : 'Recent Orders',
      quickActions: isAr ? 'إجراءات سريعة' : 'Quick Actions',
      addProduct: isAr ? 'إضافة منتج' : 'Add Product',
      addOrder: isAr ? 'إضافة طلب جديد' : 'Add New Order',
      recordExpense: isAr ? 'تسجيل مصروف' : 'Record Expense',
      addCustomer: isAr ? 'إضافة عميل' : 'Add Customer',
      checkInventory: isAr ? 'تحديث المخزون' : 'Update Stock',
      calcCost: isAr ? 'حاسبة التسعير' : 'Pricing Helper',
      askAi: isAr ? 'اسأل المساعد' : 'Ask Assistant',
    },
    common: {
      save: isAr ? 'حفظ' : 'Save',
      cancel: isAr ? 'إلغاء' : 'Cancel',
      delete: isAr ? 'حذف' : 'Delete',
      edit: isAr ? 'تعديل' : 'Edit',
      add: isAr ? 'إضافة' : 'Add',
      search: isAr ? 'بحث...' : 'Search...',
      filter: isAr ? 'تصفية' : 'Filter',
      all: isAr ? 'الكل' : 'All',
      exportCsv: isAr ? 'تصدير CSV' : 'Export CSV',
      loading: isAr ? 'جاري التنفيذ...' : 'Processing...',
      noData: isAr ? 'لا توجد بيانات بعد' : 'No data available yet',
      target: isAr ? 'الهدف' : 'Target',
      current: isAr ? 'الحالي' : 'Current',
      remaining: isAr ? 'المتبقي' : 'Remaining',
      completed: isAr ? 'المكتمل' : 'Completed',
      estCompletion: isAr ? 'التاريخ المتوقع للإنجاز' : 'Estimated Completion',
      confirm: isAr ? 'تأكيد وتنفيذ' : 'Confirm & Execute',
      dismiss: isAr ? 'تجاهل' : 'Dismiss',
    },
    explainers: {
      marginVsMarkup: isAr
        ? 'هامش الربح هو نسبة الربح من سعر البيع، بينما الزيادة (Markup) هي نسبة الربح من التكلفة. نستخدم صيغة الهامش لضمان تحقيق الربح المستهدف بدقة.'
        : 'Profit Margin is profit divided by selling price, while Markup is profit divided by cost. A 25% markup equals only a 20% profit margin. Our pricing formula uses Margin so you always keep your target share of each sale.',
      vatNote: isAr
        ? 'ضريبة القيمة المضافة المحصلة من العملاء ليست إيراداً للعمل، بل التزام يتم توريده للجهة الضريبية.'
        : 'VAT collected from customers is a tax liability—not business revenue. We always separate it from your sales and profit calculations.',
      cashVsProfit: isAr
        ? 'التدفق النقدي يقيس الأموال الفعلية الداخلة والخارجة من حسابك الآن (بما يشمل الفواتير غير المحصلة)، بينما الربح المحاسبي يقيس المبيعات مطروحاً منها تكلفة البضاعة والمصاريف.'
        : 'Cash Flow tracks real money entering and leaving your bank/cash box right now (affected by unpaid customer invoices), whereas Accounting Profit measures earned revenue minus product costs and expenses.',
    },
  };
}
