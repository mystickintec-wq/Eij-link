import React from 'react';
import { ActiveModule } from '../../types';
import {
  AppLanguage,
  NavItemConfig,
  PRIMARY_NAVIGATION_GROUPS,
} from '../../config/navigation';
import { NavigationGroup } from './NavigationGroup';

interface SidebarNavigationProps {
  activeModule: ActiveModule;
  isCollapsed?: boolean;
  isMobile?: boolean;
  language: AppLanguage;
  onSelect: (item: NavItemConfig) => void;
}

export const SidebarNavigation: React.FC<SidebarNavigationProps> = ({
  activeModule,
  isCollapsed = false,
  isMobile = false,
  language,
  onSelect,
}) => {
  return (
    <nav
      aria-label={language === 'am' ? 'ዋና የአሰሳ ምናሌ' : 'Primary Navigation'}
      className={`flex-1 overflow-y-auto px-2.5 py-3 space-y-3 ${
        isCollapsed && !isMobile ? 'overflow-x-visible' : 'overflow-x-hidden'
      }`}
    >
      {PRIMARY_NAVIGATION_GROUPS.map((group) => (
        <NavigationGroup
          key={group.id}
          group={group}
          activeModule={activeModule}
          isCollapsed={isCollapsed}
          isMobile={isMobile}
          language={language}
          onSelect={onSelect}
        />
      ))}
    </nav>
  );
};
