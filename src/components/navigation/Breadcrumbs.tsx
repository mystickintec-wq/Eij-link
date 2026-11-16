import React from 'react';
import { ChevronRight } from 'lucide-react';
import { ActiveModule } from '../../types';
import { AppLanguage, getRouteMetadata } from '../../config/navigation';

interface BreadcrumbsProps {
  activeModule: ActiveModule;
  language: AppLanguage;
  onNavigateOverview: () => void;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  activeModule,
  language,
  onNavigateOverview,
}) => {
  const { group, item } = getRouteMetadata(activeModule);
  const groupLabel = language === 'am' ? group.labelAm : group.labelEn;
  const pageLabel = language === 'am' ? item.labelAm : item.labelEn;

  return (
    <nav aria-label={language === 'am' ? 'መገኛ መንገድ' : 'Breadcrumb'} className="min-w-0">
      <ol className="flex items-center gap-1.5 text-sm min-w-0">
        {activeModule !== 'overview' && (
          <>
            <li className="hidden sm:flex items-center">
              <button
                type="button"
                onClick={onNavigateOverview}
                className={`text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-[#A0AEC0] hover:text-[#0E7490] dark:hover:text-[#43D9E9] transition-colors rounded px-1 py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9] cursor-pointer whitespace-nowrap ${
                  language === 'am' ? 'font-ethiopic normal-case tracking-normal' : ''
                }`}
              >
                {groupLabel}
              </button>
            </li>
            <li aria-hidden="true" className="hidden sm:flex items-center text-slate-500 dark:text-[#A0AEC0]/60">
              <ChevronRight className="w-3.5 h-3.5" />
            </li>
          </>
        )}

        <li className="min-w-0 flex items-center">
          <h1
            className={`font-heading font-semibold text-sm sm:text-[15px] text-slate-900 dark:text-[#F4F7FB] truncate whitespace-nowrap ${
              language === 'am' ? 'font-ethiopic' : ''
            }`}
          >
            {pageLabel}
          </h1>
        </li>
      </ol>
    </nav>
  );
};
