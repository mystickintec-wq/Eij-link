import React from 'react';
import { HelpCircle, Menu, Moon, PanelLeft, Sun } from 'lucide-react';
import { ActiveModule } from '../../types';
import { AppLanguage } from '../../config/navigation';
import { Breadcrumbs } from './Breadcrumbs';
import { LanguageSelector } from './LanguageSelector';
import { UserMenu } from './UserMenu';

interface AppHeaderProps {
  activeModule: ActiveModule;
  language: AppLanguage;
  currentTheme: 'dark' | 'light';
  isSidebarCollapsed: boolean;
  isMobileDrawerOpen: boolean;
  onToggleDesktopSidebar: () => void;
  onOpenMobileDrawer: () => void;
  onNavigateOverview: () => void;
  onChangeLanguage: (lang: AppLanguage) => void;
  onToggleTheme: () => void;
  onOpenHelp: () => void;
  onOpenCloudVault: () => void;
  onOpenSettings: () => void;
  voiceControl?: React.ReactNode;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  activeModule,
  language,
  currentTheme,
  isSidebarCollapsed,
  isMobileDrawerOpen,
  onToggleDesktopSidebar,
  onOpenMobileDrawer,
  onNavigateOverview,
  onChangeLanguage,
  onToggleTheme,
  onOpenHelp,
  onOpenCloudVault,
  onOpenSettings,
  voiceControl,
}) => {
  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 dark:bg-[#101C2C]/95 backdrop-blur-md border-b border-slate-200 dark:border-[#253448] px-2.5 sm:px-5 flex items-center justify-between gap-2 sm:gap-3">
      {/* Left: Drawer / Sidebar Toggles, Mobile Brand & Breadcrumbs */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          onClick={onOpenMobileDrawer}
          aria-expanded={isMobileDrawerOpen}
          aria-controls="mobile-navigation-drawer"
          aria-label={language === 'am' ? 'የአሰሳ ምናሌን ክፈት' : 'Open navigation menu'}
          className="md:hidden w-10 h-10 rounded-[10px] bg-slate-100 dark:bg-[#172438] hover:bg-slate-200 dark:hover:bg-[#1E2E46] border border-slate-200 dark:border-[#253448] text-slate-700 dark:text-[#F4F7FB] flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9] cursor-pointer shrink-0"
        >
          <Menu className="w-5 h-5" aria-hidden="true" />
        </button>

        {/* Desktop Sidebar Toggle */}
        <button
          type="button"
          onClick={onToggleDesktopSidebar}
          aria-expanded={!isSidebarCollapsed}
          aria-label={
            isSidebarCollapsed
              ? language === 'am'
                ? 'የጎን ምናሌን ዘርጋ'
                : 'Expand sidebar'
              : language === 'am'
              ? 'የጎን ምናሌን ሰብስብ'
              : 'Collapse sidebar'
          }
          title={isSidebarCollapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
          className="hidden md:inline-flex w-9 h-9 rounded-[10px] bg-slate-100 dark:bg-[#172438] hover:bg-slate-200 dark:hover:bg-[#1E2E46] border border-slate-200 dark:border-[#253448] text-slate-700 dark:text-[#A0AEC0] hover:text-slate-900 dark:hover:text-[#F4F7FB] items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9] cursor-pointer shrink-0"
        >
          <PanelLeft className="w-4 h-4" aria-hidden="true" />
        </button>

        {/* Mobile Brand Mark (Desktop brand lives cleanly in SidebarHeader) */}
        <button
          type="button"
          onClick={onNavigateOverview}
          className="md:hidden flex items-center gap-2 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9] rounded-[8px] px-1 py-0.5 cursor-pointer"
          aria-label="EjjiLink AI Home"
        >
          <span className="font-heading font-bold text-sm text-slate-900 dark:text-[#F4F7FB] whitespace-nowrap">
            EjjiLink <span className="text-[#0E7490] dark:text-[#43D9E9]">AI</span>
          </span>
        </button>

        <span className="hidden sm:inline md:hidden text-slate-300 dark:text-[#253448]" aria-hidden="true">
          /
        </span>

        {/* Active Route Title & Category Breadcrumb */}
        <div className="hidden sm:block min-w-0">
          <Breadcrumbs
            activeModule={activeModule}
            language={language}
            onNavigateOverview={onNavigateOverview}
          />
        </div>
      </div>

      {/* Right: Functional Utility Actions (Voice Nav, Language, Help, Theme, User Account) */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {voiceControl}

        <LanguageSelector
          language={language}
          onChangeLanguage={onChangeLanguage}
          compact
        />

        <button
          type="button"
          onClick={onOpenHelp}
          aria-label={language === 'am' ? 'እርዳታ እና ድጋፍ' : 'Help & Support'}
          title={language === 'am' ? 'እርዳታ እና ድጋፍ' : 'Help & Support'}
          className="hidden sm:flex w-9 h-9 rounded-[10px] bg-slate-100 dark:bg-[#172438] hover:bg-slate-200 dark:hover:bg-[#1E2E46] border border-slate-200 dark:border-[#253448] text-slate-700 dark:text-[#A0AEC0] hover:text-[#0E7490] dark:hover:text-[#43D9E9] items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9] cursor-pointer"
        >
          <HelpCircle className="w-4 h-4" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={
            currentTheme === 'dark'
              ? language === 'am'
                ? 'ወደ ብርሃን ገጽታ ቀይር'
                : 'Switch to light mode'
              : language === 'am'
              ? 'ወደ ጨለማ ገጽታ ቀይር'
              : 'Switch to dark mode'
          }
          title={currentTheme === 'dark' ? 'Light mode (Ctrl+M)' : 'Dark mode (Ctrl+M)'}
          className="w-9 h-9 rounded-[10px] bg-slate-100 dark:bg-[#172438] hover:bg-slate-200 dark:hover:bg-[#1E2E46] border border-slate-200 dark:border-[#253448] text-slate-700 dark:text-[#A0AEC0] hover:text-amber-700 dark:hover:text-[#43D9E9] flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9] cursor-pointer"
        >
          {currentTheme === 'dark' ? (
            <Sun className="w-4 h-4" aria-hidden="true" />
          ) : (
            <Moon className="w-4 h-4" aria-hidden="true" />
          )}
        </button>

        <UserMenu
          language={language}
          onOpenCloudVault={onOpenCloudVault}
          onOpenSettings={onOpenSettings}
        />
      </div>
    </header>
  );
};
