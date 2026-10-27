import express, { Request, Response, NextFunction } from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '30mb' }));

// Server-side Gemini client with required aistudio-build telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// -----------------------------------------------------------------------------
// Security & Rate Limiting Middleware
// -----------------------------------------------------------------------------
// In-memory sliding window rate limiter (60 requests per minute per IP)
interface RateLimitBucket {
  count: number;
  resetAt: number;
}
const rateLimits = new Map<string, RateLimitBucket>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 60;

// -----------------------------------------------------------------------------
// Retry Helper for Transient Model Spikes
// -----------------------------------------------------------------------------
async function callWithRetry<T>(fn: () => Promise<T>, retries = 2, delayMs = 1200): Promise<T> {
  let lastError: any;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      const isTransient =
        err?.status === 503 ||
        err?.message?.includes('503') ||
        err?.message?.includes('high demand') ||
        err?.message?.includes('UNAVAILABLE') ||
        err?.message?.includes('overloaded');

      if (isTransient && attempt < retries) {
        await new Promise((r) => setTimeout(r, delayMs * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

function formatErrorMessage(error: any): string {
  if (!error) return 'An unexpected error occurred.';
  const raw = error.message || String(error);
  try {
    const parsed = JSON.parse(raw);
    if (parsed.error?.message) {
      if (parsed.error.code === 503 || parsed.error.status === 'UNAVAILABLE') {
        return 'The AI service is experiencing high demand. Please try again in a few moments.';
      }
      if (parsed.error.code === 429 || parsed.error.status === 'RESOURCE_EXHAUSTED') {
        return 'AI request limit reached on Free Tier. Please wait a moment before trying again.';
      }
      return parsed.error.message;
    }
  } catch {
    // not json
  }
  if (raw.includes('RESOURCE_EXHAUSTED') || raw.includes('429') || raw.includes('Quota exceeded')) {
    return 'AI request limit reached on Free Tier. Please wait a moment before trying again.';
  }
  return raw;
}

function rateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || 'unknown';
  const now = Date.now();

  let bucket = rateLimits.get(ip);
  if (!bucket || now > bucket.resetAt) {
    bucket = { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
    rateLimits.set(ip, bucket);
  }

  bucket.count++;
  const remaining = Math.max(0, RATE_LIMIT_MAX_REQUESTS - bucket.count);
  res.setHeader('X-RateLimit-Limit', RATE_LIMIT_MAX_REQUESTS);
  res.setHeader('X-RateLimit-Remaining', remaining);
  res.setHeader('X-RateLimit-Reset', Math.ceil(bucket.resetAt / 1000));

  if (bucket.count > RATE_LIMIT_MAX_REQUESTS) {
    return res.status(429).json({
      error: 'Rate limit exceeded. Maximum 60 requests per minute allowed.',
      retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
    });
  }

  next();
}

app.use('/api', rateLimiter);

// -----------------------------------------------------------------------------
// Health Check Endpoint
// -----------------------------------------------------------------------------
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    system: 'EjjiLink AI Part 2 Core Engine',
    timestamp: new Date().toISOString(),
    endpoints: [
      'POST /api/assistant',
      'POST /api/translate',
      'POST /api/transcribe',
      'POST /api/documents',
    ],
  });
});

// -----------------------------------------------------------------------------
// 1. POST /api/assistant — Simplify Text & Suggest Replies
// -----------------------------------------------------------------------------
app.post('/api/assistant', async (req, res) => {
  try {
    const { text, mode = 'simplify', tone = 'simple', targetAudience = 'general', language = 'en' } = req.body;

    // Input Validation
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text payload is required and must be a string.' });
    }
    const cleanText = text.trim();
    if (cleanText.length < 2) {
      return res.status(400).json({ error: 'Text must be at least 2 characters.' });
    }
    if (cleanText.length > 6000) {
      return res.status(400).json({ error: 'Text payload exceeds maximum limit of 6,000 characters.' });
    }

    const validModes = ['simplify', 'suggest_replies', 'clarify', 'tone_adjust'];
    const activeMode = validModes.includes(mode) ? mode : 'simplify';

    const systemInstruction = `You are EjjiLink AI Communication Assistant, an expert accessibility assistant designed to help Deaf, Hard-of-Hearing, and non-native language speakers understand complex communication, simplify difficult jargon, and quickly construct polite, articulate responses.
You specialize in English and Ethiopian languages (Amharic, Afaan Oromoo, Tigrinya).
Your tone is encouraging, objective, clear, and respectful.
Respond strictly in JSON matching the specified schema.`;

    const prompt = `Process the following text according to mode: "${activeMode}", desired tone: "${tone}", and target audience: "${targetAudience}".

Text:
"""${cleanText}"""

Requirements:
1. simplifiedText: A crystal-clear, plain-language version without difficult jargon or convoluted sentence structures.
2. keyPoints: Array of 2 to 5 essential takeaway bullet points.
3. suggestedReplies: Array of 3 to 5 realistic, quick reply options (e.g. affirmative, questioning, follow-up, polite decline) suitable for direct one-tap selection.
4. readingLevel: Estimated reading difficulty (e.g. "Elementary", "Standard", "Advanced").
5. explanations: Brief note on any idioms, technical terms, or cultural nuances clarified.`;

    const response = await callWithRetry(() =>
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              simplifiedText: { type: Type.STRING },
              originalText: { type: Type.STRING },
              readingLevel: { type: Type.STRING },
              keyPoints: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              suggestedReplies: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              explanations: { type: Type.STRING },
              detectedTone: { type: Type.STRING },
            },
            required: ['simplifiedText', 'keyPoints', 'suggestedReplies', 'readingLevel'],
          },
        },
      })
    );

    const parsed = JSON.parse(response.text || '{}');
    parsed.originalText = cleanText;

    res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/assistant:', error);
    res.status(500).json({ error: formatErrorMessage(error) });
  }
});

