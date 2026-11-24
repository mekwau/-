import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownUp,
  CheckCircle2,
  Edit3,
  History,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import { getT } from '../i18n/translations';
import { InventoryCategory, InventoryItem, MeasurementUnit } from '../types/business';
import { formatCurrency, formatNumber } from '../utils/calculations';

const UNITS: MeasurementUnit[] = ['g', 'kg', 'ml', 'L', 'm', 'cm', 'yd', 'pcs', 'skein'];

export function InventoryView() {
  const {
    language,
    business,
    inventory,
    stockMovements,
    adjustInventory,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    pushToast,
    isBusy,
  } = useBusiness();

  const t = getT(language);
  const isAr = language === 'ar';

  const [tab, setTab] = useState<'stock' | 'history'>('stock');
  const [catFilter, setCatFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  // Add / Edit item form
  const [showAdd, setShowAdd] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCat, setNewItemCat] = useState<InventoryCategory>('raw_material');
  const [newItemUnit, setNewItemUnit] = useState<MeasurementUnit>('g');
  const [newItemQty, setNewItemQty] = useState(1000);
  const [newItemPrice, setNewItemPrice] = useState(0.05);
  const [newItemSupplier, setNewItemSupplier] = useState('');
  const [newItemReorder, setNewItemReorder] = useState(300);

  // Manual Adjustment modal state
  const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null);
  const [adjustDelta, setAdjustDelta] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustMode, setAdjustMode] = useState<'restock' | 'manual_adjustment'>('restock');

  const lowStockItems = useMemo(
    () => inventory.filter((i) => i.availableQty <= i.reorderLevel),
    [inventory]
  );

  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      if (catFilter === 'low_stock' && item.availableQty > item.reorderLevel) return false;
      if (catFilter !== 'all' && catFilter !== 'low_stock' && item.category !== catFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!item.name.toLowerCase().includes(q) && !item.supplier.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [inventory, catFilter, search]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) {
      pushToast('error', isAr ? 'يرجى إدخال اسم الصنف' : 'Please enter an item name.');
      return;
    }
    if (editingItemId) {
      const existing = inventory.find((i) => i.id === editingItemId);
      if (existing) {
        updateInventoryItem({
          ...existing,
          name: newItemName.trim(),
          category: newItemCat,
          unit: newItemUnit,
          availableQty: newItemQty,
          purchasePricePerUnit: newItemPrice,
          supplier: newItemSupplier.trim() || '-',
          reorderLevel: newItemReorder,
        });
      }
      setEditingItemId(null);
      setShowAdd(false);
      setNewItemName('');
      return;
    }
    const ok = await addInventoryItem({
      name: newItemName.trim(),
      category: newItemCat,
      unit: newItemUnit,
      availableQty: newItemQty,
      reservedQty: 0,
      purchasePricePerUnit: newItemPrice,
      supplier: newItemSupplier.trim() || '-',
      reorderLevel: newItemReorder,
    });
    if (ok) {
      setShowAdd(false);
      setNewItemName('');
    }
  };

  const openEditInventory = (item: InventoryItem) => {
    setEditingItemId(item.id);
    setNewItemName(item.name);
    setNewItemCat(item.category);
    setNewItemUnit(item.unit);
    setNewItemQty(item.availableQty);
    setNewItemPrice(item.purchasePricePerUnit);
    setNewItemSupplier(item.supplier === '-' ? '' : item.supplier);
    setNewItemReorder(item.reorderLevel);
    setShowAdd(true);
  };

  const handleConfirmAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingItem) return;
    if (!adjustReason.trim()) {
      pushToast('error', isAr ? 'يرجى كتابة سبب تعديل المخزون' : 'A reason is required for manual stock adjustments.');
      return;
    }
    if (adjustDelta === 0) {
      pushToast('error', isAr ? 'أدخل كمية التعديل (موجبة أو سالبة)' : 'Enter a non-zero quantity change.');
      return;
    }
    const ok = await adjustInventory(adjustingItem.id, adjustDelta, adjustReason.trim(), adjustMode);
    if (ok) {
      setAdjustingItem(null);
      setAdjustDelta(0);
      setAdjustReason('');
    }
  };

  const categoryLabels: Record<InventoryCategory, string> = {
    raw_material: isAr ? 'مواد خام' : 'Raw Material',
    finished_product: isAr ? 'منتجات جاهزة' : 'Finished Product',
    packaging: isAr ? 'مواد تغليف' : 'Packaging',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--ink-primary)]">
            {isAr ? 'إدارة المخزون وحركة المواد' : 'Inventory & Stock Movement'}
          </h2>
          <p className="text-xs text-[var(--ink-secondary)] mt-1">
            {isAr
              ? 'تتبع المواد الخام والمنتجات الجاهزة ومواد التغليف وتنبيهات إعادة الطلب.'
              : 'Track raw materials, finished products, packaging supplies, suppliers, and reorder alerts.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 bg-[var(--surface-muted)] rounded-lg">
            <button
              type="button"
              onClick={() => setTab('stock')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer ${
                tab === 'stock' ? 'bg-[var(--blueprint)] text-white' : 'text-[var(--ink-secondary)]'
              }`}
            >
              {isAr ? 'المخزون الحالي' : 'Stock Levels'}
            </button>
            <button
              type="button"
              onClick={() => setTab('history')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer ${
                tab === 'history' ? 'bg-[var(--blueprint)] text-white' : 'text-[var(--ink-secondary)]'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>{isAr ? 'سجل الحركات' : 'Movement History'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              if (showAdd) {
                setShowAdd(false);
                setEditingItemId(null);
              } else {
                setEditingItemId(null);
                setNewItemName('');
                setShowAdd(true);
              }
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--blueprint)] text-white text-xs font-semibold hover:opacity-90 whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? 'إضافة صنف' : 'Add Item'}</span>
          </button>
        </div>
      </div>

      {/* Low Stock Alert Strip */}
      {lowStockItems.length > 0 && (
        <div className="bg-[var(--surface-muted)] border border-[var(--warning)]/60 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-[var(--warning)] shrink-0 mt-0.5" />
            <div className="text-xs">
              <div className="font-semibold text-[var(--warning)]">
                {isAr
                  ? `تنبيه انخفاض المخزون (${lowStockItems.length} أصناف)`
                  : `Low Stock Alert (${lowStockItems.length} items below reorder level)`}
              </div>
              <div className="text-[var(--blueprint)] mt-0.5">
                {lowStockItems.map((i) => `${i.name} (${i.availableQty} ${i.unit})`).join(' · ')}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setTab('stock');
              setCatFilter('low_stock');
            }}
            className="px-3 py-1.5 rounded-lg border border-[var(--warning)]/60 bg-[var(--surface-muted)] text-xs font-medium text-[var(--warning)] hover:bg-[var(--surface-muted)] cursor-pointer"
          >
            {isAr ? 'عرض النواقص' : 'Filter Low Stock'}
          </button>
        </div>
      )}

      {/* Add Inventory Form */}
      {showAdd && (
        <form onSubmit={handleAddItem} className="bg-[var(--surface)] border border-[var(--border-hairline)] rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2">
            <label className="block text-xs font-medium mb-1">{isAr ? 'اسم الصنف' : 'Item Name'}</label>
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">{isAr ? 'التصنيف' : 'Category'}</label>
            <select
              value={newItemCat}
              onChange={(e) => setNewItemCat(e.target.value as InventoryCategory)}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm"
            >
              <option value="raw_material">{categoryLabels.raw_material}</option>
              <option value="finished_product">{categoryLabels.finished_product}</option>
              <option value="packaging">{categoryLabels.packaging}</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">{isAr ? 'الوحدة' : 'Unit'}</label>
            <select
              value={newItemUnit}
              onChange={(e) => setNewItemUnit(e.target.value as MeasurementUnit)}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm"
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">{isAr ? 'الكمية المتوفرة' : 'Available Qty'}</label>
            <input
              type="number"
              min={0}
              step="any"
              value={newItemQty}
              onChange={(e) => setNewItemQty(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm font-num"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">
              {isAr ? `سعر الشراء للوحدة (${business.currency})` : `Purchase Price / Unit (${business.currency})`}
            </label>
            <input
              type="number"
              min={0}
              step="any"
              value={newItemPrice}
              onChange={(e) => setNewItemPrice(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-xs font-num"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">{isAr ? 'المورد' : 'Supplier'}</label>
            <input
              type="text"
              value={newItemSupplier}
              onChange={(e) => setNewItemSupplier(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">{isAr ? 'حد إعادة الطلب' : 'Reorder Level'}</label>
            <input
              type="number"
              min={0}
              value={newItemReorder}
              onChange={(e) => setNewItemReorder(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm font-num"
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="px-4 py-2 rounded-lg border border-[var(--border-hairline)] text-xs font-medium"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              disabled={isBusy}
              className="px-5 py-2 rounded-lg bg-[var(--blueprint)] text-white text-xs font-semibold cursor-pointer"
            >
              {t.common.save}
            </button>
          </div>
        </form>
      )}

      {/* Manual Adjustment Modal / Inline Panel */}
      {adjustingItem && (
        <form onSubmit={handleConfirmAdjustment} className="bg-[var(--surface)] border border-[var(--blueprint)]/50 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[var(--ink-primary)] flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[var(--blueprint)]" />
              <span>
                {isAr ? `تعديل مخزون: ${adjustingItem.name}` : `Adjust Stock: ${adjustingItem.name}`}
              </span>
            </h3>
            <span className="text-xs font-num text-[var(--ink-secondary)]">
              {isAr ? 'المتوفر حالياً:' : 'Current:'} {adjustingItem.availableQty} {adjustingItem.unit}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">{isAr ? 'نوع الحركة' : 'Adjustment Type'}</label>
              <select
                value={adjustMode}
                onChange={(e) => setAdjustMode(e.target.value as 'restock' | 'manual_adjustment')}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-xs"
              >
                <option value="restock">{isAr ? 'إعادة تعبئة / شراء (+)' : 'Supplier Restock (+)'}</option>
                <option value="manual_adjustment">{isAr ? 'تعديل يدوي (+/-)' : 'Manual Adjustment (+/-)'}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">
                {isAr ? `الكمية (${adjustingItem.unit})` : `Quantity Change (${adjustingItem.unit})`}
              </label>
              <input
                type="number"
                step="any"
                value={adjustDelta}
                onChange={(e) => setAdjustDelta(Number(e.target.value))}
                placeholder="+500 or -100"
                className="w-full px-3 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-xs font-num"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">{isAr ? 'السبب (إلزامي)' : 'Reason (Required)'}</label>
              <input
                type="text"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder={isAr ? 'مثال: تلف، جرد فعلي، توريد جديد' : 'e.g. Supplier invoice #204, Damaged'}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-xs"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setAdjustingItem(null)}
              className="px-4 py-2 rounded-lg border border-[var(--border-hairline)] text-xs font-medium"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              disabled={isBusy}
              className="px-4 py-2 rounded-lg bg-[var(--blueprint)] text-white text-xs font-semibold cursor-pointer"
            >
              {isAr ? 'تأكيد التعديل' : 'Apply Stock Adjustment'}
            </button>
          </div>
        </form>
      )}

      {tab === 'stock' ? (
        <div className="space-y-4">
          <div className="bg-[var(--surface)] border border-[var(--border-hairline)] rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-[var(--ink-secondary)] absolute start-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isAr ? 'ابحث باسم المادة أو المورد...' : 'Search item or supplier...'}
                className="w-full ps-9 pe-3 py-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-xs"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'all', label: t.common.all },
                { id: 'raw_material', label: categoryLabels.raw_material },
                { id: 'packaging', label: categoryLabels.packaging },
                { id: 'finished_product', label: categoryLabels.finished_product },
                { id: 'low_stock', label: isAr ? 'منخفض المخزون' : 'Low Stock' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setCatFilter(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                    catFilter === f.id
                      ? 'bg-[var(--blueprint-soft)] text-[var(--ink-primary)] font-semibold'
                      : 'text-[var(--ink-secondary)] hover:bg-[var(--surface-muted)]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[var(--surface)] border border-[var(--border-hairline)] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-start">
                <thead className="bg-[var(--canvas)] text-[var(--ink-secondary)] border-b border-[var(--border-hairline)]">
                  <tr>
                    <th className="py-3 px-4 font-medium">{isAr ? 'الصنف والتصنيف' : 'Item & Category'}</th>
                    <th className="py-3 px-4 font-medium">{isAr ? 'المورد' : 'Supplier'}</th>
                    <th className="py-3 px-4 font-medium text-end">{isAr ? 'المتوفر' : 'Available'}</th>
                    <th className="py-3 px-4 font-medium text-end">{isAr ? 'المحجوز' : 'Reserved'}</th>
                    <th className="py-3 px-4 font-medium text-end">{isAr ? 'حد التنبيه' : 'Reorder Level'}</th>
                    <th className="py-3 px-4 font-medium text-end">{isAr ? 'سعر الوحدة' : 'Unit Cost'}</th>
                    <th className="py-3 px-4 font-medium">{isAr ? 'الحالة' : 'Status'}</th>
                    <th className="py-3 px-4 font-medium text-end">{isAr ? 'إجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-hairline)]">
                  {filteredInventory.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-[var(--ink-secondary)]">
                        {t.common.noData}
                      </td>
                    </tr>
                  ) : (
                    filteredInventory.map((item) => {
                      const isLow = item.availableQty <= item.reorderLevel;
                      return (
                        <tr key={item.id} className="hover:bg-[var(--surface-muted)]/60">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-[var(--ink-primary)]">{item.name}</div>
                            <div className="text-[11px] text-[var(--ink-secondary)]">{categoryLabels[item.category]}</div>
                          </td>
                          <td className="py-3 px-4 text-[var(--ink-secondary)]">{item.supplier}</td>
                          <td className="py-3 px-4 text-end font-num font-bold text-[var(--ink-primary)]">
                            {formatNumber(item.availableQty, 1)} {item.unit}
                          </td>
                          <td className="py-3 px-4 text-end font-num text-[var(--ink-secondary)]">
                            {formatNumber(item.reservedQty, 1)} {item.unit}
                          </td>
                          <td className="py-3 px-4 text-end font-num text-[var(--ink-secondary)]">
                            {formatNumber(item.reorderLevel)} {item.unit}
                          </td>
                          <td className="py-3 px-4 text-end font-num text-[var(--ink-primary)]">
                            {formatCurrency(item.purchasePricePerUnit, business.currency, language)}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            {isLow ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--warning)]">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                <span>{isAr ? 'منخفض' : 'Low Stock'}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--positive)]">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>{isAr ? 'متوفر' : 'In Stock'}</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-end whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setAdjustingItem(item);
                                  setAdjustDelta(0);
                                  setAdjustReason('');
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-xs font-medium hover:border-[var(--blueprint)]/50 cursor-pointer"
                              >
                                <ArrowDownUp className="w-3 h-3" />
                                <span>{isAr ? 'تعديل الكمية' : 'Update Stock'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => openEditInventory(item)}
                                className="p-1.5 rounded-lg text-[var(--ink-secondary)] hover:text-[var(--blueprint)] hover:bg-[var(--surface-muted)] cursor-pointer"
                                title={t.common.edit}
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteInventoryItem(item.id)}
                                className="p-1.5 rounded-lg text-[var(--ink-secondary)] hover:text-[var(--danger)] hover:bg-[var(--surface-muted)] cursor-pointer"
                                title={t.common.delete}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
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
      ) : (
        <div className="bg-[var(--surface)] border border-[var(--border-hairline)] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead className="bg-[var(--canvas)] text-[var(--ink-secondary)] border-b border-[var(--border-hairline)]">
                <tr>
                  <th className="py-3 px-4 font-medium">{isAr ? 'التاريخ' : 'Date'}</th>
                  <th className="py-3 px-4 font-medium">{isAr ? 'الصنف' : 'Item'}</th>
                  <th className="py-3 px-4 font-medium">{isAr ? 'نوع الحركة' : 'Type'}</th>
                  <th className="py-3 px-4 font-medium text-end">{isAr ? 'الكمية' : 'Change'}</th>
                  <th className="py-3 px-4 font-medium">{isAr ? 'السبب / المرجع' : 'Reason / Reference'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-hairline)]">
                {stockMovements.map((mov) => (
                  <tr key={mov.id} className="hover:bg-[var(--surface-muted)]/60">
                    <td className="py-3 px-4 font-num text-[var(--ink-secondary)]">{mov.createdAt}</td>
                    <td className="py-3 px-4 font-semibold text-[var(--ink-primary)]">{mov.itemName}</td>
                    <td className="py-3 px-4 text-[var(--ink-secondary)]">{mov.type.replace('_', ' ')}</td>
                    <td
                      className={`py-3 px-4 text-end font-num font-bold ${
                        mov.changeQty >= 0 ? 'text-[var(--positive)]' : 'text-[var(--danger)]'
                      }`}
                    >
                      {mov.changeQty > 0 ? '+' : ''}
                      {mov.changeQty} {mov.unit}
                    </td>
                    <td className="py-3 px-4 text-[var(--ink-primary)]">{mov.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
