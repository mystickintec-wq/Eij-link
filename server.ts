import express, { Request, Response, NextFunction } from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import crypto from 'crypto';
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Trust first reverse proxy (Nginx / Cloud Run / preview proxy) so req.ip is accurate
app.set('trust proxy', 1);

// Scoped JSON payload parsers (prevent oversized payloads on small text endpoints)
const smallJsonParser = express.json({ limit: '100kb' });
const audioJsonParser = express.json({ limit: '40mb' });
const documentJsonParser = express.json({ limit: '25mb' });

// Resolve Firebase Project ID for ID token verification without requiring private service account keys
let FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || '';
if (!FIREBASE_PROJECT_ID) {
  try {
    const cfgPath = path.resolve(__dirname, 'firebase-applet-config.json');
    if (fs.existsSync(cfgPath)) {
      const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf-8'));
      FIREBASE_PROJECT_ID = cfg.projectId || '';
    }
  } catch {
    // Non-fatal if config file is absent
  }
}

interface VerifiedAuthUser {
  uid: string;
  email?: string;
}

interface AuthenticatedRequest extends Request {
  authUser?: VerifiedAuthUser;
}

// Cached Google public X.509 certificates for Firebase ID token RS256 verification
let cachedFirebaseCerts: Record<string, string> = {};
let firebaseCertsExpiresAt = 0;

async function getFirebasePublicCerts(): Promise<Record<string, string>> {
  const now = Date.now();
  if (now < firebaseCertsExpiresAt && Object.keys(cachedFirebaseCerts).length > 0) {
    return cachedFirebaseCerts;
  }

  const resp = await fetch(
    'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com'
  );
  if (!resp.ok) {
    throw new Error(`Failed to fetch Firebase public certificates (${resp.status})`);
  }

  const cacheControl = resp.headers.get('cache-control') || '';
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/i);
  const maxAgeSeconds = maxAgeMatch ? Number(maxAgeMatch[1]) : 3600;
  cachedFirebaseCerts = (await resp.json()) as Record<string, string>;
  firebaseCertsExpiresAt = now + maxAgeSeconds * 1000;
  return cachedFirebaseCerts;
}

async function verifyFirebaseIdToken(token: string): Promise<VerifiedAuthUser> {
  if (!FIREBASE_PROJECT_ID) {
    throw new Error('Firebase project ID is not configured for token verification.');
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Malformed JWT.');
  }

  const [encodedHeader, encodedPayload, encodedSig] = parts;
  const header = JSON.parse(Buffer.from(encodedHeader, 'base64url').toString('utf-8'));
  const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf-8'));

  if (header.alg !== 'RS256' || typeof header.kid !== 'string') {
    throw new Error('Unsupported JWT algorithm or missing key ID.');
  }

  const certs = await getFirebasePublicCerts();
  const certPem = certs[header.kid];
  if (!certPem) {
    throw new Error('Unknown signing key ID.');
  }

  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(`${encodedHeader}.${encodedPayload}`);
  const isSignatureValid = verifier.verify(certPem, Buffer.from(encodedSig, 'base64url'));
  if (!isSignatureValid) {
    throw new Error('Invalid JWT signature.');
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const expectedIssuer = `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`;
  if (payload.aud !== FIREBASE_PROJECT_ID) {
    throw new Error('Invalid token audience.');
  }
  if (payload.iss !== expectedIssuer) {
    throw new Error('Invalid token issuer.');
  }
  if (typeof payload.exp !== 'number' || payload.exp <= nowSeconds) {
    throw new Error('Expired token.');
  }
  if (typeof payload.iat !== 'number' || payload.iat > nowSeconds + 300) {
    throw new Error('Invalid issued-at timestamp.');
  }
  if (typeof payload.sub !== 'string' || payload.sub.length === 0 || payload.sub.length > 128) {
    throw new Error('Missing token subject.');
  }

  return {
    uid: payload.sub,
    email: typeof payload.email === 'string' ? payload.email : undefined,
  };
}

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
// In-memory sliding window rate limiter (60 requests per minute per user or IP)
interface RateLimitBucket {
  count: number;
  resetAt: number;
}
const rateLimits = new Map<string, RateLimitBucket>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 60;
const MAX_RATE_LIMIT_ENTRIES = 5000;

// Periodically prune expired buckets to prevent unbounded memory growth
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of rateLimits.entries()) {
    if (now > bucket.resetAt) {
      rateLimits.delete(key);
    }
  }
}, RATE_LIMIT_WINDOW_MS).unref();

