import React from 'react';
import { ActiveModule } from '../../types';
import { AppLanguage, NavGroupConfig, NavItemConfig } from '../../config/navigation';
import { NavigationItem } from './NavigationItem';

interface NavigationGroupProps {
  group: NavGroupConfig;
  activeModule: ActiveModule;
  isCollapsed?: boolean;
  isMobile?: boolean;
  language: AppLanguage;
  onSelect: (item: NavItemConfig) => void;
}

export const NavigationGroup: React.FC<NavigationGroupProps> = ({
  group,
  activeModule,
  isCollapsed = false,
  isMobile = false,
  language,
  onSelect,
}) => {
  const groupLabel = language === 'am' ? group.labelAm : group.labelEn;
  const headingId = `nav-group-${group.id}${isMobile ? '-mobile' : ''}`;

  return (
    <div className="space-y-1" role="region" aria-labelledby={!isCollapsed || isMobile ? headingId : undefined}>
      {!isCollapsed || isMobile ? (
        <h2
          id={headingId}
          className={`px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-600 dark:text-[#A0AEC0]/90 select-none ${
            language === 'am' ? 'font-ethiopic normal-case tracking-normal text-xs' : ''
          }`}
        >
          {groupLabel}
        </h2>
      ) : (
        <div
          className="mx-3 my-2 h-px bg-slate-200 dark:bg-[#253448]"
          aria-hidden="true"
        />
      )}

      <ul className="space-y-0.5" aria-label={groupLabel}>
        {group.items.map((item) => (
          <NavigationItem
            key={item.id}
            item={item}
            isActive={item.kind === 'route' && item.moduleId === activeModule}
            isCollapsed={isCollapsed}
            isMobile={isMobile}
            language={language}
            onSelect={onSelect}
          />
        ))}
      </ul>
    </div>
  );
};
