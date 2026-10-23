import React from 'react';
import { Github, Send, Heart, Sparkles, Code2 } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white dark:bg-slate-950 border-t border-gray-200 dark:border-slate-800 py-12 text-xs text-slate-600 dark:text-gray-400 transition-colors">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-gray-200 dark:border-slate-800">
          {/* School & Club Identity */}
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-amber-500/70 bg-[#0b192c] shrink-0 shadow-sm">
              <img
                src="/assets/aistudio/Club_Logo_4c19d54c.jpg"
                alt="The Ethio-Tech Initiative"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2 font-heading">
                <span>EjjiLink AI</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30">
                  React.js Architecture
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-gray-400">
                The Ethio-Tech Initiative • Holy Trinity Cathedral General Secondary School, Addis Ababa
              </p>
            </div>
          </div>

          {/* Tech Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-emerald-700 dark:text-emerald-400 font-mono text-[11px] font-semibold">
              React 19
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-amber-700 dark:text-amber-400 font-mono text-[11px] font-semibold">
              Three.js PBR 3D
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-sky-700 dark:text-sky-400 font-mono text-[11px] font-semibold">
              MediaPipe Hands
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-purple-700 dark:text-purple-400 font-mono text-[11px] font-semibold">
              Web Speech API
            </span>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/The-Ethio-Tech-Initiative"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 border border-gray-200 dark:border-slate-800 transition-colors shadow-xs"
              title="GitHub Organization"
            >
              <Github className="w-4 h-4" />
            </a>
            <a
              href="https://t.me/EthioTech_HTCS"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-gray-300 hover:text-sky-600 dark:hover:text-sky-400 border border-gray-200 dark:border-slate-800 transition-colors shadow-xs"
              title="Telegram Channel"
            >
              <Send className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Bottom Credits & Integrity Disclaimer */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-[11px]">
          <p>
            Built by student innovators at Holy Trinity Cathedral General Secondary School. Inspired by humanity. Powered by innovation.
          </p>
          <p className="text-slate-500 font-medium">
            🇪🇹 Innovation • Inclusion • Impact
          </p>
        </div>
      </div>
    </footer>
  );
};
