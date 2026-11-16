import React from 'react';
import { ActiveModule } from '../../types';
import { AppLanguage, NavItemConfig } from '../../config/navigation';
import { SidebarHeader } from './SidebarHeader';
import { SidebarNavigation } from './SidebarNavigation';
import { SidebarFooter } from './SidebarFooter';

interface AppSidebarProps {
  activeModule: ActiveModule;
  isCollapsed: boolean;
  language: AppLanguage;
  onSelectItem: (item: NavItemConfig) => void;
  onToggleCollapse: () => void;
  onNavigateOverview: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  activeModule,
  isCollapsed,
  language,
  onSelectItem,
  onToggleCollapse,
  onNavigateOverview,
}) => {
  return (
    <aside
      aria-label={language === 'am' ? 'የመተግበሪያ የጎን አሰሳ' : 'Application Sidebar'}
      className={`hidden md:flex flex-col fixed inset-y-0 left-0 z-40 bg-white/88 dark:bg-[#101C2C] backdrop-blur-xl border-r border-cyan-900/10 dark:border-[#253448] shadow-[4px_0_24px_-14px_rgba(14,116,144,0.12)] dark:shadow-none transition-[width] duration-200 ease-out ${
        isCollapsed ? 'w-[72px]' : 'w-[252px]'
      }`}
    >
      <SidebarHeader
        isCollapsed={isCollapsed}
        language={language}
        onNavigateOverview={onNavigateOverview}
      />

      <SidebarNavigation
        activeModule={activeModule}
        isCollapsed={isCollapsed}
        language={language}
        onSelect={onSelectItem}
      />

      <SidebarFooter
        activeModule={activeModule}
        isCollapsed={isCollapsed}
        language={language}
        onSelect={onSelectItem}
        onToggleCollapse={onToggleCollapse}
      />
    </aside>
  );
};
