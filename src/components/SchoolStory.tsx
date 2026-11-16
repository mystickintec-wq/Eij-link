import React from 'react';
import { Cpu, Hand, Languages, ShieldCheck } from 'lucide-react';
import { AppLanguage } from '../config/navigation';
import { GESTURE_LIST } from '../data/gestures';
import { Card } from './ui';

interface SchoolStoryProps {
  language?: AppLanguage;
}

export const SchoolStory: React.FC<SchoolStoryProps> = ({ language = 'en' }) => {
  const isAm = language === 'am';

  const metrics = [
    {
      label: isAm ? 'የእርግጠኝነት መቆለፊያ' : 'Confidence Lock',
      value: '>80%',
      caption: isAm ? 'ያልተረጋጋ እንቅስቃሴን ያጣራል' : 'Temporal filtering prevents jitter',
      accent: 'text-emerald-700 dark:text-emerald-400',
      icon: <ShieldCheck className="w-4 h-4" aria-hidden="true" />,
    },
    {
      label: isAm ? 'ዋና የምልክት ቃላት' : 'Core Gestures',
      value: String(GESTURE_LIST.length),
      caption: isAm ? 'EthSL እና ዓለም አቀፍ ምልክቶች' : 'EthSL and universal signs supported',
      accent: 'text-[#0E7490] dark:text-[#43D9E9]',
      icon: <Hand className="w-4 h-4" aria-hidden="true" />,
    },
    {
      label: isAm ? 'ወደ ደመና የሚላክ ቪዲዮ' : 'Cloud Frame Uploads',
      value: '0ms',
      caption: isAm ? '100% በመሳሪያው ላይ የሚሰራ' : 'On-device camera inference only',
      accent: 'text-[#0E7490] dark:text-[#43D9E9]',
      icon: <Cpu className="w-4 h-4" aria-hidden="true" />,
    },
    {
      label: isAm ? 'የተደገፉ ቋንቋዎች' : 'Core Languages',
      value: '2',
      caption: isAm ? 'እንግሊዝኛ እና አማርኛ' : 'English and Amharic (አማርኛ)',
      accent: 'text-[#4F46E5] dark:text-[#8585FF]',
      icon: <Languages className="w-4 h-4" aria-hidden="true" />,
    },
  ];

  return (
    <section id="our-story" aria-labelledby="identity-heading" className="scroll-mt-24">
      <Card padding="none" className="overflow-hidden">
        <div className="grid lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-[#253448]">
          {/* Mission & Ethiopian Accessibility Identity */}
          <div className="lg:col-span-7 p-6 sm:p-8 space-y-5">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#0E7490] dark:text-[#43D9E9] font-ethiopic">
                {isAm ? 'ሰውን ማዕከል ያደረገ ተልዕኮ' : 'Human-Centered Mission'}
              </p>
              <h2
                id="identity-heading"
                className="font-heading text-2xl sm:text-3xl font-bold text-slate-900 dark:text-[#F4F7FB] [text-wrap:balance]"
              >
                {isAm
                  ? 'በኢትዮጵያ የመግባቢያ ክፍተቶችን ማጥበብ'
                  : 'Designed for inclusive communication in Ethiopia.'}
              </h2>
            </div>

            <div className="space-y-3 text-sm text-slate-600 dark:text-[#A0AEC0] leading-relaxed max-w-2xl font-ethiopic">
              <p>
                {isAm
                  ? 'EjjiLink AI መስማት የተሳናቸው፣ የመስማት እክል ያለባቸው እና መስማት የሚችሉ ሰዎች በእንግሊዝኛ እና በአማርኛ በነጻነት እንዲግባቡ በተራ ላፕቶፖችና ስልኮች ላይ ወዲያውኑ እንዲሰራ ሆኖ የተገነባ ነው።'
                  : 'EjjiLink AI connects Deaf, hard-of-hearing, and hearing people directly in everyday settings—running locally on ordinary laptops and phones without specialized sensor hardware.'}
              </p>
              <p>
                {isAm
                  ? 'ሁሉም የካሜራ ትንተናዎች በመሳሪያዎ ላይ ስለሚከናወኑ የእርስዎ የግል ምስል ወደ ውጭ አይላክም።'
                  : 'Camera tracking happens strictly on-device so conversations remain fast, private, and dignified while respecting Ethiopian Sign Language (EthSL) structure.'}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-[#253448] flex items-center gap-3">
              <span
                aria-hidden="true"
                className="w-9 h-9 rounded-[10px] bg-[#0E7490]/12 dark:bg-[#43D9E9]/15 text-[#0E7490] dark:text-[#43D9E9] flex items-center justify-center font-bold text-sm font-ethiopic shrink-0"
              >
                ነ
              </span>
              <p className="text-xs text-slate-600 dark:text-[#A0AEC0] leading-relaxed">
                <strong className="text-slate-900 dark:text-[#F4F7FB]">
                  {isAm ? 'ቅርስ እና ቴክኖሎጂ፡' : 'Heritage Meets Accessible AI:'}
                </strong>{' '}
                {isAm
                  ? 'አርማችን የአክሱም ሐውልትን ከዲጂታል መስመሮች ጋር በማዋሃድ የኢትዮጵያን ቅርስ ከዘመናዊ ቴክኖሎጂ ጋር ያገናኛል።'
                  : 'Our emblem pairs the Axum Obelisk with circuit pathways to represent Ethiopian heritage driving inclusive computer vision.'}
              </p>
            </div>
          </div>

          {/* 4-Cell Tabular Metrics Panel (Zero Nested Cards) */}
          <div className="lg:col-span-5 grid grid-cols-2 bg-slate-50/60 dark:bg-[#172438]/40">
            {metrics.map((m, idx) => (
              <div
                key={m.label}
                className={`p-5 sm:p-6 flex flex-col justify-between gap-3 border-slate-200 dark:border-[#253448] ${
                  idx % 2 === 1 ? 'border-l' : ''
                } ${idx >= 2 ? 'border-t' : ''}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-slate-600 dark:text-[#A0AEC0] font-ethiopic">
                    {m.label}
                  </span>
                  <span className="text-slate-600 dark:text-[#A0AEC0]">{m.icon}</span>
                </div>
                <div>
                  <div className={`text-2xl sm:text-3xl font-bold font-mono tabular-nums ${m.accent}`}>
                    {m.value}
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-[#A0AEC0] mt-1 leading-snug font-ethiopic">
                    {m.caption}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </section>
  );
};