// -----------------------------------------------------------------------------
// 2. POST /api/translate — Multilingual Translation
// -----------------------------------------------------------------------------
app.post('/api/translate', async (req, res) => {
  try {
    const { text, sourceLang = 'auto', targetLang } = req.body;

    // Input Validation
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text payload is required and must be a string.' });
    }
    const cleanText = text.trim();
    if (cleanText.length < 1) {
      return res.status(400).json({ error: 'Text must not be empty.' });
    }
    if (cleanText.length > 5000) {
      return res.status(400).json({ error: 'Text payload exceeds maximum limit of 5,000 characters.' });
    }
    if (!targetLang || typeof targetLang !== 'string') {
      return res.status(400).json({ error: 'targetLang is required.' });
    }

    const systemInstruction = `You are EjjiLink AI Translator, an expert linguist specializing in Ethiopian languages (Amharic, Afaan Oromoo, Tigrinya, Somali) and international languages (English, French, Arabic, Spanish).
Preserve conversational nuance, respectful etiquette, and accuracy. If translating to or from Amharic, provide the exact Ge'ez Fidel script and an intuitive Latin phonetic pronunciation.
Always return JSON matching the specified schema.`;

    const prompt = `Translate the following text from "${sourceLang}" to "${targetLang}".

Text:
"""${cleanText}"""`;

    const response = await callWithRetry(() =>
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              translatedText: { type: Type.STRING },
              phoneticPronunciation: { type: Type.STRING },
              detectedSourceLang: { type: Type.STRING },
              sourceLanguage: { type: Type.STRING },
              targetLanguage: { type: Type.STRING },
              notes: { type: Type.STRING },
            },
            required: ['translatedText', 'sourceLanguage', 'targetLanguage'],
          },
        },
      })
    );

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/translate:', error);
    res.status(500).json({ error: formatErrorMessage(error) });
  }
});

