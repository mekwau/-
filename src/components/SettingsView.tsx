import React, { useMemo, useState } from 'react';
import { Check, Code2, Copy, Play, Plus, RefreshCw, Server, Trash2 } from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import { BUSINESS_TYPE_META } from '../i18n/translations';
import { dispatchWebhook } from '../services/apiClient';
import { BusinessType, CurrencyCode, TeamMember } from '../types/business';

const CURRENCIES: CurrencyCode[] = ['SAR', 'AED', 'KWD', 'QAR', 'EGP', 'USD', 'EUR', 'GBP'];

export function SettingsView() {
  const {
    language,
    setLanguage,
    business,
    setBusiness,
    team,
    setTeam,
    notificationPrefs,
    setNotificationPrefs,
    webhookConfig,
    setWebhookConfig,
    requestLogs,
    switchDemoPreset,
    pushToast,
  } = useBusiness();

  const isAr = language === 'ar';
  const [settingsTab, setSettingsTab] = useState<'general' | 'integrations'>('general');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<TeamMember['role']>('staff');
  const [codeTab, setCodeTab] = useState<'n8n_json' | 'js_client' | 'curl'>('n8n_json');
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [testOutput, setTestOutput] = useState<string | null>(null);

  const handleAddTeamMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim() || !newMemberEmail.trim()) return;
    setTeam((prev) => [
      ...prev,
      {
        id: `tm-${Date.now()}`,
        name: newMemberName.trim(),
        email: newMemberEmail.trim(),
        role: newMemberRole,
        active: true,
      },
    ]);
    setNewMemberName('');
    setNewMemberEmail('');
    pushToast('success', isAr ? 'تمت إضافة عضو الفريق' : 'Team member added');
  };

  const sampleBaseUrl = webhookConfig.baseUrl.trim() || 'https://your-n8n-instance.app.n8n.cloud';

  // Importable n8n Workflow JSON supporting Small Business OS webhooks
  const n8nWorkflowJson = useMemo(
    () =>
      JSON.stringify(
        {
          name: 'Bizwise - Core Webhook Router',
          nodes: [
            {
              parameters: {
                httpMethod: 'POST',
                path: 'business-os/:action',
                responseMode: 'responseNode',
                options: {},
              },
              id: 'webhook-trigger',
              name: 'Bizwise Webhook',
              type: 'n8n-nodes-base.webhook',
              typeVersion: 2,
              position: [240, 300],
            },
            {
              parameters: {
                jsCode: `// Route incoming Small Business OS payload to Supabase / AI / Notifications\nconst action = $input.first().json.params?.action || 'event';\nconst body = $input.first().json.body || {};\n\nreturn [{\n  json: {\n    ok: true,\n    action,\n    receivedAt: new Date().toISOString(),\n    businessId: body.businessId || body.id || null,\n    echo: body\n  }\n}];`,
              },
              id: 'process-node',
              name: 'Process Operation',
              type: 'n8n-nodes-base.code',
              typeVersion: 2,
              position: [500, 300],
            },
            {
              parameters: {
                respondWith: 'json',
                responseBody: '={{ $json }}',
                options: { responseCode: 200 },
              },
              id: 'respond-node',
              name: 'Respond to App',
              type: 'n8n-nodes-base.respondToWebhook',
              typeVersion: 1.1,
              position: [760, 300],
            },
          ],
          connections: {
            'Bizwise Webhook': {
              main: [[{ node: 'Process Operation', type: 'main', index: 0 }]],
            },
            'Process Operation': {
              main: [[{ node: 'Respond to App', type: 'main', index: 0 }]],
            },
          },
        },
        null,
        2
      ),
    []
  );

  const jsIntegrationSnippet = useMemo(
    () => `// Small Business OS -> n8n Webhook Integration Client
const N8N_BASE_URL = "${sampleBaseUrl}";

export async function callN8nWebhook(endpointPath, payload) {
  const response = await fetch(\`\${N8N_BASE_URL}\${endpointPath}\`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      businessId: "${business.id}",
      timestamp: new Date().toISOString(),
      ...payload,
    }),
  });

  if (!response.ok) {
    throw new Error(\`n8n webhook error: HTTP \${response.status}\`);
  }
  return response.json();
}

// Example: Create order & trigger n8n automation
await callN8nWebhook("${webhookConfig.endpoints.orderCreate}", {
  orderNumber: "ORD-1046",
  customerName: "Reem Al-Otaibi",
  totalPrice: 240,
  status: "confirmed",
});`,
    [sampleBaseUrl, business.id, webhookConfig.endpoints.orderCreate]
  );

  const curlSnippet = useMemo(
    () => `curl -X POST "${sampleBaseUrl}${webhookConfig.endpoints.orderCreate}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "businessId": "${business.id}",
    "orderNumber": "ORD-TEST-001",
    "customerName": "Test Customer",
    "totalPrice": 120,
    "status": "new"
  }'`,
    [sampleBaseUrl, business.id, webhookConfig.endpoints.orderCreate]
  );

  const activeSnippet =
    codeTab === 'n8n_json' ? n8nWorkflowJson : codeTab === 'js_client' ? jsIntegrationSnippet : curlSnippet;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(activeSnippet);
      pushToast('success', isAr ? 'تم نسخ كود الربط' : 'Integration code copied to clipboard');
    } catch {
      pushToast('error', 'Copy failed');
    }
  };

  const handleTestConnection = async () => {
    if (!webhookConfig.baseUrl.trim()) {
      pushToast('error', isAr ? 'أدخل رابط n8n الأساسي أولاً' : 'Enter your n8n Webhook Base URL first.');
      return;
    }
    setTestingWebhook(true);
    setTestOutput(null);
    const liveTempConfig = { ...webhookConfig, mode: 'live' as const };
    const res = await dispatchWebhook(liveTempConfig, 'financeSummary', {
      ping: true,
      businessId: business.id,
      businessName: business.name,
      timestamp: new Date().toISOString(),
    });
    setTestingWebhook(false);
    setTestOutput(JSON.stringify(res, null, 2));
    if (res.ok) {
      pushToast('success', isAr ? 'تم الاتصال بـ n8n بنجاح!' : 'Connected to n8n webhook successfully!');
    } else {
      pushToast('error', res.error || 'Webhook test failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--ink-primary)]">
            {isAr ? 'إعدادات المشروع' : 'Settings'}
          </h2>
          <p className="text-xs text-[var(--ink-secondary)] mt-1">
            {isAr
              ? 'إدارة اسم المشروع ونوع النشاط والعملة واللغة، أو ربط الأتمتة.'
              : 'Manage your business profile, currency, language, notifications, and optional integrations.'}
          </p>
        </div>

        <div className="inline-flex p-1 rounded-xl bg-[var(--surface)] border border-[var(--border-hairline)] self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setSettingsTab('general')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
              settingsTab === 'general' ? 'bg-[var(--blueprint)] text-white font-semibold' : 'text-[var(--ink-secondary)]'
            }`}
          >
            {isAr ? 'الإعدادات العامة' : 'General'}
          </button>
          <button
            type="button"
            onClick={() => setSettingsTab('integrations')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
              settingsTab === 'integrations' ? 'bg-[var(--blueprint)] text-white font-semibold' : 'text-[var(--ink-secondary)]'
            }`}
          >
            {isAr ? 'التكامل والفريق (متقدم)' : 'Integrations & Team'}
          </button>
        </div>
      </div>

      {settingsTab === 'general' && (
        <>
          {/* Business Profile & Regional Config */}
          <div className="bg-[var(--surface)] border border-[var(--border-hairline)] rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-[var(--ink-primary)]">
              {isAr ? 'ملف النشاط التجاري والعملة والضريبة' : 'Business Profile, Locale & Tax Configuration'}
            </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium mb-1">{isAr ? 'اسم النشاط' : 'Business Name'}</label>
            <input
              type="text"
              value={business.name}
              onChange={(e) => setBusiness({ ...business, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">{isAr ? 'نوع النشاط (يغير نماذج المنتجات)' : 'Business Type'}</label>
            <select
              value={business.type}
              onChange={(e) => setBusiness({ ...business, type: e.target.value as BusinessType })}
              className="w-full px-3 py-2 rounded-lg border text-sm"
            >
              {(Object.keys(BUSINESS_TYPE_META) as BusinessType[]).map((bt) => (
                <option key={bt} value={bt}>
                  {BUSINESS_TYPE_META[bt][language].title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">{isAr ? 'اللغة' : 'Language'}</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'en' | 'ar')}
              className="w-full px-3 py-2 rounded-lg border text-sm"
            >
              <option value="en">English (LTR)</option>
              <option value="ar">العربية (RTL)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">{isAr ? 'العملة' : 'Currency'}</label>
            <select
              value={business.currency}
              onChange={(e) => setBusiness({ ...business, currency: e.target.value as CurrencyCode })}
              className="w-full px-3 py-2 rounded-lg border text-sm"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">{isAr ? 'الدولة' : 'Country'}</label>
            <input
              type="text"
              value={business.country}
              onChange={(e) => setBusiness({ ...business, country: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">{isAr ? 'نسبة ضريبة القيمة المضافة (%)' : 'VAT / Tax Rate (%)'}</label>
            <input
              type="number"
              min={0}
              max={30}
              step="0.5"
              value={Math.round(business.vatRate * 100)}
              onChange={(e) => setBusiness({ ...business, vatRate: Number(e.target.value) / 100 })}
              className="w-full px-3 py-2 rounded-lg border text-sm font-num"
            />
          </div>
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => switchDemoPreset(business.type)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)] text-xs font-medium hover:border-[var(--blueprint)]/50 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[var(--blueprint)]" />
            <span>
              {isAr
                ? 'تحميل بيانات تجريبية كاملة لنوع النشاط المختار'
                : 'Load Full Demo Preset for Selected Business Type'}
            </span>
          </button>

          <span className="text-xs text-[var(--positive)] flex items-center gap-1">
            <Check className="w-3.5 h-3.5" />
            <span>{isAr ? 'يتم حفظ التعديلات تلقائياً' : 'Changes saved automatically'}</span>
          </span>
        </div>
      </div>

          {/* Notification Preferences */}
          <div className="bg-[var(--surface)] border border-[var(--border-hairline)] rounded-2xl p-6 space-y-3">
            <h3 className="text-sm font-bold text-[var(--ink-primary)]">
              {isAr ? 'تفضيلات الإشعارات' : 'Notification Preferences'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              {(
                [
                  ['newOrders', isAr ? 'الطلبات الجديدة' : 'New Orders'],
                  ['lowInventory', isAr ? 'انخفاض المخزون' : 'Low Inventory Alerts'],
                  ['pendingPayments', isAr ? 'المدفوعات المعلقة' : 'Pending Payments'],
                  ['weeklyReports', isAr ? 'التقارير الأسبوعية' : 'Weekly Reports'],
                  ['goalMilestones', isAr ? 'تحقيق أهداف النمو' : 'Goal Milestones'],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2.5 p-3 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-muted)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationPrefs[key]}
                    onChange={(e) => setNotificationPrefs({ ...notificationPrefs, [key]: e.target.checked })}
                  />
                  <span className="font-medium text-[var(--ink-primary)]">{label}</span>
                </label>
              ))}
            </div>
          </div>
        </>
      )}

      {settingsTab === 'integrations' && (
        <>
          {/* Connected Integrations & n8n Webhooks + Copyable Code */}
          <div className="bg-[var(--surface)] border border-[var(--blueprint)]/50 rounded-2xl p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-[var(--blueprint)]" />
            <h3 className="text-sm font-bold text-[var(--ink-primary)]">
              {isAr ? 'تكامل n8n Webhooks و Supabase' : 'n8n Webhook Configuration & Integration Code'}
            </h3>
          </div>

          <div className="flex items-center p-1 bg-[var(--surface-muted)] rounded-lg border border-[var(--border-hairline)]">
            <button
              type="button"
              onClick={() => setWebhookConfig({ ...webhookConfig, mode: 'demo' })}
              className={`px-3 py-1 rounded-md text-xs font-medium cursor-pointer ${
                webhookConfig.mode === 'demo' ? 'bg-[var(--blueprint)] text-white' : 'text-[var(--ink-secondary)]'
              }`}
            >
              {isAr ? 'وضع العرض التجريبي' : 'Demo Mode'}
            </button>
            <button
              type="button"
              onClick={() => setWebhookConfig({ ...webhookConfig, mode: 'live' })}
              className={`px-3 py-1 rounded-md text-xs font-medium cursor-pointer ${
                webhookConfig.mode === 'live' ? 'bg-[var(--blueprint)] text-white' : 'text-[var(--ink-secondary)]'
              }`}
            >
              {isAr ? 'الوضع الحي (n8n)' : 'Live n8n Mode'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium mb-1">
              {isAr ? 'رابط n8n الأساسي (Base URL)' : 'n8n Webhook Base URL'}
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={webhookConfig.baseUrl}
                onChange={(e) => setWebhookConfig({ ...webhookConfig, baseUrl: e.target.value })}
                placeholder="https://your-n8n-instance.app.n8n.cloud"
                className="flex-1 px-3 py-2 rounded-lg border text-xs font-num"
              />
              <button
                type="button"
                disabled={testingWebhook}
                onClick={handleTestConnection}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--blueprint)] text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50 whitespace-nowrap cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{testingWebhook ? '...' : isAr ? 'اختبار' : 'Test Ping'}</span>
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Supabase Project URL (Env / Public)</label>
            <input
              type="url"
              value={webhookConfig.supabaseUrl}
              onChange={(e) => setWebhookConfig({ ...webhookConfig, supabaseUrl: e.target.value })}
              placeholder="https://xyzproject.supabase.co"
              className="w-full px-3 py-2 rounded-lg border text-xs font-num"
            />
          </div>
        </div>

        {testOutput && (
          <pre className="p-3 rounded-xl bg-[var(--canvas)] border border-[var(--border-hairline)] text-[11px] font-num text-[var(--ink-primary)] overflow-x-auto">
            {testOutput}
          </pre>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {(Object.keys(webhookConfig.endpoints) as (keyof typeof webhookConfig.endpoints)[]).map((key) => (
            <div key={key} className="p-2.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-muted)]">
              <div className="text-[11px] font-medium text-[var(--ink-secondary)]">{key}</div>
              <input
                type="text"
                value={webhookConfig.endpoints[key]}
                onChange={(e) =>
                  setWebhookConfig({
                    ...webhookConfig,
                    endpoints: { ...webhookConfig.endpoints, [key]: e.target.value },
                  })
                }
                className="mt-1 w-full px-2 py-1 rounded border text-[11px] font-num"
              />
            </div>
          ))}
        </div>

        {/* Ready-to-Use n8n Integration Code Tabs */}
        <div className="pt-4 border-t border-[var(--border-hairline)] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--ink-primary)]">
              <Code2 className="w-4 h-4 text-[var(--blueprint)]" />
              <span>{isAr ? 'كود الربط الجاهز لـ n8n (انسخ أو استورد مباشرة)' : 'Ready-to-Use n8n Integration Code'}</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex p-1 bg-[var(--surface-muted)] rounded-lg border border-[var(--border-hairline)] text-xs">
                <button
                  type="button"
                  onClick={() => setCodeTab('n8n_json')}
                  className={`px-2.5 py-1 rounded-md font-medium cursor-pointer ${
                    codeTab === 'n8n_json' ? 'bg-[var(--blueprint)] text-white' : 'text-[var(--ink-secondary)]'
                  }`}
                >
                  n8n Workflow JSON
                </button>
                <button
                  type="button"
                  onClick={() => setCodeTab('js_client')}
                  className={`px-2.5 py-1 rounded-md font-medium cursor-pointer ${
                    codeTab === 'js_client' ? 'bg-[var(--blueprint)] text-white' : 'text-[var(--ink-secondary)]'
                  }`}
                >
                  JS Client
                </button>
                <button
                  type="button"
                  onClick={() => setCodeTab('curl')}
                  className={`px-2.5 py-1 rounded-md font-medium cursor-pointer ${
                    codeTab === 'curl' ? 'bg-[var(--blueprint)] text-white' : 'text-[var(--ink-secondary)]'
                  }`}
                >
                  cURL
                </button>
              </div>

              <button
                type="button"
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--blueprint)]/50 bg-[var(--blueprint-soft)] text-[var(--blueprint)] text-xs font-medium hover:bg-[var(--blueprint)] hover:text-white transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{isAr ? 'نسخ' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <pre
            dir="ltr"
            className="p-4 rounded-xl bg-[var(--canvas)] border border-[var(--border-hairline)] text-[11px] font-num text-[var(--ink-primary)] overflow-x-auto max-h-72 leading-relaxed"
          >
            {activeSnippet}
          </pre>
        </div>

        {requestLogs.length > 0 && (
          <div className="pt-3 border-t border-[var(--border-hairline)]">
            <div className="text-xs font-semibold text-[var(--ink-primary)] mb-2">
              {isAr ? 'سجل طلبات الخدمة الأخيرة' : 'Recent API Dispatch History'}
            </div>
            <div className="max-h-36 overflow-y-auto space-y-1 text-[11px] font-num">
              {requestLogs.slice(0, 8).map((l) => (
                <div key={l.id} className="flex items-center justify-between px-2.5 py-1.5 rounded bg-[var(--surface-muted)]">
                  <span>
                    {l.method} {l.endpoint}
                  </span>
                  <span className={l.ok ? 'text-[var(--positive)]' : 'text-[var(--danger)]'}>{l.statusText}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Team Members & Roles */}
      <div className="bg-[var(--surface)] border border-[var(--border-hairline)] rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-[var(--ink-primary)]">
          {isAr ? 'أعضاء الفريق والأدوار والصلاحيات' : 'Team Members & Permissions'}
        </h3>

        <div className="divide-y divide-[var(--border-hairline)] text-xs">
          {team.map((member) => (
            <div key={member.id} className="py-2.5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-semibold text-[var(--ink-primary)]">{member.name}</div>
                <div className="text-[var(--ink-secondary)]">{member.email}</div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={member.role}
                  onChange={(e) =>
                    setTeam((prev) =>
                      prev.map((m) =>
                        m.id === member.id ? { ...m, role: e.target.value as TeamMember['role'] } : m
                      )
                    )
                  }
                  className="px-2.5 py-1.5 rounded-lg border text-xs"
                >
                  <option value="owner">{isAr ? 'المالك (كامل الصلاحيات)' : 'Owner (Full Access)'}</option>
                  <option value="operations">{isAr ? 'إدارة الطلبات والمخزون' : 'Operations (Orders & Stock)'}</option>
                  <option value="accountant">{isAr ? 'محاسب (المالية والتقارير)' : 'Accountant (Finance & P&L)'}</option>
                  <option value="staff">{isAr ? 'طاقم الإنتاج' : 'Production Staff'}</option>
                </select>
                {member.role !== 'owner' && (
                  <button
                    type="button"
                    onClick={() => setTeam((prev) => prev.filter((m) => m.id !== member.id))}
                    className="p-1.5 text-[var(--ink-secondary)] hover:text-[var(--danger)]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleAddTeamMember} className="flex flex-wrap items-center gap-2.5 pt-2">
          <input
            type="text"
            value={newMemberName}
            onChange={(e) => setNewMemberName(e.target.value)}
            placeholder={isAr ? 'اسم العضو' : 'Member name'}
            className="px-3 py-2 rounded-lg border text-xs flex-1 min-w-[140px]"
          />
          <input
            type="email"
            value={newMemberEmail}
            onChange={(e) => setNewMemberEmail(e.target.value)}
            placeholder={isAr ? 'البريد الإلكتروني' : 'Email'}
            className="px-3 py-2 rounded-lg border text-xs flex-1 min-w-[160px]"
          />
          <select
            value={newMemberRole}
            onChange={(e) => setNewMemberRole(e.target.value as TeamMember['role'])}
            className="px-3 py-2 rounded-lg border text-xs"
          >
            <option value="operations">Operations</option>
            <option value="accountant">Accountant</option>
            <option value="staff">Staff</option>
          </select>
          <button
            type="submit"
            className="flex items-center gap-1 px-3.5 py-2 rounded-lg bg-[var(--blueprint)] text-white text-xs font-semibold cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAr ? 'دعوة' : 'Add'}</span>
          </button>
        </form>
      </div>
        </>
      )}
    </div>
  );
}
