import React, { useState } from 'react';
import { 
  Video, 
  Layers, 
  Compass, 
  Github, 
  Send, 
  Sun, 
  Moon, 
  Menu, 
  X, 
  ShieldCheck,
  Cloud,
  FlaskConical,
  SlidersHorizontal,
  Mic,
  MicOff
} from 'lucide-react';
import { useCommunication } from '../context/CommunicationContext';
import { voiceNavigationService } from '../services/voiceNavigationService';

interface HeaderProps {
  currentTheme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenArchitecture: () => void;
  onOpenCloudVault: () => void;
  onOpenEvaluationLab: () => void;
  onOpenAccessibility: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTheme,
  onToggleTheme,
  onOpenArchitecture,
  onOpenCloudVault,
  onOpenEvaluationLab,
  onOpenAccessibility
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const { communicationState, setCommunicationState, isVoiceNavActive, setVoiceNavActive } = useCommunication();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 nav-glass transition-colors duration-200">
      <nav className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-6">
        {/* Zone 1: Brand & Initiative Wordmark */}
        <a href="#" className="flex items-center gap-3 shrink-0 group">
          <div className="w-9 h-9 rounded-full overflow-hidden border border-[rgba(148,163,184,0.2)] dark:border-[rgba(148,163,184,0.15)] bg-[#121C2D] flex items-center justify-center shrink-0">
            {!logoError ? (
              <img
                src="/assets/aistudio/Club_Logo_4c19d54c.jpg"
                alt="The Ethio-Tech Initiative Logo"
                className="w-full h-full object-cover"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#22D3EE]">
                <svg viewBox="0 0 64 64" className="w-6 h-6">
                  <polygon points="32,8 26,16 24,52 40,52 38,16" fill="none" stroke="currentColor" strokeWidth="2.5" />
                  <line x1="20" y1="56" x2="44" y2="56" stroke="currentColor" strokeWidth="3" />
                  <circle cx="16" cy="26" r="3.5" fill="#2DD4BF" />
                  <circle cx="48" cy="22" r="3.5" fill="#2DD4BF" />
                  <circle cx="32" cy="30" r="3.5" fill="#2DD4BF" />
                  <path d="M18,46 Q34,36 48,22" fill="none" stroke="#F8FAFC" strokeWidth="2" />
                </svg>
              </div>
            )}
          </div>
          <div>
            <span className="font-bold text-base tracking-tight text-slate-900 dark:text-[#F8FAFC] group-hover:text-[#22D3EE] transition-colors">
              EjjiLink AI
            </span>
            <p className="text-[11px] text-slate-500 dark:text-[#8493A8] font-normal leading-none hidden sm:block">
              The Ethio-Tech Initiative · HTCS Addis Ababa
            </p>
          </div>
        </a>

