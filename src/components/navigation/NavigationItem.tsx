import React from 'react';
import { AppLanguage, NavItemConfig } from '../../config/navigation';

interface NavigationItemProps {
  item: NavItemConfig;
  isActive: boolean;
  isCollapsed?: boolean;
  isMobile?: boolean;
  language: AppLanguage;
  onSelect: (item: NavItemConfig) => void;
}

export const NavigationItem: React.FC<NavigationItemProps> = ({
  item,
  isActive,
  isCollapsed = false,
  isMobile = false,
  language,
  onSelect,
}) => {
  const Icon = item.icon;
  const label = language === 'am' ? item.labelAm : item.labelEn;
  const description = language === 'am' ? item.descriptionAm : item.descriptionEn;

  return (
    <li className="relative">
      <button
        type="button"
        id={item.moduleId ? `nav-item-${item.moduleId}` : `nav-action-${item.id}`}
        onClick={() => onSelect(item)}
        aria-current={isActive ? 'page' : undefined}
        aria-label={isCollapsed ? label : undefined}
        title={isCollapsed ? undefined : description}
        className={`group relative w-full flex items-center rounded-[10px] text-left transition-[colors,transform] duration-150 active:scale-[0.99] motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9] cursor-pointer ${
          isMobile ? 'min-h-[44px] px-3.5 py-2.5 gap-3' : isCollapsed ? 'min-h-[40px] px-2 py-2 justify-center' : 'min-h-[40px] px-3 py-2 gap-3'
        } ${
          isActive
            ? 'bg-gradient-to-r from-cyan-500/14 via-sky-500/10 to-indigo-500/8 dark:bg-none dark:bg-[#172438] text-[#0E7490] dark:text-[#43D9E9] font-semibold border border-cyan-500/20 dark:border-transparent'
            : 'text-slate-700 dark:text-[#A0AEC0] hover:bg-sky-50/90 dark:hover:bg-[#172438]/70 hover:text-[#0E7490] dark:hover:text-[#F4F7FB] font-medium border border-transparent'
        }`}
      >
        {/* Subtle Linear/Carbon active rail indicator */}
        {isActive && (
          <span
            aria-hidden="true"
            className="absolute left-0 top-2 bottom-2 w-[3.5px] rounded-r-full bg-gradient-to-b from-[#0891B2] to-[#4F46E5] dark:bg-none dark:bg-[#43D9E9]"
          />
        )}

        <Icon
          aria-hidden="true"
          className={`w-[18px] h-[18px] shrink-0 transition-colors ${
            isActive
              ? 'text-[#0E7490] dark:text-[#43D9E9]'
              : 'text-slate-600 dark:text-[#A0AEC0] group-hover:text-slate-900 dark:group-hover:text-[#F4F7FB]'
          }`}
        />

        {(!isCollapsed || isMobile) && (
          <span
            className={`text-[13.5px] leading-tight whitespace-nowrap truncate flex-1 ${
              language === 'am' ? 'font-ethiopic' : ''
            }`}
          >
            {label}
          </span>
        )}

        {/* Accessible tooltip for desktop collapsed mode */}
        {isCollapsed && !isMobile && (
          <div
            role="tooltip"
            className="pointer-events-none absolute left-full ml-3 z-50 px-2.5 py-1.5 rounded-[8px] bg-slate-900 dark:bg-[#172438] text-white dark:text-[#F4F7FB] border border-slate-700 dark:border-[#253448] shadow-lg text-xs font-medium whitespace-nowrap opacity-0 translate-x-[-4px] group-hover:opacity-100 group-hover:translate-x-0 group-focus-visible:opacity-100 group-focus-visible:translate-x-0 transition-all duration-150 flex items-center gap-2"
          >
            <span className={language === 'am' ? 'font-ethiopic' : ''}>{label}</span>
            {item.shortcutNum && (
              <kbd className="px-1 py-0.5 text-[10px] font-mono rounded bg-slate-800 dark:bg-[#080D18] text-[#43D9E9] border border-slate-700 dark:border-[#253448]">
                Alt+{item.shortcutNum}
              </kbd>
            )}
          </div>
        )}
      </button>
    </li>
  );
};
