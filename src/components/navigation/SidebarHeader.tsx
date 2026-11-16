import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { AppLanguage } from '../../config/navigation';

interface SidebarHeaderProps {
  isCollapsed: boolean;
  language: AppLanguage;
  onNavigateOverview: () => void;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  isCollapsed,
  language,
  onNavigateOverview,
}) => {
  const [logoError, setLogoError] = useState(false);

  return (
    <div className="h-16 px-3.5 flex items-center border-b border-slate-200 dark:border-[#253448] shrink-0">
      <button
        type="button"
        onClick={onNavigateOverview}
        className={`w-full flex items-center gap-3 rounded-[10px] p-1.5 text-left transition-colors hover:bg-slate-100 dark:hover:bg-[#172438] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9] cursor-pointer ${
          isCollapsed ? 'justify-center' : ''
        }`}
        aria-label={language === 'am' ? 'EjjiLink AI — ወደ መነሻ ገጽ ሂድ' : 'EjjiLink AI — Go to Workspace Overview'}
        title={isCollapsed ? 'EjjiLink AI' : undefined}
      >
        <div className="w-9 h-9 rounded-full overflow-hidden border border-slate-300 dark:border-[#253448] bg-slate-100 dark:bg-[#172438] flex items-center justify-center shrink-0">
          {!logoError ? (
            <img
              src="/assets/aistudio/Club_Logo_4c19d54c.jpg"
              alt="EJJIlink AI"
              className="w-full h-full object-cover"
              onError={() => setLogoError(true)}
            />
          ) : (
            <Sparkles className="w-4 h-4 text-[#0E7490] dark:text-[#43D9E9]" aria-hidden="true" />
          )}
        </div>

        {!isCollapsed && (
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-1 leading-none">
              <span className="font-heading font-bold text-base tracking-tight text-slate-900 dark:text-[#F4F7FB] truncate">
                EjjiLink
              </span>
              <span className="font-heading font-bold text-base tracking-tight text-[#0E7490] dark:text-[#43D9E9]">
                AI
              </span>
            </div>
            <span className={`block text-[11px] font-medium text-slate-600 dark:text-[#A0AEC0] truncate mt-1 ${language === 'am' ? 'font-ethiopic' : ''}`}>
              {language === 'am' ? 'ኢትዮ-ቴክ ኢኒሼቲቭ' : 'Ethio-Tech Initiative'}
            </span>
          </div>
        )}
      </button>
    </div>
  );
};
