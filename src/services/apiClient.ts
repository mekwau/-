import { WebhookConfig } from '../types/business';

export interface ApiResult<T = unknown> {
  ok: boolean;
  mode: 'demo' | 'live';
  endpoint: string;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface RequestLogEntry {
  id: string;
  endpoint: string;
  method: 'POST';
  mode: 'demo' | 'live';
  ok: boolean;
  statusText: string;
  timestamp: string;
}

function resolveWebhookUrl(config: WebhookConfig, endpointPath: string): string {
  const cleanBase = config.baseUrl.trim().replace(/\/+$/, '');
  const cleanPath = endpointPath.startsWith('/') ? endpointPath : `/${endpointPath}`;
  if (endpointPath.startsWith('http://') || endpointPath.startsWith('https://')) {
    return endpointPath;
  }
  if (!cleanBase) return '';
  return `${cleanBase}${cleanPath}`;
}

export async function dispatchWebhook<TPayload, TResponse = unknown>(
  config: WebhookConfig,
  endpointKey: keyof WebhookConfig['endpoints'],
  payload: TPayload,
  onLog?: (entry: RequestLogEntry) => void
): Promise<ApiResult<TResponse>> {
  const endpointPath = config.endpoints[endpointKey];
  const timestamp = new Date().toISOString();

  // In Demo Mode, do not fake network calls to unconfigured webhooks — return cleanly scoped local execution notice
  if (config.mode === 'demo') {
    const entry: RequestLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      endpoint: endpointPath,
      method: 'POST',
      mode: 'demo',
      ok: true,
      statusText: 'Local Demo State Updated',
      timestamp,
    };
    onLog?.(entry);
    return {
      ok: true,
      mode: 'demo',
      endpoint: endpointPath,
      timestamp,
    };
  }

  const targetUrl = resolveWebhookUrl(config, endpointPath);
  if (!targetUrl) {
    const errMsg = `No n8n Webhook Base URL configured for ${endpointPath}. Update it in Settings > Integrations.`;
    onLog?.({
      id: `log-${Date.now()}`,
      endpoint: endpointPath,
      method: 'POST',
      mode: 'live',
      ok: false,
      statusText: 'Missing Base URL',
      timestamp,
    });
    return {
      ok: false,
      mode: 'live',
      endpoint: endpointPath,
      error: errMsg,
      timestamp,
    };
  }

  try {
    let response: Response;
    if (config.useServerProxy) {
      response = await fetch('/api/webhook/forward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUrl, payload }),
      });
    } else {
      response = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }

    const body = await response.json().catch(() => ({}));
    if (!response.ok || body?.ok === false) {
      const errorMessage = body?.error || `Webhook request failed (${response.status})`;
      onLog?.({
        id: `log-${Date.now()}`,
        endpoint: endpointPath,
        method: 'POST',
        mode: 'live',
        ok: false,
        statusText: `HTTP ${response.status}`,
        timestamp,
      });
      return {
        ok: false,
        mode: 'live',
        endpoint: endpointPath,
        error: errorMessage,
        timestamp,
      };
    }

    onLog?.({
      id: `log-${Date.now()}`,
      endpoint: endpointPath,
      method: 'POST',
      mode: 'live',
      ok: true,
      statusText: `HTTP ${response.status} OK`,
      timestamp,
    });

    return {
      ok: true,
      mode: 'live',
      endpoint: endpointPath,
      data: (body?.data ?? body) as TResponse,
      timestamp,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Network error calling webhook.';
    onLog?.({
      id: `log-${Date.now()}`,
      endpoint: endpointPath,
      method: 'POST',
      mode: 'live',
      ok: false,
      statusText: 'Network Error',
      timestamp,
    });
    return {
      ok: false,
      mode: 'live',
      endpoint: endpointPath,
      error: message,
      timestamp,
    };
  }
}

export interface AdvisorResponse {
  answer: string;
  keyMetrics?: { label: string; value: string }[];
  recommendations?: string[];
  proposedAction?: {
    type: 'record_expense' | 'update_product_price' | 'create_goal' | 'send_followup' | 'update_order_status' | 'none';
    title: string;
    description: string;
    requiresConfirmation: boolean;
    payloadJson?: string;
  } | null;
}

export async function askBusinessAdvisor(
  config: WebhookConfig,
  question: string,
  language: 'en' | 'ar',
  businessContext: Record<string, unknown>,
  onLog?: (entry: RequestLogEntry) => void
): Promise<ApiResult<AdvisorResponse>> {
  const timestamp = new Date().toISOString();

  // If Live mode + n8n AI webhook configured, route to n8n first
  if (config.mode === 'live' && resolveWebhookUrl(config, config.endpoints.aiAsk)) {
    const webhookRes = await dispatchWebhook<
      { question: string; language: 'en' | 'ar'; businessContext: Record<string, unknown> },
      AdvisorResponse
    >(config, 'aiAsk', { question, language, businessContext }, onLog);

    if (webhookRes.ok && webhookRes.data) {
      return webhookRes;
    }
    return {
      ok: false,
      mode: 'live',
      endpoint: config.endpoints.aiAsk,
      error: webhookRes.error || 'n8n AI webhook returned an error.',
      timestamp,
    };
  }

  // Otherwise call server-side Gemini Business Advisor endpoint (/api/ai/ask)
  try {
    const res = await fetch('/api/ai/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, language, businessContext }),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json?.ok) {
      onLog?.({
        id: `log-${Date.now()}`,
        endpoint: '/api/ai/ask',
        method: 'POST',
        mode: config.mode,
        ok: false,
        statusText: `HTTP ${res.status}`,
        timestamp,
      });
      return {
        ok: false,
        mode: config.mode,
        endpoint: '/api/ai/ask',
        error: json?.error || `Business Advisor failed (${res.status}).`,
        timestamp,
      };
    }

    onLog?.({
      id: `log-${Date.now()}`,
      endpoint: '/api/ai/ask',
      method: 'POST',
      mode: config.mode,
      ok: true,
      statusText: '200 OK',
      timestamp,
    });

    return {
      ok: true,
      mode: config.mode,
      endpoint: '/api/ai/ask',
      data: json.data as AdvisorResponse,
      timestamp,
    };
  } catch (err) {
    return {
      ok: false,
      mode: config.mode,
      endpoint: '/api/ai/ask',
      error: err instanceof Error ? err.message : 'Unable to reach Business Advisor service.',
      timestamp,
    };
  }
}