// -----------------------------------------------------------------------------
// 3. POST /api/transcribe — Audio Speech-to-Text
// -----------------------------------------------------------------------------
app.post('/api/transcribe', async (req, res) => {
  try {
    const { audio, mimeType = 'audio/webm' } = req.body;

    // Input Validation
    if (!audio || typeof audio !== 'string') {
      return res.status(400).json({ error: 'Missing audio base64 payload.' });
    }

    // Limit base64 audio payload size (~25MB max)
    if (audio.length > 35 * 1024 * 1024) {
      return res.status(400).json({ error: 'Audio payload exceeds maximum size limit of 25MB.' });
    }

    const allowedMimeTypes = [
      'audio/webm',
      'audio/wav',
      'audio/wave',
      'audio/x-wav',
      'audio/mp3',
      'audio/mpeg',
      'audio/ogg',
      'audio/m4a',
      'audio/aac',
    ];

    const safeMimeType = allowedMimeTypes.includes(mimeType) ? mimeType : 'audio/webm';

    const audioPart = {
      inlineData: {
        mimeType: safeMimeType,
        data: audio,
      },
    };

    let transcript = '';
    let modelUsed = 'gemini-3.5-transcribe';

    // Primary attempt: gemini-3.5-transcribe
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-transcribe',
        contents: {
          parts: [
            audioPart,
            {
              text: 'Transcribe this spoken speech accurately into verbatim text. Support English, Amharic, or mixed bilingual speech. Output only the verbatim transcribed words without commentary or quotation marks.',
            },
          ],
        },
      });
      transcript = response.text?.trim() || '';
    } catch (primaryErr: any) {
      const isQuotaOrRateLimit =
        String(primaryErr).includes('429') ||
        String(primaryErr).includes('RESOURCE_EXHAUSTED') ||
        String(primaryErr).includes('quota');

      if (isQuotaOrRateLimit) {
        console.warn('gemini-3.5-transcribe quota reached (3 RPM limit). Auto-falling back to gemini-3.8-flash.');
      } else {
        console.warn('gemini-3.5-transcribe error, falling back to gemini-3.8-flash:', primaryErr?.message || primaryErr);
      }

      // Secondary attempt: gemini-3.8-flash (multimodal audio with higher rate limits)
      try {
        const fallbackResponse = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [
            audioPart,
            {
              text: 'Transcribe this audio verbatim in English or Amharic. Return only the exact transcribed speech without quotation marks, markdown, or commentary.',
            },
          ],
        });
        transcript = fallbackResponse.text?.trim() || '';
        modelUsed = 'gemini-3.8-flash';
      } catch (fallbackErr: any) {
        const isFallbackQuota =
          String(fallbackErr).includes('429') ||
          String(fallbackErr).includes('RESOURCE_EXHAUSTED') ||
          String(fallbackErr).includes('quota');

        if (isFallbackQuota) {
          return res.status(429).json({
            error: 'AI transcription quota limit reached on Free Tier. Please use browser Web Speech captions or retry in 30 seconds.',
            retryAfterSeconds: 30,
            quotaExceeded: true,
          });
        }

        console.error('All audio transcription models failed:', fallbackErr);
        return res.status(500).json({ error: formatErrorMessage(fallbackErr) });
      }
    }

    res.json({ text: transcript, modelUsed });
  } catch (error: any) {
    console.error('Audio transcription unexpected error:', error);
    res.status(500).json({ error: formatErrorMessage(error) });
  }
});

// -----------------------------------------------------------------------------
// 4. POST /api/documents — Document Text Extraction & OCR
// -----------------------------------------------------------------------------
app.post('/api/documents', async (req, res) => {
  try {
    const { fileBase64, mimeType = 'image/png', filename = 'document', simplifyLanguage = true } = req.body;

    // Input Validation
    if (!fileBase64 || typeof fileBase64 !== 'string') {
      return res.status(400).json({ error: 'Missing fileBase64 payload.' });
    }

    // Limit document payload size (~15MB max)
    if (fileBase64.length > 20 * 1024 * 1024) {
      return res.status(400).json({ error: 'Document payload exceeds maximum size limit of 15MB.' });
    }

    const allowedMimeTypes = [
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp',
      'image/gif',
      'application/pdf',
    ];

    if (!allowedMimeTypes.includes(mimeType)) {
      return res.status(400).json({
        error: `Unsupported file type "${mimeType}". Allowed types: PNG, JPEG, WEBP, PDF.`,
      });
    }

    const docPart = {
      inlineData: {
        mimeType,
        data: fileBase64,
      },
    };

    const systemInstruction = `You are EjjiLink AI Document Reader, an intelligent OCR and plain-language accessibility analyzer for classroom worksheets, notices, medical prescriptions, official letters, and receipts.
You accurately extract verbatim text from images and PDF documents, including Amharic Fidel script and English text.
You summarize the content in accessible plain language and outline actionable points.
Always return JSON matching the specified schema.`;

    const prompt = `Perform complete OCR text extraction on this document ("${filename}").
Extract the verbatim text, summarize it, identify 3-5 main key points, determine document type and language, and provide a plain-language explanation for accessibility.`;

    const response = await callWithRetry(() =>
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: {
          parts: [docPart, { text: prompt }],
        },
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              extractedText: { type: Type.STRING },
              summary: { type: Type.STRING },
              keyPoints: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              detectedLanguage: { type: Type.STRING },
              documentType: { type: Type.STRING },
              wordCount: { type: Type.INTEGER },
              simplification: { type: Type.STRING },
            },
            required: ['extractedText', 'summary', 'keyPoints', 'detectedLanguage', 'documentType'],
          },
        },
      })
    );

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/documents:', error);
    res.status(500).json({ error: formatErrorMessage(error) });
  }
});

// -----------------------------------------------------------------------------
// Vite Dev Server / Static Production Server
// -----------------------------------------------------------------------------
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  // Dev server and upstream app process must strictly bind to port 3000 (nginx listens on 8080)
  const PORT = 3000;

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, port: PORT, host: '0.0.0.0' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EjjiLink AI full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
