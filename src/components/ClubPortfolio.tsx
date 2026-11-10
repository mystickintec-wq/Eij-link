import React from 'react';
import { Layers, Github, Send, GitBranch, Bell, Play } from 'lucide-react';

export const ClubPortfolio: React.FC = () => {
  return (
    <section id="portfolio" className="py-12 scroll-mt-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#22D3EE] block mb-1">
            Official HTCS Student Builds
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-[#F8FAFC] tracking-tight">
            The Ethio-Tech Initiative Portfolio
          </h2>
          <p className="text-slate-600 dark:text-[#B6C2D2] text-xs sm:text-sm mt-1 max-w-2xl">
            Explore our open-source student projects originating from Holy Trinity Cathedral Secondary School in Addis Ababa, Ethiopia.
          </p>
        </div>
        <a
          href="https://github.com/The-Ethio-Tech-Initiative"
          target="_blank"
          rel="noopener noreferrer"
          className="h-10 px-4 rounded-[10px] text-xs font-medium bg-slate-100 dark:bg-[#19263A] hover:bg-slate-200 dark:hover:bg-[#1E2E44] text-slate-800 dark:text-[#F8FAFC] border border-slate-200 dark:border-[rgba(148,163,184,0.15)] flex items-center gap-2 self-start md:self-auto transition-colors"
        >
          <Github className="w-4 h-4" />
          <span>GitHub Organization</span>
        </a>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Project #01: EjjiLink AI */}
        <div className="bg-white dark:bg-[#121C2D] rounded-[18px] p-6 border border-slate-200 dark:border-[rgba(148,163,184,0.12)] shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-[#8493A8]">
              <span className="font-semibold text-[#22D3EE]">Project #01 · Live Production</span>
              <span>Accessibility AI</span>
            </div>

            <h3 className="text-xl font-bold text-slate-900 dark:text-[#F8FAFC] flex items-center gap-2">
              EjjiLink AI
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-[#B6C2D2] leading-relaxed">
              Our assistive web platform that translates 7 core hand gestures into spoken <strong>English</strong> and <strong>Amharic (አማርኛ)</strong> with high-confidence temporal smoothing.
            </p>

            <div className="flex flex-wrap gap-1.5 pt-1 text-xs font-mono text-slate-500 dark:text-[#8493A8]">
              <span>React</span>
              <span aria-hidden="true">·</span>
              <span>MediaPipe</span>
              <span aria-hidden="true">·</span>
              <span>Web Speech API</span>
              <span aria-hidden="true">·</span>
              <span>Three.js PBR</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5 pt-4 border-t border-slate-200 dark:border-[rgba(148,163,184,0.1)]">
            <a
              href="#communication-workspace"
              className="flex-1 h-10 px-4 rounded-[10px] text-xs font-semibold bg-[#22D3EE] hover:bg-[#2DD4BF] text-[#080D18] flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <Play className="w-3.5 h-3.5" /> Use Two-Way Studio
            </a>
            <a
              href="https://github.com/The-Ethio-Tech-Initiative"
              target="_blank"
              rel="noopener noreferrer"
              className="h-10 px-4 rounded-[10px] text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-[#19263A] dark:hover:bg-[#1E2E44] text-slate-800 dark:text-[#F8FAFC] border border-slate-200 dark:border-[rgba(148,163,184,0.15)] flex items-center gap-1.5 transition-colors"
            >
              <Github className="w-3.5 h-3.5" /> View Repo
            </a>
          </div>
        </div>

        {/* Project #02: Guzo AI */}
        <div className="bg-white dark:bg-[#121C2D] rounded-[18px] p-6 border border-slate-200 dark:border-[rgba(148,163,184,0.12)] shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-[#8493A8]">
              <span className="font-semibold text-[#FBBF24]">Project #02 · In Development</span>
              <span>Transit & Route AI</span>
            </div>

            <h3 className="text-xl font-bold text-slate-900 dark:text-[#F8FAFC] flex items-center gap-2">
              Guzo AI (ጉዞ AI)
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-[#B6C2D2] leading-relaxed">
              Our upcoming second student-led initiative: an intelligent Ethiopian route, commuter guidance, and transit assistant designed to simplify everyday travel across Addis Ababa.
            </p>

            <div className="flex flex-wrap gap-1.5 pt-1 text-xs font-mono text-slate-500 dark:text-[#8493A8]">
              <span>React</span>
              <span aria-hidden="true">·</span>
              <span>Route Intelligence</span>
              <span aria-hidden="true">·</span>
              <span>Addis Transit Map</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5 pt-4 border-t border-slate-200 dark:border-[rgba(148,163,184,0.1)]">
            <a
              href="https://github.com/The-Ethio-Tech-Initiative"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 h-10 px-4 rounded-[10px] text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-[#19263A] dark:hover:bg-[#1E2E44] text-slate-800 dark:text-[#F8FAFC] border border-slate-200 dark:border-[rgba(148,163,184,0.15)] flex items-center justify-center gap-1.5 transition-colors"
            >
              <GitBranch className="w-3.5 h-3.5" /> Track on GitHub
            </a>
            <a
              href="https://t.me/EthioTech_HTCS"
              target="_blank"
              rel="noopener noreferrer"
              className="h-10 px-4 rounded-[10px] text-xs font-medium bg-slate-100 dark:bg-[#19263A] hover:bg-slate-200 dark:hover:bg-[#1E2E44] text-[#22D3EE] border border-slate-200 dark:border-[rgba(148,163,184,0.15)] flex items-center gap-1.5 transition-colors"
            >
              <Bell className="w-3.5 h-3.5" /> Launch Alert
            </a>
          </div>
        </div>
      </div>

      {/* HTCS Club Hub Banner */}
      <div className="bg-white dark:bg-[#0D1422] rounded-[18px] p-6 sm:p-7 border border-slate-200 dark:border-[rgba(148,163,184,0.12)] shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1.5">
          <span className="text-xs font-semibold text-[#22D3EE] uppercase tracking-wider block">
            Student Innovation Movement
          </span>
          <h3 className="text-xl font-bold text-slate-900 dark:text-[#F8FAFC]">
            The Ethio-Tech Initiative @ HTCS
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-[#B6C2D2] max-w-xl">
            Passionate about accessible AI, web engineering, and social impact? Connect with student peers and mentors on our official Telegram channel.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 shrink-0">
          <a
            href="https://t.me/EthioTech_HTCS"
            target="_blank"
            rel="noopener noreferrer"
            className="h-10 px-5 rounded-[10px] text-xs font-semibold bg-[#22D3EE] hover:bg-[#2DD4BF] text-[#080D18] flex items-center gap-2 transition-colors shadow-xs"
          >
            <Send className="w-4 h-4" /> Join @EthioTech_HTCS
          </a>
        </div>
      </div>
    </section>
  );
};
