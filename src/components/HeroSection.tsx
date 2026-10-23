import React from 'react';
import { Camera, Sparkles, Shield, Cpu, ExternalLink, ArrowRight, CheckCircle2, Code2, Zap } from 'lucide-react';
import { GESTURE_LIST } from '../data/gestures';

interface HeroSectionProps {
  onStartDemo: () => void;
  onExplore3D: () => void;
  onOpenCloudVault?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onStartDemo, onExplore3D, onOpenCloudVault }) => {
  return (
    <section className="pt-24 pb-16 md:pt-32 md:pb-20">
      {/* School & Initiative Top Banner (Light / Dark Adaptive) */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 px-5 py-3 rounded-2xl bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white border border-amber-500/40 shadow-xl">
        <div className="flex items-center gap-3">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <p className="text-xs sm:text-sm font-medium text-gray-200">
            <strong className="text-amber-400">Holy Trinity Cathedral General Secondary School:</strong> Student-Led AI Innovation from{' '}
            <em className="text-emerald-300">The Ethio-Tech Initiative</em>, Addis Ababa, Ethiopia
          </p>
        </div>
        <a
          href="https://t.me/EthioTech_HTCS"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-bold text-emerald-300 hover:text-amber-300 flex items-center gap-1.5 underline underline-offset-4"
        >
          Follow Updates <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      <div className="grid lg:grid-cols-12 gap-12 items-center">
        {/* Left Column: Mission & Cool Display Welcome Pitch */}
        <div className="lg:col-span-7 space-y-6">
          {/* Tech Badges with React.js */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-950/70 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>React.js + Three.js + MediaPipe</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 dark:bg-amber-950/60 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-semibold">
              <span>🇪🇹 Addis Ababa Innovation</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 dark:bg-sky-950/60 border border-sky-500/30 text-sky-700 dark:text-sky-300 text-xs font-semibold">
              <span>English & አማርኛ</span>
            </div>
          </div>

          {/* Ultra-Cool Welcome Headline with Outfit / Space Grotesk Display Font */}
          <div className="space-y-2">
            <p className="text-xs sm:text-sm uppercase tracking-widest font-bold text-emerald-600 dark:text-emerald-400 font-heading">
              Welcome to EjjiLink AI
            </p>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08] text-slate-900 dark:text-white">
              Where Hands{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-amber-500 to-emerald-500 dark:from-emerald-400 dark:via-amber-300 dark:to-emerald-400">
                Become Voices
              </span>
            </h1>
          </div>

          <p className="text-base sm:text-lg text-slate-600 dark:text-gray-300 leading-relaxed max-w-2xl font-normal">
            What if a simple hand gesture could speak for you? Built in <strong>React.js</strong> and powered by on-device computer vision and 3D kinematics, <strong>EjjiLink AI</strong> bridges communication barriers between Deaf, hard-of-hearing, and hearing individuals in both <strong>English</strong> and <strong>Amharic (አማርኛ)</strong>.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap gap-4 pt-2">
            <a
              href="#communication-workspace"
              onClick={onStartDemo}
              className="px-6 py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-emerald-600 via-emerald-500 to-amber-600 hover:from-emerald-500 hover:to-amber-500 text-white shadow-lg shadow-emerald-900/20 dark:shadow-emerald-900/40 transition-all flex items-center gap-2 hover:-translate-y-0.5 font-heading cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              Launch Two-Way Studio
            </a>
            <a
              href="#communication-workspace"
              onClick={onExplore3D}
              className="px-6 py-3.5 rounded-2xl font-bold text-sm bg-white dark:bg-slate-900 hover:bg-gray-100 dark:hover:bg-slate-800 text-slate-800 dark:text-amber-300 border border-gray-300 dark:border-amber-500/40 shadow-xs transition-all flex items-center gap-2 hover:-translate-y-0.5 font-heading cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              3D Rigged Hand Explorer
            </a>
            {onOpenCloudVault && (
              <button
                onClick={onOpenCloudVault}
                className="px-5 py-3.5 rounded-2xl font-bold text-sm bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 transition-all flex items-center gap-2 hover:-translate-y-0.5 font-heading cursor-pointer"
              >
                <span>Cloud Vault</span>
              </button>
            )}
          </div>

          {/* Core Trust Guarantees (Adaptive Light/Dark Cards) */}
          <div className="grid sm:grid-cols-3 gap-3 pt-4">
            <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-gray-200 dark:border-emerald-500/20 shadow-xs flex items-start gap-3 backdrop-blur-sm">
              <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-xs font-bold text-slate-900 dark:text-white">100% On-Device</strong>
                <span className="text-[11px] text-slate-500 dark:text-gray-400">Zero video frames ever uploaded or stored.</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-gray-200 dark:border-amber-500/20 shadow-xs flex items-start gap-3 backdrop-blur-sm">
              <CheckCircle2 className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-xs font-bold text-slate-900 dark:text-white">&gt;80% Lock Guard</strong>
                <span className="text-[11px] text-slate-500 dark:text-gray-400">5-frame temporal smoothing eliminates jitter.</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-gray-200 dark:border-emerald-500/20 shadow-xs flex items-start gap-3 backdrop-blur-sm">
              <Cpu className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-xs font-bold text-slate-900 dark:text-white">React & Three.js</strong>
                <span className="text-[11px] text-slate-500 dark:text-gray-400">60 FPS PBR rendering and local AI inference.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Hero Visual Card with Official Logo & Gesture Grid */}
        <div className="lg:col-span-5">
          <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-gray-200 dark:border-emerald-500/40 bg-white/90 dark:bg-slate-900/90 p-6 backdrop-blur-md">
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-amber-400/80 bg-[#0b192c] shrink-0 shadow-md">
                  <img
                    src="/assets/aistudio/Club_Logo_4c19d54c.jpg"
                    alt="HTCS Club Logo"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-slate-900 dark:text-white font-bold text-base leading-tight font-heading">
                    The Ethio-Tech Initiative
                  </h3>
                  <p className="text-amber-600 dark:text-amber-400 text-xs font-medium">Holy Trinity Cathedral Preparatory School</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30">
                React.js v2.0
              </span>
            </div>

            {/* Gesture Pills Grid */}
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-3 font-heading">
              Supported Everyday Gestures (7 Core Signs):
            </p>
            <div className="grid grid-cols-2 gap-2.5 mb-5">
              {GESTURE_LIST.map((g) => (
                <div
                  key={g.id}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    g.isNew
                      ? 'bg-amber-500/10 border-amber-500/40 text-slate-900 dark:text-white'
                      : 'bg-gray-50 dark:bg-slate-800/80 border-gray-200 dark:border-slate-700/80 text-slate-900 dark:text-white'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="text-lg">{g.emoji}</span>
                    <span className="text-xs font-bold">{g.labelEn}</span>
                    {g.isNew && (
                      <span className="text-[9px] px-1 py-0.5 rounded bg-amber-400 text-slate-950 font-black">
                        NEW
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-0.5 font-ethiopic">{g.labelAm}</div>
                </div>
              ))}
            </div>

            {/* Quick Demo CTA */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-gradient-to-r dark:from-emerald-950/70 dark:to-slate-900 border border-emerald-300 dark:border-emerald-500/30 flex items-center justify-between gap-3">
              <div className="text-xs text-slate-700 dark:text-gray-300">
                <strong className="text-slate-900 dark:text-white block font-semibold">Test Without Webcam</strong>
                <span>Try Mode B voice input or click any card in the studio.</span>
              </div>
              <a
                href="#communication-workspace"
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shrink-0 transition-colors flex items-center gap-1 shadow-xs"
              >
                Try Demo <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
