import React, { useMemo, useState } from 'react';
import {
  BookmarkCheck,
  Calculator,
  Edit3,
  HelpCircle,
  Image as ImageIcon,
  Plus,
  Save,
  Trash2,
  Upload,
} from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import { BUSINESS_TYPE_META, getT } from '../i18n/translations';
import {
  MeasurementUnit,
  Product,
  ProductMaterialItem,
} from '../types/business';
import {
  calculateMaterialLineCost,
  calculateProductCosts,
  evaluatePricingScenario,
  formatCurrency,
} from '../utils/calculations';

const MARGIN_LEVELS = [0.15, 0.2, 0.25, 0.3, 0.4, 0.5];

const UNITS: MeasurementUnit[] = ['g', 'kg', 'ml', 'L', 'm', 'cm', 'yd', 'pcs', 'skein', 'hr'];

function createEmptyProduct(businessType: Product['businessType'], defaultRate: number, defaultPkg: number): Product {
  const defaultUnit = BUSINESS_TYPE_META[businessType].defaultUnit;
  const starterMat: ProductMaterialItem =
    businessType === 'food_bakery'
      ? { id: `m-${Date.now()}`, name: 'Dark Chocolate', materialKind: 'ingredient', purchasedQty: 1, purchaseUnit: 'kg', purchasePrice: 80, usedQty: 160, usedUnit: 'g' }
      : businessType === 'clothing_fashion'
      ? { id: `m-${Date.now()}`, name: 'Linen Fabric', materialKind: 'fabric', purchasedQty: 5, purchaseUnit: 'm', purchasePrice: 300, usedQty: 2, usedUnit: 'm' }
      : businessType === 'crochet_knitting'
      ? { id: `m-${Date.now()}`, name: 'Cotton Yarn Skein', materialKind: 'yarn', brandOrType: 'Organic Cotton', purchasedQty: 100, purchaseUnit: 'g', purchasePrice: 22, usedQty: 250, usedUnit: 'g', colorCount: 2 }
      : businessType === 'candles_fragrances'
      ? { id: `m-${Date.now()}`, name: 'Soy Wax 464', materialKind: 'wax', purchasedQty: 1, purchaseUnit: 'kg', purchasePrice: 45, usedQty: 220, usedUnit: 'g' }
      : businessType === 'beauty_skincare'
      ? { id: `m-${Date.now()}`, name: 'Sweet Almond Carrier Oil', materialKind: 'ingredient', purchasedQty: 500, purchaseUnit: 'ml', purchasePrice: 90, usedQty: 80, usedUnit: 'ml' }
      : { id: `m-${Date.now()}`, name: 'Primary Craft Material', materialKind: 'custom', purchasedQty: 10, purchaseUnit: 'pcs', purchasePrice: 100, usedQty: 2, usedUnit: 'pcs' };

  return {
    id: `prod-${Date.now()}`,
    businessType,
    name: '',
    category: '',
    sellingUnit: defaultUnit,
    unitsPerBatch: 1,
    variantLabel: '',
    materials: [starterMat],
    additionalCosts: {
      packaging: defaultPkg,
      electricityAndGas: businessType === 'food_bakery' || businessType === 'candles_fragrances' ? 5 : 2,
      laborHours: 1,
      hourlyLaborRate: defaultRate,
      flatLaborCost: 0,
      delivery: 0,
      overhead: 4,
      wastePercent: 3,
      customExpenses: [],
    },
    sellingPrice: 0,
    targetMargin: 0.3,
    isActive: true,
    isPatternTemplate: false,
    updatedAt: new Date().toISOString().slice(0, 10),
  };
}

