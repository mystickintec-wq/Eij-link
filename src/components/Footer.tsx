import React from 'react';
import { Github, Send, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gradient-to-b from-white/85 to-sky-50/85 dark:bg-none dark:bg-[#080D18] backdrop-blur-md border-t border-cyan-900/10 dark:border-[#253448] py-8 text-xs text-slate-600 dark:text-[#A0AEC0] transition-colors">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-200 dark:border-[#253448]">
          {/* School & Club Identity */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full overflow-hidden border border-slate-300 dark:border-[#253448] bg-[#101C2C] shrink-0">
              <img
                src="/assets/aistudio/Club_Logo_4c19d54c.jpg"
                alt="The Ethio-Tech Initiative"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="font-heading font-semibold text-sm text-slate-900 dark:text-[#F4F7FB]">
                EjjiLink AI
              </div>
              <p className="text-[11px] text-slate-600 dark:text-[#A0AEC0]">
                The Ethio-Tech Initiative · Holy Trinity Cathedral Secondary School, Addis Ababa
              </p>
            </div>
          </div>

          {/* Tech specs */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-mono text-slate-600 dark:text-[#A0AEC0]">
            <span>React</span>
            <span aria-hidden="true">·</span>
            <span>2D Skeleton Overlay</span>
            <span aria-hidden="true">·</span>
            <span>MediaPipe Vision</span>
            <span aria-hidden="true">·</span>
            <span>Web Speech API</span>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-2">
            <a
              href="https://github.com/The-Ethio-Tech-Initiative"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-[10px] bg-white dark:bg-[#101C2C] hover:bg-slate-200 dark:hover:bg-[#172438] text-slate-700 dark:text-[#A0AEC0] hover:text-[#0E7490] dark:hover:text-[#43D9E9] border border-slate-300/80 dark:border-[#253448] transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9]"
              title="GitHub Organization"
              aria-label="GitHub Organization"
            >
              <Github className="w-4 h-4" aria-hidden="true" />
            </a>
            <a
              href="https://t.me/EthioTech_HTCS"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-[10px] bg-white dark:bg-[#101C2C] hover:bg-slate-200 dark:hover:bg-[#172438] text-slate-700 dark:text-[#A0AEC0] hover:text-[#0E7490] dark:hover:text-[#43D9E9] border border-slate-300/80 dark:border-[#253448] transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9]"
              title="Telegram Community"
              aria-label="Telegram Community"
            >
              <Send className="w-4 h-4" aria-hidden="true" />
            </a>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-600 dark:text-[#A0AEC0]">
          <p>
            © {new Date().getFullYear()} The Ethio-Tech Initiative. Built for accessible Ethiopian communication.
          </p>
          <div className="flex items-center gap-1.5">
            <span>Crafted with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" aria-hidden="true" />
            <span>in Addis Ababa, Ethiopia</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
