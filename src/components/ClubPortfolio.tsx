import React from 'react';
import { Layers, Github, Send, GitBranch, Bell, Play, ExternalLink, Sparkles, Code2 } from 'lucide-react';

export const ClubPortfolio: React.FC = () => {
  return (
    <section id="portfolio" className="py-16 scroll-mt-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 mb-3 font-heading">
            <Layers className="w-3.5 h-3.5" /> Official HTCS Student Builds
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            The Ethio-Tech Initiative Portfolio
          </h2>
          <p className="text-slate-600 dark:text-gray-400 text-sm mt-2 max-w-2xl">
            Explore our open-source student projects originating from Holy Trinity Cathedral General Secondary and Preparatory School in Addis Ababa, Ethiopia.
          </p>
        </div>
        <a
          href="https://github.com/The-Ethio-Tech-Initiative"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-slate-800 dark:text-gray-200 border border-gray-200 dark:border-slate-700 flex items-center gap-2 self-start md:self-auto transition-all shadow-xs"
        >
          <Github className="w-4 h-4" />
          github.com/The-Ethio-Tech-Initiative
        </a>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* Project #01: EjjiLink AI */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-7 border-2 border-emerald-500/60 shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30">
                ● Project #01 • LIVE NOW
              </span>
              <span className="text-xs font-medium text-slate-500 dark:text-gray-400">Accessibility AI</span>
            </div>

            <h3 className="font-display text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              🤲 EjjiLink AI
            </h3>

            <p className="text-sm text-slate-600 dark:text-gray-300 leading-relaxed">
              Our flagship assistive web application built with <strong>React.js</strong> that translates 7 core hand gestures into spoken <strong>English</strong> and <strong>Amharic (አማርኛ)</strong> with high-confidence temporal smoothing.
            </p>

            <div className="flex flex-wrap gap-2 pt-2">
              <span className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-slate-950 text-slate-700 dark:text-gray-300 border border-gray-200 dark:border-slate-800 font-semibold text-emerald-700 dark:text-emerald-400">
                React.js
              </span>
              <span className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-slate-950 text-slate-700 dark:text-gray-300 border border-gray-200 dark:border-slate-800">
                MediaPipe Hands
              </span>
              <span className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-slate-950 text-slate-700 dark:text-gray-300 border border-gray-200 dark:border-slate-800">
                Web Speech API
              </span>
              <span className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-slate-950 text-slate-700 dark:text-gray-300 border border-gray-200 dark:border-slate-800">
                Three.js 3D
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-6 mt-6 border-t border-gray-100 dark:border-slate-800">
            <a
              href="#communication-workspace"
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <Play className="w-3.5 h-3.5" /> Use Two-Way Studio
            </a>
            <a
              href="https://github.com/The-Ethio-Tech-Initiative"
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-4 rounded-xl text-xs font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-gray-200 border border-gray-200 dark:border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Github className="w-3.5 h-3.5" /> View Repo
            </a>
          </div>
        </div>

        {/* Project #02: Guzo AI */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-7 border-2 border-amber-500/50 shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30">
                ⏳ Project #02 • PENDING / IN DEV
              </span>
              <span className="text-xs font-medium text-slate-500 dark:text-gray-400">Transit & Route AI</span>
            </div>

            <h3 className="font-display text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              🧭 Guzo AI (ጉዞ AI)
            </h3>

            <p className="text-sm text-slate-600 dark:text-gray-300 leading-relaxed">
              Our upcoming second student-led innovation: an intelligent Ethiopian route, commuter guidance, and local travel assistant designed to simplify everyday journeys across Addis Ababa and beyond.
            </p>

            <div className="flex flex-wrap gap-2 pt-2">
              <span className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-slate-950 text-slate-700 dark:text-gray-300 border border-gray-200 dark:border-slate-800 font-semibold text-amber-700 dark:text-amber-400">
                React.js
              </span>
              <span className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-slate-950 text-slate-700 dark:text-gray-300 border border-gray-200 dark:border-slate-800">
                AI Route Assistant
              </span>
              <span className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-slate-950 text-slate-700 dark:text-gray-300 border border-gray-200 dark:border-slate-800">
                Addis Ababa Routing
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-6 mt-6 border-t border-gray-100 dark:border-slate-800">
            <a
              href="https://github.com/The-Ethio-Tech-Initiative"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 flex items-center justify-center gap-1.5 transition-colors"
            >
              <GitBranch className="w-3.5 h-3.5" /> Track on GitHub
            </a>
            <a
              href="https://t.me/EthioTech_HTCS"
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-4 rounded-xl text-xs font-semibold bg-sky-500/15 hover:bg-sky-500/25 text-sky-700 dark:text-sky-300 border border-sky-500/30 flex items-center gap-1.5 transition-colors"
            >
              <Bell className="w-3.5 h-3.5" /> Launch Alert
            </a>
          </div>
        </div>
      </div>

      {/* HTCS Club Hub Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950/80 to-slate-900 text-white rounded-3xl p-8 border border-emerald-500/30 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-400 font-heading">
            <Sparkles className="w-4 h-4" />
            <span>Join The Student Innovation Movement</span>
          </div>
          <h3 className="font-display text-2xl font-black text-white">
            The Ethio-Tech Initiative @ HTCS
          </h3>
          <p className="text-sm text-gray-300 max-w-xl">
            Passionate about coding, React.js, AI, and social impact? Connect with student peers and mentors on our official Telegram channel.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 shrink-0">
          <a
            href="https://t.me/EthioTech_HTCS"
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-3 rounded-2xl text-xs font-bold bg-sky-500 hover:bg-sky-400 text-white flex items-center gap-2 shadow-lg transition-all"
          >
            <Send className="w-4 h-4" /> Join @EthioTech_HTCS
          </a>
        </div>
      </div>
    </section>
  );
};
