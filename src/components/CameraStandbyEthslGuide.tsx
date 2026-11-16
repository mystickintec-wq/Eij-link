import React, { useState, useMemo } from 'react';
import {
  ETHSL_PDF_SIGNS,
  ETHSL_FIDEL_CONSONANTS,
  ETHSL_VOWEL_RULES,
  EthslSignItem,
  EthslFidelConsonant,
} from '../data/ethslPdfSigns';
import {
  Video,
  BookOpen,
  Sparkles,
  ExternalLink,
  Volume2,
  ChevronRight,
  Hand,
  Layers,
  ArrowRight,
  Info,
  Check,
  Search,
} from 'lucide-react';
import { GestureKey } from '../types';
import { Button, EmptyState, SearchInput, StatusBadge } from './ui';

interface CameraStandbyEthslGuideProps {
  onStartCamera: () => void;
  onSelectGesture?: (gestureKey: GestureKey) => void;
  variant?: 'overlay' | 'standalone';
}

type TabType = 'phrases' | 'fidel' | 'vowels' | 'culture';

const CATEGORIES = [
  { id: 'all', label: 'All Signs (80+)' },
  { id: 'greetings', label: 'Greetings & National' },
  { id: 'courtesy', label: 'Courtesy' },
  { id: 'food_drink', label: 'Food & Drink' },
  { id: 'questions', label: 'Questions' },
  { id: 'family', label: 'Family' },
  { id: 'emotions', label: 'Emotions' },
  { id: 'education_work', label: 'School & Work' },
  { id: 'transport', label: 'Transport' },
  { id: 'colors', label: 'Colors' },
  { id: 'numbers_days', label: 'Numbers & Days' },
];

