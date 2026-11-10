import React from 'react';
import { Camera, Sparkles, Shield, Cpu, ExternalLink, CheckCircle2 } from 'lucide-react';
import { GESTURE_LIST } from '../data/gestures';
import { CommunicationOrb3D } from './CommunicationOrb3D';
import { useCommunication } from '../context/CommunicationContext';

interface HeroSectionProps {
  onStartDemo: () => void;
  onExplore3D: () => void;
  onOpenCloudVault?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onStartDemo, onExplore3D, onOpenCloudVault }) => {
  const { communicationState, setCommunicationState, audioLevel, themeAccent, disable3D } = useCommunication();

  return (
    <section className="pt-20 pb-12 md:pt-28 md:pb-16">
      {/* School & Initiative Top Banner */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3 px-5 py-3 rounded-[14px] bg-slate-100 dark:bg-[#121C2D] border border-slate-200 dark:border-[rgba(148,163,184,0.15)] text-slate-800 dark:text-[#F8FAFC] shadow-xs">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-[#22D3EE] shrink-0" />
          <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-[#B6C2D2]">
            <strong className="text-slate-900 dark:text-[#F8FAFC] font-semibold">Holy Trinity Cathedral Secondary School:</strong> Student-Led AI Innovation from{' '}
            <span className="text-[#22D3EE]">The Ethio-Tech Initiative</span>, Addis Ababa, Ethiopia
          </p>
        </div>
        <a
          href="https://t.me/EthioTech_HTCS"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold text-[#22D3EE] hover:text-[#2DD4BF] flex items-center gap-1.5 transition-colors"
        >
          Follow Updates <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      <div className="grid lg:grid-cols-12 gap-10 items-center">
        {/* Left Column: Mission & Pitch */}
        <div className="lg:col-span-7 space-y-6">
          {/* Metadata tags — Clean unboxed text with separators */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-[#8493A8]">
            <span className="font-medium text-slate-700 dark:text-[#B6C2D2]">React.js + Three.js</span>
            <span aria-hidden="true">·</span>
            <span>MediaPipe Hand Kinematics</span>
            <span aria-hidden="true">·</span>
            <span>Addis Ababa, Ethiopia</span>
            <span aria-hidden="true">·</span>
            <span className="text-[#22D3EE]">English & አማርኛ</span>
          </div>

          {/* Headline */}
          <div className="space-y-3">
            <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-bold tracking-tight leading-[1.1] text-slate-900 dark:text-[#F8FAFC]">
              Where Hands{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#22D3EE] via-[#2DD4BF] to-[#60A5FA]">
                Become Voices
              </span>
            </h1>
            <p className="text-base sm:text-lg text-slate-600 dark:text-[#B6C2D2] leading-relaxed max-w-2xl font-normal">
              What if a simple hand gesture could speak for you? Built in <strong>React</strong> and driven by on-device computer vision and real-time 3D kinematics, <strong>EjjiLink AI</strong> bridges communication barriers between Deaf, hard-of-hearing, and hearing individuals in both <strong>English</strong> and <strong>Amharic (አማርኛ)</strong>.
            </p>
          </div>

          {/* Action CTAs — Standardized button sizes & hierarchy */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a
              href="#communication-workspace"
              onClick={onStartDemo}
              className="h-12 px-6 rounded-[10px] text-sm font-semibold bg-[#22D3EE] hover:bg-[#2DD4BF] text-[#080D18] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <Camera className="w-4 h-4" />
              Launch Two-Way Studio
            </a>

            <a
              href="#ux-particle-displayer"
              onClick={() => {
                document.getElementById('ux-particle-displayer')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="h-12 px-5 rounded-[10px] text-sm font-medium bg-slate-100 dark:bg-[#19263A] hover:bg-slate-200 dark:hover:bg-[#1E2E44] text-slate-900 dark:text-[#F8FAFC] border border-slate-200 dark:border-[rgba(148,163,184,0.15)] transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#22D3EE]" />
              UX Particle Displayer
            </a>

            {onOpenCloudVault && (
              <button
                onClick={onOpenCloudVault}
                className="h-12 px-5 rounded-[10px] text-sm font-medium bg-transparent hover:bg-slate-100 dark:hover:bg-[#19263A]/60 text-slate-700 dark:text-[#B6C2D2] hover:text-slate-900 dark:hover:text-[#F8FAFC] transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Cloud Vault</span>
              </button>
            )}
          </div>

          {/* Core Trust Guarantees — Standardized 14px cards */}
          <div className="grid sm:grid-cols-3 gap-3 pt-3">
            <div className="p-4 rounded-[14px] bg-white dark:bg-[#121C2D] border border-slate-200 dark:border-[rgba(148,163,184,0.12)] flex items-start gap-3">
              <Shield className="w-5 h-5 text-[#22D3EE] shrink-0 mt-0.5" />
              <div>
                <strong className="block text-xs font-semibold text-slate-900 dark:text-[#F8FAFC]">100% On-Device</strong>
                <span className="text-[12px] text-slate-500 dark:text-[#8493A8]">Zero video frames uploaded or stored.</span>
              </div>
            </div>

            <div className="p-4 rounded-[14px] bg-white dark:bg-[#121C2D] border border-slate-200 dark:border-[rgba(148,163,184,0.12)] flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#34D399] shrink-0 mt-0.5" />
              <div>
                <strong className="block text-xs font-semibold text-slate-900 dark:text-[#F8FAFC]">&gt;80% Lock Guard</strong>
                <span className="text-[12px] text-slate-500 dark:text-[#8493A8]">5-frame temporal smoothing eliminates jitter.</span>
              </div>
            </div>

            <div className="p-4 rounded-[14px] bg-white dark:bg-[#121C2D] border border-slate-200 dark:border-[rgba(148,163,184,0.12)] flex items-start gap-3">
              <Cpu className="w-5 h-5 text-[#8B5CF6] shrink-0 mt-0.5" />
              <div>
                <strong className="block text-xs font-semibold text-slate-900 dark:text-[#F8FAFC]">60 FPS Kinematics</strong>
                <span className="text-[12px] text-slate-500 dark:text-[#8493A8]">Three.js PBR rendering and local AI inference.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Real-Time 3D Communication Experience (UX Particle Displayer) */}
        <div id="ux-particle-displayer" className="lg:col-span-5 space-y-4 scroll-mt-24">
          <CommunicationOrb3D
            state={communicationState}
            audioLevel={audioLevel}
            accent={themeAccent}
            disable3D={disable3D}
            onStateSelect={(s) => setCommunicationState(s)}
            showStateControls={true}
          />

          {/* Quick Sign Vocabulary & Core Reference */}
          <div className="p-5 rounded-[14px] bg-white dark:bg-[#121C2D] border border-slate-200 dark:border-[rgba(148,163,184,0.12)]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-800 dark:text-[#F8FAFC]">
                Everyday Sign Vocabulary (EthSL + Universal)
              </span>
              <span className="text-xs text-[#22D3EE] font-mono font-medium">7 Core Signs</span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center">
              {GESTURE_LIST.slice(0, 4).map((g) => (
                <div
                  key={g.id}
                  className="p-2 rounded-[10px] bg-slate-50 dark:bg-[#0D1422] border border-slate-200 dark:border-[rgba(148,163,184,0.1)]"
                >
                  <span className="text-base block">{g.emoji}</span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-[#F8FAFC] block truncate">{g.labelEn}</span>
                  <span className="text-[11px] text-[#22D3EE] font-ethiopic block truncate">{g.labelAm}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
