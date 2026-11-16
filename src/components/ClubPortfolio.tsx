import React from 'react';
import { Cloud, ExternalLink, Github, Play, Send } from 'lucide-react';
import { AppLanguage } from '../config/navigation';
import { Button, Card } from './ui';

interface ClubPortfolioProps {
  language?: AppLanguage;
  onLaunchStudio?: () => void;
  onOpenCloudVault?: () => void;
}

export const ClubPortfolio: React.FC<ClubPortfolioProps> = ({
  language = 'en',
  onLaunchStudio,
  onOpenCloudVault,
}) => {
  const isAm = language === 'am';

  return (
    <section id="portfolio" aria-labelledby="community-heading" className="scroll-mt-24">
      <Card variant="elevated" padding="none" className="overflow-hidden">
        {/* Header Bar */}
        <div className="p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-[#253448]">
          <div className="flex items-center gap-3.5 min-w-0">
            <img
              src="/assets/aistudio/Club_Logo_4c19d54c.jpg"
              alt="The Ethio-Tech Initiative emblem"
              referrerPolicy="no-referrer"
              className="w-11 h-11 rounded-full object-cover border border-slate-300 dark:border-[#253448] shrink-0"
            />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600 dark:text-[#A0AEC0]">
                {isAm ? 'የትምህርት ቤት እና የማህበረሰብ አመጣጥ' : 'Community & Student Engineering'}
              </p>
              <h2
                id="community-heading"
                className="font-heading text-lg sm:text-xl font-bold text-slate-900 dark:text-[#F4F7FB] [text-wrap:balance]"
              >
                The Ethio-Tech Initiative · Holy Trinity Cathedral Secondary School
              </h2>
              <p className="text-xs text-slate-600 dark:text-[#A0AEC0]">
                {isAm
                  ? 'አዲስ አበባ፣ ኢትዮጵያ — በተማሪዎች የተመራ ክፍት-ምንጭ AI ፈጠራ።'
                  : 'Addis Ababa, Ethiopia — Open-source student accessibility initiatives.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <a
              href="https://github.com/The-Ethio-Tech-Initiative"
              target="_blank"
              rel="noopener noreferrer"
              className="h-9 px-3.5 rounded-[8px] text-xs font-medium bg-white dark:bg-[#101C2C] hover:bg-slate-100 dark:hover:bg-[#1E2E46] text-slate-800 dark:text-[#F4F7FB] border border-slate-200 dark:border-[#253448] inline-flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#43D9E9]"
            >
              <Github className="w-3.5 h-3.5" aria-hidden="true" />
              <span>GitHub</span>
              <ExternalLink className="w-3 h-3 opacity-60" aria-hidden="true" />
            </a>
            <a
              href="https://t.me/EthioTech_HTCS"
              target="_blank"
              rel="noopener noreferrer"
              className="h-9 px-3.5 rounded-[8px] text-xs font-medium bg-white dark:bg-[#101C2C] hover:bg-slate-100 dark:hover:bg-[#1E2E46] text-[#0E7490] dark:text-[#43D9E9] border border-slate-200 dark:border-[#253448] inline-flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9]"
            >
              <Send className="w-3.5 h-3.5" aria-hidden="true" />
              <span>@EthioTech_HTCS</span>
            </a>
          </div>
        </div>

        {/* Two Quiet Project Attribution Rows */}
        <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-[#253448] bg-white dark:bg-[#101C2C]">
          <div className="p-6 flex flex-col justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-[#A0AEC0]">
                <span className="font-semibold text-[#0E7490] dark:text-[#43D9E9]">
                  {isAm ? 'ፕሮጀክት 01 · በስራ ላይ' : 'Project 01 · Production'}
                </span>
                <span aria-hidden="true">·</span>
                <span>{isAm ? 'ተደራሽነት AI' : 'Accessibility AI'}</span>
              </div>
              <h3 className="font-heading text-base font-bold text-slate-900 dark:text-[#F4F7FB]">
                EjjiLink AI
              </h3>
              <p className="text-xs text-slate-600 dark:text-[#A0AEC0] leading-relaxed">
                {isAm
                  ? 'የምልክት ቋንቋን ወደ እንግሊዝኛ እና አማርኛ ድምፅ የሚተረጉም በመሳሪያ ላይ የሚሰራ መድረክ።'
                  : 'Real-time EthSL recognition, bilingual English/Amharic speech synthesis, and 2D face, body & dual-hand tracking.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {onLaunchStudio && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onLaunchStudio}
                  leftIcon={<Play className="w-3.5 h-3.5 text-[#0E7490] dark:text-[#43D9E9]" />}
                >
                  {isAm ? 'ስቱዲዮ ክፈት' : 'Launch Studio'}
                </Button>
              )}
              {onOpenCloudVault && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onOpenCloudVault}
                  leftIcon={<Cloud className="w-3.5 h-3.5" />}
                >
                  {isAm ? 'የደመና ማህደር' : 'Cloud Vault'}
                </Button>
              )}
            </div>
          </div>

          <div className="p-6 flex flex-col justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-[#A0AEC0]">
                <span className="font-semibold text-amber-700 dark:text-amber-400">
                  {isAm ? 'ፕሮጀክት 02 · በግንባታ ላይ' : 'Project 02 · In Development'}
                </span>
                <span aria-hidden="true">·</span>
                <span>{isAm ? 'የትራንዚት መመሪያ' : 'Addis Transit AI'}</span>
              </div>
              <h3 className="font-heading text-base font-bold text-slate-900 dark:text-[#F4F7FB]">
                Guzo AI <span className="font-ethiopic">(ጉዞ AI)</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-[#A0AEC0] leading-relaxed">
                {isAm
                  ? 'በአዲስ አበባ የዕለት ተዕለት ጉዞን ለማቅለል የተነደፈ የተማሪዎች የመንገድ እና የትራንዚት አጋዥ።'
                  : 'Upcoming HTCS student build for intelligent Ethiopian route guidance and commuter transit clarity in Addis Ababa.'}
              </p>
            </div>

            <div>
              <a
                href="https://github.com/The-Ethio-Tech-Initiative"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-slate-700 dark:text-[#A0AEC0] hover:text-[#0E7490] dark:hover:text-[#43D9E9] inline-flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9] rounded-[6px] py-1"
              >
                <span>{isAm ? 'እድገቱን በGitHub ይከታተሉ' : 'Follow repository progress'}</span>
                <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </Card>
    </section>
  );
};
