import React, { useState } from 'react';
import { ArrowDown, ArrowRight, Camera, Check, Hand, Volume2 } from 'lucide-react';
import { AppLanguage } from '../config/navigation';
import { GESTURE_DEFINITIONS, GESTURE_LIST } from '../data/gestures';
import { speechService } from '../services/speechService';
import { GestureKey } from '../types';
import { HandPoseDiagram } from './HandPoseDiagram';
import { Button, Card, useToast } from './ui';

interface HeroSectionProps {
  language?: AppLanguage;
  onStartDemo: () => void;
  onStartLiveRecognition?: () => void;
  onExplore3D: (gestureKey?: GestureKey) => void;
}

const DEMO_SIGN_KEYS: GestureKey[] = ['hello', 'thank_you', 'water', 'help', 'please', 'yes'];

export const HeroSection: React.FC<HeroSectionProps> = ({
  language = 'en',
  onStartDemo,
  onStartLiveRecognition,
  onExplore3D,
}) => {
  const { showToast } = useToast();
  const [selectedKey, setSelectedKey] = useState<GestureKey>('hello');
  const [speakingLang, setSpeakingLang] = useState<'en' | 'am' | null>(null);

  const isAm = language === 'am';
  const activeGesture = GESTURE_DEFINITIONS[selectedKey] || GESTURE_LIST[0];
  const demoGestures = DEMO_SIGN_KEYS.map((key) => GESTURE_DEFINITIONS[key]).filter(Boolean);

  const handleScrollToHowItWorks = () => {
    const target = document.getElementById('how-it-works');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSpeak = (langCode: 'en-US' | 'am-ET') => {
    const shortLang = langCode === 'am-ET' ? 'am' : 'en';
    setSpeakingLang(shortLang);
    speechService.speak(
      activeGesture,
      langCode,
      0.95,
      () => setSpeakingLang(shortLang),
      () => setSpeakingLang(null),
      () => {
        setSpeakingLang(null);
        showToast(
          isAm
            ? 'በዚህ አሳሽ ላይ የድምፅ ንባብ አይገኝም።'
            : 'Speech playback is unavailable in this browser.',
          'info'
        );
      }
    );
  };

  return (
    <section aria-labelledby="hero-headline" className="relative pt-2 pb-6 lg:pt-6 lg:pb-10">
      <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Column: Product Proposition */}
        <div className="lg:col-span-6 space-y-6">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0E7490] dark:text-[#43D9E9] font-ethiopic">
              {isAm
                ? 'በAI የተደገፈ የመግባቢያ ቴክኖሎጂ'
                : 'AI-POWERED ACCESSIBILITY TECHNOLOGY'}
            </p>

            <h1
              id="hero-headline"
              className="font-heading text-[clamp(2.35rem,4.4vw,3.65rem)] font-bold tracking-tight leading-[1.08] text-slate-900 dark:text-[#F4F7FB] [text-wrap:balance]"
            >
              {isAm ? 'እጆች ድምፅ የሚሆኑበት።' : 'Where Hands Become Voices.'}
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-[#A0AEC0] leading-relaxed max-w-xl font-normal font-ethiopic">
              {isAm
                ? 'ብልህ የምልክት ቋንቋ ማወቂያ፣ ባለሁለት ቋንቋ ትርጉም እና ተደራሽ ቴክኖሎጂን በመጠቀም የመግባቢያ እንቅፋቶችን ያስወግዱ።'
                : 'Breaking communication barriers through intelligent sign recognition, multilingual translation, and accessible technology.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button
              variant="primary"
              size="lg"
              onClick={onStartDemo}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="font-ethiopic"
            >
              {isAm ? 'መገናኘት ይጀምሩ' : 'Start Communicating'}
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={handleScrollToHowItWorks}
              leftIcon={<ArrowDown className="w-4 h-4" />}
              className="font-ethiopic"
            >
              {isAm ? 'አሰራሩን ይመልከቱ' : 'Explore How It Works'}
            </Button>
          </div>

          {/* Quiet Unboxed Product Metadata */}
          <div className="pt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-600 dark:text-[#A0AEC0]">
            <span className="font-medium text-slate-900 dark:text-[#F4F7FB]">
              English &amp; <span className="font-ethiopic font-medium">አማርኛ</span>
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              {GESTURE_LIST.length}{' '}
              <span className="font-ethiopic">
                {isAm ? 'ዋና ምልክቶች' : 'EthSL & Universal Signs'}
              </span>
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-ethiopic">
              {isAm ? 'በመሳሪያ ላይ 100% ግላዊ' : 'On-device sign tracking'}
            </span>
          </div>
        </div>

        {/* Right Column: Integrated 21-Point Hand Rig -> Bilingual Translation -> Speech */}
        <div className="lg:col-span-6 relative">
          {/* Restrained localized radial lighting anchored strictly behind visual stage */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-6 rounded-[28px] bg-[radial-gradient(ellipse_at_top_right,rgba(8,145,178,0.10),transparent_65%)] dark:bg-[radial-gradient(ellipse_at_top_right,rgba(67,217,233,0.13),rgba(133,133,255,0.06)_45%,transparent_72%)]"
          />

          <Card padding="none" className="relative overflow-hidden shadow-sm dark:shadow-[0_18px_45px_rgba(2,6,23,0.45)]">
            {/* Top Bar: Interactive EthSL Sign Header */}
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-[#253448] flex items-center justify-between gap-3 bg-slate-50/80 dark:bg-[#172438]/65">
              <div className="flex items-center gap-2 min-w-0">
                <Hand className="w-4 h-4 text-[#0E7490] dark:text-[#43D9E9] shrink-0" aria-hidden="true" />
                <span className="text-xs font-semibold text-slate-900 dark:text-[#F4F7FB] truncate font-ethiopic">
                  {isAm ? (
                    'የቀጥታ መግባቢያ ፍሰት'
                  ) : (
                    <>
                      <span className="hidden sm:inline">Interactive </span>Sign-to-Voice Flow
                    </>
                  )}
                </span>
              </div>
              <span className="text-[11px] font-mono tabular-nums text-slate-600 dark:text-[#A0AEC0] shrink-0">
                {activeGesture.signLanguage || 'EthSL'} · &ge;{Math.round(activeGesture.threshold * 100)}% lock
              </span>
            </div>

            {/* Symmetrical Gesture Selector (Zero Orphan Rows) */}
            <div
              className="px-5 py-3 border-b border-slate-200 dark:border-[#253448] grid grid-cols-2 sm:grid-cols-3 gap-2"
              role="group"
              aria-label={isAm ? 'የምልክት ናሙና ይምረጡ' : 'Choose a sign gesture to preview'}
            >
              {demoGestures.map((gesture) => {
                const isSelected = gesture.id === activeGesture.id;
                return (
                  <button
                    key={gesture.id}
                    type="button"
                    onClick={() => setSelectedKey(gesture.id)}
                    aria-pressed={isSelected}
                    className={`min-h-[36px] px-3 py-1.5 rounded-[8px] text-xs font-medium border transition-[colors,transform] duration-150 active:scale-[0.98] motion-reduce:active:scale-100 cursor-pointer flex items-center justify-between gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9] ${
                      isSelected
                        ? 'bg-[#0E7490]/10 dark:bg-[#43D9E9]/14 border-[#0E7490] dark:border-[#43D9E9] text-[#0E7490] dark:text-[#43D9E9] font-semibold'
                        : 'bg-slate-50 dark:bg-[#172438]/75 border-slate-200 dark:border-[#253448] text-slate-700 dark:text-[#A0AEC0] hover:text-slate-900 dark:hover:text-[#F4F7FB] hover:border-slate-300 dark:hover:border-[#374c68]'
                    }`}
                  >
                    <span className="truncate font-ethiopic">
                      {isAm ? gesture.labelAm : gesture.labelEn}
                    </span>
                    <span
                      aria-hidden="true"
                      className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-[#0E7490] dark:bg-[#43D9E9]'
                          : 'bg-slate-300 dark:bg-[#33465f]'
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            {/* Core Demonstration Body: 21-Point Hand Rig -> Bilingual Recognition -> Speech */}
            <div className="p-5 sm:p-6 space-y-5">
              <div className="grid sm:grid-cols-12 gap-5 items-center">
                {/* Product-Quality 21-Point Anatomical Hand Visualizer */}
                <div className="sm:col-span-6 space-y-2.5">
                  <HandPoseDiagram gestureKey={activeGesture.id} variant="stage" />

                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                      <Check className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span className="font-ethiopic">
                        {isAm ? 'ምልክት ተለይቷል' : 'Gesture Recognized'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-[#A0AEC0] leading-relaxed">
                      {activeGesture.poseInstructions}
                    </p>
                  </div>
                </div>

                {/* English + Amharic Output + Direct Audio Playback */}
                <div className="sm:col-span-6 flex flex-col justify-between space-y-4 sm:pl-2">
                  <div key={activeGesture.id} className="space-y-3.5 ejji-animate-fade-up">
                    <div>
                      <span className="text-[11px] font-medium text-slate-600 dark:text-[#A0AEC0] block mb-0.5">
                        English
                      </span>
                      <div className="font-heading text-2xl sm:text-[28px] font-bold text-slate-900 dark:text-[#F4F7FB] tracking-tight leading-tight">
                        {activeGesture.labelEn}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200 dark:border-[#253448]">
                      <span className="text-[11px] font-medium text-slate-600 dark:text-[#A0AEC0] block mb-0.5 font-ethiopic">
                        አማርኛ (Amharic)
                      </span>
                      <div className="flex items-baseline gap-2.5 flex-wrap">
                        <span className="font-ethiopic text-2xl sm:text-[26px] font-bold text-[#0E7490] dark:text-[#43D9E9] leading-snug">
                          {activeGesture.labelAm}
                        </span>
                        <span className="text-xs font-mono text-slate-600 dark:text-[#A0AEC0]">
                          /{activeGesture.phoneticAm}/
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Voice Synthesis Buttons */}
                  <div className="pt-1 flex flex-wrap items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleSpeak('en-US')}
                      leftIcon={<Volume2 className="w-3.5 h-3.5 text-[#0E7490] dark:text-[#43D9E9]" />}
                      aria-pressed={speakingLang === 'en'}
                    >
                      {speakingLang === 'en' ? 'Speaking EN...' : 'Speak EN'}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleSpeak('am-ET')}
                      leftIcon={<Volume2 className="w-3.5 h-3.5 text-[#4F46E5] dark:text-[#8585FF]" />}
                      aria-pressed={speakingLang === 'am'}
                      className="font-ethiopic"
                    >
                      {speakingLang === 'am' ? 'በማንበብ ላይ...' : 'በአማርኛ አንብብ'}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Clean Footer Strip: Try Camera & View 3D Pose */}
              <div className="pt-4 border-t border-slate-200 dark:border-[#253448] flex flex-wrap items-center justify-between gap-3 text-xs">
                {onStartLiveRecognition ? (
                  <button
                    type="button"
                    onClick={onStartLiveRecognition}
                    className="font-medium text-slate-700 dark:text-[#A0AEC0] hover:text-[#0E7490] dark:hover:text-[#43D9E9] transition-colors flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9] rounded-[6px] px-1.5 py-1 font-ethiopic"
                  >
                    <Camera className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{isAm ? 'በካሜራ ሞክር' : 'Try Camera'}</span>
                  </button>
                ) : (
                  <span />
                )}

                <button
                  type="button"
                  onClick={() => onExplore3D(activeGesture.id)}
                  className="font-semibold text-[#0E7490] dark:text-[#43D9E9] hover:opacity-80 transition-opacity flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9] rounded-[6px] px-1.5 py-1 font-ethiopic"
                >
                  <span>{isAm ? 'በ3D እይ' : 'View 3D Pose'}</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};