// -----------------------------------------------------------------------------
// Multi-Model Cascade and Fallback Engine for Zero-Downtime Accessibility
// -----------------------------------------------------------------------------
const TEXT_MODELS = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];

function withTimeout<T>(promise: Promise<T>, ms = 4500): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('AI service request timed out')), ms)
    ),
  ]);
}

async function callWithModelCascade<T>(
  fn: (modelName: string) => Promise<T>,
  models: string[] = TEXT_MODELS,
  timeoutMs = 4500
): Promise<T> {
  let lastError: any;
  for (const model of models) {
    try {
      return await withTimeout(fn(model), timeoutMs);
    } catch (err: any) {
      lastError = err;
      const isTransient =
        err?.status === 503 ||
        err?.status === 429 ||
        String(err).includes('503') ||
        String(err).includes('high demand') ||
        String(err).includes('UNAVAILABLE') ||
        String(err).includes('RESOURCE_EXHAUSTED') ||
        String(err).includes('timed out') ||
        String(err).includes('overloaded');

      if (isTransient) {
        console.warn(`Model ${model} issue (${err?.message || err?.status || 'transient'}), cascading to next model...`);
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

const SERVER_SIMPLIFY_MAP: Array<[RegExp, string]> = [
  [/\bostensibly\b/gi, 'supposedly'],
  [/\bmandated\b/gi, 'required'],
  [/\bsynthesize\b/gi, 'summarize'],
  [/\bempirical observations\b/gi, 'hands-on findings'],
  [/\bempirical\b/gi, 'firsthand'],
  [/\bpedagogical abstract\b/gi, 'learning summary'],
  [/\bpedagogical\b/gi, 'educational'],
  [/\bscholastic symposium\b/gi, 'school conference / meeting'],
  [/\bscholastic\b/gi, 'school'],
  [/\bsymposium\b/gi, 'meeting'],
  [/\bpursuant to\b/gi, 'following'],
  [/\bmunicipal decree\b/gi, 'city rule'],
  [/\bcommercial vehicular operators\b/gi, 'commercial drivers'],
  [/\bauthenticated\b/gi, 'verified'],
  [/\bbiometric identity documentation\b/gi, 'photo ID or fingerprint record'],
  [/\bstatutory expiration deadline\b/gi, 'official deadline'],
  [/\bstatutory\b/gi, 'legal'],
  [/\bstrategic methodologies\b/gi, 'practical steps and methods'],
  [/\basynchronous\b/gi, 'flexible, message-based'],
  [/\bcross-functional\b/gi, 'multi-team'],
  [/\bconflict remediation\b/gi, 'resolving disagreements'],
  [/\bgeographically distributed\b/gi, 'remote / distributed'],
  [/\belaborate on\b/gi, 'explain'],
  [/\bcommence\b/gi, 'start'],
  [/\bterminate\b/gi, 'end'],
  [/\butilize\b/gi, 'use'],
  [/\bfacilitate\b/gi, 'help with'],
  [/\bimplement\b/gi, 'put into action'],
  [/\bendeavor\b/gi, 'try'],
  [/\bexpedite\b/gi, 'speed up'],
  [/\bdisseminate\b/gi, 'share'],
  [/\bprocure\b/gi, 'get'],
  [/\btransmit\b/gi, 'send'],
  [/\binquire\b/gi, 'ask'],
  [/\bascertain\b/gi, 'find out'],
  [/\boptimal\b/gi, 'best'],
  [/\bparamount\b/gi, 'very important'],
];

function simplifyTextServer(rawText: string): string {
  let result = rawText;
  for (const [pattern, replacement] of SERVER_SIMPLIFY_MAP) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

function generateServerAssistantFallback(
  cleanText: string,
  mode: string,
  tone: string,
  _targetAudience?: string
) {
  const simplified = simplifyTextServer(cleanText);
  const sentences = cleanText
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 5);

  const keyPoints =
    sentences.length > 0
      ? sentences.slice(0, 3).map((s) => simplifyTextServer(s))
      : [simplified];

  const lower = cleanText.toLowerCase();
  const isQuestion = cleanText.includes('?') || lower.includes('could you') || lower.includes('please explain');
  const isDeadline = lower.includes('deadline') || lower.includes('mandated') || lower.includes('submit') || lower.includes('required');

  let suggestedReplies: string[];
  if (isQuestion) {
    suggestedReplies = [
      'Yes, I can provide a clear explanation with examples.',
      'Could you please clarify the specific focus or scope?',
      'I am preparing my response and will share it shortly.',
      'Thank you for asking. Let us schedule a brief time to discuss.',
    ];
  } else if (isDeadline) {
    suggestedReplies = [
      'Understood. I will prepare this and submit before the deadline.',
      'Could you please verify the exact submission requirements?',
      'I am currently working on this and will keep you updated.',
      'Thank you for the notification.',
    ];
  } else {
    suggestedReplies = [
      'Thank you for the update. I have reviewed the message.',
      'I understand and will proceed accordingly.',
      'Could you provide a few more details when convenient?',
      'Let me know if any further action is required.',
    ];
  }

  return {
    simplifiedText: simplified,
    originalText: cleanText,
    readingLevel: 'Grade 5-6 (Plain Language)',
    keyPoints: keyPoints.length > 0 ? keyPoints : [simplified],
    suggestedReplies,
    explanations: 'Rewritten in plain, accessible language with jargon replaced for clarity. (Instant Accessibility Engine)',
    detectedTone: mode === 'tone_adjust' ? `Adjusted to ${tone}` : 'Direct & Accessible',
    isOfflineFallback: true,
    offlineNotice: 'AI cloud service is experiencing temporary high demand. Serving instant plain-language analysis.',
  };
}

const SERVER_DICTIONARY: Record<string, { am: string; amPhonetic: string; en: string }> = {
  hello: { am: 'ሰላም', amPhonetic: 'Selam', en: 'Hello' },
  hi: { am: 'ሰላም', amPhonetic: 'Selam', en: 'Hi' },
  'thank you': { am: 'አመሰግናለሁ', amPhonetic: 'Ameseginalehu', en: 'Thank you' },
  thanks: { am: 'አመሰግናለሁ', amPhonetic: 'Ameseginalehu', en: 'Thanks' },
  yes: { am: 'አዎ', amPhonetic: 'Awo', en: 'Yes' },
  no: { am: 'አይደለም / አይ', amPhonetic: 'Aydelem / Aye', en: 'No' },
  please: { am: 'እባክዎ', amPhonetic: 'Ebakwo', en: 'Please' },
  help: { am: 'እባክዎን እርዱኝ', amPhonetic: 'Ebakwon erdugn', en: 'Please help me' },
  water: { am: 'ውሃ', amPhonetic: 'Wuha', en: 'Water' },
  food: { am: 'ምግብ', amPhonetic: 'Migib', en: 'Food' },
  'how are you': { am: 'እንደምን አለህ / አለሽ?', amPhonetic: 'Endemin aleh / alesh?', en: 'How are you?' },
  'good morning': { am: 'እንደምን አደሩ', amPhonetic: 'Endemin aderachu', en: 'Good morning' },
  'good evening': { am: 'እንደምን አመሹ', amPhonetic: 'Endemin ameshu', en: 'Good evening' },
  goodbye: { am: 'ደህና ሁን / ሁኚ', amPhonetic: 'Dehna hun / hugni', en: 'Goodbye' },
  peace: { am: 'ሰላም', amPhonetic: 'Selam', en: 'Peace' },
  love: { am: 'ፍቅር', amPhonetic: 'Fikir', en: 'Love' },
  ok: { am: 'እሺ', amPhonetic: 'Ishi', en: 'OK / Alright' },
  doctor: { am: 'ዶክተር / ሐኪም', amPhonetic: 'Hakim', en: 'Doctor' },
  hospital: { am: 'ሆስፒታል', amPhonetic: 'Hospital', en: 'Hospital' },
  school: { am: 'ትምህርት ቤት', amPhonetic: 'Timhirt bet', en: 'School' },
  teacher: { am: 'አስተማሪ', amPhonetic: 'Astemari', en: 'Teacher' },
  friend: { am: 'ጓደኛ', amPhonetic: 'Gwadegna', en: 'Friend' },
};

function generateServerTranslateFallback(cleanText: string, sourceLang: string, targetLang: string) {
  const norm = cleanText.toLowerCase().trim();
  const target = targetLang.toLowerCase();
  const match = SERVER_DICTIONARY[norm];

  if (match) {
    if (target.includes('amharic') || target.includes('am')) {
      return {
        translatedText: match.am,
        phoneticPronunciation: match.amPhonetic,
        sourceLanguage: sourceLang || 'en',
        targetLanguage: targetLang,
        notes: 'Instant dictionary translation.',
        isOfflineFallback: true,
        offlineNotice: 'AI cloud experiencing high demand. Provided via instant local dictionary.',
      };
    } else if (target.includes('english') || target.includes('en')) {
      return {
        translatedText: match.en,
        sourceLanguage: sourceLang || 'am',
        targetLanguage: targetLang,
        notes: 'Instant dictionary translation.',
        isOfflineFallback: true,
        offlineNotice: 'AI cloud experiencing high demand. Provided via instant local dictionary.',
      };
    }
  }

  return {
    translatedText: `[Standby Mode] ${cleanText}`,
    sourceLanguage: sourceLang || 'auto',
    targetLanguage: targetLang,
    notes: 'AI cloud service is experiencing temporary high demand. Please try again shortly.',
    isOfflineFallback: true,
    offlineNotice: 'AI cloud is experiencing temporary high demand. Please retry in a few moments.',
  };
}

function generateServerDocumentFallback(filename: string) {
  return {
    extractedText: `Document received (${filename}). Cloud OCR service is experiencing temporary high demand.`,
    summary: 'Document uploaded successfully. Cloud OCR is temporarily busy with high demand.',
    keyPoints: [
      'Document uploaded successfully',
      'AI cloud OCR experiencing temporary demand spikes',
      'You can paste document text directly into the AI Assistant workspace for instant plain-language analysis',
    ],
    detectedLanguage: 'Unknown',
    documentType: filename.toLowerCase().endsWith('.pdf') ? 'PDF Document' : 'Image Document',
    wordCount: 0,
    simplification: 'Please paste text directly or retry in a few moments once cloud demand subsides.',
    isOfflineFallback: true,
    offlineNotice: 'Cloud AI OCR is experiencing temporary high demand. Please try again shortly.',
  };
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

async function authenticateApiRequest(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (req.path === '/health') {
    return next();
  }

  const authHeader = req.headers.authorization;
  const requireAuth = process.env.REQUIRE_API_AUTH === 'true';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const idToken = authHeader.slice('Bearer '.length).trim();
    if (!idToken) {
      return res.status(401).json({ error: 'Unauthorized: Empty Bearer token.' });
    }
    try {
      req.authUser = await verifyFirebaseIdToken(idToken);
      return next();
    } catch (err: any) {
      console.warn('Rejected invalid Firebase ID token:', err?.message || err);
      return res.status(401).json({ error: 'Unauthorized: Invalid or expired authentication token.' });
    }
  }

  if (requireAuth) {
    return res.status(401).json({ error: 'Unauthorized: Sign in required to access AI endpoints.' });
  }

  return next();
}

function rateLimiter(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const rawIp = req.ip || (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
  const key = req.authUser?.uid ? `uid:${req.authUser.uid}` : `ip:${rawIp}`;
  const now = Date.now();

  if (rateLimits.size > MAX_RATE_LIMIT_ENTRIES) {
    for (const [k, b] of rateLimits.entries()) {
      if (now > b.resetAt) rateLimits.delete(k);
    }
    if (rateLimits.size > MAX_RATE_LIMIT_ENTRIES) {
      const oldestKey = rateLimits.keys().next().value;
      if (oldestKey) rateLimits.delete(oldestKey);
    }
  }

  let bucket = rateLimits.get(key);
  if (!bucket || now > bucket.resetAt) {
    bucket = { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
    rateLimits.set(key, bucket);
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

app.use('/api', authenticateApiRequest, rateLimiter);

// -----------------------------------------------------------------------------
// Health Check Endpoint
// -----------------------------------------------------------------------------
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    system: 'EjjiLink AI Part 2 Core Engine',
    timestamp: new Date().toISOString(),
    authMode: process.env.REQUIRE_API_AUTH === 'true' ? 'required' : 'optional-verified',
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
app.post('/api/assistant', smallJsonParser, async (req, res) => {
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

    let parsed: any;
    try {
      const response = await callWithModelCascade((model) =>
        ai.models.generateContent({
          model,
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

      parsed = JSON.parse(response.text || '{}');
      parsed.originalText = cleanText;
    } catch (modelErr: any) {
      console.warn('All cloud Gemini models encountered high demand or limits. Activating instant accessibility fallback:', modelErr?.message || modelErr);
      parsed = generateServerAssistantFallback(cleanText, activeMode, tone, targetAudience);
    }

    res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/assistant:', error);
    res.status(500).json({ error: formatErrorMessage(error) });
  }
});

// -----------------------------------------------------------------------------
// 2. POST /api/translate — Multilingual Translation
// -----------------------------------------------------------------------------
app.post('/api/translate', smallJsonParser, async (req, res) => {
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

    let parsed: any;
    try {
      const response = await callWithModelCascade((model) =>
        ai.models.generateContent({
          model,
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

      parsed = JSON.parse(response.text || '{}');
    } catch (modelErr: any) {
      console.warn('Translation cloud models busy. Activating dictionary fallback:', modelErr?.message || modelErr);
      parsed = generateServerTranslateFallback(cleanText, sourceLang, targetLang);
    }

    res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/translate:', error);
    res.status(500).json({ error: formatErrorMessage(error) });
  }
});

// -----------------------------------------------------------------------------
// 3. POST /api/transcribe — Audio Speech-to-Text
// -----------------------------------------------------------------------------
app.post('/api/transcribe', audioJsonParser, async (req, res) => {
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

    // Primary attempt: gemini-3.5-transcribe (with 20s worker timeout guard)
    try {
      const response = await withTimeout(
        ai.models.generateContent({
          model: 'gemini-3.5-transcribe',
          contents: {
            parts: [
              audioPart,
              {
                text: 'Transcribe this spoken speech accurately into verbatim text. Support English, Amharic, or mixed bilingual speech. Output only the verbatim transcribed words without commentary or quotation marks.',
              },
            ],
          },
        }),
        20000
      );
      transcript = response.text?.trim() || '';
    } catch (primaryErr: any) {
      const isQuotaOrRateLimit =
        String(primaryErr).includes('429') ||
        String(primaryErr).includes('RESOURCE_EXHAUSTED') ||
        String(primaryErr).includes('quota');

      if (isQuotaOrRateLimit) {
        console.warn('gemini-3.5-transcribe quota reached (3 RPM limit). Auto-falling back to gemini-3.8-flash.');
      } else {
        console.warn('gemini-3.5-transcribe error/timeout, falling back to gemini-3.8-flash:', primaryErr?.message || primaryErr);
      }

      // Secondary attempt: gemini-3.8-flash (multimodal audio with 20s timeout guard)
      try {
        const fallbackResponse = await withTimeout(
          ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: [
              audioPart,
              {
                text: 'Transcribe this audio verbatim in English or Amharic. Return only the exact transcribed speech without quotation marks, markdown, or commentary.',
              },
            ],
          }),
          20000
        );
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

        const isTimeout = String(fallbackErr?.message || fallbackErr).includes('timed out');
        console.error('All audio transcription models failed:', fallbackErr);
        return res.status(isTimeout ? 504 : 500).json({ error: formatErrorMessage(fallbackErr) });
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
app.post('/api/documents', documentJsonParser, async (req, res) => {
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

    let parsed: any;
    try {
      const response = await callWithModelCascade((model) =>
        ai.models.generateContent({
          model,
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

      parsed = JSON.parse(response.text || '{}');
    } catch (modelErr: any) {
      console.warn('Document OCR models busy. Activating document fallback:', modelErr?.message || modelErr);
      parsed = generateServerDocumentFallback(filename);
    }

    res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/documents:', error);
    res.status(500).json({ error: formatErrorMessage(error) });
  }
});

// Clean JSON error responses for malformed JSON or oversized payloads on /api/*
app.use('/api', (err: any, _req: Request, res: Response, next: NextFunction) => {
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request payload exceeds route size limit.' });
  }
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON request payload.' });
  }
  next(err);
});

// -----------------------------------------------------------------------------
// Vite Dev Server / Static Production Server
// -----------------------------------------------------------------------------
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  // Dev server and upstream app process must strictly bind to port 3000 (nginx listens on 8080)
  const PORT = 3000;

  // Serve static assets from public/ (including wasm and 3D models)
  app.use(express.static(path.resolve(__dirname, 'public')));

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