export function ProductsView() {
  const {
    language,
    business,
    products,
    inventory,
    saveProduct,
    deleteProduct,
    setActiveSection,
    pushToast,
    isBusy,
  } = useBusiness();

  const t = getT(language);
  const isAr = language === 'ar';

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);

  const savedPatternTemplates = useMemo(
    () => products.filter((p) => p.businessType === 'crochet_knitting' && p.isPatternTemplate),
    [products]
  );

  const openNewProduct = () => {
    setEditingProduct(
      createEmptyProduct(business.type, business.defaultLaborRatePerHour, business.defaultPackagingCost)
    );
    setShowBuilder(true);
  };

  const openEditProduct = (p: Product) => {
    setEditingProduct(JSON.parse(JSON.stringify(p)));
    setShowBuilder(true);
  };

  const loadPatternTemplate = (template: Product) => {
    const cloned: Product = {
      ...JSON.parse(JSON.stringify(template)),
      id: `prod-${Date.now()}`,
      name: `${template.name} (Copy)`,
      isPatternTemplate: false,
      updatedAt: new Date().toISOString().slice(0, 10),
    };
    setEditingProduct(cloned);
    setShowBuilder(true);
    pushToast('info', isAr ? 'تم تحميل قالب الباترون' : `Loaded pattern template "${template.name}"`);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingProduct) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setEditingProduct({ ...editingProduct, imageUrl: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };

  const activeCosts = useMemo(
    () => (editingProduct ? calculateProductCosts(editingProduct) : null),
    [editingProduct]
  );

  const pricingScenarios = useMemo(() => {
    if (!activeCosts) return [];
    return MARGIN_LEVELS.map((m) =>
      evaluatePricingScenario(activeCosts.costPerUnit, m, {
        vatRate: business.vatRate,
        discountRate: 0,
        paymentFeeRate: business.paymentFeeRate,
        channelFeeRate: business.channelFeeRate,
      })
    );
  }, [activeCosts, business.vatRate, business.paymentFeeRate, business.channelFeeRate]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (!editingProduct.name.trim()) {
      pushToast('error', isAr ? 'يرجى إدخال اسم المنتج' : 'Please enter a product name.');
      return;
    }
    const cost = calculateProductCosts(editingProduct).costPerUnit;
    const finalSellingPrice =
      editingProduct.sellingPrice > 0
        ? editingProduct.sellingPrice
        : Number(
            evaluatePricingScenario(cost, editingProduct.targetMargin, {
              vatRate: business.vatRate,
              discountRate: 0,
              paymentFeeRate: business.paymentFeeRate,
              channelFeeRate: business.channelFeeRate,
            }).suggestedPriceExclVat.toFixed(2)
          );

    const ok = await saveProduct({
      ...editingProduct,
      sellingPrice: finalSellingPrice,
      updatedAt: new Date().toISOString().slice(0, 10),
    });
    if (ok) {
      setShowBuilder(false);
      setEditingProduct(null);
    }
  };

  const addMaterialRow = (kind: ProductMaterialItem['materialKind'] = 'custom') => {
    if (!editingProduct) return;
    const defaultUnit: MeasurementUnit =
      kind === 'fabric'
        ? 'm'
        : kind === 'fragrance'
        ? 'ml'
        : kind === 'container' || kind === 'accessory' || kind === 'packaging'
        ? 'pcs'
        : 'g';

    setEditingProduct({
      ...editingProduct,
      materials: [
        ...editingProduct.materials,
        {
          id: `mat-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          name: '',
          materialKind: kind,
          purchasedQty: 1,
          purchaseUnit: defaultUnit === 'g' ? 'kg' : defaultUnit,
          purchasePrice: 0,
          usedQty: 1,
          usedUnit: defaultUnit,
        },
      ],
    });
  };

  const updateMaterialRow = (id: string, patch: Partial<ProductMaterialItem>) => {
    if (!editingProduct) return;
    setEditingProduct({
      ...editingProduct,
      materials: editingProduct.materials.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    });
  };

  const removeMaterialRow = (id: string) => {
    if (!editingProduct) return;
    setEditingProduct({
      ...editingProduct,
      materials: editingProduct.materials.filter((m) => m.id !== id),
    });
  };

  const addCustomExpenseRow = () => {
    if (!editingProduct) return;
    setEditingProduct({
      ...editingProduct,
      additionalCosts: {
        ...editingProduct.additionalCosts,
        customExpenses: [
          ...(editingProduct.additionalCosts.customExpenses ?? []),
          { id: `ce-${Date.now()}`, label: '', amount: 0 },
        ],
      },
    });
  };

  const currentTypeMeta = BUSINESS_TYPE_META[business.type][language];

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[var(--blueprint)]">{currentTypeMeta.title}</p>
          <h2 className="text-xl font-bold text-[var(--ink-primary)]">
            {isAr ? 'المنتجات وحاسبة التكاليف الذكية' : 'Products & Dynamic Costing'}
          </h2>
          <p className="text-xs text-[var(--ink-secondary)] mt-0.5">{currentTypeMeta.subtitle}</p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setActiveSection('pricing')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface)] text-xs font-medium text-[var(--ink-primary)] hover:bg-[var(--surface-muted)] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Calculator className="w-3.5 h-3.5 text-[var(--blueprint)]" />
            <span>{t.nav.pricing}</span>
          </button>
          <button
            type="button"
            onClick={openNewProduct}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--blueprint)] text-white text-xs font-semibold hover:opacity-90 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? 'إضافة منتج وحساب تكلفته' : 'New Product & Cost Calculator'}</span>
          </button>
        </div>
      </div>

      {/* Crochet & Knitting Saved Pattern Templates Bar */}
      {business.type === 'crochet_knitting' && savedPatternTemplates.length > 0 && !showBuilder && (
        <div className="bg-[var(--surface)] border border-[var(--border-hairline)] rounded-xl p-4">
          <div className="text-xs font-semibold text-[var(--ink-primary)] mb-2.5 flex items-center gap-2">
            <BookmarkCheck className="w-4 h-4 text-[var(--positive)]" />
            <span>{isAr ? 'قوالب الباترونات المحفوظة (إعادة استخدام سريعة)' : 'Reusable Crochet & Knitting Pattern Templates'}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {savedPatternTemplates.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => loadPatternTemplate(tpl)}
                className="px-3 py-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--canvas)] hover:bg-[var(--blueprint-soft)] text-xs font-medium text-[var(--ink-primary)] cursor-pointer"
              >
                {tpl.name} · {tpl.materials.length} {isAr ? 'خيوط/خامات' : 'materials'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Dynamic Product & Cost Builder Form */}
      {showBuilder && editingProduct && activeCosts && (
        <form onSubmit={handleSave} className="bg-[var(--surface)] border border-[var(--border-hairline)] rounded-2xl p-5 sm:p-6 space-y-6">
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-[var(--border-hairline)]">
            <div>
              <span className="text-xs font-medium text-[var(--positive)]">{currentTypeMeta.title}</span>
              <h3 className="text-lg font-bold text-[var(--ink-primary)]">
                {editingProduct.name ? editingProduct.name : isAr ? 'منتج جديد وحاسبة التكلفة' : 'New Product Costing Sheet'}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowBuilder(false);
                setEditingProduct(null);
              }}
              className="px-3 py-1.5 rounded-lg border border-[var(--border-hairline)] text-xs font-medium text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] cursor-pointer"
            >
              {t.common.cancel}
            </button>
          </div>

          {/* Section 1: Core Product Metadata adapted to Business Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2">
              <label className="block text-xs font-medium text-[var(--ink-primary)] mb-1.5">
                {isAr ? 'اسم المنتج *' : 'Product Name *'}
              </label>
              <input
                type="text"
                value={editingProduct.name}
                onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                placeholder={
                  business.type === 'food_bakery'
                    ? 'e.g. Dark Chocolate Truffle Box'
                    : business.type === 'candles_fragrances'
                    ? 'e.g. Amber & Sage Soy Candle'
                    : business.type === 'crochet_knitting'
                    ? 'e.g. Sage Striped Cotton Tote'
                    : 'e.g. Custom Product Name'
                }
                className="w-full px-3.5 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--ink-primary)] mb-1.5">
                {business.type === 'clothing_fashion'
                  ? isAr
                    ? 'فئة الملابس'
                    : 'Clothing Category'
                  : isAr
                  ? 'التصنيف'
                  : 'Category'}
              </label>
              <input
                type="text"
                value={editingProduct.category}
                onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                placeholder={
                  business.type === 'handmade'
                    ? 'Resin / Wood / Gift'
                    : business.type === 'clothing_fashion'
                    ? 'Abaya / Dress / Jacket'
                    : 'Signature Collection'
                }
                className="w-full px-3.5 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--ink-primary)] mb-1.5">
                {isAr ? 'وحدة البيع' : 'Selling Unit'}
              </label>
              <input
                type="text"
                value={editingProduct.sellingUnit}
                onChange={(e) => setEditingProduct({ ...editingProduct, sellingUnit: e.target.value })}
                placeholder={currentTypeMeta.unitPlaceholder}
                className="w-full px-3.5 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--ink-primary)] mb-1.5">
                {business.type === 'food_bakery'
                  ? isAr
                    ? 'عدد الوحدات المنتجة من الوصفة'
                    : 'Units Produced per Recipe'
                  : isAr
                  ? 'عدد الوحدات في الدفعة'
                  : 'Units Produced per Batch'}
              </label>
              <input
                type="number"
                min={1}
                value={editingProduct.unitsPerBatch}
                onChange={(e) =>
                  setEditingProduct({ ...editingProduct, unitsPerBatch: Math.max(1, Number(e.target.value)) })
                }
                className="w-full px-3.5 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm font-num"
              />
            </div>

            {(business.type === 'candles_fragrances' || business.type === 'beauty_skincare') && (
              <div>
                <label className="block text-xs font-medium text-[var(--ink-primary)] mb-1.5">
                  {business.type === 'candles_fragrances'
                    ? isAr
                      ? 'الحجم وتنوع العطر'
                      : 'Candle Size & Scent Variation'
                    : isAr
                    ? 'حجم العبوة / المتغير'
                    : 'Size / Formula Variant'}
                </label>
                <input
                  type="text"
                  value={editingProduct.variantLabel ?? ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, variantLabel: e.target.value })}
                  placeholder={business.type === 'candles_fragrances' ? '8 oz Amber Jar · Oud & Fig' : '50 ml Glass Dropper'}
                  className="w-full px-3.5 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm"
                />
              </div>
            )}

            <div className="sm:col-span-2 flex items-end gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-[var(--ink-primary)] mb-1.5">
                  {isAr ? 'صورة المنتج (اختياري)' : 'Product Image (Optional)'}
                </label>
                <label className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg border border-dashed border-[var(--border-hairline)] bg-[var(--canvas)] text-xs font-medium text-[var(--ink-primary)] hover:bg-[var(--surface-muted)] cursor-pointer">
                  <Upload className="w-3.5 h-3.5 text-[var(--blueprint)]" />
                  <span>{isAr ? 'رفع صورة المنتج' : 'Upload Product Photo'}</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>

              {business.type === 'crochet_knitting' && (
                <label className="flex items-center gap-2 pb-2 text-xs font-medium text-[var(--ink-primary)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editingProduct.isPatternTemplate)}
                    onChange={(e) => setEditingProduct({ ...editingProduct, isPatternTemplate: e.target.checked })}
                  />
                  <span>{isAr ? 'حفظ كقالب باترون متكرر' : 'Save as reusable pattern'}</span>
                </label>
              )}
            </div>
          </div>

          {/* Section 2: Business-Specific Materials / Recipe / Fabric / Yarn / Wax Table */}
          <div className="border-t border-[var(--border-hairline)] pt-5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div>
                <h4 className="text-sm font-semibold text-[var(--ink-primary)]">{currentTypeMeta.materialLabel}</h4>
                <p className="text-[11px] text-[var(--ink-secondary)]">
                  {isAr
                    ? 'أدخل كمية الشراء وسعرها، ثم الكمية المستخدمة في الوصفة أو القطعة (يتم تحويل الوحدات مثل kg إلى g تلقائياً).'
                    : 'Enter purchased package quantity & price, then quantity used in the batch/item (kg↔g and L↔ml convert automatically).'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {business.type === 'clothing_fashion' && (
                  <>
                    <button
                      type="button"
                      onClick={() => addMaterialRow('fabric')}
                      className="px-3 py-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-xs font-medium hover:bg-[var(--surface-muted)] cursor-pointer"
                    >
                      + {isAr ? 'إضافة قماش' : 'Add Fabric'}
                    </button>
                    <button
                      type="button"
                      onClick={() => addMaterialRow('accessory')}
                      className="px-3 py-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-xs font-medium hover:bg-[var(--surface-muted)] cursor-pointer"
                    >
                      + {isAr ? 'أزرار / سحاب / خيوط' : 'Add Buttons / Zippers'}
                    </button>
                  </>
                )}
                {business.type === 'candles_fragrances' && (
                  <>
                    <button
                      type="button"
                      onClick={() => addMaterialRow('wax')}
                      className="px-3 py-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-xs font-medium hover:bg-[var(--surface-muted)] cursor-pointer"
                    >
                      + {isAr ? 'إضافة شمع' : 'Add Wax'}
                    </button>
                    <button
                      type="button"
                      onClick={() => addMaterialRow('fragrance')}
                      className="px-3 py-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-xs font-medium hover:bg-[var(--surface-muted)] cursor-pointer"
                    >
                      + {isAr ? 'إضافة زيت عطري' : 'Add Fragrance Oil'}
                    </button>
                    <button
                      type="button"
                      onClick={() => addMaterialRow('container')}
                      className="px-3 py-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-xs font-medium hover:bg-[var(--surface-muted)] cursor-pointer"
                    >
                      + {isAr ? 'إضافة عبوة / فتيل' : 'Add Jar / Wick'}
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => addMaterialRow('custom')}
                  className="px-3 py-1.5 rounded-lg bg-[var(--surface-muted)] text-xs font-medium text-[var(--ink-primary)] hover:bg-[var(--surface-muted)] cursor-pointer"
                >
                  + {isAr ? 'إضافة مادة / مكون' : 'Add Material Row'}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border border-[var(--border-hairline)] rounded-xl bg-[var(--surface-muted)]">
              <table className="w-full text-xs text-start">
                <thead className="bg-[var(--canvas)] text-[var(--ink-secondary)] border-b border-[var(--border-hairline)]">
                  <tr>
                    <th className="py-2.5 px-3 font-medium">
                      {business.type === 'food_bakery'
                        ? isAr
                          ? 'المكون (أو من المخزون)'
                          : 'Ingredient'
                        : business.type === 'crochet_knitting'
                        ? isAr
                          ? 'نوع الخيط والعلامة'
                          : 'Yarn Type / Brand'
                        : isAr
                        ? 'اسم المادة'
                        : 'Material / Component'}
                    </th>
                    {business.type === 'crochet_knitting' && (
                      <th className="py-2.5 px-2 font-medium">{isAr ? 'الألوان' : 'Colors'}</th>
                    )}
                    <th className="py-2.5 px-2 font-medium">
                      {business.type === 'crochet_knitting'
                        ? isAr
                          ? 'وزن الشلة'
                          : 'Skein Wt'
                        : isAr
                        ? 'كمية الشراء'
                        : 'Purchased Qty'}
                    </th>
                    <th className="py-2.5 px-2 font-medium">{isAr ? 'وحدة الشراء' : 'Unit'}</th>
                    <th className="py-2.5 px-2 font-medium">
                      {business.type === 'crochet_knitting'
                        ? isAr
                          ? 'سعر الشلة'
                          : 'Skein Price'
                        : isAr
                        ? `سعر الشراء (${business.currency})`
                        : `Purchase Price`}
                    </th>
                    <th className="py-2.5 px-2 font-medium">{isAr ? 'المستخدم' : 'Used Qty'}</th>
                    <th className="py-2.5 px-2 font-medium">{isAr ? 'وحدة الاستخدام' : 'Unit'}</th>
                    <th className="py-2.5 px-3 font-medium text-end">{isAr ? 'التكلفة المحسوبة' : 'Line Cost'}</th>
                    <th className="py-2.5 px-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-hairline)]">
                  {editingProduct.materials.map((mat) => {
                    const lineCost = calculateMaterialLineCost(mat);
                    return (
                      <tr key={mat.id} className="hover:bg-[var(--surface-muted)]/60">
                        <td className="p-2 min-w-[180px]">
                          <input
                            type="text"
                            value={mat.name}
                            list="inventory-suggestions"
                            onChange={(e) => {
                              const val = e.target.value;
                              const invMatch = inventory.find((i) => i.name === val);
                              if (invMatch) {
                                updateMaterialRow(mat.id, {
                                  name: val,
                                  inventoryItemId: invMatch.id,
                                  purchasedQty: 1,
                                  purchaseUnit: invMatch.unit,
                                  purchasePrice: invMatch.purchasePricePerUnit,
                                  usedUnit: invMatch.unit,
                                });
                              } else {
                                updateMaterialRow(mat.id, { name: val });
                              }
                            }}
                            placeholder={isAr ? 'اكتب أو اختر من المخزون' : 'Material name'}
                            className="w-full px-2.5 py-1.5 rounded border border-[var(--border-hairline)] text-xs"
                          />
                        </td>
                        {business.type === 'crochet_knitting' && (
                          <td className="p-2 w-16">
                            <input
                              type="number"
                              min={1}
                              value={mat.colorCount ?? 1}
                              onChange={(e) => updateMaterialRow(mat.id, { colorCount: Number(e.target.value) })}
                              className="w-full px-2 py-1.5 rounded border border-[var(--border-hairline)] text-xs font-num"
                            />
                          </td>
                        )}
                        <td className="p-2 w-24">
                          <input
                            type="number"
                            min={0.01}
                            step="any"
                            value={mat.purchasedQty}
                            onChange={(e) => updateMaterialRow(mat.id, { purchasedQty: Number(e.target.value) })}
                            className="w-full px-2 py-1.5 rounded border border-[var(--border-hairline)] text-xs font-num"
                          />
                        </td>
                        <td className="p-2 w-20">
                          <select
                            value={mat.purchaseUnit}
                            onChange={(e) =>
                              updateMaterialRow(mat.id, { purchaseUnit: e.target.value as MeasurementUnit })
                            }
                            className="w-full px-1.5 py-1.5 rounded border border-[var(--border-hairline)] text-xs bg-[var(--surface-muted)]"
                          >
                            {UNITS.map((u) => (
                              <option key={u} value={u}>
                                {u}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2 w-24">
                          <input
                            type="number"
                            min={0}
                            step="any"
                            value={mat.purchasePrice}
                            onChange={(e) => updateMaterialRow(mat.id, { purchasePrice: Number(e.target.value) })}
                            className="w-full px-2 py-1.5 rounded border border-[var(--border-hairline)] text-xs font-num"
                          />
                        </td>
                        <td className="p-2 w-24">
                          <input
                            type="number"
                            min={0}
                            step="any"
                            value={mat.usedQty}
                            onChange={(e) => updateMaterialRow(mat.id, { usedQty: Number(e.target.value) })}
                            className="w-full px-2 py-1.5 rounded border border-[var(--border-hairline)] text-xs font-num"
                          />
                        </td>
                        <td className="p-2 w-20">
                          <select
                            value={mat.usedUnit}
                            onChange={(e) =>
                              updateMaterialRow(mat.id, { usedUnit: e.target.value as MeasurementUnit })
                            }
                            className="w-full px-1.5 py-1.5 rounded border border-[var(--border-hairline)] text-xs bg-[var(--surface-muted)]"
                          >
                            {UNITS.map((u) => (
                              <option key={u} value={u}>
                                {u}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2 px-3 text-end font-num font-semibold text-[var(--ink-primary)] whitespace-nowrap">
                          {formatCurrency(lineCost, business.currency, language)}
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeMaterialRow(mat.id)}
                            className="p-1 text-[var(--ink-secondary)] hover:text-[var(--danger)] cursor-pointer"
                            aria-label="Remove material"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <datalist id="inventory-suggestions">
                {inventory.map((inv) => (
                  <option key={inv.id} value={inv.name} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Section 3: Additional Costs (Packaging, Energy, Labor, Delivery, Waste, Custom) */}
          <div className="border-t border-[var(--border-hairline)] pt-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-[var(--ink-primary)]">
                {isAr ? 'التكاليف الإضافية والعمل والهدر (لكل دفعة)' : 'Additional Production Costs (Per Batch)'}
              </h4>
              <button
                type="button"
                onClick={addCustomExpenseRow}
                className="text-xs font-medium text-[var(--positive)] hover:underline cursor-pointer"
              >
                + {isAr ? 'إضافة مصروف مخصص' : 'Add Custom Expense'}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-[var(--ink-secondary)] mb-1">
                  {business.type === 'beauty_skincare' || business.type === 'candles_fragrances'
                    ? isAr
                      ? 'الملصقات والتغليف'
                      : 'Labels & Packaging'
                    : isAr
                    ? 'التغليف'
                    : 'Packaging'}
                </label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={editingProduct.additionalCosts.packaging}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      additionalCosts: { ...editingProduct.additionalCosts, packaging: Number(e.target.value) },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-xs font-num"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[var(--ink-secondary)] mb-1">
                  {isAr ? 'الكهرباء والغاز' : 'Electricity & Gas'}
                </label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={editingProduct.additionalCosts.electricityAndGas}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      additionalCosts: { ...editingProduct.additionalCosts, electricityAndGas: Number(e.target.value) },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-xs font-num"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[var(--ink-secondary)] mb-1">
                  {isAr ? 'ساعات العمل' : 'Labor Hours'}
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.25"
                  value={editingProduct.additionalCosts.laborHours}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      additionalCosts: { ...editingProduct.additionalCosts, laborHours: Number(e.target.value) },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-xs font-num"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[var(--ink-secondary)] mb-1">
                  {isAr ? 'أجر الساعة' : 'Hourly Rate'}
                </label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={editingProduct.additionalCosts.hourlyLaborRate}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      additionalCosts: { ...editingProduct.additionalCosts, hourlyLaborRate: Number(e.target.value) },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-xs font-num"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[var(--ink-secondary)] mb-1">
                  {business.type === 'clothing_fashion'
                    ? isAr
                      ? 'تكلفة الخياطة الثابتة'
                      : 'Tailoring Fee (Flat)'
                    : isAr
                    ? 'عمل ثابت / إضافي'
                    : 'Flat Labor / Overhead'}
                </label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={editingProduct.additionalCosts.flatLaborCost}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      additionalCosts: { ...editingProduct.additionalCosts, flatLaborCost: Number(e.target.value) },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-xs font-num"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[var(--ink-secondary)] mb-1">
                  {isAr ? 'نسبة الهدر (%)' : 'Production Waste (%)'}
                </label>
                <input
                  type="number"
                  min={0}
                  max={50}
                  step="0.5"
                  value={editingProduct.additionalCosts.wastePercent}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      additionalCosts: { ...editingProduct.additionalCosts, wastePercent: Number(e.target.value) },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-xs font-num"
                />
              </div>
            </div>

            {(editingProduct.additionalCosts.customExpenses ?? []).length > 0 && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {editingProduct.additionalCosts.customExpenses.map((ce) => (
                  <div key={ce.id} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={ce.label}
                      placeholder={isAr ? 'اسم المصروف (مثال: توصيل)' : 'Expense label'}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          additionalCosts: {
                            ...editingProduct.additionalCosts,
                            customExpenses: editingProduct.additionalCosts.customExpenses.map((x) =>
                              x.id === ce.id ? { ...x, label: e.target.value } : x
                            ),
                          },
                        })
                      }
                      className="flex-1 px-3 py-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-xs"
                    />
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={ce.amount}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          additionalCosts: {
                            ...editingProduct.additionalCosts,
                            customExpenses: editingProduct.additionalCosts.customExpenses.map((x) =>
                              x.id === ce.id ? { ...x, amount: Number(e.target.value) } : x
                            ),
                          },
                        })
                      }
                      className="w-24 px-2.5 py-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-xs font-num"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setEditingProduct({
                          ...editingProduct,
                          additionalCosts: {
                            ...editingProduct.additionalCosts,
                            customExpenses: editingProduct.additionalCosts.customExpenses.filter((x) => x.id !== ce.id),
                          },
                        })
                      }
                      className="p-1.5 text-[var(--ink-secondary)] hover:text-[var(--danger)]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 4: Calculated Cost Summary & Recommended Pricing Selection */}
          <div className="border-t border-[var(--border-hairline)] pt-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-[var(--canvas)] border border-[var(--border-hairline)] rounded-xl p-4 space-y-2.5 text-xs">
              <h4 className="text-sm font-semibold text-[var(--ink-primary)] mb-2">
                {isAr ? 'ملخص التكلفة التلقائي' : 'Automatic Cost Calculation'}
              </h4>
              <div className="flex justify-between">
                <span className="text-[var(--ink-secondary)]">{isAr ? 'تكلفة المواد / المكونات' : 'Materials / Ingredients Cost'}</span>
                <span className="font-num font-medium">{formatCurrency(activeCosts.materialsCost, business.currency, language)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--ink-secondary)]">{isAr ? 'تكلفة الهدر' : 'Production Waste'}</span>
                <span className="font-num font-medium">{formatCurrency(activeCosts.wasteCost, business.currency, language)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--ink-secondary)]">{isAr ? 'التغليف والملصقات' : 'Packaging & Labels'}</span>
                <span className="font-num font-medium">{formatCurrency(activeCosts.packagingCost, business.currency, language)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--ink-secondary)]">{isAr ? 'تكلفة العمل' : 'Labor Cost'}</span>
                <span className="font-num font-medium">{formatCurrency(activeCosts.laborCost, business.currency, language)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--ink-secondary)]">{isAr ? 'التشغيل والطاقة والإضافات' : 'Energy, Overhead & Custom'}</span>
                <span className="font-num font-medium">
                  {formatCurrency(
                    activeCosts.energyCost + activeCosts.overheadCost + activeCosts.deliveryCost + activeCosts.customExpensesCost,
                    business.currency,
                    language
                  )}
                </span>
              </div>
              <div className="pt-2.5 border-t border-[var(--border-hairline)] flex justify-between text-sm font-bold text-[var(--ink-primary)]">
                <span>{isAr ? 'إجمالي تكلفة الدفعة' : 'Total Production (Batch) Cost'}</span>
                <span className="font-num">{formatCurrency(activeCosts.totalBatchCost, business.currency, language)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-[var(--positive)]">
                <span>
                  {isAr ? `التكلفة لكل ${editingProduct.sellingUnit}` : `Cost per ${editingProduct.sellingUnit}`}
                </span>
                <span className="font-num">{formatCurrency(activeCosts.costPerUnit, business.currency, language)}</span>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-[var(--ink-primary)]">
                  {isAr ? 'توصيات سعر البيع (اختر السعر المناسب)' : 'Recommended Selling Prices by Target Profit Margin'}
                </h4>
                <span className="text-[11px] text-[var(--ink-secondary)] font-num">Cost / (1 - Margin)</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {pricingScenarios.map((sc) => {
                  const roundedPrice = Number(sc.suggestedPriceExclVat.toFixed(2));
                  const isPicked = Math.abs(editingProduct.sellingPrice - roundedPrice) < 0.05;
                  return (
                    <button
                      key={sc.targetMargin}
                      type="button"
                      onClick={() =>
                        setEditingProduct({
                          ...editingProduct,
                          sellingPrice: roundedPrice,
                          targetMargin: sc.targetMargin,
                        })
                      }
                      className={`p-3 rounded-xl border text-start transition-colors cursor-pointer ${
                        isPicked
                          ? 'bg-[var(--blueprint-soft)] border-[var(--blueprint)]'
                          : 'bg-[var(--surface-muted)] border-[var(--border-hairline)] hover:border-[var(--blueprint)]/50'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] text-[var(--ink-secondary)]">
                        <span>{Math.round(sc.targetMargin * 100)}% {isAr ? 'هامش ربح' : 'Margin'}</span>
                        <span className="font-num">+{Math.round(sc.markupPercent * 100)}% markup</span>
                      </div>
                      <div className="mt-1 text-base font-bold font-num text-[var(--ink-primary)]">
                        {formatCurrency(roundedPrice, business.currency, language)}
                      </div>
                      <div className="mt-0.5 text-[11px] font-num text-[var(--positive)]">
                        {isAr ? 'صافي ربح:' : 'Net:'} {formatCurrency(sc.estimatedNetProfit, business.currency, language)}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 pt-2">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-[var(--ink-primary)] mb-1">
                    {isAr ? `سعر البيع المعتمد (قبل الضريبة · ${business.currency})` : `Final Selling Price (Excl. VAT · ${business.currency})`}
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={editingProduct.sellingPrice}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sellingPrice: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm font-bold font-num"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isBusy}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--blueprint)] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 whitespace-nowrap cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{isAr ? 'حفظ المنتج والسعر' : 'Save Product & Price'}</span>
                </button>
              </div>

              <div className="flex items-start gap-2 text-[11px] text-[var(--ink-secondary)] bg-[var(--canvas)] p-3 rounded-lg">
                <HelpCircle className="w-3.5 h-3.5 text-[var(--blueprint)] shrink-0 mt-0.5" />
                <span>{t.explainers.marginVsMarkup}</span>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Product Catalog Grid */}
      {products.length === 0 ? (
        <div className="bg-[var(--surface)] border border-[var(--border-hairline)] rounded-2xl p-10 text-center">
          <p className="text-sm font-medium text-[var(--ink-primary)]">
            {isAr ? 'لم تضف أي منتجات بعد' : 'No products created yet'}
          </p>
          <p className="text-xs text-[var(--ink-secondary)] mt-1">
            {isAr ? 'ابدأ بإضافة أول منتج لحساب تكلفته وسعر البيع المقترح.' : 'Add your first product to calculate production costs and recommended pricing.'}
          </p>
          <button
            type="button"
            onClick={openNewProduct}
            className="mt-4 px-4 py-2 rounded-lg bg-[var(--blueprint)] text-white text-xs font-semibold cursor-pointer"
          >
            {isAr ? 'إضافة أول منتج' : 'Create First Product'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {products.map((prod) => {
            const cost = calculateProductCosts(prod);
            const profitPerUnit = prod.sellingPrice - cost.costPerUnit;
            const marginPct = prod.sellingPrice > 0 ? (profitPerUnit / prod.sellingPrice) * 100 : 0;
            return (
              <div
                key={prod.id}
                className="bg-[var(--surface)] border border-[var(--border-hairline)] rounded-2xl overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-[4/3] w-full bg-[var(--surface-muted)] relative overflow-hidden">
                    {prod.imageUrl ? (
                      <img
                        src={prod.imageUrl}
                        alt={prod.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-[var(--blueprint)]/60 gap-2 p-4 text-center">
                        <ImageIcon className="w-8 h-8" />
                        <span className="text-xs font-medium text-[var(--ink-secondary)]">{prod.category || currentTypeMeta.title}</span>
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <div className="text-[11px] text-[var(--ink-secondary)]">
                      {prod.category || currentTypeMeta.title}
                      <span aria-hidden="true"> · </span>
                      <span className="font-num">{prod.unitsPerBatch}</span> {prod.sellingUnit}/{isAr ? 'دفعة' : 'batch'}
                      {prod.variantLabel && (
                        <>
                          <span aria-hidden="true"> · </span>
                          {prod.variantLabel}
                        </>
                      )}
                    </div>
                    <h3 className="mt-1 text-base font-bold text-[var(--ink-primary)]">{prod.name}</h3>

                    <div className="mt-3 pt-3 border-t border-[var(--border-hairline)] grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <div className="text-[11px] text-[var(--ink-secondary)]">{isAr ? 'التكلفة' : 'Unit Cost'}</div>
                        <div className="font-semibold font-num text-[var(--ink-primary)] mt-0.5">
                          {formatCurrency(cost.costPerUnit, business.currency, language)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] text-[var(--ink-secondary)]">{isAr ? 'سعر البيع' : 'Price'}</div>
                        <div className="font-semibold font-num text-[var(--ink-primary)] mt-0.5">
                          {formatCurrency(prod.sellingPrice, business.currency, language)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] text-[var(--ink-secondary)]">{isAr ? 'الربح' : 'Est. Profit'}</div>
                        <div className="font-semibold font-num text-[var(--positive)] mt-0.5">
                          {formatCurrency(profitPerUnit, business.currency, language)} ({marginPct.toFixed(0)}%)
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-4 py-3 border-t border-[var(--border-hairline)] bg-[var(--surface-muted)] flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => openEditProduct(prod)}
                    className="flex items-center gap-1.5 text-xs font-medium text-[var(--ink-primary)] hover:text-[var(--positive)] cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{isAr ? 'تعديل التكلفة والسعر' : 'Edit Recipe & Cost'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteProduct(prod.id)}
                    className="p-1.5 text-[var(--ink-secondary)] hover:text-[var(--danger)] cursor-pointer"
                    aria-label="Delete product"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
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