        {/* Zone 2: Navigation Links (Single-line, clear hierarchy) */}
        <div className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-[#B6C2D2]">
          <a 
            href="#communication-workspace" 
            className="hover:text-slate-900 dark:hover:text-[#F8FAFC] transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <Video className="w-4 h-4 text-[#22D3EE]" /> Two-Way Studio
          </a>
          <a 
            href="#portfolio" 
            className="hover:text-slate-900 dark:hover:text-[#F8FAFC] transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <Layers className="w-4 h-4 text-[#2DD4BF]" /> Portfolio
          </a>
          <a 
            href="#camera-guide" 
            className="hover:text-slate-900 dark:hover:text-[#F8FAFC] transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <Compass className="w-4 h-4 text-[#60A5FA]" /> Camera Guide
          </a>
          
          <button
            onClick={onOpenEvaluationLab}
            className="hover:text-slate-900 dark:hover:text-[#F8FAFC] transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer text-xs px-2.5 py-1 rounded-[8px] bg-slate-100 dark:bg-[#121C2D] border border-slate-200 dark:border-[rgba(148,163,184,0.12)]"
          >
            <FlaskConical className="w-3.5 h-3.5 text-[#FBBF24]" /> Evaluation Lab
          </button>

          <button
            onClick={onOpenCloudVault}
            className="hover:text-slate-900 dark:hover:text-[#F8FAFC] transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer text-xs px-2.5 py-1 rounded-[8px] bg-slate-100 dark:bg-[#121C2D] border border-slate-200 dark:border-[rgba(148,163,184,0.12)]"
          >
            <Cloud className="w-3.5 h-3.5 text-[#60A5FA]" /> Cloud Vault
          </button>

          <button
            onClick={onOpenArchitecture}
            className="hover:text-slate-900 dark:hover:text-[#F8FAFC] transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer text-xs px-2.5 py-1 rounded-[8px] bg-slate-100 dark:bg-[#121C2D] border border-slate-200 dark:border-[rgba(148,163,184,0.12)]"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#34D399]" /> Privacy
          </button>
        </div>

        {/* Zone 3: Primary Actions & Utilities */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Voice Navigation Quick Toggle */}
          <button
            onClick={() => {
              if (isVoiceNavActive) {
                voiceNavigationService.stop();
                setVoiceNavActive(false);
                setCommunicationState('idle', 'Voice navigation paused.');
              } else {
                setVoiceNavActive(true);
                setCommunicationState('listening', 'Microphone active • Listening for voice commands...');
              }
            }}
            className={`h-9 px-3 rounded-[10px] text-xs font-medium transition-colors cursor-pointer border flex items-center gap-1.5 ${
              isVoiceNavActive
                ? 'bg-[#22D3EE] text-[#080D18] border-[#22D3EE] font-semibold'
                : 'bg-white dark:bg-[#121C2D] text-slate-700 dark:text-[#B6C2D2] border-slate-200 dark:border-[rgba(148,163,184,0.15)] hover:border-[#22D3EE]/50 hover:text-[#22D3EE]'
            }`}
            title="Voice Navigation & Commands (Alt+V)"
            aria-label="Toggle Voice Navigation"
          >
            {isVoiceNavActive ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            <span className="hidden sm:inline font-mono text-[11px]">Alt+V</span>
          </button>

          {/* Accessibility Settings Modal Trigger */}
          <button
            onClick={onOpenAccessibility}
            className="h-9 px-3 rounded-[10px] text-xs font-medium text-slate-700 dark:text-[#B6C2D2] bg-white dark:bg-[#121C2D] border border-slate-200 dark:border-[rgba(148,163,184,0.15)] hover:border-[#22D3EE]/50 hover:text-[#22D3EE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE] transition-colors cursor-pointer flex items-center gap-1.5"
            title="Accessibility Preferences"
            aria-label="Open Accessibility Preferences"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#8B5CF6]" />
            <span className="hidden md:inline">Settings</span>
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            aria-label="Toggle Dark and Light Mode"
            className="w-9 h-9 rounded-[10px] flex items-center justify-center bg-white dark:bg-[#121C2D] text-slate-700 dark:text-[#B6C2D2] border border-slate-200 dark:border-[rgba(148,163,184,0.15)] hover:border-[#22D3EE]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE] transition-colors cursor-pointer"
            title={`Switch to ${currentTheme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {currentTheme === 'dark' ? (
              <Sun className="w-4 h-4 text-[#FBBF24]" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation-drawer"
            className="lg:hidden w-9 h-9 rounded-[10px] flex items-center justify-center bg-white dark:bg-[#121C2D] text-slate-700 dark:text-[#B6C2D2] border border-slate-200 dark:border-[rgba(148,163,184,0.15)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE] cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div 
          id="mobile-navigation-drawer"
          role="region"
          aria-label="Mobile Navigation Drawer"
          className="lg:hidden bg-white/95 dark:bg-[#0D1422]/95 backdrop-blur-xl border-b border-slate-200 dark:border-[rgba(148,163,184,0.12)] px-4 py-4 space-y-2 shadow-xl"
        >
          <a
            href="#communication-workspace"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3.5 py-2.5 rounded-[10px] text-sm font-medium text-slate-800 dark:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#19263A] transition-colors"
          >
            Two-Way Communication Studio
          </a>
          <a
            href="#portfolio"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3.5 py-2.5 rounded-[10px] text-sm font-medium text-slate-800 dark:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#19263A] transition-colors"
          >
            Club Portfolio (EjjiLink & Guzo AI)
          </a>
          <a
            href="#camera-guide"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3.5 py-2.5 rounded-[10px] text-sm font-medium text-slate-800 dark:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#19263A] transition-colors"
          >
            Camera Positioning Guide
          </a>
          
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-[rgba(148,163,184,0.12)]">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenEvaluationLab();
              }}
              className="text-left px-3 py-2 rounded-[10px] text-xs font-medium text-slate-700 dark:text-[#B6C2D2] bg-slate-100 dark:bg-[#121C2D] border border-slate-200 dark:border-[rgba(148,163,184,0.12)] flex items-center gap-1.5"
            >
              <FlaskConical className="w-3.5 h-3.5 text-[#FBBF24]" />
              <span>Evaluation Lab</span>
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenCloudVault();
              }}
              className="text-left px-3 py-2 rounded-[10px] text-xs font-medium text-slate-700 dark:text-[#B6C2D2] bg-slate-100 dark:bg-[#121C2D] border border-slate-200 dark:border-[rgba(148,163,184,0.12)] flex items-center gap-1.5"
            >
              <Cloud className="w-3.5 h-3.5 text-[#60A5FA]" />
              <span>Cloud Vault</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <a
              href="https://github.com/The-Ethio-Tech-Initiative"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 py-2 rounded-[10px] text-xs font-medium bg-slate-100 dark:bg-[#19263A] text-slate-800 dark:text-[#F8FAFC] border border-slate-200 dark:border-[rgba(148,163,184,0.15)]"
            >
              <Github className="w-3.5 h-3.5" /> GitHub
            </a>
            <a
              href="https://t.me/EthioTech_HTCS"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 py-2 rounded-[10px] text-xs font-medium bg-[#22D3EE] text-[#080D18] font-semibold"
            >
              <Send className="w-3.5 h-3.5" /> Telegram
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
