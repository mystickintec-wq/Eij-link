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
  Search,
  BookOpen,
  Sparkles,
  ExternalLink,
  Volume2,
  ChevronRight,
  Hand,
  Layers,
  ArrowRight,
  Info,
  CheckCircle2,
  Check
} from 'lucide-react';
import { GestureKey } from '../types';

interface CameraStandbyEthslGuideProps {
  onStartCamera: () => void;
  onSelectGesture?: (gestureKey: GestureKey) => void;
}

type TabType = 'phrases' | 'fidel' | 'vowels' | 'culture';

export const CameraStandbyEthslGuide: React.FC<CameraStandbyEthslGuideProps> = ({
  onStartCamera,
  onSelectGesture,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('phrases');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSign, setSelectedSign] = useState<EthslSignItem | null>(ETHSL_PDF_SIGNS[0]);
  const [selectedConsonant, setSelectedConsonant] = useState<EthslFidelConsonant | null>(ETHSL_FIDEL_CONSONANTS[0]);
  const [speakingText, setSpeakingText] = useState<string | null>(null);

  // Filtered signs
  const filteredSigns = useMemo(() => {
    return ETHSL_PDF_SIGNS.filter((sign) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        sign.english.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sign.amharic.includes(searchQuery) ||
        sign.phonetic.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sign.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat = selectedCategory === 'all' || sign.category === selectedCategory;

      return matchesSearch && matchesCat;
    });
  }, [searchQuery, selectedCategory]);

  // Audio Pronunciation
  const playAudio = (text: string, lang = 'am-ET') => {
    if ('speechSynthesis' in window) {
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

  return (
    <div className="absolute inset-0 bg-[#080D18]/95 backdrop-blur-md flex flex-col overflow-hidden text-slate-100 z-10 border border-slate-800">
      {/* Top Standby Header Bar */}
      <div className="shrink-0 p-3.5 bg-[#0C1524] border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#22D3EE]/15 border border-[#22D3EE]/30 flex items-center justify-center text-[#22D3EE]">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#22D3EE] px-1.5 py-0.5 rounded bg-[#22D3EE]/10 border border-[#22D3EE]/20">
                EthSL Curriculum Guide
              </span>
              <span className="text-xs text-slate-400">· Official PDF Reference</span>
            </div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>የኢትዮጵያ የምልክት ቋንቋ</span>
              <span className="text-slate-400 text-xs font-normal">(Ethiopian Sign Language)</span>
            </h3>
          </div>
        </div>

        {/* Primary Action: Start Camera Button */}
        <div className="flex items-center gap-2">
          <a
            href="https://youtu.be/c636uSx0o7g"
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Watch the original Ethiopian Sign Language tutorial video"
          >
            <span>Video Guide</span>
            <ExternalLink className="w-3 h-3 opacity-70" />
          </a>

          <button
            onClick={onStartCamera}
            className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#22D3EE] to-[#06b6d4] hover:from-[#06b6d4] hover:to-[#0891b2] text-[#080D18] font-bold text-xs shadow-md shadow-[#22D3EE]/20 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
          >
            <Video className="w-4 h-4" />
            <span>Start Camera Live</span>
          </button>
        </div>
      </div>

      {/* Standby Navigation Tabs */}
      <div className="shrink-0 px-3 py-2 bg-[#09101C] border-b border-slate-800/60 flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('phrases')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'phrases'
                ? 'bg-[#22D3EE] text-[#080D18] font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Hand className="w-3.5 h-3.5" />
            <span>80+ Words & Phrases</span>
          </button>

          <button
            onClick={() => setActiveTab('fidel')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'fidel'
                ? 'bg-[#22D3EE] text-[#080D18] font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <span className="font-bold text-[13px] leading-none">ፊ</span>
            <span>33 Fidel Consonants</span>
          </button>

          <button
            onClick={() => setActiveTab('vowels')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'vowels'
                ? 'bg-[#22D3EE] text-[#080D18] font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>7 Vowel Motion Rules</span>
          </button>

          <button
            onClick={() => setActiveTab('culture')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'culture'
                ? 'bg-[#22D3EE] text-[#080D18] font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>Signer Notes & Tips</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-400 hidden sm:flex items-center gap-1 shrink-0">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span>Camera Standby Mode</span>
        </div>
      </div>

      {/* Main Tab Content Area */}
      <div className="flex-1 overflow-hidden p-3 min-h-0">
        {/* ================================================================= */}
        {/* TAB 1: 80+ WORDS & PHRASES                                       */}
        {/* ================================================================= */}
        {activeTab === 'phrases' && (
          <div className="h-full flex flex-col md:flex-row gap-3 overflow-hidden">
            {/* Left Column: Search, Categories & List */}
            <div className="w-full md:w-1/2 flex flex-col h-full overflow-hidden bg-[#0A1220] rounded-xl border border-slate-800/80 p-2.5">
              {/* Search input */}
              <div className="relative mb-2 shrink-0">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search in Amharic (ሰላም) or English (water, hello)..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#0E1A2D] border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#22D3EE]"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1 overflow-x-auto pb-2 shrink-0 no-scrollbar">
                {[
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
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-2 py-0.5 rounded text-[11px] whitespace-nowrap cursor-pointer transition-colors ${
                      selectedCategory === cat.id
                        ? 'bg-[#22D3EE]/20 border border-[#22D3EE]/50 text-[#22D3EE] font-bold'
                        : 'bg-slate-800/60 border border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Sign Items List */}
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 text-left">
                {filteredSigns.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-xs">
                    No signs matched "{searchQuery}"
                  </div>
                ) : (
                  filteredSigns.map((sign) => {
                    const isSelected = selectedSign?.id === sign.id;
                    return (
                      <div
                        key={sign.id}
                        onClick={() => setSelectedSign(sign)}
                        className={`p-2 rounded-lg cursor-pointer transition-all border flex items-center justify-between gap-2 ${
                          isSelected
                            ? 'bg-[#12233B] border-[#22D3EE] shadow-sm'
                            : 'bg-[#0E1A2C]/60 hover:bg-[#0E1A2C] border-slate-800/70'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-base shrink-0">{sign.emoji}</span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-white truncate">
                                {sign.english}
                              </span>
                              <span className="text-[11px] font-mono text-[#22D3EE]">
                                {sign.amharic}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              [{sign.phonetic}] · {sign.categoryLabel}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <span
                            className={`text-[9px] px-1 py-0.5 rounded font-mono ${
                              sign.handsCount === 2
                                ? 'bg-amber-950/80 text-amber-300 border border-amber-800/50'
                                : 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/50'
                            }`}
                          >
                            {sign.handsCount === 2 ? '2 Hands' : '1 Hand'}
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Column: Selected Sign Inspector */}
            <div className="w-full md:w-1/2 flex flex-col h-full overflow-y-auto bg-[#0A1220] rounded-xl border border-slate-800/80 p-4 text-left space-y-3">
              {selectedSign ? (
                <>
                  <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{selectedSign.emoji}</span>
                        <div>
                          <h4 className="text-base font-bold text-white flex items-center gap-2">
                            <span>{selectedSign.english}</span>
                            <span className="text-[#22D3EE] font-serif text-lg">
                              {selectedSign.amharic}
                            </span>
                          </h4>
                          <span className="text-xs text-slate-400">
                            Pronunciation: <strong>[{selectedSign.phonetic}]</strong> · PDF Page {selectedSign.pageNumber}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => playAudio(selectedSign.amharic)}
                      className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                        speakingText === selectedSign.amharic
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                          : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                      }`}
                      title="Listen to pronunciation"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Hand Execution Details */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#22D3EE] flex items-center gap-1.5">
                      <Hand className="w-3.5 h-3.5" /> Handshape & Motion (from PDF)
                    </span>
                    <div className="p-3 rounded-lg bg-[#0E1A2C] border border-slate-700/80 text-xs text-slate-200 leading-relaxed font-sans">
                      {selectedSign.handshapeDescription}
                    </div>
                  </div>

                  {/* ASL Comparison & Linguistic Notes */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> ASL / International Equivalent
                    </span>
                    <div className="p-2.5 rounded-lg bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200/90 leading-relaxed">
                      {selectedSign.aslComparison}
                    </div>
                  </div>

                  {/* Sign Specifications */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-[#0E1A2C] border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Hand Tracking:</span>
                      <strong className="text-white">
                        {selectedSign.handsCount === 2 ? '👐 Dual Hands Required' : '✋ Single Dominant Hand'}
                      </strong>
                    </div>
                    <div className="p-2 rounded-lg bg-[#0E1A2C] border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Category:</span>
                      <strong className="text-white">{selectedSign.categoryLabel}</strong>
                    </div>
                  </div>

                  {/* Practice Prompt / Action Buttons */}
                  <div className="pt-2 flex flex-wrap items-center gap-2">
                    <button
                      onClick={onStartCamera}
                      className="flex-1 px-3 py-2 rounded-lg bg-[#22D3EE] hover:bg-[#06b6d4] text-[#080D18] font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Start Camera to Practice This Sign</span>
                    </button>

                    {mapSignToGestureKey(selectedSign.id) && onSelectGesture && (
                      <button
                        onClick={() => {
                          const g = mapSignToGestureKey(selectedSign.id);
                          if (g) onSelectGesture(g);
                        }}
                        className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs border border-slate-700 cursor-pointer flex items-center gap-1"
                        title="Simulate this sign pose in Studio"
                      >
                        <span>Simulate Pose</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                  Select a sign from the list to view exact handshape details
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 2: 33 FIDEL CONSONANTS                                        */}
        {/* ================================================================= */}
        {activeTab === 'fidel' && (
          <div className="h-full flex flex-col md:flex-row gap-3 overflow-hidden">
            {/* Grid of 33 Consonants */}
            <div className="w-full md:w-3/5 flex flex-col h-full overflow-hidden bg-[#0A1220] rounded-xl border border-slate-800/80 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="text-[#22D3EE]">33 Ethiopian Fidel Handshapes</span> (Pages 50-58)
                </span>
                <span className="text-[11px] text-slate-400">Click any letter to inspect</span>
              </div>

              <div className="flex-1 overflow-y-auto grid grid-cols-4 sm:grid-cols-6 gap-2 pr-1">
                {ETHSL_FIDEL_CONSONANTS.map((cons) => {
                  const isSelected = selectedConsonant?.letterId === cons.letterId;
                  return (
                    <button
                      key={cons.letterId}
                      onClick={() => setSelectedConsonant(cons)}
                      className={`p-2 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                        isSelected
                          ? 'bg-[#183152] border-[#22D3EE] text-white shadow-sm ring-1 ring-[#22D3EE]'
                          : 'bg-[#0E1A2C]/70 hover:bg-[#0E1A2C] border-slate-800 text-slate-300'
                      }`}
                    >
                      <span className="text-xl font-serif font-bold text-[#22D3EE]">{cons.fidel}</span>
                      <span className="text-[10px] font-mono text-slate-400 mt-0.5">{cons.letterId}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Consonant Inspector */}
            <div className="w-full md:w-2/5 flex flex-col h-full overflow-y-auto bg-[#0A1220] rounded-xl border border-slate-800/80 p-4 text-left space-y-3">
              {selectedConsonant ? (
                <>
                  <div className="flex items-center gap-3 pb-2 border-b border-slate-800">
                    <div className="w-12 h-12 rounded-xl bg-[#12233B] border border-[#22D3EE]/40 flex items-center justify-center text-3xl font-serif text-[#22D3EE] font-bold">
                      {selectedConsonant.fidel}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        {selectedConsonant.romanization}
                      </h4>
                      <span className="text-[11px] text-slate-400">
                        Amharic Consonant · PDF Page {selectedConsonant.pageNumber}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#22D3EE] flex items-center gap-1.5">
                      <Hand className="w-3.5 h-3.5" /> EthSL Handshape Instruction
                    </span>
                    <div className="p-3 rounded-lg bg-[#0E1A2C] border border-slate-700/80 text-xs text-slate-200 leading-relaxed font-sans">
                      {selectedConsonant.handshapeDescription}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Closest International / ASL Sign
                    </span>
                    <div className="p-2.5 rounded-lg bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200/90 leading-relaxed">
                      {selectedConsonant.aslEquivalent}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
                    💡 <strong>Fidel Signing Rule</strong>: In Ethiopian Sign Language, the handshape represents the consonant sound, while the directional movement represents the vowel order!
                  </div>

                  <button
                    onClick={onStartCamera}
                    className="w-full px-3 py-2 rounded-lg bg-[#22D3EE] hover:bg-[#06b6d4] text-[#080D18] font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md mt-auto"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Practice "{selectedConsonant.fidel}" in Camera</span>
                  </button>
                </>
              ) : null}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 3: 7 VOWEL MOTION RULES                                       */}
        {/* ================================================================= */}
        {activeTab === 'vowels' && (
          <div className="h-full flex flex-col bg-[#0A1220] rounded-xl border border-slate-800/80 p-3 overflow-y-auto text-left space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="text-[#22D3EE]">The 7 Vowel Movement Directions</span> (PDF Pages 58-60)
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  All 7 orders of Ethiopian vowels are signed by executing specific spatial motions with the consonant handshape.
                </p>
              </div>

              <button
                onClick={onStartCamera}
                className="px-3 py-1.5 rounded-lg bg-[#22D3EE] text-[#080D18] font-bold text-xs flex items-center gap-1.5 cursor-pointer hover:bg-[#06b6d4] shrink-0"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Test in Camera</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {ETHSL_VOWEL_RULES.map((vowel) => (
                <div
                  key={vowel.order}
                  className="p-3 rounded-lg bg-[#0E1A2C] border border-slate-800 hover:border-slate-700 flex flex-col justify-between space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-[#22D3EE]/15 text-[#22D3EE] font-mono text-[11px] font-bold">
                      Order {vowel.order}
                    </span>
                    <span className="text-lg font-serif font-bold text-white">{vowel.sampleFidel}</span>
                  </div>

                  <div>
                    <strong className="text-xs text-white block">{vowel.vowelSound}</strong>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      👉 <strong>Motion:</strong> {vowel.motionDescription}
                    </p>
                  </div>

                  <div className="text-[11px] text-amber-300/80 bg-amber-950/20 px-2 py-1 rounded border border-amber-900/30">
                    ASL Equivalent: {vowel.aslComparison}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 4: SIGNER NOTES & CULTURE                                     */}
        {/* ================================================================= */}
        {activeTab === 'culture' && (
          <div className="h-full flex flex-col bg-[#0A1220] rounded-xl border border-slate-800/80 p-4 overflow-y-auto text-left space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>Linguistic Guidelines & Rules from the Ethiopian Sign Language Guide</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-[#0E1A2C] border border-slate-800 space-y-1.5">
                <span className="font-bold text-[#22D3EE] flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" /> Dominant vs Non-Dominant Hand Rule
                </span>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  Unless otherwise stated in the sheet, <strong>"right hand"</strong> can be interchangeably used for <strong>"dominant hand"</strong>. Left-handed signers can mirror all single-hand signs naturally.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#0E1A2C] border border-slate-800 space-y-1.5">
                <span className="font-bold text-[#22D3EE] flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" /> Compound 2-Hand Phrases
                </span>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  Phrases such as <em>"Enquan dehena metachu" (Welcome)</em> and <em>"Chigir yelem" (No worries)</em> are multi-step compound signs combining facial touch, chest motion, and simultaneous dual-hand shapes.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#0E1A2C] border border-slate-800 space-y-1.5">
                <span className="font-bold text-[#22D3EE] flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" /> Respectful Body Posture
                </span>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  When signing <em>"Ameseginalehu" (Thank you)</em> in EthSL, it is customary to bend slightly forward as your flat right hand moves from your chin out toward your resting left hand.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#0E1A2C] border border-slate-800 space-y-1.5">
                <span className="font-bold text-[#22D3EE] flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" /> Video Reference
                </span>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  To watch real-world video demonstrations of every single sign in this curriculum, visit the verified source video at{' '}
                  <a
                    href="https://youtu.be/c636uSx0o7g"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#22D3EE] underline hover:text-white"
                  >
                    https://youtu.be/c636uSx0o7g
                  </a>.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={onStartCamera}
                className="w-full px-4 py-2.5 rounded-lg bg-[#22D3EE] hover:bg-[#06b6d4] text-[#080D18] font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md"
              >
                <Video className="w-4 h-4" />
                <span>Launch Camera Vision Now</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
