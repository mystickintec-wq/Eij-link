import React from 'react';
import { Heart } from 'lucide-react';

export const SchoolStory: React.FC = () => {
  return (
    <section id="our-story" className="py-12 scroll-mt-20">
      <div className="text-center mb-10">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#F87171] inline-flex items-center gap-1.5 mb-2">
          <Heart className="w-3.5 h-3.5" /> Human-Centered AI
        </span>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-[#F8FAFC] tracking-tight">
          Why We Built EjjiLink AI
        </h2>
        <p className="text-slate-600 dark:text-[#B6C2D2] text-xs sm:text-sm max-w-2xl mx-auto mt-1">
          A story about bringing people closer—using accessible technology to turn silent gestures into shared understanding.
        </p>
      </div>

      <div className="bg-white dark:bg-[#121C2D] rounded-[18px] p-6 md:p-8 border border-slate-200 dark:border-[rgba(148,163,184,0.12)] shadow-sm">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#22D3EE] block">
              Inclusion Through Innovation
            </span>

            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-[#F8FAFC] leading-snug">
              Bridging Communication Barriers in Ethiopia
            </h3>

            <p className="text-slate-600 dark:text-[#B6C2D2] text-xs sm:text-sm leading-relaxed">
              In Ethiopia, vibrant languages and cultural signing exist side by side, yet communication barriers can still isolate members of the Deaf and hard-of-hearing community. Our mission at <strong>The Ethio-Tech Initiative</strong> was to build a tool that feels natural, respectful, and operates instantly on ordinary school laptops and phones without requiring expensive custom sensor hardware.
            </p>

            <p className="text-slate-600 dark:text-[#B6C2D2] text-xs sm:text-sm leading-relaxed">
              Engineered by high school students at <strong>Holy Trinity Cathedral Secondary School</strong> in Addis Ababa, EjjiLink AI prioritizes stability and trust over superficial complexity. We engineered 7 essential everyday gestures with strict confidence gating and on-device privacy.
            </p>

            {/* Emblem Meaning Callout */}
            <div className="p-4 rounded-[14px] bg-slate-50 dark:bg-[#0D1422] border border-slate-200 dark:border-[rgba(148,163,184,0.12)] flex items-start gap-3">
              <div className="w-8 h-8 rounded-[8px] bg-[#22D3EE]/15 text-[#22D3EE] flex items-center justify-center font-bold text-sm shrink-0">
                ነ
              </div>
              <div className="text-xs text-slate-600 dark:text-[#B6C2D2] leading-relaxed">
                <strong className="text-slate-900 dark:text-[#F8FAFC] block mb-0.5">Heritage Meets Tomorrow:</strong>
                Our emblem unites the Axum Obelisk with glowing circuit pathways—symbolizing Ethiopia's heritage inspiring the next generation of African computer vision innovation.
              </div>
            </div>
          </div>

          {/* Performance & Trust Metric Cards */}
          <div className="grid grid-cols-2 gap-3.5">
            <div className="bg-slate-50 dark:bg-[#0D1422] p-5 rounded-[14px] border border-slate-200 dark:border-[rgba(148,163,184,0.12)] text-center">
              <div className="text-3xl font-bold font-mono tabular-nums text-[#34D399] mb-1">&gt;80%</div>
              <div className="text-xs font-semibold text-slate-800 dark:text-[#F8FAFC]">Confidence Lock</div>
              <div className="text-[11px] text-slate-500 dark:text-[#8493A8] mt-1">Filters out erratic tremors and transitions</div>
            </div>

            <div className="bg-slate-50 dark:bg-[#0D1422] p-5 rounded-[14px] border border-slate-200 dark:border-[rgba(148,163,184,0.12)] text-center">
              <div className="text-3xl font-bold font-mono tabular-nums text-[#22D3EE] mb-1">7</div>
              <div className="text-xs font-semibold text-slate-800 dark:text-[#F8FAFC]">Core Gestures</div>
              <div className="text-[11px] text-slate-500 dark:text-[#8493A8] mt-1">EthSL and universal gestures validated</div>
            </div>

            <div className="bg-slate-50 dark:bg-[#0D1422] p-5 rounded-[14px] border border-slate-200 dark:border-[rgba(148,163,184,0.12)] text-center">
              <div className="text-3xl font-bold font-mono tabular-nums text-[#60A5FA] mb-1">0ms</div>
              <div className="text-xs font-semibold text-slate-800 dark:text-[#F8FAFC]">Cloud Frame Uploads</div>
              <div className="text-[11px] text-slate-500 dark:text-[#8493A8] mt-1">100% on-device local camera inference</div>
            </div>

            <div className="bg-slate-50 dark:bg-[#0D1422] p-5 rounded-[14px] border border-slate-200 dark:border-[rgba(148,163,184,0.12)] text-center">
              <div className="text-3xl font-bold font-mono tabular-nums text-[#8B5CF6] mb-1">2</div>
              <div className="text-xs font-semibold text-slate-800 dark:text-[#F8FAFC]">Supported Languages</div>
              <div className="text-[11px] text-slate-500 dark:text-[#8493A8] mt-1">English and Amharic (አማርኛ)</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
