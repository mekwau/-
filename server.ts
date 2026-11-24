import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      aiConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
      n8nConfigured: Boolean(process.env.VITE_N8N_WEBHOOK_BASE_URL),
    });
  });

  // Server-side AI Business Advisor endpoint
  app.post('/api/ai/ask', async (req, res) => {
    try {
      const { question, language, businessContext } = req.body ?? {};
      if (!question || typeof question !== 'string') {
        res.status(400).json({ error: 'Question is required.' });
        return;
      }

      const ai = getGeminiClient();
      if (!ai) {
        res.status(503).json({
          error:
            language === 'ar'
              ? 'مفتاح Gemini API غير مهيأ في إعدادات الخادم. يرجى إضافته في Settings > Secrets.'
              : 'GEMINI_API_KEY is not configured on the server. Add it in Settings > Secrets or connect an n8n AI webhook.',
        });
        return;
      }

      const systemInstruction = `You are Business Advisor, an approachable, precise Digital Business Manager Assistant inside Small Business OS for home-based business owners.
Language: Respond strictly in ${language === 'ar' ? 'Arabic' : 'English'}.
Rules:
1. Never invent or hallucinate financial numbers. Only cite figures directly present in the provided businessContext JSON or computed accurately from it.
2. If data is missing to answer a question, clearly state what is missing and how the owner can log it.
3. Explain financial concepts simply for non-accountants.
4. Provide practical, actionable recommendations tailored to the owner's business type (${businessContext?.business?.type ?? 'small business'}).
5. If an action would modify orders, record expenses, update product prices, create a goal, or send a customer follow-up, return a structured proposedAction object so the owner can confirm it before execution. Otherwise set proposedAction to null.`;

      const prompt = `Owner Question: ${question}

Actual Business Data Snapshot:
${JSON.stringify(businessContext ?? {}, null, 2)}`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              answer: {
                type: Type.STRING,
                description: 'Clear, plain-language explanation grounded strictly in the provided business data.',
              },
              keyMetrics: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: { type: Type.STRING },
                    value: { type: Type.STRING },
                  },
                },
                description: 'Up to 4 exact figures referenced from the business data.',
              },
              recommendations: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '2-4 practical next steps for the business owner.',
              },
              proposedAction: {
                type: Type.OBJECT,
                nullable: true,
                properties: {
                  type: {
                    type: Type.STRING,
                    description: 'One of: record_expense, update_product_price, create_goal, send_followup, update_order_status, none',
                  },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  requiresConfirmation: { type: Type.BOOLEAN },
                  payloadJson: { type: Type.STRING, description: 'JSON string of suggested parameters.' },
                },
              },
            },
          },
        },
      });

      const rawText = (response.text ?? '{}').trim();
      const parsed = JSON.parse(rawText);
      res.json({ ok: true, data: parsed });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reach Gemini AI service.';
      res.status(500).json({ error: message });
    }
  });

  // Optional proxy endpoint for configured n8n webhooks to avoid browser CORS blocks
  app.post('/api/webhook/forward', async (req, res) => {
    try {
      const { targetUrl, payload } = req.body ?? {};
      if (!targetUrl || typeof targetUrl !== 'string') {
        res.status(400).json({ error: 'targetUrl is required.' });
        return;
      }

      let parsedUrl: URL;
      try {
        parsedUrl = new URL(targetUrl);
      } catch {
        res.status(400).json({ error: 'Invalid webhook URL format.' });
        return;
      }

      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        res.status(400).json({ error: 'Webhook URL must use http or https.' });
        return;
      }

      const upstream = await fetch(parsedUrl.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload ?? {}),
      });

      const text = await upstream.text();
      let bodyData: unknown = text;
      try {
        bodyData = JSON.parse(text);
      } catch {
        // leave as plain text
      }

      if (!upstream.ok) {
        res.status(upstream.status).json({
          ok: false,
          status: upstream.status,
          error: typeof bodyData === 'object' && bodyData && 'error' in bodyData ? (bodyData as { error: string }).error : `Webhook returned HTTP ${upstream.status}`,
          data: bodyData,
        });
        return;
      }

      res.json({ ok: true, status: upstream.status, data: bodyData });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Webhook connection failed.';
      res.status(502).json({ ok: false, error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Small Business OS listening on http://localhost:${PORT}`);
  });
}

startServer();
