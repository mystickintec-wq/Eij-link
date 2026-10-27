import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Cloud, 
  Cpu, 
  Database, 
  Lock, 
  CheckCircle2, 
  FolderTree, 
  ArrowRight, 
  Layers, 
  Sparkles, 
  Bot, 
  Languages, 
  FileText, 
  Captions, 
  Server,
  FileCode,
  ListChecks
} from 'lucide-react';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'overview' | 'dataflow' | 'endpoints' | 'structure' | 'roadmap';

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md">
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-emerald-500/30 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-gray-50/70 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl sm:text-2xl font-bold font-heading text-slate-900 dark:text-white">
                  EjjiLink AI — System Architecture (Part 2)
                </h3>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  <ShieldCheck className="w-3 h-3" /> Full-Stack Production Architecture
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-gray-400">
                Modular design, server-side AI routing, Zero-Trust security boundary, and project roadmap.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 py-2 bg-gray-50 dark:bg-slate-950/80 border-b border-gray-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto text-xs font-semibold">
          {[
            { id: 'overview', label: '1. Architecture Overview', icon: Layers },
            { id: 'dataflow', label: '2. Request Data Flow', icon: ArrowRight },
            { id: 'endpoints', label: '3. API Endpoints & Security', icon: Server },
            { id: 'structure', label: '4. Project Folder Structure', icon: FolderTree },
            { id: 'roadmap', label: '5. Implementation Roadmap', icon: ListChecks },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Architectural Rule Callout */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-900 dark:text-amber-200 leading-relaxed flex items-start gap-3">
                <Lock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-heading mb-0.5 text-slate-900 dark:text-white">
                    Core Security Boundary:
                  </strong>
                  The browser never contains secret AI provider keys. Requests needing private credentials (Gemini 3.5 Transcribe, Gemini 3.8 Flash, or Firebase Admin) strictly pass through protected server endpoints (`/api/*`). Firebase client configuration is public and restricted by Zero-Trust security rules.
                </div>
              </div>

              {/* 5 Architectural Layers Grid */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
                {/* 1. Frontend */}
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold font-heading">
                    <Cpu className="w-4 h-4" />
                    <span>1. Frontend UI Layer</span>
                  </div>
                  <p className="text-slate-600 dark:text-gray-300">
                    Accessible Dashboard · Live Captions · Multilingual Translation · AI Assistant · Document OCR · Accessibility Preferences.
                  </p>
                  <span className="text-[10px] text-slate-400 block font-mono">React 18 + Vite / Next.js target</span>
                </div>

                {/* 2. Backend API */}
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 font-bold font-heading">
                    <Server className="w-4 h-4" />
                    <span>2. Backend API Layer</span>
                  </div>
                  <p className="text-slate-600 dark:text-gray-300">
                    Input validation · In-memory rate limiting (60 req/min) · Error handling · MIME validation · Server-to-server AI routing.
                  </p>
                  <span className="text-[10px] text-slate-400 block font-mono">Express on Node.js (:3000)</span>
                </div>

                {/* 3. AI Providers */}
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold font-heading">
                    <Sparkles className="w-4 h-4" />
                    <span>3. AI Providers (Gemini)</span>
                  </div>
                  <p className="text-slate-600 dark:text-gray-300">
                    gemini-3.5-transcribe (Audio) · gemini-3.8-flash (Assistant, Translation, OCR) · Web Speech API (Local TTS).
                  </p>
                  <span className="text-[10px] text-slate-400 block font-mono">@google/genai SDK</span>
                </div>

                {/* 4. Firebase */}
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold font-heading">
                    <Database className="w-4 h-4" />
                    <span>4. Firebase Backend</span>
                  </div>
                  <p className="text-slate-600 dark:text-gray-300">
                    Authentication (Google & Guest) · Cloud Firestore (Saved phrases, custom vocabulary) · Deployed Zero-Trust Rules.
                  </p>
                  <span className="text-[10px] text-slate-400 block font-mono">europe-west2 Firestore DB</span>
                </div>

                {/* 5. Sign Language Module */}
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 space-y-2 sm:col-span-2 lg:col-span-2">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold font-heading">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>5. Sign-Language & 3D Kinematics Module</span>
                  </div>
                  <p className="text-slate-600 dark:text-gray-300">
                    In-browser 21-landmark MediaPipe tracking · Geometric pose classification · Mathematical forward kinematics · Three.js 3D hand animation across 3 educational demonstration scenarios.
                  </p>
                  <span className="text-[10px] text-slate-400 block font-mono">MediaPipe Tasks Vision + Three.js</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DATA FLOW */}
          {activeTab === 'dataflow' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 space-y-2 text-xs">
                <h4 className="font-bold text-slate-900 dark:text-white font-heading">
                  Standard Request Lifecycle (e.g. Text Simplification / Suggest Replies)
                </h4>
                <p className="text-slate-500 dark:text-slate-400">
                  Illustrates the end-to-end security boundary from the client browser to the protected server and back.
                </p>
              </div>

              {/* Step-by-step Interactive Flow Pipeline */}
              <div className="space-y-3">
                {[
                  {
                    step: '1',
                    title: 'User Enters Input',
                    detail: 'User types or pastes text in the Assistant / Translation / Captions interface.',
                    badge: 'Frontend Client',
                    color: 'emerald',
                  },
                  {
                    step: '2',
                    title: 'Frontend Validation',
                    detail: 'Checks character bounds (min 2, max 6,000 chars), sanitizes input, and provides immediate visual feedback.',
                    badge: 'Client Validation',
                    color: 'emerald',
                  },
                  {
                    step: '3',
                    title: 'Protected API Request',
                    detail: 'Dispatches POST to /api/assistant or /api/translate. No secret keys in browser.',
                    badge: 'HTTPS Request',
                    color: 'sky',
                  },
                  {
                    step: '4',
                    title: 'Server Permissions & Rate Limits',
                    detail: 'Express server verifies IP rate limit (60 req/min) and inspects JSON payload schema.',
                    badge: 'Backend Guard',
                    color: 'sky',
                  },
                  {
                    step: '5',
                    title: 'AI Provider Inference (Gemini)',
                    detail: 'Server calls ai.models.generateContent with User-Agent telemetry using gemini-3.8-flash.',
                    badge: 'Gemini Engine',
                    color: 'purple',
                  },
                  {
                    step: '6',
                    title: 'Schema Validation & Formatting',
                    detail: 'Server validates returned structured JSON (simplifiedText, keyPoints, suggestedReplies).',
                    badge: 'Backend Parsing',
                    color: 'purple',
                  },
                  {
                    step: '7',
                    title: 'UI Display & Interactive Actions',
                    detail: 'Client displays plain-language output, grade level badge, one-tap reply copy, or speech synthesis.',
                    badge: 'User Delivery',
                    color: 'emerald',
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 flex items-center justify-between gap-4 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-slate-900 text-white dark:bg-slate-800 flex items-center justify-center font-bold text-xs shrink-0">
                        {item.step}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block font-heading">
                          {item.title}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                          {item.detail}
                        </span>
                      </div>
                    </div>
                    <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {item.badge}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: ENDPOINTS */}
          {activeTab === 'endpoints' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid gap-4">
                {[
                  {
                    endpoint: 'POST /api/assistant',
                    responsibility: 'Simplify complex text, generate 1-tap quick replies, explain technical jargon, and adjust formality.',
                    model: 'gemini-3.8-flash',
                    security: 'Max 6,000 chars, strict JSON schema validation, rate limit 60 req/min per IP.',
                    active: true,
                  },
                  {
                    endpoint: 'POST /api/translate',
                    responsibility: 'Multilingual neural translation between Ethiopian languages (Amharic, Afaan Oromoo, Tigrinya) and world languages with phonetic guide.',
                    model: 'gemini-3.8-flash',
                    security: 'Max 5,000 chars, language code validation, rate limit 60 req/min per IP.',
                    active: true,
                  },
                  {
                    endpoint: 'POST /api/transcribe',
                    responsibility: 'Speech-to-text audio transcription with automatic fallback from gemini-3.5-transcribe to gemini-3.8-flash on quota exhaustion, plus browser Web Speech streaming.',
                    model: 'gemini-3.5-transcribe + gemini-3.8-flash',
                    security: 'Max 25MB base64 payload, validated audio MIME types (webm, wav, mp3, ogg), 429 quota protection.',
                    active: true,
                  },
                  {
                    endpoint: 'POST /api/documents',
                    responsibility: 'Visual OCR text extraction from photos, school worksheets, receipts, and medical guides with plain-language summary.',
                    model: 'gemini-3.8-flash',
                    security: 'Max 15MB file payload, allowed MIME types (PNG, JPEG, WEBP, PDF).',
                    active: true,
                  },
                ].map((ep, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <code className="font-mono font-bold text-sky-600 dark:text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-lg">
                          {ep.endpoint}
                        </code>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400">
                          {ep.model}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                        Live & Active
                      </span>
                    </div>

                    <p className="text-slate-700 dark:text-gray-300">
                      <strong>Responsibility:</strong> {ep.responsibility}
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                      <strong>Security Controls:</strong> {ep.security}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: FOLDER STRUCTURE */}
          {activeTab === 'structure' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                <strong className="block text-slate-900 dark:text-white font-heading">
                  Target Next.js & React App Architecture
                </strong>
                <p>
                  The current production deployment runs React 18 SPA + Vite on an Express Node.js server (`server.ts`), modularized for seamless migration to Next.js App Router.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-[11px] leading-relaxed overflow-x-auto">
                <pre>{`ejjilink/
├── public/
│   ├── assets/aistudio/          # Official Ethio-Tech initiative assets
│   └── models/ejjilink-hand.glb  # Three.js 3D hand mesh asset
├── src/
│   ├── app/ (Target Next.js App Router)
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── captions/page.tsx
│   │   ├── translate/page.tsx
│   │   ├── assistant/page.tsx
│   │   ├── documents/page.tsx
│   │   └── api/                  # Server-side API endpoints
│   ├── components/               # Modular workspace components
│   │   ├── NavigationModuleBar.tsx
│   │   ├── AssistantWorkspace.tsx
│   │   ├── TranslationWorkspace.tsx
│   │   ├── CaptionsWorkspace.tsx
│   │   ├── DocumentsWorkspace.tsx
│   │   ├── AccessibilitySettingsModal.tsx
│   │   ├── TwoWayWorkspace.tsx
│   │   ├── ThreeDHandViewer.tsx
│   │   └── CloudStorageVault.tsx
│   ├── services/                 # Decoupled service layer
│   │   ├── assistantService.ts
│   │   ├── translationService.ts
│   │   ├── documentService.ts
│   │   ├── transcribeService.ts
│   │   ├── speechService.ts
│   │   ├── handLandmarkerService.ts
│   │   └── firebase.ts
│   ├── types/                    # Typed contracts
│   └── data/                     # Sign vocabulary & sequences
├── server.ts                     # Full-stack Node/Express engine with Gemini & rate limiting
├── firestore.rules               # Deployed Zero-Trust database security rules
├── firebase-blueprint.json       # Firestore schema blueprint
└── .env.example                  # Documented environment variables`}</pre>
              </div>
            </div>
          )}

          {/* TAB 5: ROADMAP */}
          {activeTab === 'roadmap' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs flex items-center justify-between">
                <div>
                  <strong className="text-slate-900 dark:text-white block font-heading">
                    First Release Status: 16/16 Milestone Tasks Ready
                  </strong>
                  <span className="text-slate-500 dark:text-slate-400">
                    Phase 1 (Foundation), Phase 2 (Core AI), Phase 3 (Reliability), and Phase 4 (Advanced Features).
                  </span>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white">
                  100% Ready
                </span>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 text-xs">
                {[
                  { phase: 'Phase 1: Foundation', tasks: ['Shared layout and navigation', 'Accessible dashboard and settings', 'Firebase Auth & Cloud Firestore configured', 'Client-server security boundary established'] },
                  { phase: 'Phase 2: Core AI', tasks: ['Text-to-speech (Web Speech API)', 'Speech-to-text (gemini-3.5-transcribe)', 'Protected AI assistant (POST /api/assistant)', 'Translation endpoint (POST /api/translate)'] },
                  { phase: 'Phase 3: Reliability', tasks: ['Loading and error states on all modules', 'Input validation and rate limits (60 req/min)', 'Screen-reader, contrast and dyslexic font toggles', 'Multilingual browser compatibility tests'] },
                  { phase: 'Phase 4: Advanced Features', tasks: ['Document text extraction (POST /api/documents)', 'Real-time streaming speech captions', 'MediaPipe 21-landmark gesture tracking', 'Three.js 3D hand kinematic articulation'] },
                ].map((ph, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 space-y-2">
                    <h5 className="font-bold text-slate-900 dark:text-white font-heading text-xs">
                      {ph.phase}
                    </h5>
                    <ul className="space-y-1 text-slate-600 dark:text-slate-400 text-[11px]">
                      {ph.tasks.map((t, tIdx) => (
                        <li key={tIdx} className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-gray-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-gray-50/70 dark:bg-slate-950/40 text-xs text-slate-500 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>EjjiLink AI • Phase 1 + 2 Complete Architecture</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Close Architecture
          </button>
        </div>
      </div>
    </div>
  );
};
