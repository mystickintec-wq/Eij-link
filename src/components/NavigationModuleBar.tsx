import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  Languages, 
  Captions, 
  FileText, 
  Hand, 
  SlidersHorizontal,
  Bot,
  ChevronLeft,
  ChevronRight
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

  const modules: {
    id: ActiveModule;
    label: string;
    sublabel: string;
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
    badge?: string;
    shortcut: string;
  }[] = [
    {
      id: 'studio',
      label: 'Sign Studio & 3D Hands',
      sublabel: 'Two-Way Camera & Kinematics',
      icon: Hand,
      accentColor: '#22D3EE',
      badge: 'Core',
      shortcut: 'Alt+1',
    },
    {
      id: 'assistant',
      label: 'AI Assistant',
      sublabel: 'Simplify & Suggest Replies',
      icon: Bot,
      accentColor: '#FBBF24',
      badge: 'Gemini 3.8',
      shortcut: 'Alt+2',
    },
    {
      id: 'translate',
      label: 'Universal Translate',
      sublabel: 'Amharic & Multilingual',
      icon: Languages,
      accentColor: '#8B5CF6',
      shortcut: 'Alt+3',
    },
    {
      id: 'captions',
      label: 'Live Captions',
      sublabel: 'Speech-to-Text Transcribe',
      icon: Captions,
      accentColor: '#60A5FA',
      badge: 'Speech API',
      shortcut: 'Alt+4',
    },
    {
      id: 'documents',
      label: 'Document OCR',
      sublabel: 'Extract & Plain Language',
      icon: FileText,
      accentColor: '#2DD4BF',
      shortcut: 'Alt+5',
    },
    {
      id: 'settings',
      label: 'Accessibility',
      sublabel: 'Voice, 3D & Preferences',
      icon: SlidersHorizontal,
      accentColor: '#22D3EE',
      shortcut: 'Alt+6',
    },
  ];

  // Check scroll capability for overflow gradient & scroll buttons
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

  // Global Alt+1 to Alt+6 keyboard shortcut navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        const keyNum = parseInt(e.key, 10);
        if (keyNum >= 1 && keyNum <= modules.length) {
          e.preventDefault();
          const targetModule = modules[keyNum - 1].id;
          onSelectModule(targetModule);
          const btn = tabButtonRefs.current.get(targetModule);
          btn?.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modules, onSelectModule]);

  // Keyboard navigation within the tablist (Arrow keys, Home, End)
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
      className="w-full my-6 relative"
    >
      {/* Screen Reader Live Status Announcement */}
      <div role="status" aria-live="polite" className="sr-only">
        Active workspace: {activeModuleItem?.label}. Press Alt plus 1 to 6 or use arrow keys to navigate workspaces.
      </div>

      <div className="relative p-1.5 rounded-[18px] bg-white dark:bg-[#0D1422] border border-slate-200 dark:border-[rgba(148,163,184,0.12)] shadow-sm">
        
        {/* Left Scroll Button (Appears when content overflows) */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scrollTabs('left')}
            aria-label="Scroll workspaces to the left"
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white dark:bg-[#121C2D] border border-slate-300 dark:border-[rgba(148,163,184,0.2)] text-slate-700 dark:text-[#F8FAFC] flex items-center justify-center shadow-md hover:bg-slate-100 dark:hover:bg-[#19263A] transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#22D3EE]"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        {/* Right Scroll Button (Appears when content overflows) */}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => scrollTabs('right')}
            aria-label="Scroll workspaces to the right"
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white dark:bg-[#121C2D] border border-slate-300 dark:border-[rgba(148,163,184,0.2)] text-slate-700 dark:text-[#F8FAFC] flex items-center justify-center shadow-md hover:bg-slate-100 dark:hover:bg-[#19263A] transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#22D3EE]"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {/* Scrollable Tablist Container */}
        <div 
          ref={tabsContainerRef}
          onScroll={checkScrollState}
          role="tablist"
          aria-label="Workspace Modules"
          aria-orientation="horizontal"
          className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5 px-0.5 scroll-smooth"
        >
          {modules.map((m, index) => {
            const Icon = m.icon;
            const isActive = activeModule === m.id;

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
                aria-keyshortcuts={m.shortcut}
                tabIndex={isActive ? 0 : -1}
                onClick={() => onSelectModule(m.id)}
                onKeyDown={(e) => handleTabKeyDown(e, index)}
                className={`relative flex-1 min-w-[170px] min-h-[48px] flex items-center gap-3 px-3.5 py-2 rounded-[10px] transition-all cursor-pointer whitespace-nowrap text-left shrink-0 border focus-visible:ring-2 focus-visible:ring-[#22D3EE] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080D18] focus:outline-none ${
                  isActive
                    ? 'bg-slate-100 dark:bg-[#19263A] text-slate-900 dark:text-[#F8FAFC] border-slate-300 dark:border-[rgba(34,211,238,0.4)] shadow-xs font-semibold'
                    : 'bg-transparent text-slate-600 dark:text-[#B6C2D2] border-transparent hover:text-slate-900 dark:hover:text-[#F8FAFC] hover:bg-slate-50 dark:hover:bg-[#121C2D]'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0 transition-colors ${
                    isActive
                      ? 'bg-[#22D3EE]/20 text-[#22D3EE]'
                      : 'bg-slate-100 dark:bg-[#121C2D] text-slate-500 dark:text-[#8493A8]'
                  }`}
                  aria-hidden="true"
                >
                  <Icon className="w-4 h-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1 leading-tight">
                    <span className="text-xs truncate">
                      {m.label}
                    </span>
                    <span 
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded-[4px] border ${
                        isActive 
                          ? 'bg-[#22D3EE]/10 text-[#22D3EE] border-[#22D3EE]/30' 
                          : 'bg-slate-100 dark:bg-[#121C2D] text-slate-400 dark:text-[#8493A8] border-slate-200 dark:border-[rgba(148,163,184,0.1)]'
                      }`}
                      title={`Press ${m.shortcut} to jump here`}
                      aria-label={`Shortcut: ${m.shortcut}`}
                    >
                      {m.shortcut}
                    </span>
                  </div>
                  <span className="block text-[11px] text-slate-500 dark:text-[#8493A8] truncate font-normal">
                    {m.sublabel}
                  </span>
                </div>

                {/* Visible Bottom Active Accent Line */}
                {isActive && (
                  <span 
                    className="absolute bottom-0 left-3 right-3 h-[2px] bg-[#22D3EE] rounded-full animate-in fade-in duration-150"
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

