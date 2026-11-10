import React from 'react';
import { Github, Send, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-100 dark:bg-[#080D18] border-t border-slate-200 dark:border-[rgba(148,163,184,0.12)] py-10 text-xs text-slate-500 dark:text-[#8493A8] transition-colors">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-200 dark:border-[rgba(148,163,184,0.1)]">
          {/* School & Club Identity */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-300 dark:border-[rgba(148,163,184,0.2)] bg-[#0D1422] shrink-0">
              <img
                src="/assets/aistudio/Club_Logo_4c19d54c.jpg"
                alt="The Ethio-Tech Initiative"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="font-semibold text-sm text-slate-900 dark:text-[#F8FAFC]">
                EjjiLink AI
              </div>
              <p className="text-[11px] text-slate-500 dark:text-[#8493A8]">
                The Ethio-Tech Initiative · Holy Trinity Cathedral Secondary School, Addis Ababa
              </p>
            </div>
          </div>

          {/* Clean metadata tech specs */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-mono text-slate-500 dark:text-[#8493A8]">
            <span>React</span>
            <span aria-hidden="true">·</span>
            <span>Three.js PBR</span>
            <span aria-hidden="true">·</span>
            <span>MediaPipe Hands</span>
            <span aria-hidden="true">·</span>
            <span>Web Speech API</span>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-2">
            <a
              href="https://github.com/The-Ethio-Tech-Initiative"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-[8px] bg-white dark:bg-[#121C2D] hover:bg-slate-200 dark:hover:bg-[#19263A] text-slate-700 dark:text-[#B6C2D2] hover:text-[#22D3EE] border border-slate-200 dark:border-[rgba(148,163,184,0.15)] transition-colors flex items-center justify-center"
              title="GitHub Organization"
              aria-label="GitHub Organization"
            >
              <Github className="w-4 h-4" />
            </a>
            <a
              href="https://t.me/EthioTech_HTCS"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-[8px] bg-white dark:bg-[#121C2D] hover:bg-slate-200 dark:hover:bg-[#19263A] text-slate-700 dark:text-[#B6C2D2] hover:text-[#22D3EE] border border-slate-200 dark:border-[rgba(148,163,184,0.15)] transition-colors flex items-center justify-center"
              title="Telegram Community"
              aria-label="Telegram Community"
            >
              <Send className="w-4 h-4" />
            </a>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500 dark:text-[#8493A8]">
          <p>
            © {new Date().getFullYear()} The Ethio-Tech Initiative. Built for accessible Ethiopian communication.
          </p>
          <div className="flex items-center gap-1.5">
            <span>Crafted with</span>
            <Heart className="w-3.5 h-3.5 text-[#F87171] fill-[#F87171]" />
            <span>in Addis Ababa, Ethiopia</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
