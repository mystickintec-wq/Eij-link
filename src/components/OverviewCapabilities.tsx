import React from 'react';
import {
  ArrowRight,
  ArrowLeftRight,
  BookOpen,
  Bot,
  Camera,
  Captions,
  FileText,
  Hand,
  Languages,
  Video,
} from 'lucide-react';
import { AppLanguage } from '../config/navigation';
import { GESTURE_LIST } from '../data/gestures';
import { ActiveModule, GestureKey } from '../types';
import { HandPoseDiagram } from './HandPoseDiagram';
import { Button, Card } from './ui';

interface OverviewCapabilitiesProps {
  language: AppLanguage;
  onNavigateModule: (mod: ActiveModule) => void;
  onSelectGestureForStudio: (gestureKey: GestureKey) => void;
}

export const OverviewCapabilities: React.FC<OverviewCapabilitiesProps> = ({
  language,
  onNavigateModule,
  onSelectGestureForStudio,
}) => {
  const isAm = language === 'am';

  const workflowSteps = isAm
    ? [
        {
          num: '01',
          title: 'ምልክት ያሳዩ',
          detail: 'በካሜራው ፊት የኢትዮጵያ ወይም ዓለም አቀፍ የምልክት ቋንቋ እንቅስቃሴ ያድርጉ።',
        },
        {
          num: '02',
          title: 'AI ትንተና',
          detail: 'በመሳሪያዎ ላይ ያለው ሞዴል 21 የእጅ መገጣጠሚያዎችን በትክክል ይለያል።',
        },
        {
          num: '03',
          title: 'እንግሊዝኛ እና አማርኛ',
          detail: 'የተለየው ምልክት ወዲያውኑ በእንግሊዝኛ እና በአማርኛ ጽሑፍ ይታያል።',
        },
        {
          num: '04',
          title: 'የድምፅ ውጤት',
          detail: 'ስርዓቱ መልእክቱን በድምፅ ያነባል ወይም ንግግርን ወደ የምልክት መመሪያ ይመልሳል።',
        },
      ]
    : [
        {
          num: '01',
          title: 'Perform Gesture',
          detail: 'Sign an EthSL or universal hand pose naturally in front of your camera.',
        },
        {
          num: '02',
          title: 'On-Device Recognition',
          detail: 'MediaPipe 21-point hand tracking locks sustained signs without jitter.',
        },
        {
          num: '03',
          title: 'English & Amharic Text',
          detail: 'The recognized meaning renders clearly in English and Amharic (አማርኛ).',
        },
        {
          num: '04',
          title: 'Spoken Voice Output',
          detail: 'Audio synthesis speaks the translation aloud for immediate conversation.',
        },
      ];

  const featuredStudioSigns = GESTURE_LIST.slice(0, 4);

  const accessibilityTools: {
    moduleId: ActiveModule;
    title: string;
    subtitle: string;
    description: string;
    cta: string;
    icon: React.ReactNode;
    accentClass: string;
    iconBoxClass: string;
  }[] = [
    {
      moduleId: 'captions',
      title: isAm ? 'የድምጽ ጽሑፍ መግለጫ' : 'Speech Captions',
      subtitle: isAm ? 'ቀጥታ ንግግር ወደ ጽሑፍ' : 'Live Voice-to-Text',
      description: isAm
        ? 'ንግግርን በቀጥታ ወደሚነበብ ጽሑፍ ይቀይራል፤ ከፍተኛ ንጽጽር እና ለንባብ ቀላል ቅርጸ-ቁምፊዎች አሉት።'
        : 'Continuous live transcription with adjustable font size, high contrast, and dyslexia-friendly typography.',
      cta: isAm ? 'መግለጫ ክፈት' : 'Open Captions',
      icon: <Captions className="w-4 h-4" aria-hidden="true" />,
      accentClass: 'text-[#0E7490] dark:text-[#43D9E9]',
      iconBoxClass: 'bg-cyan-50 border-cyan-200/90 dark:bg-[#172438] dark:border-[#253448]',
    },
    {
      moduleId: 'translate',
      title: isAm ? 'የቋንቋ ተርጓሚ' : 'Language Translation',
      subtitle: isAm ? 'እንግሊዝኛ ↔ አማርኛ' : 'English ↔ Amharic & More',
      description: isAm
        ? 'በአማርኛ፣ እንግሊዝኛ እና በሌሎች ቋንቋዎች መካከል ጽሑፍንና ድምፅን በሁለት አቅጣጫ ይተርጉሙ።'
        : 'Bidirectional bilingual text and spoken translation designed for natural Ethiopian conversation.',
      cta: isAm ? 'ተርጓሚ ክፈት' : 'Open Translator',
      icon: <Languages className="w-4 h-4" aria-hidden="true" />,
      accentClass: 'text-[#4F46E5] dark:text-[#8585FF]',
      iconBoxClass: 'bg-indigo-50 border-indigo-200/90 dark:bg-[#172438] dark:border-[#253448]',
    },
    {
      moduleId: 'assistant',
      title: isAm ? 'የAI አጋዥ' : 'AI Assistant',
      subtitle: isAm ? 'ግልጽ ቋንቋ እና ምላሽ' : 'Plain Language & Replies',
      description: isAm
        ? 'ውስብስብ ዓረፍተ ነገሮችን ያቃልሉ፣ አስፈላጊ ነጥቦችን ያውጡ እና ፈጣን ምላሾችን ያዘጋጁ።'
        : 'Simplify dense paragraphs into clear language, summarize notes, and draft accessible responses.',
      cta: isAm ? 'አጋዥ ክፈት' : 'Open Assistant',
      icon: <Bot className="w-4 h-4" aria-hidden="true" />,
      accentClass: 'text-emerald-700 dark:text-emerald-400',
      iconBoxClass: 'bg-emerald-50 border-emerald-200/90 dark:bg-[#172438] dark:border-[#253448]',
    },
    {
      moduleId: 'documents',
      title: isAm ? 'ከምስል ጽሑፍ ማውጫ (OCR)' : 'Document OCR',
      subtitle: isAm ? 'ፎቶ እና ሰነድ ንባብ' : 'Extract & Read Aloud',
      description: isAm
        ? 'ከታተሙ ወረቀቶች ወይም ፎቶዎች ጽሑፍ በማውጣት ያቅልሉ እና በድምፅ ያዳምጡ።'
        : 'Capture text from printed notices or photos, simplify the wording, and hear it spoken aloud.',
      cta: isAm ? 'OCR ክፈት' : 'Open OCR Reader',
      icon: <FileText className="w-4 h-4" aria-hidden="true" />,
      accentClass: 'text-blue-700 dark:text-[#60A5FA]',
      iconBoxClass: 'bg-sky-50 border-sky-200/90 dark:bg-[#172438] dark:border-[#253448]',
    },
  ];

  return (
    <div className="space-y-16 lg:space-y-20">
      {/* HOW IT WORKS — 4-Step Communication Flow */}
      <section id="how-it-works" aria-labelledby="how-it-works-heading" className="scroll-mt-24">
        <div className="mb-6 space-y-2 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#0E7490] dark:text-[#43D9E9] font-ethiopic">
            {isAm ? 'የመግባቢያ ሂደት' : 'How It Works'}
          </p>
          <h2
            id="how-it-works-heading"
            className="font-heading text-2xl sm:text-3xl font-bold text-slate-900 dark:text-[#F4F7FB] [text-wrap:balance]"
          >
            {isAm
              ? 'ከእጅ እንቅስቃሴ እስከ ድምፅ በአራት ግልጽ ደረጃዎች'
              : 'From hand gesture to spoken voice in four steps.'}
          </h2>
          <p className="text-xs text-slate-600 dark:text-[#A0AEC0] font-mono tabular-nums pt-0.5 font-ethiopic">
            {isAm
              ? 'ርቀት 30–50 ሴ.ሜ · የ1 ሰከንድ እርጋታ · የፊት ብርሃን'
              : '30–50 cm camera distance · 1s steady hold · front lighting'}
          </p>
        </div>

        <Card padding="none" className="overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {workflowSteps.map((step, idx) => {
              const stepBadgeTones = [
                'bg-cyan-50 text-[#0E7490] border border-cyan-200/80 dark:bg-[#43D9E9]/12 dark:text-[#43D9E9] dark:border-transparent',
                'bg-sky-50 text-blue-700 border border-sky-200/80 dark:bg-[#43D9E9]/12 dark:text-[#43D9E9] dark:border-transparent',
                'bg-indigo-50 text-[#4F46E5] border border-indigo-200/80 dark:bg-[#8585FF]/15 dark:text-[#8585FF] dark:border-transparent',
                'bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-400/15 dark:text-emerald-400 dark:border-transparent',
              ];
              return (
                <div
                  key={step.num}
                  className={`group p-6 space-y-2.5 border-slate-200 dark:border-[#253448] hover:bg-sky-50/55 dark:hover:bg-[#172438]/60 transition-colors duration-200 ${
                    idx > 0 ? 'border-t sm:border-t-0' : ''
                  } ${idx % 2 === 1 ? 'sm:border-l' : ''} ${
                    idx >= 2 ? 'sm:border-t lg:border-t-0' : ''
                  } ${idx > 0 ? 'lg:border-l' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-[7px] font-mono tabular-nums text-xs font-semibold ${stepBadgeTones[idx % stepBadgeTones.length]}`}
                    >
                      {step.num}
                    </span>
                  </div>
                  <h3 className="font-heading text-base font-bold text-slate-900 dark:text-[#F4F7FB] font-ethiopic pt-0.5">
                    {step.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-[#A0AEC0] leading-relaxed font-ethiopic">
                    {step.detail}
                  </p>
                </div>
              );
            })}
          </div>
        </Card>
      </section>

      {/* CAPABILITIES — Varied Asymmetric Presentation Connecting All 8 Workspaces */}
      <section aria-labelledby="workspaces-heading" className="space-y-6">
        <div className="space-y-1.5 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#0E7490] dark:text-[#43D9E9] font-ethiopic">
            {isAm ? 'የስራ ቦታዎች እና መሳሪያዎች' : 'Accessibility Workspaces'}
          </p>
          <h2
            id="workspaces-heading"
            className="font-heading text-2xl sm:text-3xl font-bold text-slate-900 dark:text-[#F4F7FB] [text-wrap:balance]"
          >
            {isAm
              ? 'ለሁሉም የመግባቢያ ፍላጎት የተገነቡ ስምንት መሳሪያዎች'
              : 'Eight connected workspaces built for real conversation.'}
          </h2>
        </div>

        {/* Tier 1: Asymmetric Bento Split (Core Sign & 2D Tracking) */}
        <div className="grid lg:grid-cols-12 gap-5 items-stretch">
          {/* Primary Sign-to-Voice & Two-Way Bridge (7 columns) */}
          <Card
            padding="lg"
            className="lg:col-span-7 flex flex-col justify-between gap-6"
          >
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-[#A0AEC0]">
                <span className="font-semibold text-[#0E7490] dark:text-[#43D9E9]">
                  {isAm ? 'ዋና የካሜራ እና የድምፅ ስቱዲዮ' : 'Core Sign & Voice Engine'}
                </span>
                <span aria-hidden="true">·</span>
                <span>MediaPipe 21-Point Tracking</span>
              </div>

              <h3 className="font-heading text-xl sm:text-2xl font-bold text-slate-900 dark:text-[#F4F7FB] [text-wrap:balance] font-ethiopic">
                {isAm
                  ? 'የቀጥታ ምልክት ማንበቢያ እና ባለሁለት አቅጣጫ መገናኛ'
                  : 'Live Gesture Recognition & Two-Way Communication'}
              </h3>

              <p className="text-sm text-slate-600 dark:text-[#A0AEC0] leading-relaxed max-w-xl font-ethiopic">
                {isAm
                  ? 'ምልክቶችን በካሜራ በቀጥታ ወደ እንግሊዝኛና አማርኛ ንግግር ይቀይሩ፣ ወይም ድምፅን እና ጽሑፍን ወደ የምልክት ቋንቋ መመሪያ እንቅስቃሴ ይለውጡ።'
                  : 'Translate real-time camera signs into spoken English and Amharic, or turn spoken phrases and typed replies back into guided hand sign sequences.'}
              </p>

              {/* Inline Bidirectional Direction Strip */}
              <div className="grid sm:grid-cols-2 gap-3 pt-1">
                <div className="p-4 rounded-[12px] bg-gradient-to-br from-cyan-50/85 to-sky-50/50 dark:bg-none dark:bg-[#172438] border border-cyan-200/75 dark:border-[#253448]/70 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-[#F4F7FB]">
                    <Video className="w-4 h-4 text-[#0E7490] dark:text-[#43D9E9]" aria-hidden="true" />
                    <span className="font-ethiopic">{isAm ? 'የቀጥታ ምልክት ማንበቢያ' : 'Live Recognition'}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-[#A0AEC0] leading-relaxed font-ethiopic">
                    {isAm
                      ? 'ከ80% በላይ እርግጠኝነት ማረጋገጫ እና የ5-ፍሬም እርጋታ ጋር።'
                      : 'On-device webcam hand tracking with 5-frame temporal lock and auto-speech.'}
                  </p>
                </div>

                <div className="p-4 rounded-[12px] bg-gradient-to-br from-indigo-50/85 to-violet-50/50 dark:bg-none dark:bg-[#172438] border border-indigo-200/75 dark:border-[#253448]/70 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-[#F4F7FB]">
                    <ArrowLeftRight className="w-4 h-4 text-[#4F46E5] dark:text-[#8585FF]" aria-hidden="true" />
                    <span className="font-ethiopic">{isAm ? 'ባለሁለት አቅጣጫ መገናኛ' : 'Two-Way Communication'}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-[#A0AEC0] leading-relaxed font-ethiopic">
                    {isAm
                      ? 'ምልክት ወደ ድምፅ እና ድምፅ ወደ የምልክት መመሪያ በአንድ የተቀናጀ ቦታ።'
                      : 'Switch smoothly between Hands-to-Voice and Voice-to-Sign replies.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-200 dark:border-[#253448]">
              <Button
                variant="primary"
                size="md"
                onClick={() => onNavigateModule('live-recognition')}
                leftIcon={<Camera className="w-4 h-4" />}
              >
                {isAm ? 'የቀጥታ ካሜራ ክፈት' : 'Open Live Recognition'}
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={() => onNavigateModule('studio')}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                {isAm ? 'ባለሁለት አቅጣጫ ስቱዲዮ' : 'Open Two-Way Studio'}
              </Button>
            </div>
          </Card>

          {/* 2D Tracking Studio & EthSL Curriculum Pair (5 columns) */}
          <Card
            variant="elevated"
            padding="lg"
            className="lg:col-span-5 flex flex-col justify-between gap-6"
          >
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-[#A0AEC0]">
                <span className="font-semibold text-[#4F46E5] dark:text-[#8585FF]">
                  {isAm ? '2D መከታተያ እና EthSL መማሪያ' : '2D Skeleton Tracking & Curriculum'}
                </span>
                <span aria-hidden="true">·</span>
                <span>{isAm ? 'ፊት፣ ሰውነት እና እጆች' : 'Face, Body & Hands'}</span>
              </div>

              <h3 className="font-heading text-xl font-bold text-slate-900 dark:text-[#F4F7FB] font-ethiopic">
                {isAm
                  ? '2D የመከታተያ ስቱዲዮ እና የEthSL ቃላት'
                  : '2D Tracking Studio & Vocabulary Learning'}
              </h3>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-[#A0AEC0] leading-relaxed font-ethiopic">
                {isAm
                  ? 'ፊትን፣ የሰውነት አፅምን እና ሁለት እጆችን በቀጥታ በ2D ይከታተሉ ወይም 80+ ቃላትን እና 33 የፊደል ምልክቶችን ይማሩ።'
                  : 'Track facial contours, 2D body skeleton, and dual 21-point hands in real time, or study 80+ EthSL vocabulary entries and 33 Fidel consonants.'}
              </p>

              {/* Clickable Live Sign Preview Grid */}
              <div className="space-y-2">
                <span className="text-[11px] font-medium text-slate-600 dark:text-[#A0AEC0] block font-ethiopic">
                  {isAm ? 'በ2D ስቱዲዮ ለመለማመድ ምልክት ይምረጡ፦' : 'Select a sign to practice in 2D Tracking Studio:'}
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {featuredStudioSigns.map((gesture) => (
                    <button
                      key={gesture.id}
                      type="button"
                      onClick={() => onSelectGestureForStudio(gesture.id)}
                      className="group min-h-[48px] px-2.5 py-2 rounded-[10px] bg-white dark:bg-[#101C2C] border border-slate-200 dark:border-[#253448] hover:border-[#0E7490] dark:hover:border-[#43D9E9] hover:-translate-y-[1px] active:scale-[0.98] motion-reduce:transform-none text-left transition-[border-color,transform] duration-150 cursor-pointer flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9]"
                    >
                      <div className="w-9 h-9 rounded-[8px] bg-slate-50 dark:bg-[#080D18] border border-slate-200 dark:border-[#253448] group-hover:border-[#0E7490]/50 dark:group-hover:border-[#43D9E9]/50 flex items-center justify-center shrink-0 transition-colors">
                        <HandPoseDiagram gestureKey={gesture.id} variant="compact" className="w-7 h-7" />
                      </div>
                      <div className="min-w-0">
                        <span className="block text-xs font-semibold text-slate-900 dark:text-[#F4F7FB] truncate">
                          {gesture.labelEn}
                        </span>
                        <span className="block text-[11px] font-ethiopic text-[#0E7490] dark:text-[#43D9E9] truncate">
                          {gesture.labelAm}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-4 border-t border-slate-200 dark:border-[#253448]">
              <Button
                variant="secondary"
                size="md"
                onClick={() => onNavigateModule('tracking-studio')}
                leftIcon={<Hand className="w-4 h-4 text-[#0E7490] dark:text-[#43D9E9]" />}
              >
                {isAm ? '2D መከታተያ ስቱዲዮ' : '2D Tracking Studio'}
              </Button>
              <Button
                variant="ghost"
                size="md"
                onClick={() => onNavigateModule('vocabulary')}
                leftIcon={<BookOpen className="w-4 h-4" />}
              >
                {isAm ? 'መዝገበ-ቃላት' : 'EthSL Vocabulary'}
              </Button>
            </div>
          </Card>
        </div>

        {/* Tier 2: Hairline Architectural Grid for Remaining 4 Accessibility Tools */}
        <Card padding="none" className="overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            {accessibilityTools.map((tool, idx) => (
              <div
                key={tool.moduleId}
                className={`p-6 flex flex-col justify-between gap-4 border-slate-200 dark:border-[#253448] hover:bg-sky-50/50 dark:hover:bg-[#172438]/55 transition-colors duration-200 ${
                  idx > 0 ? 'border-t md:border-t-0' : ''
                } ${idx % 2 === 1 ? 'md:border-l' : ''} ${
                  idx >= 2 ? 'md:border-t' : ''
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`w-9 h-9 rounded-[10px] border flex items-center justify-center shrink-0 ${tool.iconBoxClass} ${tool.accentClass}`}
                      >
                        {tool.icon}
                      </span>
                      <div className="min-w-0">
                        <h3 className="font-heading text-base font-bold text-slate-900 dark:text-[#F4F7FB] font-ethiopic truncate">
                          {tool.title}
                        </h3>
                        <span className="text-[11px] font-medium text-slate-600 dark:text-[#A0AEC0] font-ethiopic block">
                          {tool.subtitle}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-[#A0AEC0] leading-relaxed font-ethiopic">
                    {tool.description}
                  </p>
                </div>

                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onNavigateModule(tool.moduleId)}
                    rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                    className="font-ethiopic"
                  >
                    {tool.cta}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
};
