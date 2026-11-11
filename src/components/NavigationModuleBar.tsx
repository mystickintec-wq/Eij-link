import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  Languages, 
  Captions, 
  FileText, 
  Hand, 
  SlidersHorizontal,
  Bot,
  ChevronLeft,
  ChevronRight,
  Zap,
  Sparkles,
  Command
} from 'lucide-react';
import { ActiveModule } from '../types';
import { useCommunication } from '../context/CommunicationContext';

interface NavigationModuleBarProps {
  activeModule: ActiveModule;
  onSelectModule: (module: ActiveModule) => void;
}

export const NavigationModuleBar: React.FC<NavigationModuleBarProps> = ({
  activeModule,
  onSelectModule,
}) => {
  const { communicationState } = useCommunication();
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const tabButtonRefs = useRef<Map<ActiveModule, HTMLButtonElement>>(new Map());
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  
  // Interactive Ctrl / Command Key State
  const [isCtrlHeld, setIsCtrlHeld] = useState(false);
  const [lastTriggeredModule, setLastTriggeredModule] = useState<ActiveModule | null>(null);
  const [shortcutFeedback, setShortcutFeedback] = useState<string | null>(null);

  const modules: {
    id: ActiveModule;
    label: string;
    sublabel: string;
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
    badge?: string;
    shortcutNum: number;
  }[] = [
    {
      id: 'studio',
      label: 'Sign Studio',
      sublabel: 'Two-Way 3D Kinematics',
      icon: Hand,
      accentColor: '#22D3EE',
      badge: 'Core',
      shortcutNum: 1,
    },
    {
      id: 'assistant',
      label: 'AI Assistant',
      sublabel: 'Simplify & Suggest',
      icon: Bot,
      accentColor: '#FBBF24',
      badge: 'Gemini 3.8',
      shortcutNum: 2,
    },
    {
      id: 'translate',
      label: 'Translate',
      sublabel: 'Universal Amharic',
      icon: Languages,
      accentColor: '#8B5CF6',
      shortcutNum: 3,
    },
    {
      id: 'captions',
      label: 'Live Captions',
      sublabel: 'Speech-to-Text',
      icon: Captions,
      accentColor: '#60A5FA',
      badge: 'Speech API',
      shortcutNum: 4,
    },
    {
      id: 'documents',
      label: 'Document OCR',
      sublabel: 'Plain Language Reader',
      icon: FileText,
      accentColor: '#2DD4BF',
      shortcutNum: 5,
    },
    {
      id: 'settings',
      label: 'Accessibility',
      sublabel: 'Voice, 3D & Contrast',
      icon: SlidersHorizontal,
      accentColor: '#22D3EE',
      shortcutNum: 6,
    },
  ];

  // Check scroll capability for overflow gradient & scroll buttons on smaller screens
  const checkScrollState = useCallback(() => {
    const el = tabsContainerRef.current;
    if (!el) return;
    const hasOverflow = el.scrollWidth > el.clientWidth;
    setCanScrollLeft(el.scrollLeft > 6);
    setCanScrollRight(hasOverflow && el.scrollLeft < el.scrollWidth - el.clientWidth - 6);
  }, []);

  useEffect(() => {
    checkScrollState();
    window.addEventListener('resize', checkScrollState);
    return () => window.removeEventListener('resize', checkScrollState);
  }, [checkScrollState]);

  // Global Ctrl+1..6 and Alt+1..6 Keyboard Shortcuts & Ctrl Key Holding Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Detect when Control or Meta (Command on Mac) is pressed
      if (e.key === 'Control' || e.key === 'Meta') {
        setIsCtrlHeld(true);
      }

      // Check for Ctrl+1..6 or Alt+1..6
      if ((e.ctrlKey || e.metaKey || e.altKey) && !e.shiftKey) {
        const keyNum = parseInt(e.key, 10);
        if (keyNum >= 1 && keyNum <= modules.length) {
          e.preventDefault();
          const targetModule = modules[keyNum - 1].id;
          const targetLabel = modules[keyNum - 1].label;
          
          onSelectModule(targetModule);
          setLastTriggeredModule(targetModule);
          setShortcutFeedback(`Jumped to ${targetLabel} via ${e.ctrlKey || e.metaKey ? 'Ctrl' : 'Alt'}+${keyNum}`);

          const btn = tabButtonRefs.current.get(targetModule);
          btn?.focus();

          // Reset trigger glow after 800ms
          setTimeout(() => {
            setLastTriggeredModule(null);
          }, 800);

          setTimeout(() => {
            setShortcutFeedback(null);
          }, 2400);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Control' || e.key === 'Meta' || (!e.ctrlKey && !e.metaKey)) {
        setIsCtrlHeld(false);
      }
    };

    const handleWindowBlur = () => {
      setIsCtrlHeld(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [modules, onSelectModule]);

  // Keyboard navigation within the tablist (Arrow keys, Home, End, Enter, Space)
  const handleTabKeyDown = (e: React.KeyboardEvent, index: number) => {
    let targetIndex = -1;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        targetIndex = (index + 1) % modules.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        targetIndex = (index - 1 + modules.length) % modules.length;
        break;
      case 'Home':
        e.preventDefault();
        targetIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        targetIndex = modules.length - 1;
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        onSelectModule(modules[index].id);
        return;
      default:
        return;
    }

    if (targetIndex >= 0) {
      const nextModule = modules[targetIndex];
      onSelectModule(nextModule.id);
      const targetBtn = tabButtonRefs.current.get(nextModule.id);
      targetBtn?.focus();
      targetBtn?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
  };

  const scrollTabs = (direction: 'left' | 'right') => {
    const el = tabsContainerRef.current;
    if (!el) return;
    const scrollAmount = 240;
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  const activeModuleItem = modules.find((m) => m.id === activeModule);

  return (
    <nav 
      aria-label="Main Application Workspaces" 
      className="w-full my-6 relative transition-all"
    >
      {/* Screen Reader Live Status Announcement */}
      <div role="status" aria-live="polite" className="sr-only">
        {shortcutFeedback || `Active workspace: ${activeModuleItem?.label}. Press Ctrl or Alt plus 1 to 6 or use arrow keys to navigate.`}
      </div>

      {/* Floating Ctrl Key HUD Tooltip Indicator when Ctrl is held */}
      <div className="flex items-center justify-between mb-2 px-1 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-[#8493A8] uppercase tracking-wider flex items-center gap-1.5 font-heading">
            <Sparkles className="w-3.5 h-3.5 text-[#22D3EE]" />
            Workspace Navigation
          </span>
          {activeModuleItem && (
            <span className="hidden sm:inline-block text-[10px] text-slate-400 dark:text-[#8493A8]">
              · Active: <strong className="text-[#22D3EE]">{activeModuleItem.label}</strong>
            </span>
          )}
        </div>

        {/* Dynamic Ctrl Key HUD Indicator */}
        <div className="flex items-center gap-2">
          {isCtrlHeld ? (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#22D3EE] text-[#080D18] font-bold text-[10px] shadow-[0_0_14px_#22D3EE] animate-pulse">
              <Zap className="w-3 h-3 animate-bounce" />
              <span>Ctrl Jump Mode Active: Press 1-6</span>
            </div>
          ) : (
            <div className="text-[10px] text-slate-400 dark:text-[#8493A8] flex items-center gap-1 font-mono">
              <kbd className="px-1.5 py-0.5 rounded-[4px] bg-slate-100 dark:bg-[#121C2D] border border-slate-200 dark:border-[rgba(148,163,184,0.15)] text-slate-600 dark:text-[#B6C2D2]">Ctrl</kbd>
              <span>+</span>
              <kbd className="px-1.5 py-0.5 rounded-[4px] bg-slate-100 dark:bg-[#121C2D] border border-slate-200 dark:border-[rgba(148,163,184,0.15)] text-slate-600 dark:text-[#B6C2D2]">1..6</kbd>
            </div>
          )}
        </div>
      </div>

      {/* Proportional Screen-Responsive Container with Glowing Frame */}
      <div 
        className={`relative p-1.5 sm:p-2 rounded-[18px] bg-white dark:bg-[#0D1422] border transition-all duration-300 shadow-sm ${
          isCtrlHeld 
            ? 'border-[#22D3EE] ring-2 ring-[#22D3EE]/30 shadow-[0_0_25px_rgba(34,211,238,0.2)]'
            : 'border-slate-200 dark:border-[rgba(148,163,184,0.15)] hover:dark:border-[rgba(34,211,238,0.25)]'
        }`}
      >
        {/* Left Scroll Button (Mobile / Narrow Viewports) */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scrollTabs('left')}
            aria-label="Scroll workspaces to the left"
            className="lg:hidden absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white dark:bg-[#121C2D] border border-slate-300 dark:border-[rgba(148,163,184,0.2)] text-slate-700 dark:text-[#F8FAFC] flex items-center justify-center shadow-md hover:bg-slate-100 dark:hover:bg-[#19263A] transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#22D3EE]"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        {/* Right Scroll Button (Mobile / Narrow Viewports) */}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => scrollTabs('right')}
            aria-label="Scroll workspaces to the right"
            className="lg:hidden absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white dark:bg-[#121C2D] border border-slate-300 dark:border-[rgba(148,163,184,0.2)] text-slate-700 dark:text-[#F8FAFC] flex items-center justify-center shadow-md hover:bg-slate-100 dark:hover:bg-[#19263A] transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#22D3EE]"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {/* Proportional Grid Tablist (Laptop/Desktop: 6 proportional columns; Mobile: responsive flex/grid) */}
        <div 
          ref={tabsContainerRef}
          onScroll={checkScrollState}
          role="tablist"
          aria-label="Workspace Modules"
          aria-orientation="horizontal"
          className="w-full flex lg:grid lg:grid-cols-6 gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none py-0.5 px-0.5 scroll-smooth"
        >
          {modules.map((m, index) => {
            const Icon = m.icon;
            const isActive = activeModule === m.id;
            const isFlashTriggered = lastTriggeredModule === m.id;

            return (
              <button
                key={m.id}
                ref={(el) => {
                  if (el) tabButtonRefs.current.set(m.id, el);
                  else tabButtonRefs.current.delete(m.id);
                }}
                id={`workspace-tab-${m.id}`}
                role="tab"
                type="button"
                aria-selected={isActive}
                aria-controls={`workspace-panel-${m.id}`}
                aria-keyshortcuts={`Ctrl+${m.shortcutNum}, Alt+${m.shortcutNum}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => onSelectModule(m.id)}
                onKeyDown={(e) => handleTabKeyDown(e, index)}
                className={`group relative flex-1 min-w-[155px] lg:min-w-0 min-h-[50px] lg:min-h-[54px] flex items-center gap-2.5 sm:gap-3 px-3 sm:px-3.5 py-2 rounded-[12px] transition-all duration-200 cursor-pointer whitespace-nowrap text-left shrink-0 border focus-visible:ring-2 focus-visible:ring-[#22D3EE] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080D18] focus:outline-none ${
                  isActive
                    ? 'bg-slate-100 dark:bg-[#19263A] text-slate-900 dark:text-[#F8FAFC] border-[#22D3EE]/50 shadow-[0_0_20px_rgba(34,211,238,0.2)] font-semibold'
                    : 'bg-transparent text-slate-600 dark:text-[#B6C2D2] border-transparent hover:text-slate-900 dark:hover:text-[#F8FAFC] hover:bg-slate-50 dark:hover:bg-[#121C2D] hover:border-slate-200 dark:hover:border-[rgba(34,211,238,0.2)] hover:shadow-[0_0_12px_rgba(34,211,238,0.08)]'
                } ${isFlashTriggered ? 'ring-2 ring-[#22D3EE] shadow-[0_0_28px_#22D3EE] scale-[1.02]' : ''}`}
              >
                {/* Icon Container with Luminous Halo Glow Effect */}
                <div
                  className={`w-8 h-8 rounded-[9px] flex items-center justify-center shrink-0 transition-all duration-300 ${
                    isActive
                      ? 'bg-[#22D3EE]/20 text-[#22D3EE] ring-1 ring-[#22D3EE]/50 shadow-[0_0_12px_rgba(34,211,238,0.35)]'
                      : 'bg-slate-100 dark:bg-[#121C2D] text-slate-500 dark:text-[#8493A8] group-hover:text-[#22D3EE] group-hover:bg-[#22D3EE]/10'
                  }`}
                  aria-hidden="true"
                >
                  <Icon className={`w-4 h-4 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`} />
                </div>

                {/* Text Content: Proportional Scaling with Clean Truncation */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1 leading-tight">
                    <span className="text-xs font-semibold truncate block">
                      {m.label}
                    </span>

                    {/* Interactive Shortcut Keycap Badge (Morphs when Ctrl is held) */}
                    <span 
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-[4px] transition-all duration-200 border shrink-0 ${
                        isCtrlHeld
                          ? 'bg-[#22D3EE] text-[#080D18] border-[#22D3EE] shadow-[0_0_10px_#22D3EE] scale-110 animate-pulse'
                          : isActive
                            ? 'bg-[#22D3EE]/15 text-[#22D3EE] border-[#22D3EE]/30'
                            : 'bg-slate-100 dark:bg-[#121C2D] text-slate-400 dark:text-[#8493A8] border-slate-200 dark:border-[rgba(148,163,184,0.1)] group-hover:border-[#22D3EE]/30 group-hover:text-[#22D3EE]'
                      }`}
                      title={`Press Ctrl+${m.shortcutNum} or Alt+${m.shortcutNum} to jump here`}
                      aria-label={`Shortcut: Ctrl or Alt plus ${m.shortcutNum}`}
                    >
                      {isCtrlHeld ? `Ctrl+${m.shortcutNum}` : `^${m.shortcutNum}`}
                    </span>
                  </div>

                  <span className="block text-[10px] lg:text-[11px] text-slate-500 dark:text-[#8493A8] truncate font-normal mt-0.5">
                    {m.sublabel}
                  </span>
                </div>

                {/* Glowing Bottom Neon Accent Bar */}
                {isActive && (
                  <span 
                    className="absolute bottom-0 left-3 right-3 h-[2.5px] bg-gradient-to-r from-[#22D3EE] via-[#2DD4BF] to-[#60A5FA] rounded-full shadow-[0_0_12px_#22D3EE] animate-in fade-in duration-200"
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
