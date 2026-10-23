import React, { useState } from 'react';
import { 
  Video, 
  Layers, 
  Compass, 
  Heart, 
  Users, 
  Github, 
  Send, 
  Sun, 
  Moon, 
  Menu, 
  X, 
  Sparkles,
  ShieldCheck,
  Cloud,
  Code2,
  FlaskConical
} from 'lucide-react';

interface HeaderProps {
  currentTheme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenArchitecture: () => void;
  onOpenCloudVault: () => void;
  onOpenEvaluationLab: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTheme,
  onToggleTheme,
  onOpenArchitecture,
  onOpenCloudVault,
  onOpenEvaluationLab
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 nav-glass transition-colors duration-300">
      <nav className="container mx-auto px-4 md:px-6 py-3.5 flex items-center justify-between">
        {/* Brand / Official Club Logo */}
        <a href="#" className="flex items-center gap-3 group">
          <div className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-amber-500/80 shadow-md bg-[#0b192c] flex items-center justify-center shrink-0">
            {!logoError ? (
              <img
                src="/assets/aistudio/Club_Logo_4c19d54c.jpg"
                alt="The Ethio-Tech Initiative Logo"
                className="w-full h-full object-cover"
                onError={() => setLogoError(true)}
              />
            ) : (
              /* Built-in SVG Fallback matching the Axum Obelisk + Circuit Emblem */
              <div className="w-full h-full flex items-center justify-center bg-[#0b192c] text-amber-400">
                <svg viewBox="0 0 64 64" className="w-8 h-8">
                  <polygon points="32,8 26,16 24,52 40,52 38,16" fill="none" stroke="#eab308" strokeWidth="2.5" />
                  <line x1="20" y1="56" x2="44" y2="56" stroke="#eab308" strokeWidth="3" />
                  <circle cx="16" cy="26" r="3.5" fill="#34d399" />
                  <circle cx="48" cy="22" r="3.5" fill="#34d399" />
                  <circle cx="32" cy="30" r="3.5" fill="#34d399" />
                  <path d="M18,46 Q34,36 48,22" fill="none" stroke="#f8fafc" strokeWidth="2" />
                </svg>
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 via-amber-500 to-emerald-500 dark:from-emerald-400 dark:via-amber-300 dark:to-emerald-400">
                EjjiLink AI
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300/50 dark:border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                React.js
              </span>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium truncate max-w-[210px] sm:max-w-none">
              The Ethio-Tech Initiative • HTCS Addis Ababa
            </p>
          </div>
        </a>

        {/* Desktop Navigation Links (Transparent & Clean) */}
        <div className="hidden lg:flex items-center gap-5 text-sm font-semibold text-slate-700 dark:text-gray-300">
          <a href="#communication-workspace" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1.5 font-heading">
            <Video className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Two-Way Studio
          </a>
          <a href="#portfolio" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1.5 font-heading">
            <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Club Portfolio
          </a>
          <a href="#camera-guide" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1.5 font-heading">
            <Compass className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Camera Guide
          </a>
          <button
            onClick={onOpenEvaluationLab}
            className="hover:text-amber-500 dark:hover:text-amber-300 transition-colors flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-700 dark:text-amber-300 font-heading cursor-pointer shadow-xs"
          >
            <FlaskConical className="w-3.5 h-3.5 text-amber-500" /> Evaluation Lab
          </button>
          <button
            onClick={onOpenCloudVault}
            className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 text-slate-700 dark:text-gray-300 border border-gray-200 dark:border-slate-700 font-heading cursor-pointer"
          >
            <Cloud className="w-3.5 h-3.5 text-sky-500" /> Cloud Vault
          </button>
          <button
            onClick={onOpenArchitecture}
            className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-heading cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Privacy & Cloud
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <a
            href="https://github.com/The-Ethio-Tech-Initiative"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/70 dark:bg-slate-800/80 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-slate-700 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-300 shadow-xs backdrop-blur-md transition-all"
          >
            <Github className="w-3.5 h-3.5" />
            GitHub
          </a>

          <a
            href="https://t.me/EthioTech_HTCS"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30 hover:bg-sky-500/25 transition-all shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            Telegram
          </a>

          {/* Theme Toggle Button (Supports Dark & Light Modes) */}
          <button
            onClick={onToggleTheme}
            aria-label="Toggle Dark and Light Mode"
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/80 dark:bg-slate-800/80 text-amber-500 dark:text-amber-300 border border-gray-200 dark:border-slate-700 hover:border-emerald-500 shadow-xs backdrop-blur-md transition-all cursor-pointer"
            title={`Switch to ${currentTheme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {currentTheme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 hover:rotate-45" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700 transition-transform duration-300 hover:-rotate-12" />
            )}
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Open Mobile Menu"
            className="lg:hidden w-10 h-10 rounded-xl flex items-center justify-center bg-white/80 dark:bg-slate-800/80 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-slate-700"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Dropdown Menu (Adaptive Light/Dark) */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-gray-200 dark:border-slate-800 px-4 pt-3 pb-5 space-y-2.5 shadow-xl transition-all">
          <a
            href="#communication-workspace"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3.5 py-2.5 rounded-xl font-medium text-gray-800 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 dark:hover:text-emerald-300 font-heading"
          >
            Two-Way Communication Studio
          </a>
          <a
            href="#portfolio"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3.5 py-2.5 rounded-xl font-medium text-gray-800 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 dark:hover:text-emerald-300 font-heading"
          >
            Club Portfolio (EjjiLink & Guzo AI)
          </a>
          <a
            href="#camera-guide"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3.5 py-2.5 rounded-xl font-medium text-gray-800 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 dark:hover:text-emerald-300 font-heading"
          >
            Camera Positioning Guide
          </a>
          <a
            href="#our-story"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3.5 py-2.5 rounded-xl font-medium text-gray-800 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 dark:hover:text-emerald-300 font-heading"
          >
            Our Ethiopian Story
          </a>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenEvaluationLab();
            }}
            className="w-full text-left px-3.5 py-2.5 rounded-xl font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 border border-amber-500/30 flex items-center gap-2"
          >
            <FlaskConical className="w-4 h-4 text-amber-500" />
            <span>Evaluation & Testing Lab</span>
          </button>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenCloudVault();
            }}
            className="w-full text-left px-3.5 py-2.5 rounded-xl font-medium text-slate-700 dark:text-gray-300 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex items-center gap-2"
          >
            <Cloud className="w-4 h-4 text-sky-500" />
            <span>Cloud Storage Vault</span>
          </button>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenArchitecture();
            }}
            className="w-full text-left px-3.5 py-2.5 rounded-xl font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Cloud Architecture & Privacy</span>
          </button>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <a
              href="https://github.com/The-Ethio-Tech-Initiative"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-semibold bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-white text-xs border border-gray-200 dark:border-slate-700"
            >
              <Github className="w-4 h-4" /> GitHub Org
            </a>
            <a
              href="https://t.me/EthioTech_HTCS"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-semibold bg-sky-500 text-white text-xs"
            >
              <Send className="w-4 h-4" /> Telegram
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
