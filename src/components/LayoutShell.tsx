import React, { useState } from 'react';
import {
  Bell,
  Briefcase,
  ClipboardList,
  Globe,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  Moon,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  PieChart,
  Receipt,
  Settings,
  ShoppingBag,
  Sparkles,
  Sun,
  Target,
  Users,
  X,
} from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import { getT } from '../i18n/translations';
import { AppSection } from '../types/business';

interface LayoutShellProps {
  children: React.ReactNode;
}

export function LayoutShell({ children }: LayoutShellProps) {
  const {
    activeSection,
    setActiveSection,
    setAuthScreen,
    business,
    user,
    language,
    setLanguage,
    theme,
    setTheme,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    signOutToSample,
    toasts,
    dismissToast,
  } = useBusiness();

  const t = getT(language);
  const isAr = language === 'ar';
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Exact 9 friendly navigation items requested for Bizwise
  const navItems: { id: AppSection; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', label: t.nav.dashboard, icon: LayoutDashboard },
    { id: 'orders', label: t.nav.orders, icon: ClipboardList },
    { id: 'products', label: t.nav.products, icon: ShoppingBag },
    { id: 'inventory', label: t.nav.inventory, icon: Package },
    { id: 'customers', label: t.nav.customers, icon: Users },
    { id: 'expenses', label: t.nav.expenses, icon: Receipt },
    { id: 'finance', label: t.nav.finance, icon: PieChart },
    { id: 'goals', label: t.nav.goals, icon: Target },
    { id: 'settings', label: t.nav.settings, icon: Settings },
  ];

  const sectionTitleMap: Record<AppSection, string> = {
    dashboard: t.nav.dashboard,
    orders: t.nav.orders,
    products: t.nav.products,
    inventory: t.nav.inventory,
    customers: t.nav.customers,
    expenses: t.nav.expenses,
    finance: t.nav.finance,
    pricing: t.nav.pricing,
    goals: t.nav.goals,
    reports: t.nav.reports,
    advisor: t.nav.advisor,
    settings: t.nav.settings,
  };

  const handleSelectNav = (id: AppSection) => {
    setActiveSection(id);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex bg-[var(--canvas)] text-[var(--ink-primary)]">
      {/* Desktop Collapsible Sidebar */}
      <aside
        className={`hidden lg:flex lg:flex-col lg:shrink-0 bg-[var(--surface)] border-e border-[var(--border-hairline)] transition-[width] duration-200 ${
          collapsed ? 'lg:w-20' : 'lg:w-64'
        }`}
      >
        {/* Bizwise Brand Header */}
        <div className="px-4 py-4 h-16 border-b border-[var(--border-hairline)] flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => handleSelectNav('dashboard')}
            className="flex items-center gap-2.5 min-w-0 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-[var(--blueprint)] text-white flex items-center justify-center shrink-0">
              <Briefcase className="w-4 h-4" />
            </div>
            {!collapsed && (
              <span className="text-lg font-bold tracking-tight text-[var(--ink-primary)] whitespace-nowrap">
                Bizwise
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="p-1.5 rounded-lg text-[var(--ink-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--ink-primary)] transition-colors cursor-pointer"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>

        {/* Business Context Pill-Free Header */}
        {!collapsed && (
          <div className="px-4 py-3 border-b border-[var(--border-hairline)]">
            <div className="text-xs font-semibold text-[var(--ink-primary)] truncate">{business.name}</div>
            <div className="mt-0.5 text-[11px] text-[var(--ink-secondary)] flex items-center gap-1.5 truncate">
              <span>{business.currency}</span>
              <span aria-hidden="true">·</span>
              <span className="truncate">
                {user.isDemo ? t.demoMode : user.fullName}
              </span>
            </div>
          </div>
        )}

        {/* Primary 9 Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              activeSection === item.id ||
              (item.id === 'products' && activeSection === 'pricing') ||
              (item.id === 'finance' && activeSection === 'reports');

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectNav(item.id)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center ${
                  collapsed ? 'justify-center px-2' : 'gap-3 px-3.5'
                } py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[var(--blueprint-soft)] text-[var(--ink-primary)] font-semibold'
                    : 'text-[var(--ink-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--ink-primary)]'
                }`}
              >
                <Icon
                  className={`w-[18px] h-[18px] shrink-0 ${
                    isActive ? 'text-[var(--blueprint)]' : 'text-[var(--ink-secondary)]'
                  }`}
                />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Bottom Profile & Setup Access */}
        <div className="p-3 border-t border-[var(--border-hairline)] space-y-1.5">
          {user.isDemo ? (
            <button
              type="button"
              onClick={() => setAuthScreen('login')}
              title={collapsed ? (isAr ? 'سجّل بفكرة مشروعك' : 'Sign In with Your Idea') : undefined}
              className={`w-full flex items-center ${
                collapsed ? 'justify-center px-2' : 'justify-center gap-2 px-3'
              } py-2.5 rounded-xl bg-[var(--blueprint-soft)] text-[var(--blueprint)] text-xs font-semibold hover:opacity-90 transition-opacity whitespace-nowrap cursor-pointer`}
            >
              <LogIn className="w-4 h-4 shrink-0" />
              {!collapsed && <span>{isAr ? 'سجّل بفكرة مشروعك' : 'Sign In with Your Idea'}</span>}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setAuthScreen('login')}
                title={collapsed ? user.fullName : undefined}
                className={`w-full flex items-center ${
                  collapsed ? 'justify-center px-2' : 'justify-between px-3'
                } py-2 rounded-xl text-xs text-[var(--ink-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--ink-primary)] transition-colors cursor-pointer`}
              >
                {!collapsed ? (
                  <>
                    <span className="truncate font-medium text-[var(--ink-primary)]">{user.fullName}</span>
                    <span className="flex items-center gap-1 text-[var(--blueprint)] shrink-0">
                      <LogIn className="w-3.5 h-3.5" />
                      <span>{isAr ? 'تبديل' : 'Switch'}</span>
                    </span>
                  </>
                ) : (
                  <LogIn className="w-4 h-4 text-[var(--blueprint)]" />
                )}
              </button>
              {!collapsed && (
                <button
                  type="button"
                  onClick={signOutToSample}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border-hairline)] text-xs font-medium text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--surface-muted)] transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{isAr ? 'تسجيل الخروج' : 'Sign Out'}</span>
                </button>
              )}
            </>
          )}
        </div>
      </aside>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setMobileMenuOpen(false)} />
          <aside className="relative z-10 w-72 max-w-[85vw] bg-[var(--surface)] h-full flex flex-col border-e border-[var(--border-hairline)]">
            <div className="px-4 py-4 border-b border-[var(--border-hairline)] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[var(--blueprint)] text-white flex items-center justify-center">
                  <Briefcase className="w-4 h-4" />
                </div>
                <span className="text-base font-bold text-[var(--ink-primary)]">Bizwise</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg text-[var(--ink-secondary)] hover:bg-[var(--surface-muted)]"
                aria-label="Close navigation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectNav(item.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium ${
                      isActive
                        ? 'bg-[var(--blueprint-soft)] text-[var(--ink-primary)] font-semibold'
                        : 'text-[var(--ink-secondary)]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[var(--blueprint)]' : ''}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
            <div className="p-3 border-t border-[var(--border-hairline)] space-y-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setActiveSection('advisor');
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-[var(--blueprint)] text-white text-xs font-semibold"
              >
                {t.topbar.askAdvisor}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setAuthScreen('login');
                }}
                className="w-full py-2.5 px-3 rounded-xl border border-[var(--border-hairline)] text-xs font-medium text-[var(--ink-primary)]"
              >
                {user.isDemo
                  ? isAr
                    ? 'سجّل بفكرة مشروعك'
                    : 'Sign In with Your Idea'
                  : isAr
                  ? 'تبديل المشروع'
                  : 'Switch Business Idea'}
              </button>
              {!user.isDemo && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    signOutToSample();
                  }}
                  className="w-full py-2 px-3 rounded-xl text-xs font-medium text-[var(--ink-secondary)]"
                >
                  {isAr ? 'تسجيل الخروج' : 'Sign Out'}
                </button>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Clean 3-Zone Header */}
        <header className="sticky top-0 z-30 bg-[var(--surface)]/95 backdrop-blur-sm border-b border-[var(--border-hairline)] px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -ms-2 rounded-lg text-[var(--ink-secondary)] hover:bg-[var(--surface-muted)]"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-base sm:text-lg font-semibold text-[var(--ink-primary)] truncate">
              {sectionTitleMap[activeSection]}
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-[var(--ink-primary)] hover:border-[var(--blueprint)]/50 transition-colors cursor-pointer"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Navy Mode'}
              aria-label="Toggle Light/Dark theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-[var(--blueprint)]" />
              ) : (
                <Moon className="w-4 h-4 text-[var(--blueprint)]" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-xs font-medium text-[var(--ink-primary)] hover:border-[var(--blueprint)]/50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              title="Switch Language (English / Arabic)"
            >
              <Globe className="w-3.5 h-3.5 text-[var(--blueprint)]" />
              <span>{language === 'en' ? 'العربية' : 'English'}</span>
            </button>

            {/* Notifications Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen((v) => !v)}
                className="relative p-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-[var(--ink-primary)] hover:border-[var(--blueprint)]/50 transition-colors cursor-pointer"
                aria-label={t.topbar.notifications}
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -end-1 min-w-[18px] h-[18px] px-1 rounded-md bg-[var(--blueprint)] text-white text-[10px] font-num flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setNotifOpen(false)} />
                  <div className="absolute end-0 mt-2 w-80 sm:w-96 bg-[var(--surface)] border border-[var(--border-hairline)] rounded-2xl shadow-xl z-40 overflow-hidden">
                    <div className="px-4 py-3 border-b border-[var(--border-hairline)] flex items-center justify-between">
                      <span className="text-sm font-semibold text-[var(--ink-primary)]">{t.topbar.notifications}</span>
                      <button
                        type="button"
                        onClick={markAllNotificationsRead}
                        className="text-xs text-[var(--blueprint)] hover:underline cursor-pointer"
                      >
                        {isAr ? 'تحديد الكل كمقروء' : 'Mark all read'}
                      </button>
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-[var(--border-hairline)]">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-[var(--ink-secondary)]">{t.common.noData}</div>
                      ) : (
                        notifications.map((n) => (
                          <button
                            key={n.id}
                            type="button"
                            onClick={() => {
                              markNotificationRead(n.id);
                              if (n.targetSection) setActiveSection(n.targetSection);
                              setNotifOpen(false);
                            }}
                            className={`w-full text-start px-4 py-3 hover:bg-[var(--surface-muted)] transition-colors cursor-pointer ${
                              !n.read ? 'bg-[var(--blueprint-soft)]' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold text-[var(--ink-primary)]">{n.title}</span>
                              <span className="text-[11px] font-num text-[var(--ink-secondary)] shrink-0">
                                {n.createdAt}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-[var(--ink-secondary)] leading-relaxed">{n.message}</p>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setActiveSection('advisor')}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--blueprint)] text-white text-xs font-semibold hover:opacity-90 transition-opacity whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t.topbar.askAdvisor}</span>
            </button>
          </div>
        </header>

        {/* Main Scrollable Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1360px] w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Confirmation Toasts */}
      {toasts.length > 0 && (
        <div className="fixed bottom-4 end-4 z-50 flex flex-col gap-2 max-w-sm w-full px-4 sm:px-0">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border shadow-lg text-xs font-medium ${
                toast.type === 'error'
                  ? 'bg-[var(--surface)] border-[var(--danger)] text-[var(--danger)]'
                  : toast.type === 'success'
                  ? 'bg-[var(--surface)] border-[var(--positive)] text-[var(--ink-primary)]'
                  : 'bg-[var(--surface)] border-[var(--border-hairline)] text-[var(--ink-primary)]'
              }`}
            >
              <span>{toast.text}</span>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="p-1 rounded hover:bg-[var(--surface-muted)] shrink-0"
                aria-label="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
