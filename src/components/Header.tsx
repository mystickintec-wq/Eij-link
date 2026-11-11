import React, { useState, useEffect } from 'react';
import { 
  Video, 
  Layers, 
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
  MicOff,
  Zap,
  Sparkles
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
  const [isCtrlHeld, setIsCtrlHeld] = useState(false);
  const [activeShortcutNotice, setActiveShortcutNotice] = useState<string | null>(null);

  const { communicationState, setCommunicationState, isVoiceNavActive, setVoiceNavActive } = useCommunication();

  // Real-time Ctrl / Command Key Detection & Global Shortcuts in Header
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Control' || e.key === 'Meta') {
        setIsCtrlHeld(true);
      }

      // Check for Ctrl / Alt header shortcuts (without form input conflicts)
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      if (e.ctrlKey || e.metaKey || e.altKey) {
        const key = e.key.toLowerCase();

        // Ctrl+V or Alt+V: Toggle Voice Navigation
        if (key === 'v') {
          e.preventDefault();
          if (isVoiceNavActive) {
            voiceNavigationService.stop();
            setVoiceNavActive(false);
            setCommunicationState('idle', 'Voice navigation paused.');
            setActiveShortcutNotice('Voice Navigation Paused');
          } else {
            setVoiceNavActive(true);
            setCommunicationState('listening', 'Microphone active • Listening for voice commands...');
            setActiveShortcutNotice('Voice Navigation Active');
          }
          setTimeout(() => setActiveShortcutNotice(null), 2000);
        }

        // Ctrl+K: Cloud Storage Vault
        if (key === 'k') {
          e.preventDefault();
          onOpenCloudVault();
          setActiveShortcutNotice('Cloud Vault Opened');
          setTimeout(() => setActiveShortcutNotice(null), 2000);
        }

        // Ctrl+L: Evaluation Lab
        if (key === 'l') {
          e.preventDefault();
          onOpenEvaluationLab();
          setActiveShortcutNotice('Evaluation Lab Opened');
          setTimeout(() => setActiveShortcutNotice(null), 2000);
        }

        // Ctrl+, (Comma): Accessibility Settings
        if (key === ',') {
          e.preventDefault();
          onOpenAccessibility();
          setActiveShortcutNotice('Settings Opened');
          setTimeout(() => setActiveShortcutNotice(null), 2000);
        }

        // Ctrl+M: Theme Toggle
        if (key === 'm') {
          e.preventDefault();
          onToggleTheme();
          setActiveShortcutNotice('Theme Toggled');
          setTimeout(() => setActiveShortcutNotice(null), 2000);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Control' || e.key === 'Meta' || (!e.ctrlKey && !e.metaKey)) {
        setIsCtrlHeld(false);
      }
    };

    const handleBlur = () => {
      setIsCtrlHeld(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [
    isVoiceNavActive, 
    setVoiceNavActive, 
    setCommunicationState, 
    onOpenCloudVault, 
    onOpenEvaluationLab, 
    onOpenAccessibility, 
    onToggleTheme
  ]);

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 backdrop-blur-xl bg-white/90 dark:bg-[#080D18]/92 ${
        isCtrlHeld 
          ? 'border-b border-[#22D3EE] shadow-[0_4px_30px_rgba(34,211,238,0.22)]' 
          : 'border-b border-slate-200/80 dark:border-[rgba(34,211,238,0.18)] shadow-[0_4px_20px_rgba(0,0,0,0.15)] dark:shadow-[0_4px_24px_rgba(34,211,238,0.06)]'
      }`}
    >
      {/* Screen Reader Live Status for Header Shortcuts */}
      <div role="status" aria-live="polite" className="sr-only">
        {activeShortcutNotice || 'Top navigation bar. Press Ctrl or Alt for quick shortcuts.'}
      </div>

      <nav className="w-full max-w-[1536px] mx-auto px-3 sm:px-5 lg:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Zone 1: Brand & Wordmark (Scales proportionally without pushing nav off-screen) */}
        <a 
          href="#" 
          className="flex items-center gap-2.5 sm:gap-3 shrink-0 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE] rounded-[10px] p-1"
          aria-label="EjjiLink AI Home"
        >
          <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden border border-[rgba(148,163,184,0.2)] dark:border-[rgba(34,211,238,0.4)] bg-[#121C2D] flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(34,211,238,0.15)] group-hover:shadow-[0_0_16px_rgba(34,211,238,0.35)] transition-all">
            {!logoError ? (
              <img
                src="/assets/aistudio/Club_Logo_4c19d54c.jpg"
                alt="The Ethio-Tech Initiative Logo"
                className="w-full h-full object-cover"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#22D3EE]">
                <svg viewBox="0 0 64 64" className="w-5 h-5">
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
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm sm:text-base tracking-tight text-slate-900 dark:text-[#F8FAFC] group-hover:text-[#22D3EE] transition-colors leading-tight block">
                EjjiLink AI
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#22D3EE] shadow-[0_0_6px_#22D3EE] animate-pulse" />
            </div>
            {/* Subtitle hides on narrow laptops to preserve 100% proportional space for nav buttons */}
            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-[#8493A8] font-normal leading-none hidden xl:block mt-0.5">
              The Ethio-Tech Initiative · HTCS Addis Ababa
            </p>
          </div>
        </a>

        {/* Zone 2: Navigation Links (Proportionally scaled for laptops 1024px-1440px with Glowing Hover Effects) */}
        <div className="hidden lg:flex items-center lg:gap-1.5 xl:gap-3 text-xs font-medium text-slate-600 dark:text-[#B6C2D2]">
          <a 
            href="#communication-workspace" 
            className="hover:text-slate-900 dark:hover:text-[#F8FAFC] hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.4)] transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE] rounded-[8px] px-2.5 py-1.5 hover:bg-slate-100 dark:hover:bg-[#121C2D]"
          >
            <Video className="w-3.5 h-3.5 text-[#22D3EE]" /> 
            <span>Two-Way Studio</span>
            {isCtrlHeld && (
              <kbd className="ml-0.5 px-1 py-0.2 rounded bg-[#22D3EE] text-[#080D18] text-[9px] font-mono font-bold shadow-[0_0_6px_#22D3EE]">Ctrl+S</kbd>
            )}
          </a>

          <a 
            href="#portfolio" 
            className="hover:text-slate-900 dark:hover:text-[#F8FAFC] hover:drop-shadow-[0_0_8px_rgba(45,212,191,0.4)] transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE] rounded-[8px] px-2.5 py-1.5 hover:bg-slate-100 dark:hover:bg-[#121C2D]"
          >
            <Layers className="w-3.5 h-3.5 text-[#2DD4BF]" /> 
            <span>Portfolio</span>
          </a>
          
          {/* Evaluation Lab Pill Button */}
          <button
            type="button"
            onClick={onOpenEvaluationLab}
            aria-label="Open Evaluation Lab (Ctrl+L)"
            className="hover:text-slate-900 dark:hover:text-[#F8FAFC] transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer text-xs px-2.5 py-1.5 rounded-[8px] bg-slate-100 dark:bg-[#121C2D] border border-slate-200 dark:border-[rgba(148,163,184,0.12)] hover:border-[#FBBF24]/50 hover:shadow-[0_0_12px_rgba(251,191,36,0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]"
          >
            <FlaskConical className="w-3.5 h-3.5 text-[#FBBF24]" /> 
            <span className="hidden xl:inline">Evaluation Lab</span>
            <span className="xl:hidden">Lab</span>
            {isCtrlHeld && (
              <kbd className="ml-0.5 px-1 py-0.2 rounded bg-[#FBBF24] text-[#080D18] text-[9px] font-mono font-bold shadow-[0_0_6px_#FBBF24]">Ctrl+L</kbd>
            )}
          </button>

          {/* Cloud Storage Vault Pill Button */}
          <button
            type="button"
            onClick={onOpenCloudVault}
            aria-label="Open Cloud Vault (Ctrl+K)"
            className="hover:text-slate-900 dark:hover:text-[#F8FAFC] transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer text-xs px-2.5 py-1.5 rounded-[8px] bg-slate-100 dark:bg-[#121C2D] border border-slate-200 dark:border-[rgba(148,163,184,0.12)] hover:border-[#60A5FA]/50 hover:shadow-[0_0_12px_rgba(96,165,250,0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]"
          >
            <Cloud className="w-3.5 h-3.5 text-[#60A5FA]" /> 
            <span className="hidden xl:inline">Cloud Vault</span>
            <span className="xl:hidden">Vault</span>
            {isCtrlHeld && (
              <kbd className="ml-0.5 px-1 py-0.2 rounded bg-[#60A5FA] text-[#080D18] text-[9px] font-mono font-bold shadow-[0_0_6px_#60A5FA]">Ctrl+K</kbd>
            )}
          </button>

          {/* Privacy & Architecture Pill Button */}
          <button
            type="button"
            onClick={onOpenArchitecture}
            aria-label="Open Privacy & Architecture"
            className="hover:text-slate-900 dark:hover:text-[#F8FAFC] transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer text-xs px-2.5 py-1.5 rounded-[8px] bg-slate-100 dark:bg-[#121C2D] border border-slate-200 dark:border-[rgba(148,163,184,0.12)] hover:border-[#34D399]/50 hover:shadow-[0_0_12px_rgba(52,211,153,0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#34D399]" /> 
            <span>Privacy</span>
          </button>
        </div>

        {/* Zone 3: Primary Actions & Utilities (Never clipped, fully accessible with glowing state) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          
          {/* Ctrl Key Armed HUD Badge */}
          {isCtrlHeld && (
            <div className="hidden md:flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#22D3EE] text-[#080D18] font-bold text-[10px] shadow-[0_0_12px_#22D3EE] animate-pulse shrink-0">
              <Zap className="w-3 h-3 animate-bounce" />
              <span>Ctrl Armed</span>
            </div>
          )}

          {/* Voice Navigation Quick Toggle Button with Glowing Effect */}
          <button
            type="button"
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
            className={`h-9 px-2.5 sm:px-3 rounded-[10px] text-xs font-medium transition-all duration-300 cursor-pointer border flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE] ${
              isVoiceNavActive
                ? 'bg-[#22D3EE] text-[#080D18] border-[#22D3EE] font-semibold shadow-[0_0_18px_#22D3EE]'
                : 'bg-white dark:bg-[#121C2D] text-slate-700 dark:text-[#B6C2D2] border-slate-200 dark:border-[rgba(148,163,184,0.15)] hover:border-[#22D3EE]/50 hover:text-[#22D3EE] hover:shadow-[0_0_12px_rgba(34,211,238,0.2)]'
            }`}
            title="Toggle Voice Navigation (Ctrl+V / Alt+V)"
            aria-label="Toggle Voice Navigation (Ctrl+V / Alt+V)"
          >
            {isVoiceNavActive ? <Mic className="w-4 h-4 animate-pulse text-[#080D18]" /> : <MicOff className="w-4 h-4 text-slate-400 group-hover:text-[#22D3EE]" />}
            <span className="font-mono text-[11px] font-bold">
              {isCtrlHeld ? 'Ctrl+V' : 'Alt+V'}
            </span>
          </button>

          {/* Accessibility Settings Modal Trigger */}
          <button
            type="button"
            onClick={onOpenAccessibility}
            className="h-9 px-2.5 sm:px-3 rounded-[10px] text-xs font-medium text-slate-700 dark:text-[#B6C2D2] bg-white dark:bg-[#121C2D] border border-slate-200 dark:border-[rgba(148,163,184,0.15)] hover:border-[#8B5CF6]/50 hover:text-[#8B5CF6] hover:shadow-[0_0_12px_rgba(139,92,246,0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE] transition-all cursor-pointer flex items-center gap-1.5"
            title="Accessibility Preferences (Ctrl+,)"
            aria-label="Open Accessibility Preferences (Ctrl+,)"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#8B5CF6]" />
            <span className="hidden xl:inline">Settings</span>
          </button>

          {/* Dark / Light Theme Toggle Button */}
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={`Switch to ${currentTheme === 'dark' ? 'Light' : 'Dark'} Mode (Ctrl+M)`}
            className="w-9 h-9 rounded-[10px] flex items-center justify-center bg-white dark:bg-[#121C2D] text-slate-700 dark:text-[#B6C2D2] border border-slate-200 dark:border-[rgba(148,163,184,0.15)] hover:border-[#22D3EE]/50 hover:shadow-[0_0_12px_rgba(34,211,238,0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE] transition-all cursor-pointer"
            title={`Switch to ${currentTheme === 'dark' ? 'Light' : 'Dark'} Mode (Ctrl+M)`}
          >
            {currentTheme === 'dark' ? (
              <Sun className="w-4 h-4 text-[#FBBF24] hover:rotate-45 transition-transform" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          {/* Mobile Menu Hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation-drawer"
            className="lg:hidden w-9 h-9 rounded-[10px] flex items-center justify-center bg-white dark:bg-[#121C2D] text-slate-700 dark:text-[#B6C2D2] border border-slate-200 dark:border-[rgba(148,163,184,0.15)] hover:border-[#22D3EE]/50 hover:shadow-[0_0_10px_rgba(34,211,238,0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE] cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-[#22D3EE]" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Glowing Bottom Neon Frame Trim */}
      <div 
        className={`h-[1px] w-full transition-all duration-300 ${
          isCtrlHeld 
            ? 'bg-gradient-to-r from-transparent via-[#22D3EE] to-transparent shadow-[0_0_12px_#22D3EE]' 
            : 'bg-gradient-to-r from-transparent via-[#22D3EE]/30 to-transparent'
        }`}
        aria-hidden="true"
      />

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div 
          id="mobile-navigation-drawer"
          role="region"
          aria-label="Mobile Navigation Drawer"
          className="lg:hidden bg-white/95 dark:bg-[#0D1422]/98 backdrop-blur-xl border-b border-slate-200 dark:border-[rgba(34,211,238,0.2)] px-4 py-4 space-y-2 shadow-2xl"
        >
          <a
            href="#communication-workspace"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3.5 py-2.5 rounded-[10px] text-sm font-medium text-slate-800 dark:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#19263A] hover:text-[#22D3EE] transition-colors"
          >
            Two-Way Communication Studio
          </a>
          <a
            href="#portfolio"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3.5 py-2.5 rounded-[10px] text-sm font-medium text-slate-800 dark:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#19263A] hover:text-[#2DD4BF] transition-colors"
          >
            Club Portfolio (EjjiLink & Guzo AI)
          </a>
          
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-[rgba(148,163,184,0.12)]">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenEvaluationLab();
              }}
              className="text-left px-3 py-2 rounded-[10px] text-xs font-medium text-slate-700 dark:text-[#B6C2D2] bg-slate-100 dark:bg-[#121C2D] border border-slate-200 dark:border-[rgba(148,163,184,0.12)] hover:border-[#FBBF24]/50 flex items-center gap-1.5"
            >
              <FlaskConical className="w-3.5 h-3.5 text-[#FBBF24]" />
              <span>Evaluation Lab</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenCloudVault();
              }}
              className="text-left px-3 py-2 rounded-[10px] text-xs font-medium text-slate-700 dark:text-[#B6C2D2] bg-slate-100 dark:bg-[#121C2D] border border-slate-200 dark:border-[rgba(148,163,184,0.12)] hover:border-[#60A5FA]/50 flex items-center gap-1.5"
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
              className="flex items-center justify-center gap-1.5 py-2 rounded-[10px] text-xs font-medium bg-[#22D3EE] text-[#080D18] font-semibold shadow-[0_0_12px_rgba(34,211,238,0.4)]"
            >
              <Send className="w-3.5 h-3.5" /> Telegram
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
