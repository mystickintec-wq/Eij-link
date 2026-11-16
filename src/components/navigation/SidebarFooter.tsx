import React from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import {
  ACCOUNT_NAVIGATION_GROUP,
  AppLanguage,
  NavItemConfig,
} from '../../config/navigation';
import { NavigationGroup } from './NavigationGroup';
import { ActiveModule } from '../../types';

interface SidebarFooterProps {
  activeModule: ActiveModule;
  isCollapsed: boolean;
  isMobile?: boolean;
  language: AppLanguage;
  onSelect: (item: NavItemConfig) => void;
  onToggleCollapse?: () => void;
}

export const SidebarFooter: React.FC<SidebarFooterProps> = ({
  activeModule,
  isCollapsed,
  isMobile = false,
  language,
  onSelect,
  onToggleCollapse,
}) => {
  const collapseLabel = isCollapsed
    ? language === 'am'
      ? 'የጎን ምናሌን ዘርጋ'
      : 'Expand sidebar'
    : language === 'am'
    ? 'የጎን ምናሌን ሰብስብ'
    : 'Collapse sidebar';

  return (
    <div className="shrink-0 border-t border-slate-200 dark:border-[#253448] px-2.5 py-3 space-y-2 bg-slate-50/70 dark:bg-[#0D1726]/80">
      <NavigationGroup
        group={ACCOUNT_NAVIGATION_GROUP}
        activeModule={activeModule}
        isCollapsed={isCollapsed}
        isMobile={isMobile}
        language={language}
        onSelect={onSelect}
      />

      {!isMobile && onToggleCollapse && (
        <div className="pt-1">
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-expanded={!isCollapsed}
            aria-label={collapseLabel}
            title={collapseLabel}
            className={`w-full min-h-[38px] flex items-center rounded-[10px] text-slate-600 dark:text-[#A0AEC0] hover:bg-slate-200/70 dark:hover:bg-[#172438] hover:text-slate-900 dark:hover:text-[#F4F7FB] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9] cursor-pointer ${
              isCollapsed ? 'justify-center px-2' : 'px-3 gap-3'
            }`}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="w-[18px] h-[18px] shrink-0" aria-hidden="true" />
            ) : (
              <>
                <PanelLeftClose className="w-[18px] h-[18px] shrink-0" aria-hidden="true" />
                <span className={`text-xs font-medium whitespace-nowrap truncate ${language === 'am' ? 'font-ethiopic' : ''}`}>
                  {collapseLabel}
                </span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