export const CameraStandbyEthslGuide: React.FC<CameraStandbyEthslGuideProps> = ({
  onStartCamera,
  onSelectGesture,
  variant = 'overlay',
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('phrases');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSign, setSelectedSign] = useState<EthslSignItem | null>(ETHSL_PDF_SIGNS[0]);
  const [selectedConsonant, setSelectedConsonant] = useState<EthslFidelConsonant | null>(ETHSL_FIDEL_CONSONANTS[0]);
  const [speakingText, setSpeakingText] = useState<string | null>(null);

  const isStandalone = variant === 'standalone';

  // Filtered signs
  const filteredSigns = useMemo(() => {
    return ETHSL_PDF_SIGNS.filter((sign) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        q === '' ||
        sign.english.toLowerCase().includes(q) ||
        sign.amharic.includes(searchQuery.trim()) ||
        sign.phonetic.toLowerCase().includes(q) ||
        sign.categoryLabel.toLowerCase().includes(q);

      const matchesCat = selectedCategory === 'all' || sign.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [searchQuery, selectedCategory]);

  // Audio Pronunciation
  const playAudio = (text: string, lang = 'am-ET') => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.88;
      utterance.lang = lang;
      setSpeakingText(text);
      utterance.onend = () => setSpeakingText(null);
      utterance.onerror = () => setSpeakingText(null);
      window.speechSynthesis.speak(utterance);
    }
  };

  // Map PDF sign to one of our app's test gestures if applicable
  const mapSignToGestureKey = (signId: string): GestureKey | null => {
    if (signId.includes('hello')) return 'hello';
    if (signId.includes('thank_you')) return 'thank_you';
    if (signId.includes('water')) return 'water';
    if (signId.includes('please')) return 'please';
    if (signId.includes('help')) return 'help';
    if (signId.includes('yes')) return 'yes';
    if (signId.includes('no')) return 'no';
    if (signId.includes('right')) return 'ok';
    if (signId.includes('wait')) return 'stop';
    return null;
  };

  const containerClass = isStandalone
    ? 'relative rounded-[16px] bg-white dark:bg-[#101C2C] border border-slate-200 dark:border-[#253448] text-slate-900 dark:text-[#F4F7FB] flex flex-col overflow-hidden shadow-sm min-h-[660px]'
    : 'absolute inset-0 bg-white/98 dark:bg-[#080D18]/96 backdrop-blur-md flex flex-col overflow-hidden text-slate-900 dark:text-[#F4F7FB] z-10';

  const headerClass = isStandalone
    ? 'shrink-0 px-5 py-4 bg-slate-50/90 dark:bg-[#0C1524] border-b border-slate-200 dark:border-[#253448] flex flex-wrap items-center justify-between gap-3'
    : 'shrink-0 p-3.5 bg-slate-50/95 dark:bg-[#101C2C] border-b border-slate-200 dark:border-[#253448] flex flex-wrap items-center justify-between gap-3';

  const tabBarClass = isStandalone
    ? 'shrink-0 px-4 py-2.5 bg-white dark:bg-[#0D1726] border-b border-slate-200 dark:border-[#253448] flex flex-wrap items-center justify-between gap-2'
    : 'shrink-0 px-3 py-2 bg-white dark:bg-[#0C1524] border-b border-slate-200 dark:border-[#253448] flex flex-wrap items-center justify-between gap-2';

  const panelSurfaceClass =
    'bg-slate-50/85 dark:bg-[#0D1726] rounded-[14px] border border-slate-200 dark:border-[#253448]';

  const innerCardClass =
    'bg-white dark:bg-[#172438] border border-slate-200 dark:border-[#253448]';

  return (
    <div className={containerClass}>
      {/* Top Header Bar */}
      <div className={headerClass}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-[10px] bg-[#0E7490]/10 dark:bg-[#43D9E9]/15 border border-[#0E7490]/25 dark:border-[#43D9E9]/30 flex items-center justify-center text-[#0E7490] dark:text-[#43D9E9] shrink-0">
            <BookOpen className="w-4 h-4" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone="info">EthSL Curriculum Guide</StatusBadge>
              <span className="text-xs text-slate-600 dark:text-[#A0AEC0]">
                Official Ethiopian Sign Language Reference
              </span>
            </div>
            <h3 className="font-heading text-sm sm:text-base font-bold flex flex-wrap items-center gap-2 mt-0.5 text-slate-900 dark:text-[#F4F7FB]">
              <span className="font-ethiopic">የኢትዮጵያ የምልክት ቋንቋ</span>
              <span className="text-xs font-normal font-sans text-slate-600 dark:text-[#A0AEC0]">
                (Ethiopian Sign Language · 80+ Signs &amp; 33 Fidel Letters)
              </span>
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href="https://youtu.be/c636uSx0o7g"
            target="_blank"
            rel="noopener noreferrer"
            className="h-9 px-3 rounded-[8px] text-xs font-medium border flex items-center gap-1.5 transition-colors bg-white dark:bg-[#172438] hover:bg-slate-100 dark:hover:bg-[#1e2f4a] text-slate-700 dark:text-[#F4F7FB] border-slate-200 dark:border-[#253448] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9]"
            title="Watch the original Ethiopian Sign Language tutorial video"
          >
            <span>Video Guide</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" aria-hidden="true" />
          </a>

          <Button
            variant="primary"
            size="sm"
            onClick={onStartCamera}
            leftIcon={<Video className="w-4 h-4" />}
          >
            Start Camera Live
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className={tabBarClass} role="tablist" aria-label="EthSL curriculum sections">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'phrases' as const, label: '80+ Words & Phrases', icon: <Hand className="w-3.5 h-3.5" aria-hidden="true" /> },
            { id: 'fidel' as const, label: '33 Fidel Consonants', icon: <span className="font-ethiopic font-bold text-xs leading-none">ፊ</span> },
            { id: 'vowels' as const, label: '7 Vowel Motion Rules', icon: <Layers className="w-3.5 h-3.5" aria-hidden="true" /> },
            { id: 'culture' as const, label: 'Signer Notes & Tips', icon: <Info className="w-3.5 h-3.5" aria-hidden="true" /> },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id)}
                className={`h-9 px-3 rounded-[8px] text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9] ${
                  isActive
                    ? 'bg-[#0E7490] dark:bg-[#43D9E9] text-white dark:text-[#080D18] shadow-xs'
                    : 'text-slate-600 dark:text-[#A0AEC0] hover:text-slate-900 dark:hover:text-[#F4F7FB] hover:bg-slate-100 dark:hover:bg-[#172438]'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {!isStandalone && (
          <StatusBadge tone="warning" className="hidden sm:inline-flex">
            Camera Standby Mode
          </StatusBadge>
        )}
      </div>

      {/* Main Tab Content Area */}
      <div className={`flex-1 p-3.5 sm:p-4 min-h-0 ${isStandalone ? 'overflow-y-auto' : 'overflow-y-auto md:overflow-hidden'}`}>
        {/* TAB 1: 80+ WORDS & PHRASES */}
        {activeTab === 'phrases' && (
          <div className={`${isStandalone ? 'grid md:grid-cols-12 gap-4' : 'h-full flex flex-col md:flex-row gap-3 md:overflow-hidden'}`}>
            {/* Left Column: Search, Categories & List */}
            <div className={`${isStandalone ? 'md:col-span-6 h-[560px]' : 'w-full md:w-1/2 min-h-[300px] md:h-full'} flex flex-col overflow-hidden p-3 ${panelSurfaceClass}`}>
              <div className="mb-2.5 shrink-0">
                <SearchInput
                  aria-label="Search Ethiopian Sign Language vocabulary"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onClear={() => setSearchQuery('')}
                  placeholder="Search Amharic (ሰላም) or English (water, hello)..."
                />
              </div>

              {/* Category Filters */}
              <div className="flex flex-wrap items-center gap-1.5 pb-2.5 shrink-0">
                {CATEGORIES.map((cat) => {
                  const isActive = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`h-7 px-2.5 rounded-[8px] text-[11px] font-medium whitespace-nowrap cursor-pointer transition-colors border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9] ${
                        isActive
                          ? 'bg-[#0E7490] dark:bg-[#43D9E9] border-[#0E7490] dark:border-[#43D9E9] text-white dark:text-[#080D18] font-semibold'
                          : 'bg-white dark:bg-[#172438] border-slate-200 dark:border-[#253448] text-slate-600 dark:text-[#A0AEC0] hover:text-slate-900 dark:hover:text-[#F4F7FB]'
                      }`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>

              {/* Sign Items List */}
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 text-left">
                {filteredSigns.length === 0 ? (
                  <EmptyState
                    icon={<Search className="w-5 h-5" />}
                    title="No matching EthSL signs"
                    description={`No curriculum signs matched "${searchQuery}". Try searching "hello", "water", or clearing filters.`}
                    action={
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedCategory('all');
                        }}
                      >
                        Reset Filters
                      </Button>
                    }
                  />
                ) : (
                  filteredSigns.map((sign) => {
                    const isSelected = selectedSign?.id === sign.id;
                    return (
                      <button
                        key={sign.id}
                        type="button"
                        onClick={() => setSelectedSign(sign)}
                        className={`w-full p-2.5 rounded-[10px] cursor-pointer transition-colors border flex items-center justify-between gap-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9] ${
                          isSelected
                            ? 'bg-cyan-50 dark:bg-[#162D48] border-[#0E7490] dark:border-[#43D9E9]'
                            : `${innerCardClass} hover:border-[#0E7490]/40 dark:hover:border-[#43D9E9]/40`
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-lg shrink-0" aria-hidden="true">{sign.emoji}</span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-xs truncate text-slate-900 dark:text-[#F4F7FB]">
                                {sign.english}
                              </span>
                              <span className="text-xs font-ethiopic font-medium text-[#0E7490] dark:text-[#43D9E9]">
                                {sign.amharic}
                              </span>
                            </div>
                            <div className="text-[11px] truncate text-slate-600 dark:text-[#A0AEC0]">
                              [{sign.phonetic}] · {sign.categoryLabel}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <StatusBadge tone={sign.handsCount === 2 ? 'warning' : 'info'}>
                            {sign.handsCount === 2 ? '2 Hands' : '1 Hand'}
                          </StatusBadge>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" aria-hidden="true" />
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Column: Selected Sign Inspector */}
            <div className={`${isStandalone ? 'md:col-span-6 h-[560px]' : 'w-full md:w-1/2 min-h-[260px] md:h-full'} flex flex-col overflow-y-auto p-4 sm:p-5 text-left space-y-4 ${panelSurfaceClass}`}>
              {selectedSign ? (
                <>
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200 dark:border-[#253448]">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-3xl shrink-0" aria-hidden="true">{selectedSign.emoji}</span>
                      <div className="min-w-0">
                        <h4 className="font-heading text-base sm:text-lg font-bold flex flex-wrap items-center gap-2 text-slate-900 dark:text-[#F4F7FB]">
                          <span>{selectedSign.english}</span>
                          <span className="text-[#0E7490] dark:text-[#43D9E9] font-ethiopic">
                            {selectedSign.amharic}
                          </span>
                        </h4>
                        <span className="text-xs text-slate-600 dark:text-[#A0AEC0]">
                          Pronunciation: <strong className="font-mono">[{selectedSign.phonetic}]</strong> · PDF Page {selectedSign.pageNumber}
                        </span>
                      </div>
                    </div>

                    <Button
                      variant={speakingText === selectedSign.amharic ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => playAudio(selectedSign.amharic)}
                      aria-label={`Listen to ${selectedSign.english} pronunciation in Amharic`}
                      leftIcon={<Volume2 className="w-4 h-4" />}
                    >
                      Speak
                    </Button>
                  </div>

                  {/* Hand Execution Details */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#0E7490] dark:text-[#43D9E9] flex items-center gap-1.5">
                      <Hand className="w-3.5 h-3.5" aria-hidden="true" /> Handshape &amp; Motion (PDF Reference)
                    </span>
                    <div className={`p-3.5 rounded-[10px] text-xs leading-relaxed ${innerCardClass} text-slate-700 dark:text-[#F4F7FB]`}>
                      {selectedSign.handshapeDescription}
                    </div>
                  </div>

                  {/* ASL Comparison */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" aria-hidden="true" /> ASL / International Comparison
                    </span>
                    <div className="p-3 rounded-[10px] bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                      {selectedSign.aslComparison}
                    </div>
                  </div>

                  {/* Sign Specifications */}
                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <div className={`p-3 rounded-[10px] ${innerCardClass}`}>
                      <span className="block text-[11px] mb-0.5 text-slate-600 dark:text-[#A0AEC0]">
                        Hand Tracking
                      </span>
                      <strong className="text-slate-900 dark:text-[#F4F7FB]">
                        {selectedSign.handsCount === 2 ? 'Dual Hands Required' : 'Single Dominant Hand'}
                      </strong>
                    </div>
                    <div className={`p-3 rounded-[10px] ${innerCardClass}`}>
                      <span className="block text-[11px] mb-0.5 text-slate-600 dark:text-[#A0AEC0]">
                        Category
                      </span>
                      <strong className="text-slate-900 dark:text-[#F4F7FB]">
                        {selectedSign.categoryLabel}
                      </strong>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-1 flex flex-wrap items-center gap-2 mt-auto">
                    <Button
                      variant="primary"
                      size="md"
                      onClick={onStartCamera}
                      leftIcon={<Video className="w-4 h-4" />}
                      className="flex-1"
                    >
                      Practice in Camera
                    </Button>

                    {mapSignToGestureKey(selectedSign.id) && onSelectGesture && (
                      <Button
                        variant="secondary"
                        size="md"
                        onClick={() => {
                          const g = mapSignToGestureKey(selectedSign.id);
                          if (g) onSelectGesture(g);
                        }}
                        rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                      >
                        Practice in 2D Studio
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <EmptyState
                  icon={<Hand className="w-5 h-5" />}
                  title="Select an EthSL sign"
                  description="Choose any word or phrase from the list to inspect its handshape, Amharic Fidel, and tracking requirements."
                />
              )}
            </div>
          </div>
        )}

        {/* TAB 2: 33 FIDEL CONSONANTS */}
        {activeTab === 'fidel' && (
          <div className={`${isStandalone ? 'grid md:grid-cols-12 gap-4' : 'h-full flex flex-col md:flex-row gap-3 md:overflow-hidden'}`}>
            <div className={`${isStandalone ? 'md:col-span-7 h-[560px]' : 'w-full md:w-3/5 min-h-[260px] md:h-full'} flex flex-col overflow-hidden p-4 ${panelSurfaceClass}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-[#0E7490] dark:text-[#43D9E9]">
                  33 Ethiopian Fidel Handshapes (PDF Pages 50–58)
                </span>
                <span className="text-[11px] text-slate-600 dark:text-[#A0AEC0]">
                  Select a character to inspect
                </span>
              </div>

              <div className="flex-1 overflow-y-auto grid grid-cols-4 sm:grid-cols-6 gap-2 pr-1">
                {ETHSL_FIDEL_CONSONANTS.map((cons) => {
                  const isSelected = selectedConsonant?.letterId === cons.letterId;
                  return (
                    <button
                      key={cons.letterId}
                      type="button"
                      onClick={() => setSelectedConsonant(cons)}
                      className={`min-h-[60px] p-2 rounded-[10px] border text-center transition-colors cursor-pointer flex flex-col items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9] ${
                        isSelected
                          ? 'bg-cyan-50 dark:bg-[#162D48] border-[#0E7490] dark:border-[#43D9E9] ring-1 ring-[#0E7490]/35 dark:ring-[#43D9E9]/50'
                          : innerCardClass
                      }`}
                    >
                      <span className="text-xl font-ethiopic font-bold text-[#0E7490] dark:text-[#43D9E9]">
                        {cons.fidel}
                      </span>
                      <span className="text-[11px] font-mono mt-0.5 text-slate-600 dark:text-[#A0AEC0]">
                        {cons.letterId}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={`${isStandalone ? 'md:col-span-5 h-[560px]' : 'w-full md:w-2/5 min-h-[260px] md:h-full'} flex flex-col overflow-y-auto p-4 sm:p-5 text-left space-y-4 ${panelSurfaceClass}`}>
              {selectedConsonant && (
                <>
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-[#253448]">
                    <div className="w-12 h-12 rounded-[12px] bg-[#0E7490]/10 dark:bg-[#43D9E9]/15 border border-[#0E7490]/30 dark:border-[#43D9E9]/40 flex items-center justify-center text-3xl font-ethiopic text-[#0E7490] dark:text-[#43D9E9] font-bold shrink-0">
                      {selectedConsonant.fidel}
                    </div>
                    <div>
                      <h4 className="font-heading text-base font-bold text-slate-900 dark:text-[#F4F7FB]">
                        {selectedConsonant.romanization}
                      </h4>
                      <span className="text-xs text-slate-600 dark:text-[#A0AEC0]">
                        Amharic Consonant · PDF Page {selectedConsonant.pageNumber}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#0E7490] dark:text-[#43D9E9] flex items-center gap-1.5">
                      <Hand className="w-3.5 h-3.5" aria-hidden="true" /> EthSL Handshape Instruction
                    </span>
                    <div className={`p-3.5 rounded-[10px] text-xs leading-relaxed ${innerCardClass} text-slate-700 dark:text-[#F4F7FB]`}>
                      {selectedConsonant.handshapeDescription}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" aria-hidden="true" /> Closest International / ASL Sign
                    </span>
                    <div className="p-3 rounded-[10px] bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                      {selectedConsonant.aslEquivalent}
                    </div>
                  </div>

                  <div className={`p-3 rounded-[10px] text-xs leading-relaxed ${innerCardClass} text-slate-600 dark:text-[#A0AEC0]`}>
                    <strong className="text-slate-900 dark:text-[#F4F7FB]">Fidel Signing Rule:</strong> The handshape represents the consonant sound, while directional motion adds the vowel order.
                  </div>

                  <Button
                    variant="primary"
                    size="md"
                    onClick={onStartCamera}
                    leftIcon={<Video className="w-4 h-4" />}
                    className="w-full mt-auto"
                  >
                    Practice "{selectedConsonant.fidel}" in Camera
                  </Button>
                </>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: 7 VOWEL MOTION RULES */}
        {activeTab === 'vowels' && (
          <div className={`flex flex-col p-4 overflow-y-auto text-left space-y-4 ${panelSurfaceClass} ${isStandalone ? '' : 'h-full'}`}>
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-[#253448]">
              <div>
                <h4 className="font-heading text-sm font-bold text-[#0E7490] dark:text-[#43D9E9]">
                  The 7 Vowel Movement Directions (PDF Pages 58–60)
                </h4>
                <p className="text-xs mt-0.5 text-slate-600 dark:text-[#A0AEC0]">
                  All 7 orders of Ethiopian vowels are signed by executing specific spatial motions with the consonant handshape.
                </p>
              </div>

              <Button variant="primary" size="sm" onClick={onStartCamera} leftIcon={<Video className="w-4 h-4" />}>
                Test in Camera
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {ETHSL_VOWEL_RULES.map((vowel) => (
                <div
                  key={vowel.order}
                  className={`p-4 rounded-[12px] flex flex-col justify-between space-y-2.5 ${innerCardClass}`}
                >
                  <div className="flex items-center justify-between">
                    <StatusBadge tone="info">Order {vowel.order}</StatusBadge>
                    <span className="text-xl font-ethiopic font-bold text-slate-900 dark:text-[#F4F7FB]">
                      {vowel.sampleFidel}
                    </span>
                  </div>

                  <div>
                    <strong className="text-xs block text-slate-900 dark:text-[#F4F7FB]">
                      {vowel.vowelSound}
                    </strong>
                    <p className="text-xs mt-1 leading-relaxed text-slate-600 dark:text-[#A0AEC0]">
                      <strong className="text-slate-800 dark:text-[#F4F7FB]">Motion:</strong> {vowel.motionDescription}
                    </p>
                  </div>

                  <div className="text-[11px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 px-2.5 py-1.5 rounded-[8px] border border-amber-200 dark:border-amber-500/25">
                    ASL Equivalent: {vowel.aslComparison}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: SIGNER NOTES & CULTURE */}
        {activeTab === 'culture' && (
          <div className={`flex flex-col p-5 overflow-y-auto text-left space-y-4 ${panelSurfaceClass} ${isStandalone ? '' : 'h-full'}`}>
            <h4 className="font-heading text-base font-bold text-slate-900 dark:text-[#F4F7FB]">
              Linguistic Guidelines &amp; Rules from the Ethiopian Sign Language Guide
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className={`p-4 rounded-[12px] space-y-1.5 ${innerCardClass}`}>
                <span className="font-bold text-[#0E7490] dark:text-[#43D9E9] flex items-center gap-1.5">
                  <Check className="w-4 h-4" aria-hidden="true" /> Dominant vs Non-Dominant Hand Rule
                </span>
                <p className="leading-relaxed text-slate-600 dark:text-[#A0AEC0]">
                  Unless otherwise stated in the curriculum, <strong>"right hand"</strong> can be interchangeably used for <strong>"dominant hand"</strong>. Left-handed signers can mirror all single-hand signs naturally.
                </p>
              </div>

              <div className={`p-4 rounded-[12px] space-y-1.5 ${innerCardClass}`}>
                <span className="font-bold text-[#0E7490] dark:text-[#43D9E9] flex items-center gap-1.5">
                  <Check className="w-4 h-4" aria-hidden="true" /> Compound 2-Hand Phrases
                </span>
                <p className="leading-relaxed text-slate-600 dark:text-[#A0AEC0]">
                  Phrases such as <em>"Enquan dehena metachu" (Welcome)</em> and <em>"Chigir yelem" (No worries)</em> are multi-step compound signs combining facial touch, chest motion, and simultaneous dual-hand shapes.
                </p>
              </div>

              <div className={`p-4 rounded-[12px] space-y-1.5 ${innerCardClass}`}>
                <span className="font-bold text-[#0E7490] dark:text-[#43D9E9] flex items-center gap-1.5">
                  <Check className="w-4 h-4" aria-hidden="true" /> Respectful Body Posture
                </span>
                <p className="leading-relaxed text-slate-600 dark:text-[#A0AEC0]">
                  When signing <em>"Ameseginalehu" (Thank you)</em> in EthSL, it is customary to bend slightly forward as your flat right hand moves from your chin out toward your resting left hand.
                </p>
              </div>

              <div className={`p-4 rounded-[12px] space-y-1.5 ${innerCardClass}`}>
                <span className="font-bold text-[#0E7490] dark:text-[#43D9E9] flex items-center gap-1.5">
                  <Check className="w-4 h-4" aria-hidden="true" /> Video Reference
                </span>
                <p className="leading-relaxed text-slate-600 dark:text-[#A0AEC0]">
                  To watch real-world video demonstrations of every sign in this curriculum, visit the verified source video at{' '}
                  <a
                    href="https://youtu.be/c636uSx0o7g"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0E7490] dark:text-[#43D9E9] underline hover:opacity-80"
                  >
                    youtu.be/c636uSx0o7g
                  </a>.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <Button variant="primary" size="md" onClick={onStartCamera} leftIcon={<Video className="w-4 h-4" />} className="w-full">
                Launch Live Camera Vision
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
