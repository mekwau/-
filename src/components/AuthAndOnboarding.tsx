import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Check,
  ChefHat,
  Flame,
  Globe,
  HandMetal,
  Layers,
  LogIn,
  LogOut,
  Scissors,
  Shirt,
  Sparkles,
  X,
} from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import { BUSINESS_TYPE_META } from '../i18n/translations';
import { BusinessProfile, BusinessType, CurrencyCode, GoalType } from '../types/business';

const CURRENCIES: CurrencyCode[] = ['SAR', 'AED', 'KWD', 'QAR', 'EGP', 'USD', 'EUR', 'GBP'];
const COUNTRIES = [
  'Saudi Arabia',
  'United Arab Emirates',
  'Kuwait',
  'Qatar',
  'Egypt',
  'Jordan',
  'United States',
  'United Kingdom',
];

const BUSINESS_ICONS: Record<BusinessType, React.ComponentType<{ className?: string }>> = {
  food_bakery: ChefHat,
  clothing_fashion: Shirt,
  handmade: HandMetal,
  crochet_knitting: Scissors,
  candles_fragrances: Flame,
  beauty_skincare: Sparkles,
  other: Layers,
};

export function AuthAndOnboarding() {
  const {
    authScreen,
    setAuthScreen,
    language,
    setLanguage,
    business,
    user,
    setUser,
    completeOnboarding,
    savedWorkspaces,
    signInWithBusinessIdea,
    switchWorkspace,
    signOutToSample,
    pushToast,
    isBusy,
  } = useBusiness();

  const isAr = language === 'ar';

  // Open business-idea sign-in / sign-up states
  const [fullName, setFullName] = useState(user.isDemo ? '' : user.fullName || '');
  const [email, setEmail] = useState(user.isDemo ? '' : user.email || '');
  const [businessNameInput, setBusinessNameInput] = useState(user.isDemo ? '' : business.name || '');
  const [businessIdeaInput, setBusinessIdeaInput] = useState(user.isDemo ? '' : business.description || '');
  const [ideaType, setIdeaType] = useState<BusinessType>(business.type || 'food_bakery');
  const [ideaCurrency, setIdeaCurrency] = useState<CurrencyCode>(business.currency || 'SAR');
  const [startWithSample, setStartWithSample] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // 5-Step Business Setup Wizard state
  const [wizardStep, setWizardStep] = useState(1);
  const [formProfile, setFormProfile] = useState<BusinessProfile>({ ...business });

  const [goalType, setGoalType] = useState<GoalType>('monthly_profit');
  const [goalTitle, setGoalTitle] = useState(
    isAr
      ? `تحقيق صافي ربح شهري 5,000 ${business.currency}`
      : `Reach a monthly net profit of 5,000 ${business.currency}`
  );
  const [goalTarget, setGoalTarget] = useState<number>(5000);
  const [goalDeadline, setGoalDeadline] = useState('2026-12-31');

  if (authScreen === 'none') return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signInWithBusinessIdea({
      fullName,
      email,
      businessName: businessNameInput,
      businessType: ideaType,
      businessIdea: businessIdeaInput,
      currency: ideaCurrency,
      startWithSampleData: startWithSample,
    });
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !businessNameInput.trim()) {
      pushToast(
        'error',
        isAr
          ? 'يرجى إدخال اسمك واسم مشروعك للمتابعة'
          : 'Please enter your name and business name to continue.'
      );
      return;
    }
    const cleanEmail =
      email.trim().toLowerCase() ||
      `${fullName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '.') || 'owner'}@bizwise.local`;
    setUser({
      id: `user-${Date.now()}`,
      fullName: fullName.trim(),
      email: cleanEmail,
      role: 'owner',
      isDemo: false,
    });
    setFormProfile((prev) => ({
      ...prev,
      id: `biz-${Date.now()}`,
      name: businessNameInput.trim(),
      type: ideaType,
      currency: ideaCurrency,
      description: businessIdeaInput.trim() || prev.description,
      startDate: new Date().toISOString().slice(0, 10),
    }));
    setWizardStep(2);
    setAuthScreen('onboarding');
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      pushToast('error', isAr ? 'يرجى إدخال بريدك الإلكتروني' : 'Please enter your email address.');
      return;
    }
    setResetSent(true);
    pushToast(
      'success',
      isAr ? 'تم إرسال رابط استعادة كلمة المرور إلى بريدك' : 'Password reset link sent to your email.'
    );
  };

  const handleFinishWizard = async () => {
    if (!formProfile.name.trim()) {
      pushToast('error', isAr ? 'يرجى إدخال اسم النشاط التجاري' : 'Please enter your business name.');
      setWizardStep(1);
      return;
    }
    const unitMap: Record<GoalType, string> = {
      monthly_profit: formProfile.currency,
      monthly_revenue: formProfile.currency,
      order_count: 'orders',
      customer_count: 'customers',
      cost_reduction: '%',
      custom: 'units',
    };
    await completeOnboarding(formProfile, {
      title: goalTitle,
      type: goalType,
      targetValue: goalTarget,
      unit: unitMap[goalType],
      deadline: goalDeadline,
    });
  };

  // Requirement questions dynamically tailored to Step 2 selected business type
  const renderBusinessRequirements = () => {
    const req = formProfile.requirements || {};
    const setReq = (k: string, v: string | boolean | number) =>
      setFormProfile((prev) => ({ ...prev, requirements: { ...prev.requirements, [k]: v } }));

    switch (formProfile.type) {
      case 'food_bakery':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[var(--ink-primary)] mb-1.5">
                {isAr ? 'بيئة التحضير' : 'Kitchen & Production Setup'}
              </label>
              <select
                value={String(req.kitchenSetup ?? 'Home kitchen')}
                onChange={(e) => setReq('kitchenSetup', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface)] text-sm"
              >
                <option value="Home kitchen">{isAr ? 'مطبخ منزلي' : 'Home kitchen'}</option>
                <option value="Licensed home bakery">{isAr ? 'مطبخ منزلي مرخص' : 'Licensed home bakery'}</option>
                <option value="Cloud / shared kitchen">{isAr ? 'مطبخ سحابي مشترك' : 'Cloud / shared kitchen'}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--ink-primary)] mb-1.5">
                {isAr ? 'مدة التحضير المسبقة للطلب' : 'Standard Order Lead Time'}
              </label>
              <input
                type="text"
                value={String(req.orderLeadTime ?? '24 hours advance notice')}
                onChange={(e) => setReq('orderLeadTime', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface)] text-sm"
              />
            </div>
            <label className="flex items-center gap-2.5 text-sm text-[var(--ink-primary)] cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(req.allergenTracking ?? true)}
                onChange={(e) => setReq('allergenTracking', e.target.checked)}
                className="rounded border-[var(--border-hairline)]"
              />
              <span>{isAr ? 'تتبع المكونات المسببة للحساسية وتاريخ الصلاحية' : 'Track shelf-life & food allergens per batch'}</span>
            </label>
          </div>
        );
      case 'clothing_fashion':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[var(--ink-primary)] mb-1.5">
                {isAr ? 'طريقة التفصيل والإنتاج' : 'Tailoring & Production Model'}
              </label>
              <select
                value={String(req.tailoringType ?? 'Made to order')}
                onChange={(e) => setReq('tailoringType', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface)] text-sm"
              >
                <option value="Made to order">{isAr ? 'تفصيل حسب الطلب' : 'Made to order'}</option>
                <option value="Ready-to-wear small batch">{isAr ? 'مجموعات جاهزة بكميات محدودة' : 'Ready-to-wear small batch'}</option>
                <option value="Outsourced seamstress">{isAr ? 'التعاون مع خياط خارجي' : 'Outsourced seamstress / workshop'}</option>
              </select>
            </div>
            <label className="flex items-center gap-2.5 text-sm text-[var(--ink-primary)] cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(req.customMeasurements ?? true)}
                onChange={(e) => setReq('customMeasurements', e.target.checked)}
              />
              <span>{isAr ? 'دعم المقاسات الخاصة للعملاء' : 'Support custom customer measurements & alterations'}</span>
            </label>
          </div>
        );
      case 'crochet_knitting':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[var(--ink-primary)] mb-1.5">
                {isAr ? 'متوسط ساعات الحياكة لكل قطعة' : 'Average Crafting Hours per Piece'}
              </label>
              <input
                type="number"
                min={0.5}
                step={0.5}
                value={Number(req.avgCraftHours ?? 4)}
                onChange={(e) => setReq('avgCraftHours', Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface)] text-sm font-num"
              />
            </div>
            <label className="flex items-center gap-2.5 text-sm text-[var(--ink-primary)] cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(req.savePatterns ?? true)}
                onChange={(e) => setReq('savePatterns', e.target.checked)}
              />
              <span>{isAr ? 'حفظ الباترونات وقوالب الخيوط لإعادة الاستخدام' : 'Enable reusable pattern & yarn template library'}</span>
            </label>
          </div>
        );
      case 'candles_fragrances':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[var(--ink-primary)] mb-1.5">
                {isAr ? 'نسبة الزيت العطري المعتادة' : 'Standard Fragrance Oil Load (%)'}
              </label>
              <input
                type="text"
                value={String(req.fragranceLoad ?? '10%')}
                onChange={(e) => setReq('fragranceLoad', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface)] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--ink-primary)] mb-1.5">
                {isAr ? 'أحجام العبوات الرئيسية' : 'Primary Vessel Sizes'}
              </label>
              <input
                type="text"
                value={String(req.vesselSizes ?? '6 oz, 8 oz, 12 oz')}
                onChange={(e) => setReq('vesselSizes', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface)] text-sm"
              />
            </div>
          </div>
        );
      default:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[var(--ink-primary)] mb-1.5">
                {isAr ? 'أسلوب الإنتاج الرئيسي' : 'Primary Production Workflow'}
              </label>
              <select
                value={String(req.productionMode ?? 'Made to order')}
                onChange={(e) => setReq('productionMode', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface)] text-sm"
              >
                <option value="Made to order">{isAr ? 'تصنيع حسب الطلب' : 'Made to order'}</option>
                <option value="Small batch stock">{isAr ? 'إنتاج دفعات صغيرة' : 'Small batch stock'}</option>
                <option value="Custom personalization">{isAr ? 'تخصيص وهدايا حسب طلب العميل' : 'Custom personalized items'}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--ink-primary)] mb-1.5">
                {isAr ? 'قنوات البيع الأساسية' : 'Main Sales Channels'}
              </label>
              <input
                type="text"
                value={String(req.salesChannels ?? 'Instagram, WhatsApp, Local Storefront')}
                onChange={(e) => setReq('salesChannels', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface)] text-sm"
              />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[var(--canvas)] overflow-y-auto flex flex-col">
      {/* Minimal Auth / Wizard Top Bar */}
      <div className="px-6 py-4 border-b border-[var(--border-hairline)] bg-[var(--surface)] flex items-center justify-between">
        <span className="text-lg font-bold text-[var(--ink-primary)]">Bizwise</span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-hairline)] text-xs font-medium hover:bg-[var(--surface-muted)] cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-[var(--blueprint)]" />
            <span>{language === 'en' ? 'العربية' : 'English'}</span>
          </button>
          <button
            type="button"
            onClick={() => setAuthScreen('none')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--surface-muted)] cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>{isAr ? 'العودة للوحة التحكم' : 'Back to Workspace'}</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        {authScreen === 'login' && (
          <div className="w-full max-w-lg bg-[var(--surface)] border border-[var(--border-hairline)] rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-[var(--ink-primary)]">
              {isAr ? 'الدخول بفكرة مشروعك' : 'Sign in with your business idea'}
            </h2>
            <p className="mt-1.5 text-sm text-[var(--ink-secondary)]">
              {isAr
                ? 'يمكن للجميع البدء فوراً—أدخل اسمك واسم مشروعك وفكرتك لإطلاق مساحة عملك الخاصة.'
                : 'Everybody can sign in immediately—enter your name, business name, and idea to open your own workspace.'}
            </p>

            <form onSubmit={handleLoginSubmit} className="mt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-[var(--ink-primary)] mb-1.5">
                    {isAr ? 'اسمك *' : 'Your Name *'}
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={isAr ? 'مثال: سارة القحطاني' : 'e.g. Sara Al-Qahtani'}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm focus:outline-none focus:ring-2 focus:ring-[#4D8EFF]/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--ink-primary)] mb-1.5">
                    {isAr ? 'اسم المشروع *' : 'Business Name *'}
                  </label>
                  <input
                    type="text"
                    value={businessNameInput}
                    onChange={(e) => setBusinessNameInput(e.target.value)}
                    placeholder={isAr ? 'مثال: مخبز سارة المنزلي' : 'e.g. Sara Home Bakery'}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm focus:outline-none focus:ring-2 focus:ring-[#4D8EFF]/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-[var(--ink-primary)] mb-1.5">
                    {isAr ? 'نوع النشاط *' : 'Business Category *'}
                  </label>
                  <select
                    value={ideaType}
                    onChange={(e) => setIdeaType(e.target.value as BusinessType)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm"
                  >
                    {(Object.keys(BUSINESS_TYPE_META) as BusinessType[]).map((bt) => (
                      <option key={bt} value={bt}>
                        {BUSINESS_TYPE_META[bt][language].title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--ink-primary)] mb-1.5">
                    {isAr ? 'العملة' : 'Currency'}
                  </label>
                  <select
                    value={ideaCurrency}
                    onChange={(e) => setIdeaCurrency(e.target.value as CurrencyCode)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm"
                  >
                    {CURRENCIES.map((cur) => (
                      <option key={cur} value={cur}>
                        {cur}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--ink-primary)] mb-1.5">
                  {isAr ? 'فكرة مشروعك *' : 'Your Business Idea *'}
                </label>
                <textarea
                  rows={2}
                  value={businessIdeaInput}
                  onChange={(e) => setBusinessIdeaInput(e.target.value)}
                  placeholder={
                    isAr
                      ? 'صف باختصار ما ستبيعه أو تقدمه في مشروعك...'
                      : 'Briefly describe what you plan to make, sell, or offer...'
                  }
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm focus:outline-none focus:ring-2 focus:ring-[#4D8EFF]/30"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--ink-primary)] mb-1.5">
                  {isAr ? 'البريد الإلكتروني (اختياري)' : 'Email address (Optional)'}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="owner@yourstudio.com"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm focus:outline-none focus:ring-2 focus:ring-[#4D8EFF]/30"
                />
              </div>

              <label className="flex items-center gap-2.5 text-xs text-[var(--ink-secondary)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={startWithSample}
                  onChange={(e) => setStartWithSample(e.target.checked)}
                />
                <span>
                  {isAr
                    ? 'تعبئة مساحة العمل بمنتجات استرشادية لهذا النوع'
                    : 'Pre-fill workspace with sample products for this category'}
                </span>
              </label>

              <button
                type="submit"
                disabled={isBusy}
                className="w-full py-2.5 px-4 rounded-lg bg-[var(--blueprint)] text-white text-sm font-semibold hover:opacity-90 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>{isAr ? 'دخول وبدء مشروعي' : 'Sign In & Start My Business'}</span>
              </button>
            </form>

            {savedWorkspaces.length > 0 && (
              <div className="mt-6 pt-5 border-t border-[var(--border-hairline)] space-y-2.5">
                <div className="text-xs font-semibold text-[var(--ink-secondary)]">
                  {isAr ? 'مشاريعك المحفوظة:' : 'Saved business workspaces:'}
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {savedWorkspaces.map((ws) => (
                    <button
                      key={ws.id}
                      type="button"
                      onClick={() => switchWorkspace(ws.id)}
                      className="w-full p-2.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] hover:border-[var(--blueprint)]/50 text-start flex items-center justify-between gap-2 cursor-pointer"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-[var(--ink-primary)] flex items-center gap-1.5 truncate">
                          <Briefcase className="w-3.5 h-3.5 text-[var(--blueprint)] shrink-0" />
                          <span className="truncate">{ws.businessName}</span>
                        </div>
                        <div className="text-[11px] text-[var(--ink-secondary)] truncate">
                          {ws.ownerName}
                          {ws.businessIdea ? ` · ${ws.businessIdea}` : ''}
                        </div>
                      </div>
                      <span className="text-[11px] font-num text-[var(--ink-secondary)] shrink-0">{ws.currency}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 pt-5 border-t border-[var(--border-hairline)] flex flex-col gap-2.5 text-center text-xs text-[var(--ink-secondary)]">
              <div>
                {isAr ? 'تفضل الإعداد المالي خطوة بخطوة؟ ' : 'Prefer a guided financial setup? '}
                <button
                  type="button"
                  onClick={() => setAuthScreen('signup')}
                  className="font-semibold text-[var(--blueprint)] hover:underline cursor-pointer"
                >
                  {isAr ? 'ابدأ معالج الإعداد الكامل' : 'Start 5-Step Guided Setup'}
                </button>
              </div>
              {!user.isDemo && (
                <button
                  type="button"
                  onClick={() => {
                    signOutToSample();
                    setAuthScreen('none');
                  }}
                  className="py-2 px-3 rounded-lg border border-[var(--border-hairline)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] font-medium flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{isAr ? 'تسجيل الخروج والعودة للوضع التجريبي' : 'Sign Out to Sample Workspace'}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setAuthScreen('none')}
                className="py-2 px-3 rounded-lg bg-[var(--surface-muted)] text-[var(--ink-primary)] font-medium cursor-pointer"
              >
                {isAr ? 'العودة للوحة التحكم' : 'Back to Dashboard'}
              </button>
            </div>
          </div>
        )}

        {authScreen === 'signup' && (
          <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--border-hairline)] rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-[var(--ink-primary)]">
              {isAr ? 'إعداد فكرة مشروعك خطوة بخطوة' : 'Guided setup for your business idea'}
            </h2>
            <p className="mt-1.5 text-sm text-[var(--ink-secondary)]">
              {isAr
                ? 'أدخل بياناتك الأساسية لنخصص لك التكاليف والربحية.'
                : 'Enter your name and business idea, then customize costs and goals step by step.'}
            </p>

            <form onSubmit={handleSignupSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--ink-primary)] mb-1.5">
                  {isAr ? 'اسمك الكامل *' : 'Your Full Name *'}
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={isAr ? 'مثال: نورة المنصور' : 'e.g. Noura Al-Mansour'}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--ink-primary)] mb-1.5">
                  {isAr ? 'اسم المشروع *' : 'Business Name *'}
                </label>
                <input
                  type="text"
                  value={businessNameInput}
                  onChange={(e) => setBusinessNameInput(e.target.value)}
                  placeholder={isAr ? 'مثال: استوديو بلوم' : 'e.g. Bloom Studio'}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--ink-primary)] mb-1.5">
                  {isAr ? 'فكرة المشروع' : 'Business Idea'}
                </label>
                <input
                  type="text"
                  value={businessIdeaInput}
                  onChange={(e) => setBusinessIdeaInput(e.target.value)}
                  placeholder={isAr ? 'ماذا ستقدم لعملائك؟' : 'What will you craft, bake, or offer?'}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--ink-primary)] mb-1.5">
                  {isAr ? 'البريد الإلكتروني (اختياري)' : 'Email address (Optional)'}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="noura@yourbusiness.com"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-lg bg-[var(--blueprint)] text-white text-sm font-semibold hover:opacity-90 transition-colors cursor-pointer"
              >
                {isAr ? 'متابعة لإعداد المشروع' : 'Continue to Guided Setup'}
              </button>
            </form>

            <div className="mt-5 text-center text-xs text-[var(--ink-secondary)]">
              {isAr ? 'تريد الدخول السريع مباشرة؟ ' : 'Want instant sign-in instead? '}
              <button
                type="button"
                onClick={() => setAuthScreen('login')}
                className="font-semibold text-[var(--blueprint)] hover:underline cursor-pointer"
              >
                {isAr ? 'دخول سريع بفكرة مشروعك' : 'Quick sign-in with your idea'}
              </button>
            </div>
          </div>
        )}

        {authScreen === 'forgot_password' && (
          <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--border-hairline)] rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-[var(--ink-primary)]">
              {isAr ? 'استعادة كلمة المرور' : 'Reset your password'}
            </h2>
            <p className="mt-1.5 text-sm text-[var(--ink-secondary)]">
              {isAr
                ? 'أدخل بريدك الإلكتروني وسنرسل لك تعليمات إعادة التعيين.'
                : 'Enter your account email and we will send password recovery instructions.'}
            </p>
            <form onSubmit={handleForgotSubmit} className="mt-6 space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@yourstudio.com"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm"
              />
              {resetSent && (
                <div className="p-3 rounded-lg bg-[var(--blueprint-soft)] border border-[var(--blueprint)]/50 text-xs text-[var(--ink-primary)]">
                  {isAr
                    ? 'تم إرسال رسالة الاستعادة! تفقد بريدك الوارد.'
                    : 'Recovery instructions sent! Check your inbox.'}
                </div>
              )}
              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-lg bg-[var(--blueprint)] text-white text-sm font-semibold hover:opacity-90 cursor-pointer"
              >
                {isAr ? 'إرسال رابط الاستعادة' : 'Send Reset Link'}
              </button>
            </form>
            <button
              type="button"
              onClick={() => setAuthScreen('login')}
              className="mt-4 w-full text-center text-xs text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] cursor-pointer"
            >
              {isAr ? 'العودة لتسجيل الدخول' : 'Back to Sign In'}
            </button>
          </div>
        )}

        {authScreen === 'onboarding' && (
          <div className="w-full max-w-3xl bg-[var(--surface)] border border-[var(--border-hairline)] rounded-2xl p-6 sm:p-8">
            {/* Step Progress Header */}
            <div className="flex items-center justify-between gap-4 pb-6 border-b border-[var(--border-hairline)]">
              <div>
                <div className="text-xs font-medium text-[var(--blueprint)]">
                  {isAr ? `الخطوة ${wizardStep} من 5` : `Step ${wizardStep} of 5`}
                </div>
                <h2 className="mt-1 text-xl sm:text-2xl font-bold text-[var(--ink-primary)]">
                  {wizardStep === 1 && (isAr ? 'معلومات النشاط التجاري' : 'Business Information')}
                  {wizardStep === 2 && (isAr ? 'اختر نوع نشاطك التجاري' : 'Select Your Business Type')}
                  {wizardStep === 3 && (isAr ? 'متطلبات نشاطك الخاصة' : 'Business Requirements')}
                  {wizardStep === 4 && (isAr ? 'الإعداد المالي والتكاليف' : 'Financial & Margin Setup')}
                  {wizardStep === 5 && (isAr ? 'حدد هدف نمو مشروعك' : 'Set Your First Business Goal')}
                </h2>
              </div>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setWizardStep(s)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      s === wizardStep ? 'w-8 bg-[var(--blueprint)]' : s < wizardStep ? 'w-4 bg-[var(--blueprint)]/50' : 'w-4 bg-[#323741]'
                    }`}
                    aria-label={`Step ${s}`}
                  />
                ))}
              </div>
            </div>

            <div className="py-6">
              {wizardStep === 1 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-[var(--ink-primary)] mb-1.5">
                      {isAr ? 'اسم النشاط التجاري' : 'Business Name'}
                    </label>
                    <input
                      type="text"
                      value={formProfile.name}
                      onChange={(e) => setFormProfile({ ...formProfile, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--ink-primary)] mb-1.5">
                      {isAr ? 'الدولة' : 'Country'}
                    </label>
                    <select
                      value={formProfile.country}
                      onChange={(e) => setFormProfile({ ...formProfile, country: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm"
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--ink-primary)] mb-1.5">
                      {isAr ? 'العملة' : 'Currency'}
                    </label>
                    <select
                      value={formProfile.currency}
                      onChange={(e) => setFormProfile({ ...formProfile, currency: e.target.value as CurrencyCode })}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm"
                    >
                      {CURRENCIES.map((cur) => (
                        <option key={cur} value={cur}>
                          {cur}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--ink-primary)] mb-1.5">
                      {isAr ? 'اللغة المفضلة' : 'Preferred Language'}
                    </label>
                    <select
                      value={formProfile.language}
                      onChange={(e) => {
                        const lang = e.target.value as 'en' | 'ar';
                        setFormProfile({ ...formProfile, language: lang });
                        setLanguage(lang);
                      }}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm"
                    >
                      <option value="en">English</option>
                      <option value="ar">العربية (RTL)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--ink-primary)] mb-1.5">
                      {isAr ? 'تاريخ بدء المشروع' : 'Business Start Date'}
                    </label>
                    <input
                      type="date"
                      value={formProfile.startDate}
                      onChange={(e) => setFormProfile({ ...formProfile, startDate: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm font-num"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-[var(--ink-primary)] mb-1.5">
                      {isAr ? 'وصف مختصر للمشروع' : 'Business Description'}
                    </label>
                    <textarea
                      rows={3}
                      value={formProfile.description}
                      onChange={(e) => setFormProfile({ ...formProfile, description: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm"
                    />
                  </div>
                </div>
              )}

              {wizardStep === 2 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(Object.keys(BUSINESS_TYPE_META) as BusinessType[]).map((bt) => {
                    const Icon = BUSINESS_ICONS[bt];
                    const selected = formProfile.type === bt;
                    const meta = BUSINESS_TYPE_META[bt][language];
                    return (
                      <button
                        key={bt}
                        type="button"
                        onClick={() => setFormProfile({ ...formProfile, type: bt })}
                        className={`p-4 rounded-xl border text-start transition-colors cursor-pointer ${
                          selected
                            ? 'bg-[var(--blueprint-soft)] border-[var(--blueprint)]'
                            : 'bg-[var(--surface-muted)] border-[var(--border-hairline)] hover:border-[var(--blueprint)]/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <Icon className={`w-5 h-5 ${selected ? 'text-[var(--positive)]' : 'text-[var(--blueprint)]'}`} />
                          {selected && <Check className="w-4 h-4 text-[var(--positive)]" />}
                        </div>
                        <div className="mt-3 text-sm font-semibold text-[var(--ink-primary)]">{meta.title}</div>
                        <p className="mt-1 text-xs text-[var(--ink-secondary)] leading-relaxed">{meta.subtitle}</p>
                      </button>
                    );
                  })}
                </div>
              )}

              {wizardStep === 3 && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-lg bg-[var(--surface-muted)]/70 text-xs text-[var(--ink-primary)]">
                    {isAr
                      ? `مخصص لنشاط: ${BUSINESS_TYPE_META[formProfile.type].ar.title}`
                      : `Tailored for: ${BUSINESS_TYPE_META[formProfile.type].en.title}`}
                  </div>
                  {renderBusinessRequirements()}
                </div>
              )}

              {wizardStep === 4 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[var(--ink-primary)] mb-1.5">
                      {isAr ? `رأس المال المبدئي (${formProfile.currency})` : `Initial Budget (${formProfile.currency})`}
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formProfile.initialBudget}
                      onChange={(e) => setFormProfile({ ...formProfile, initialBudget: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm font-num"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--ink-primary)] mb-1.5">
                      {isAr ? `المصاريف الثابتة الشهرية (${formProfile.currency})` : `Fixed Monthly Expenses (${formProfile.currency})`}
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formProfile.fixedMonthlyExpenses}
                      onChange={(e) => setFormProfile({ ...formProfile, fixedMonthlyExpenses: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm font-num"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--ink-primary)] mb-1.5">
                      {isAr ? `المصاريف المتغيرة التقديرية (${formProfile.currency})` : `Variable Monthly Expenses (${formProfile.currency})`}
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formProfile.variableMonthlyExpenses}
                      onChange={(e) => setFormProfile({ ...formProfile, variableMonthlyExpenses: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm font-num"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--ink-primary)] mb-1.5">
                      {isAr ? `أجر ساعة العمل الافتراضي (${formProfile.currency}/ساعة)` : `Labor Rate (${formProfile.currency}/hour)`}
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formProfile.defaultLaborRatePerHour}
                      onChange={(e) => setFormProfile({ ...formProfile, defaultLaborRatePerHour: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm font-num"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--ink-primary)] mb-1.5">
                      {isAr ? `متوسط تكلفة التغليف (${formProfile.currency})` : `Default Packaging Cost (${formProfile.currency})`}
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formProfile.defaultPackagingCost}
                      onChange={(e) => setFormProfile({ ...formProfile, defaultPackagingCost: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm font-num"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--ink-primary)] mb-1.5">
                      {isAr ? 'هامش الربح المستهدف (%)' : 'Desired Net Profit Margin (%)'}
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={85}
                      value={Math.round(formProfile.desiredProfitMargin * 100)}
                      onChange={(e) =>
                        setFormProfile({ ...formProfile, desiredProfitMargin: Math.max(0.05, Math.min(0.85, Number(e.target.value) / 100)) })
                      }
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm font-num"
                    />
                  </div>
                </div>
              )}

              {wizardStep === 5 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      {
                        type: 'monthly_profit' as GoalType,
                        title: isAr ? `تحقيق صافي ربح شهري 5,000 ${formProfile.currency}` : `Reach a monthly net profit of 5,000 ${formProfile.currency}`,
                        target: 5000,
                      },
                      {
                        type: 'order_count' as GoalType,
                        title: isAr ? 'بيع 100 منتج أو طلب شهرياً' : 'Sell 100 products per month',
                        target: 100,
                      },
                      {
                        type: 'cost_reduction' as GoalType,
                        title: isAr ? 'تقليل تكاليف الإنتاج بنسبة 10%' : 'Reduce production costs by 10%',
                        target: 10,
                      },
                      {
                        type: 'customer_count' as GoalType,
                        title: isAr ? 'الوصول إلى 50 عميلاً متكرراً' : 'Reach 50 recurring customers',
                        target: 50,
                      },
                    ].map((preset) => (
                      <button
                        key={preset.type}
                        type="button"
                        onClick={() => {
                          setGoalType(preset.type);
                          setGoalTitle(preset.title);
                          setGoalTarget(preset.target);
                        }}
                        className={`p-3.5 rounded-xl border text-start text-xs font-medium transition-colors cursor-pointer ${
                          goalType === preset.type
                            ? 'bg-[var(--blueprint-soft)] border-[var(--blueprint)] text-[var(--ink-primary)]'
                            : 'bg-[var(--surface-muted)] border-[var(--border-hairline)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]'
                        }`}
                      >
                        {preset.title}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-[var(--ink-primary)] mb-1.5">
                        {isAr ? 'عنوان الهدف' : 'Goal Title'}
                      </label>
                      <input
                        type="text"
                        value={goalTitle}
                        onChange={(e) => setGoalTitle(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[var(--ink-primary)] mb-1.5">
                        {isAr ? 'القيمة المستهدفة' : 'Target Value'}
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={goalTarget}
                        onChange={(e) => setGoalTarget(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm font-num"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--ink-primary)] mb-1.5">
                      {isAr ? 'الموعد المستهدف' : 'Target Completion Date'}
                    </label>
                    <input
                      type="date"
                      value={goalDeadline}
                      onChange={(e) => setGoalDeadline(e.target.value)}
                      className="w-full sm:w-56 px-3.5 py-2.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-sm font-num"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer Controls */}
            <div className="pt-5 border-t border-[var(--border-hairline)] flex items-center justify-between gap-3">
              <button
                type="button"
                disabled={wizardStep === 1}
                onClick={() => setWizardStep((s) => Math.max(1, s - 1))}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[var(--border-hairline)] text-sm font-medium text-[var(--ink-primary)] disabled:opacity-40 hover:bg-[var(--surface-muted)] cursor-pointer"
              >
                {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                <span>{isAr ? 'السابق' : 'Previous'}</span>
              </button>

              {wizardStep < 5 ? (
                <button
                  type="button"
                  onClick={() => setWizardStep((s) => Math.min(5, s + 1))}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[var(--blueprint)] text-white text-sm font-semibold hover:opacity-90 cursor-pointer"
                >
                  <span>{isAr ? 'التالي' : 'Next Step'}</span>
                  {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={handleFinishWizard}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[var(--blueprint)] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{isAr ? 'إنشاء لوحة التحكم الخاصة بي' : 'Generate My Dashboard'}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
