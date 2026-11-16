import React, { useEffect, useRef } from 'react';
import { X, Sparkles } from 'lucide-react';
import { ActiveModule } from '../../types';
import {
  ACCOUNT_NAVIGATION_GROUP,
  AppLanguage,
  NavItemConfig,
  PRIMARY_NAVIGATION_GROUPS,
} from '../../config/navigation';
import { NavigationGroup } from './NavigationGroup';
import { LanguageSelector } from './LanguageSelector';

interface MobileNavigationProps {
  isOpen: boolean;
  activeModule: ActiveModule;
  language: AppLanguage;
  onClose: () => void;
  onSelectItem: (item: NavItemConfig) => void;
  onChangeLanguage: (lang: AppLanguage) => void;
  onNavigateOverview: () => void;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  isOpen,
  activeModule,
  language,
  onClose,
  onSelectItem,
  onChangeLanguage,
  onNavigateOverview,
}) => {
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus close control when drawer opens for keyboard/screen-reader users
    closeBtnRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelect = (item: NavItemConfig) => {
    onSelectItem(item);
    onClose();
  };

  return (
    <div
      id="mobile-navigation-drawer"
      role="dialog"
      aria-modal="true"
      aria-label={language === 'am' ? 'የሞባይል አሰሳ ምናሌ' : 'Mobile Navigation Menu'}
      className="fixed inset-0 z-50 md:hidden flex"
    >
      {/* Backdrop Overlay */}
      <div
        className="fixed inset-0 bg-[#080D18]/75 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div className="relative z-10 w-[280px] max-w-[85vw] h-full bg-white dark:bg-[#101C2C] border-r border-slate-200 dark:border-[#253448] flex flex-col shadow-2xl ejji-animate-drawer">
        {/* Drawer Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200 dark:border-[#253448] shrink-0">
          <button
            type="button"
            onClick={() => {
              onNavigateOverview();
              onClose();
            }}
            className="flex items-center gap-2.5 text-left rounded-[8px] p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9] cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-300 dark:border-[#253448] bg-slate-100 dark:bg-[#172438] flex items-center justify-center shrink-0">
              <img
                src="/assets/aistudio/Club_Logo_4c19d54c.jpg"
                alt=""
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
              <Sparkles className="w-4 h-4 text-[#0E7490] dark:text-[#43D9E9] hidden" aria-hidden="true" />
            </div>
            <div>
              <span className="font-heading font-bold text-base text-slate-900 dark:text-[#F4F7FB]">
                EjjiLink <span className="text-[#0E7490] dark:text-[#43D9E9]">AI</span>
              </span>
            </div>
          </button>

          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label={language === 'am' ? 'ምናሌውን ዝጋ' : 'Close navigation menu'}
            className="w-11 h-11 rounded-[10px] flex items-center justify-center text-slate-600 dark:text-[#A0AEC0] hover:bg-slate-100 dark:hover:bg-[#172438] hover:text-slate-900 dark:hover:text-[#F4F7FB] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9] cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Scrollable Navigation Groups */}
        <nav
          aria-label={language === 'am' ? 'ዋና የሞባይል አሰሳ' : 'Mobile Primary Navigation'}
          className="flex-1 overflow-y-auto px-3 py-4 space-y-4"
        >
          {PRIMARY_NAVIGATION_GROUPS.map((group) => (
            <NavigationGroup
              key={group.id}
              group={group}
              activeModule={activeModule}
              isMobile
              language={language}
              onSelect={handleSelect}
            />
          ))}
        </nav>

        {/* Drawer Footer: Account & Language */}
        <div className="border-t border-slate-200 dark:border-[#253448] px-3 py-3 space-y-3 bg-slate-50/70 dark:bg-[#0D1726]/80">
          <NavigationGroup
            group={ACCOUNT_NAVIGATION_GROUP}
            activeModule={activeModule}
            isMobile
            language={language}
            onSelect={handleSelect}
          />

          <div className="px-3 pt-2 border-t border-slate-200 dark:border-[#253448] flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600 dark:text-[#A0AEC0]">
              {language === 'am' ? 'ቋንቋ' : 'Language'}
            </span>
            <LanguageSelector language={language} onChangeLanguage={onChangeLanguage} />
          </div>
        </div>
      </div>
    </div>
  );
};
