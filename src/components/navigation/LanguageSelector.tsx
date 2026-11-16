import React from 'react';
import { Globe } from 'lucide-react';
import { AppLanguage } from '../../config/navigation';

interface LanguageSelectorProps {
  language: AppLanguage;
  onChangeLanguage: (lang: AppLanguage) => void;
  compact?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  language,
  onChangeLanguage,
  compact = false,
}) => {
  return (
    <div
      role="group"
      aria-label={language === 'am' ? 'የቋንቋ ምርጫ' : 'Interface Language'}
      className="inline-flex items-center rounded-[10px] bg-slate-100 dark:bg-[#172438] border border-slate-200 dark:border-[#253448] p-0.5 shrink-0"
    >
      {!compact && (
        <Globe
          aria-hidden="true"
          className="w-3.5 h-3.5 text-slate-600 dark:text-[#A0AEC0] ml-2 mr-1 hidden sm:block"
        />
      )}
      <button
        type="button"
        onClick={() => onChangeLanguage('en')}
        aria-pressed={language === 'en'}
        className={`h-7 px-2.5 rounded-[7px] text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9] cursor-pointer whitespace-nowrap ${
          language === 'en'
            ? 'bg-white dark:bg-[#101C2C] text-[#0E7490] dark:text-[#43D9E9] shadow-xs'
            : 'text-slate-600 dark:text-[#A0AEC0] hover:text-slate-900 dark:hover:text-[#F4F7FB]'
        }`}
        title="Switch interface to English"
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => onChangeLanguage('am')}
        aria-pressed={language === 'am'}
        className={`h-7 px-2.5 rounded-[7px] text-xs font-semibold font-ethiopic transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9] cursor-pointer whitespace-nowrap ${
          language === 'am'
            ? 'bg-white dark:bg-[#101C2C] text-[#0E7490] dark:text-[#43D9E9] shadow-xs'
            : 'text-slate-600 dark:text-[#A0AEC0] hover:text-slate-900 dark:hover:text-[#F4F7FB]'
        }`}
        title="ቋንቋን ወደ አማርኛ ቀይር"
      >
        አማ
      </button>
    </div>
  );
};
