import React, { useMemo, useState } from 'react';
import { Check, Info, Save } from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import { getT } from '../i18n/translations';
import {
  calculateProductCosts,
  evaluatePricingScenario,
  formatCurrency,
} from '../utils/calculations';

const TARGET_MARGINS = [0.15, 0.2, 0.25, 0.3, 0.4, 0.5];

export function PricingCalculatorView() {
  const { language, business, products, saveProduct, pushToast, isBusy } = useBusiness();
  const t = getT(language);
  const isAr = language === 'ar';

  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id ?? 'custom');
  const selectedProduct = products.find((p) => p.id === selectedProductId);

  const [customCost, setCustomCost] = useState<number>(40);
  const unitCost = selectedProduct ? calculateProductCosts(selectedProduct).costPerUnit : customCost;

  const [vatPercent, setVatPercent] = useState<number>(Math.round(business.vatRate * 100));
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [paymentFeePercent, setPaymentFeePercent] = useState<number>(Number((business.paymentFeeRate * 100).toFixed(2)));
  const [channelFeePercent, setChannelFeePercent] = useState<number>(Number((business.channelFeeRate * 100).toFixed(2)));

  const [chosenPrice, setChosenPrice] = useState<number>(
    selectedProduct?.sellingPrice ?? Number((unitCost / (1 - 0.3)).toFixed(2))
  );
  const [chosenMargin, setChosenMargin] = useState<number>(selectedProduct?.targetMargin ?? 0.3);

  const handleSelectProduct = (id: string) => {
    setSelectedProductId(id);
    const prod = products.find((p) => p.id === id);
    if (prod) {
      setChosenPrice(prod.sellingPrice);
      setChosenMargin(prod.targetMargin);
    }
  };

  const feeOptions = {
    vatRate: vatPercent / 100,
    discountRate: discountPercent / 100,
    paymentFeeRate: paymentFeePercent / 100,
    channelFeeRate: channelFeePercent / 100,
  };

  const scenarios = useMemo(
    () => TARGET_MARGINS.map((m) => evaluatePricingScenario(unitCost, m, feeOptions)),
    [unitCost, vatPercent, discountPercent, paymentFeePercent, channelFeePercent]
  );

  const currentEvaluation = useMemo(
    () =>
      evaluatePricingScenario(unitCost, chosenMargin, {
        ...feeOptions,
        overridePrice: chosenPrice,
      }),
    [unitCost, chosenMargin, chosenPrice, vatPercent, discountPercent, paymentFeePercent, channelFeePercent]
  );

  const handleSavePriceToProduct = async () => {
    if (!selectedProduct) {
      pushToast('info', isAr ? 'اختر منتجاً محفوظاً لحفظ السعر عليه' : 'Select a saved product above to update its selling price.');
      return;
    }
    await saveProduct({
      ...selectedProduct,
      sellingPrice: Number(chosenPrice.toFixed(2)),
      targetMargin: chosenMargin,
      updatedAt: new Date().toISOString().slice(0, 10),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--ink-primary)]">
            {isAr ? 'حاسبة التسعير الذكية ومقارنة الهوامش' : 'Pricing Recommendation Calculator'}
          </h2>
          <p className="text-xs text-[var(--ink-secondary)] mt-1">
            {isAr
              ? 'معادلة التسعير: سعر البيع = التكلفة الإجمالية ÷ (1 - هامش الربح المستهدف)'
              : 'Formula: Selling Price = Total Cost / (1 - Target Profit Margin)'}
          </p>
        </div>

        {selectedProduct && (
          <button
            type="button"
            disabled={isBusy}
            onClick={handleSavePriceToProduct}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--blueprint)] text-white text-xs font-semibold hover:opacity-90 disabled:opacity-60 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isAr ? 'اعتماد وحفظ السعر للمنتج' : 'Save Price to Product'}</span>
          </button>
        )}
      </div>

      {/* Inputs & Fee Adjustments */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-[var(--surface)] border border-[var(--border-hairline)] rounded-2xl p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--ink-primary)] mb-1.5">
              {isAr ? 'اختر منتجاً أو أدخل تكلفة يدوية' : 'Select Product or Enter Custom Cost'}
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => handleSelectProduct(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
              <option value="custom">{isAr ? 'إدخال تكلفة يدوية (مثال: 40)' : 'Custom Unit Cost Input (e.g. 40)'}</option>
            </select>
          </div>

          {selectedProductId === 'custom' && (
            <div>
              <label className="block text-xs font-medium text-[var(--ink-primary)] mb-1.5">
                {isAr ? `التكلفة الإجمالية للوحدة (${business.currency})` : `Total Unit Cost (${business.currency})`}
              </label>
              <input
                type="number"
                min={0.1}
                step="0.5"
                value={customCost}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setCustomCost(v);
                  setChosenPrice(Number((v / (1 - chosenMargin)).toFixed(2)));
                }}
                className="w-full px-3.5 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm font-num"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[var(--border-hairline)]">
            <div>
              <label className="block text-[11px] font-medium text-[var(--ink-secondary)] mb-1">
                {isAr ? 'ضريبة القيمة المضافة (%)' : 'VAT / Sales Tax (%)'}
              </label>
              <input
                type="number"
                min={0}
                max={30}
                step="0.5"
                value={vatPercent}
                onChange={(e) => setVatPercent(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-xs font-num"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[var(--ink-secondary)] mb-1">
                {isAr ? 'نسبة الخصم الترويجي (%)' : 'Discount Offered (%)'}
              </label>
              <input
                type="number"
                min={0}
                max={60}
                step="1"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-xs font-num"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[var(--ink-secondary)] mb-1">
                {isAr ? 'رسوم الدفع الإلكتروني (%)' : 'Payment Fee (%)'}
              </label>
              <input
                type="number"
                min={0}
                max={15}
                step="0.1"
                value={paymentFeePercent}
                onChange={(e) => setPaymentFeePercent(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-xs font-num"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[var(--ink-secondary)] mb-1">
                {isAr ? 'عمولة منصة البيع (%)' : 'Selling-Channel Fee (%)'}
              </label>
              <input
                type="number"
                min={0}
                max={35}
                step="0.5"
                value={channelFeePercent}
                onChange={(e) => setChannelFeePercent(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-xs font-num"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-[var(--border-hairline)]">
            <label className="block text-xs font-medium text-[var(--ink-primary)] mb-1.5">
              {isAr ? `سعر البيع المختار قبل الضريبة (${business.currency})` : `Your Chosen Selling Price (Excl. VAT)`}
            </label>
            <input
              type="number"
              min={0}
              step="0.5"
              value={chosenPrice}
              onChange={(e) => setChosenPrice(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--blueprint)] bg-[var(--surface-muted)] text-base font-bold font-num text-[var(--ink-primary)]"
            />
          </div>

          {/* Live Breakdown for Chosen Price */}
          <div className="bg-[var(--canvas)] border border-[var(--border-hairline)] rounded-xl p-4 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-[var(--ink-secondary)]">{isAr ? 'تكلفة المنتج للوحدة' : 'Total Unit Cost'}</span>
              <span className="font-num font-semibold">{formatCurrency(unitCost, business.currency, language)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--ink-secondary)]">{isAr ? 'صافي الإيراد بعد الخصم' : 'Net Revenue (After Discount)'}</span>
              <span className="font-num font-semibold">
                {formatCurrency(currentEvaluation.discountedPriceExclVat, business.currency, language)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--ink-secondary)]">{isAr ? 'الربح الإجمالي' : 'Gross Profit'}</span>
              <span className="font-num font-semibold">
                {formatCurrency(currentEvaluation.grossProfit, business.currency, language)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--ink-secondary)]">{isAr ? 'رسوم الدفع والقناة' : 'Payment & Channel Fees'}</span>
              <span className="font-num text-[var(--blueprint)]">
                -{formatCurrency(currentEvaluation.feesAmount, business.currency, language)}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-[var(--border-hairline)] text-sm font-bold">
              <span>{isAr ? 'صافي الربح التقديري' : 'Estimated Net Profit'}</span>
              <span className={`font-num ${currentEvaluation.estimatedNetProfit >= 0 ? 'text-[var(--positive)]' : 'text-[var(--danger)]'}`}>
                {formatCurrency(currentEvaluation.estimatedNetProfit, business.currency, language)}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[var(--ink-secondary)]">{isAr ? 'هامش الربح الفعلي / الزيادة' : 'Actual Net Margin / Markup'}</span>
              <span className="font-num font-medium">
                {(currentEvaluation.actualNetMargin * 100).toFixed(1)}% / {(currentEvaluation.markupPercent * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between text-[11px] text-[var(--ink-secondary)] pt-1">
              <span>{isAr ? 'ضريبة تحصل للعميل (ليست إيراداً)' : 'Customer Price Incl. VAT'}</span>
              <span className="font-num">
                {formatCurrency(currentEvaluation.priceWithVat, business.currency, language)} (VAT{' '}
                {formatCurrency(currentEvaluation.vatCollected, business.currency, language)})
              </span>
            </div>
          </div>
        </div>

        {/* Comparison Table across Target Margins */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-[var(--surface)] border border-[var(--border-hairline)] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--border-hairline)] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[var(--ink-primary)]">
                {isAr ? 'مقارنة الأسعار المقترحة حسب هامش الربح المستهدف' : 'Price Comparison by Target Profit Margin'}
              </h3>
              <span className="text-xs font-num text-[var(--ink-secondary)]">
                {isAr ? 'التكلفة:' : 'Base Cost:'} {formatCurrency(unitCost, business.currency, language)}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-start">
                <thead className="bg-[var(--canvas)] text-[var(--ink-secondary)] border-b border-[var(--border-hairline)]">
                  <tr>
                    <th className="py-3 px-4 font-medium">{isAr ? 'الهامش المستهدف' : 'Target Margin'}</th>
                    <th className="py-3 px-4 font-medium">{isAr ? 'السعر المقترح' : 'Suggested Price'}</th>
                    <th className="py-3 px-4 font-medium">{isAr ? 'شامل الضريبة' : 'Incl. VAT'}</th>
                    <th className="py-3 px-4 font-medium">{isAr ? 'صافي الربح' : 'Est. Net Profit'}</th>
                    <th className="py-3 px-4 font-medium">{isAr ? 'نسبة الزيادة' : 'Markup'}</th>
                    <th className="py-3 px-4 font-medium text-end">{isAr ? 'اختيار' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-hairline)]">
                  {scenarios.map((sc) => {
                    const rounded = Number(sc.suggestedPriceExclVat.toFixed(2));
                    const isSelected = Math.abs(chosenPrice - rounded) < 0.05;
                    return (
                      <tr key={sc.targetMargin} className={isSelected ? 'bg-[var(--blueprint-soft)]' : 'hover:bg-[var(--surface-muted)]'}>
                        <td className="py-3 px-4 font-num font-bold text-[var(--ink-primary)]">
                          {Math.round(sc.targetMargin * 100)}%
                        </td>
                        <td className="py-3 px-4 font-num font-semibold text-[var(--ink-primary)]">
                          {formatCurrency(rounded, business.currency, language)}
                        </td>
                        <td className="py-3 px-4 font-num text-[var(--ink-secondary)]">
                          {formatCurrency(sc.priceWithVat, business.currency, language)}
                        </td>
                        <td className="py-3 px-4 font-num font-semibold text-[var(--positive)]">
                          {formatCurrency(sc.estimatedNetProfit, business.currency, language)}
                        </td>
                        <td className="py-3 px-4 font-num text-[var(--ink-secondary)]">
                          {(sc.markupPercent * 100).toFixed(1)}%
                        </td>
                        <td className="py-3 px-4 text-end">
                          <button
                            type="button"
                            onClick={() => {
                              setChosenPrice(rounded);
                              setChosenMargin(sc.targetMargin);
                            }}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer ${
                              isSelected
                                ? 'bg-[var(--blueprint)] text-white'
                                : 'border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-[var(--ink-primary)] hover:bg-[var(--surface-muted)]'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3" />}
                            <span>{isSelected ? (isAr ? 'مختار' : 'Selected') : (isAr ? 'تطبيق' : 'Use Price')}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Plain-Language Financial Explainers */}
          <div className="bg-[var(--surface)] border border-[var(--border-hairline)] rounded-2xl p-5 space-y-3 text-xs text-[var(--ink-secondary)]">
            <div className="flex items-start gap-2.5">
              <Info className="w-4 h-4 text-[var(--positive)] shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-[var(--ink-primary)]">
                  {isAr ? 'تنبيه هام حول سيناريوهات التسعير' : 'Planning Scenarios Notice'}
                </div>
                <p className="mt-0.5 leading-relaxed">
                  {isAr
                    ? 'الهوامش والأسعار المقترحة هي سيناريوهات تخطيط مبنية على تكاليفك، وليست أسعاراً مضمونة في السوق. راجع أسعار المنافسين وقيمة علامتك التجارية عند الاعتماد.'
                    : 'Suggested margins are planning scenarios based on your cost inputs—not guaranteed market prices. Compare with customer willingness to pay in your local market.'}
                </p>
              </div>
            </div>
            <div className="pt-2 border-t border-[var(--border-hairline)] flex items-start gap-2.5">
              <Info className="w-4 h-4 text-[var(--blueprint)] shrink-0 mt-0.5" />
              <p className="leading-relaxed">{t.explainers.marginVsMarkup}</p>
            </div>
            <div className="pt-2 border-t border-[var(--border-hairline)] flex items-start gap-2.5">
              <Info className="w-4 h-4 text-[var(--blueprint)] shrink-0 mt-0.5" />
              <p className="leading-relaxed">{t.explainers.vatNote}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
