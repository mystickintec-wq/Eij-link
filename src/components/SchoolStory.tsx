import React from 'react';
import { Heart, ShieldCheck, Award, Globe, Users } from 'lucide-react';

export const SchoolStory: React.FC = () => {
  return (
    <section id="our-story" className="py-16 scroll-mt-20">
      <div className="text-center mb-12">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border border-red-300 dark:border-red-500/30 mb-3 font-heading">
          <Heart className="w-3.5 h-3.5 text-red-500 dark:text-red-400" /> Human-Centered AI
        </span>
        <h2 className="font-display text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          Why We Built EjjiLink AI
        </h2>
        <p className="text-slate-600 dark:text-gray-400 text-sm sm:text-base max-w-2xl mx-auto mt-2">
          “A story about bringing people closer—using accessible technology to turn silent gestures into shared understanding.”
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 md:p-12 border border-gray-200 dark:border-emerald-500/30 shadow-xl">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-5">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-600 text-white font-heading">
              Inclusion Through Innovation
            </span>

            <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-snug">
              Bridging Communication Barriers in Ethiopia
            </h3>

            <p className="text-slate-600 dark:text-gray-300 text-sm leading-relaxed">
              In Ethiopia, vibrant languages and cultural signing exist side by side, yet communication barriers can still isolate members of the Deaf and hard-of-hearing community. Our mission at <strong>The Ethio-Tech Initiative</strong> was to build a tool in <strong>React.js</strong> that feels natural, respectful, and operates instantly on ordinary school laptops and phones without requiring expensive custom sensor gloves.
            </p>

            <p className="text-slate-600 dark:text-gray-300 text-sm leading-relaxed">
              Engineered by high school students at <strong>Holy Trinity Cathedral General Secondary School</strong> in Addis Ababa, EjjiLink AI prioritizes stability and trust over superficial complexity. Rather than overwhelming users with dozens of brittle signs, we engineered 7 essential everyday gestures with strict confidence gating and on-device privacy.
            </p>

            {/* Emblem Meaning Callout */}
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-amber-500/30 flex items-start gap-3.5 shadow-xs">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-600 to-amber-500 flex items-center justify-center text-white font-extrabold text-lg shrink-0 shadow-md">
                ነ
              </div>
              <div className="text-xs text-slate-700 dark:text-gray-300 leading-relaxed">
                <strong className="text-amber-700 dark:text-amber-400 block mb-0.5 font-heading">Heritage Meets Tomorrow:</strong>
                Our club emblem unites the monumental Axum Obelisk with glowing circuit pathways—symbolizing Ethiopia's timeless civilization powering the next generation of African computer vision innovation.
              </div>
            </div>
          </div>

          {/* Performance & Trust Metric Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-slate-950 p-6 rounded-2xl border border-gray-200 dark:border-emerald-500/30 text-center shadow-xs">
              <div className="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400 mb-1 font-display">&gt;80%</div>
              <div className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider font-heading">Confidence Lock</div>
              <div className="text-[11px] text-slate-500 dark:text-gray-400 mt-1">Filters out erratic hand tremors and transitions</div>
            </div>

            <div className="bg-gray-50 dark:bg-slate-950 p-6 rounded-2xl border border-gray-200 dark:border-amber-500/30 text-center shadow-xs">
              <div className="text-3xl sm:text-4xl font-black text-amber-600 dark:text-amber-400 mb-1 font-display">7</div>
              <div className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider font-heading">Core Gestures</div>
              <div className="text-[11px] text-slate-500 dark:text-gray-400 mt-1">Engineered for essential everyday conversations</div>
            </div>

            <div className="bg-gray-50 dark:bg-slate-950 p-6 rounded-2xl border border-gray-200 dark:border-red-500/30 text-center shadow-xs">
              <div className="text-3xl sm:text-4xl font-black text-red-600 dark:text-red-400 mb-1 font-display">2</div>
              <div className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider font-heading">Primary Languages</div>
              <div className="text-[11px] text-slate-500 dark:text-gray-400 mt-1 font-ethiopic">Instant English & Ge'ez Amharic (አማርኛ) display</div>
            </div>

            <div className="bg-gray-50 dark:bg-slate-950 p-6 rounded-2xl border border-gray-200 dark:border-sky-500/30 text-center shadow-xs">
              <div className="text-3xl sm:text-4xl font-black text-sky-600 dark:text-sky-400 mb-1 font-display">100%</div>
              <div className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider font-heading">On-Device Privacy</div>
              <div className="text-[11px] text-slate-500 dark:text-gray-400 mt-1">Zero camera frames ever leave your local browser</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
