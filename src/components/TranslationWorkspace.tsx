import React, { useState } from 'react';
import { 
  Languages, 
  ArrowLeftRight, 
  Volume2, 
  Copy, 
  Check, 
  RefreshCw, 
  Sparkles, 
  AlertCircle
} from 'lucide-react';
import { translationService } from '../services/translationService';
import { TranslateResponse } from '../types';
import { speechService } from '../services/speechService';
import { useCommunication } from '../context/CommunicationContext';

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', script: 'Latin' },
  { code: 'am', name: 'Amharic (አማርኛ)', script: 'Ge\'ez' },
  { code: 'om', name: 'Afaan Oromoo', script: 'Qubee' },
  { code: 'ti', name: 'Tigrinya (ትግርኛ)', script: 'Ge\'ez' },
  { code: 'fr', name: 'French (Français)', script: 'Latin' },
  { code: 'ar', name: 'Arabic (العربية)', script: 'Arabic' },
  { code: 'es', name: 'Spanish (Español)', script: 'Latin' },
  { code: 'sw', name: 'Swahili (Kiswahili)', script: 'Latin' },
];

const PRESET_PHRASES = [
  { text: 'Hello, how can I assist you today?', lang: 'en' },
  { text: 'እንደምን አደሩ! ዛሬ እንዴት ልርዳዎት?', lang: 'am' },
  { text: 'Nagaatti, akkam jirta?', lang: 'om' },
  { text: 'Where is the nearest hospital or clinic?', lang: 'en' },
  { text: 'እባክዎ ንጹህ የመጠጥ ውሃ ማግኘት እችላለሁ?', lang: 'am' },
  { text: 'Peace and unity to all students and teachers.', lang: 'en' },
];

export const TranslationWorkspace: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('am');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TranslateResponse | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { setCommunicationState } = useCommunication();

  const handleTranslate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    setIsLoading(true);
    setError(null);
    setCommunicationState('translating');

    try {
      const data = await translationService.translate({
        text: inputText.trim(),
        sourceLang,
        targetLang,
      });
      setResult(data);
      setCommunicationState('success');
    } catch (err: any) {
      console.error('Translation error:', err);
      setError(err.message || 'Translation failed. Please check your network.');
      setCommunicationState('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwapLanguages = () => {
    const prevSource = sourceLang;
    const prevTarget = targetLang;
    setSourceLang(prevTarget);
    setTargetLang(prevSource);
    if (result) {
      setInputText(result.translatedText);
      setResult(null);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleSpeak = (text: string, langCode: string) => {
    const bcp47 = langCode === 'am' ? 'am-ET' : langCode === 'fr' ? 'fr-FR' : langCode === 'ar' ? 'ar-SA' : langCode === 'es' ? 'es-ES' : 'en-US';
    speechService.speakCustomText(
      text,
      bcp47,
      0.9,
      () => {
        setIsSpeaking(true);
        setCommunicationState('speaking');
      },
      () => {
        setIsSpeaking(false);
        setCommunicationState('idle');
      },
      () => {
        setIsSpeaking(false);
        setCommunicationState('idle');
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Workspace Header Panel */}
      <div className="p-6 rounded-[18px] bg-white dark:bg-[#0D1422] border border-slate-200 dark:border-[rgba(148,163,184,0.12)] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-[10px] bg-[#22D3EE]/10 text-[#22D3EE] flex items-center justify-center shrink-0">
            <Languages className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-[#F8FAFC]">
                Universal Text & Speech Translation
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-[#8493A8] mt-0.5">
              High-accuracy translation between Ethiopian languages (Amharic Ge'ez, Afaan Oromoo, Tigrinya) and world languages with phonetic transcription.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-[#8493A8]">
          <span className="font-mono text-[#22D3EE]">Gemini 3.8 Flash</span>
          <span aria-hidden="true">·</span>
          <span>Neural Engine</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Source Language Column */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-6 rounded-[18px] bg-white dark:bg-[#121C2D] border border-slate-200 dark:border-[rgba(148,163,184,0.12)] shadow-sm space-y-4">
            
            {/* Language Selection Header with Swap */}
            <div className="flex items-end justify-between gap-3 pb-3 border-b border-slate-200 dark:border-[rgba(148,163,184,0.12)]">
              <div className="flex-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-[#B6C2D2] block mb-1.5">Source Language</label>
                <select
                  value={sourceLang}
                  onChange={(e) => setSourceLang(e.target.value)}
                  className="w-full min-h-[44px] bg-slate-50 dark:bg-[#080D18] border border-slate-200 dark:border-[rgba(148,163,184,0.15)] rounded-[10px] px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#22D3EE]/30 focus:border-[#22D3EE]"
                >
                  <option value="auto">Auto-Detect</option>
                  {SUPPORTED_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleSwapLanguages}
                className="w-11 h-11 rounded-[10px] bg-slate-100 dark:bg-[#19263A] hover:bg-slate-200 dark:hover:bg-[#1E2E44] text-slate-700 dark:text-[#B6C2D2] border border-slate-200 dark:border-[rgba(148,163,184,0.15)] flex items-center justify-center transition-colors cursor-pointer shrink-0"
                title="Swap source and target languages"
                aria-label="Swap languages"
              >
                <ArrowLeftRight className="w-4 h-4" />
              </button>

              <div className="flex-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-[#B6C2D2] block mb-1.5">Target Language</label>
                <select
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  className="w-full min-h-[44px] bg-slate-50 dark:bg-[#080D18] border border-slate-200 dark:border-[rgba(148,163,184,0.15)] rounded-[10px] px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#22D3EE]/30 focus:border-[#22D3EE]"
                >
                  {SUPPORTED_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Input Textarea */}
            <div>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                rows={6}
                placeholder="Type or paste text here to translate..."
                className="w-full bg-slate-50 dark:bg-[#080D18] border border-slate-200 dark:border-[rgba(148,163,184,0.15)] rounded-[10px] p-4 text-sm text-slate-900 dark:text-[#F8FAFC] focus:ring-2 focus:ring-[#22D3EE]/30 focus:border-[#22D3EE] focus:outline-none resize-none leading-relaxed placeholder:text-[#8493A8]"
              />
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-[#8493A8] px-1 pt-1.5">
                <span className="font-mono tabular-nums">{inputText.length} / 5,000 characters</span>
                {inputText && (
                  <button
                    onClick={() => handleSpeak(inputText, sourceLang)}
                    className="flex items-center gap-1 hover:text-[#22D3EE] text-slate-600 dark:text-[#B6C2D2] transition-colors cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" /> Speak Input
                  </button>
                )}
              </div>
            </div>

            {error && (
              <div className="p-3.5 rounded-[10px] bg-red-500/10 border border-red-500/20 text-[#F87171] text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => {
                  setInputText('');
                  setResult(null);
                  setError(null);
                }}
                disabled={!inputText}
                className="h-10 px-4 rounded-[10px] text-xs font-medium text-slate-500 dark:text-[#8493A8] hover:text-slate-900 dark:hover:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#19263A] transition-colors disabled:opacity-40 cursor-pointer"
              >
                Clear
              </button>

              <button
                type="button"
                onClick={() => handleTranslate()}
                disabled={isLoading || !inputText.trim()}
                className="h-10 px-5 rounded-[10px] bg-[#22D3EE] hover:bg-[#2DD4BF] text-[#080D18] font-semibold text-xs sm:text-sm flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Translating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Translate Now</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="p-5 rounded-[18px] bg-white dark:bg-[#121C2D] border border-slate-200 dark:border-[rgba(148,163,184,0.12)] space-y-2.5">
            <span className="text-xs font-semibold text-slate-700 dark:text-[#B6C2D2] block">
              Common Ethiopian Expressions:
            </span>
            <div className="flex flex-wrap gap-2">
              {PRESET_PHRASES.map((phrase, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInputText(phrase.text);
                    setResult(null);
                  }}
                  className="px-3 py-1.5 rounded-[8px] bg-slate-50 dark:bg-[#0D1422] hover:bg-[#22D3EE]/10 border border-slate-200 dark:border-[rgba(148,163,184,0.12)] text-xs text-slate-700 dark:text-[#B6C2D2] hover:text-[#22D3EE] transition-colors cursor-pointer"
                >
                  {phrase.text}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Translation Output Column */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-6 rounded-[18px] bg-white dark:bg-[#121C2D] border border-slate-200 dark:border-[rgba(148,163,184,0.12)] shadow-sm space-y-4 min-h-[360px] flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-[rgba(148,163,184,0.12)] pb-3">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${result ? 'bg-[#34D399]' : 'bg-slate-400 dark:bg-[#64748B]'}`} />
                  <span className="text-xs font-semibold text-slate-900 dark:text-[#F8FAFC]">
                    Translation Output
                  </span>
                </div>
                {result?.detectedSourceLang && (
                  <span className="text-xs text-slate-500 dark:text-[#8493A8]">
                    Detected: {result.detectedSourceLang}
                  </span>
                )}
              </div>

              {result ? (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Translated Text Container */}
                  <div className="p-5 rounded-[14px] bg-slate-50 dark:bg-[#0D1422] border border-slate-200 dark:border-[rgba(148,163,184,0.12)] space-y-3">
                    <p className="text-base sm:text-lg font-medium text-slate-900 dark:text-[#F8FAFC] leading-relaxed">
                      {result.translatedText}
                    </p>

                    {result.phoneticPronunciation && (
                      <div className="p-3 rounded-[10px] bg-white dark:bg-[#121C2D] border border-slate-200 dark:border-[rgba(148,163,184,0.12)]">
                        <span className="text-[11px] text-slate-500 dark:text-[#8493A8] font-semibold block mb-0.5">
                          Phonetic Pronunciation:
                        </span>
                        <p className="text-xs font-mono text-[#22D3EE]">
                          {result.phoneticPronunciation}
                        </p>
                      </div>
                    )}

                    {result.notes && (
                      <p className="text-xs text-slate-500 dark:text-[#8493A8] italic">
                        "{result.notes}"
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-16 text-center text-slate-400 dark:text-[#8493A8] space-y-3">
                  <Languages className="w-10 h-10 mx-auto opacity-30" />
                  <p className="text-xs font-medium">Your translated text will appear here.</p>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            {result && (
              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-[rgba(148,163,184,0.12)]">
                <button
                  onClick={() => handleSpeak(result.translatedText, targetLang)}
                  className="h-10 px-4 rounded-[10px] bg-slate-100 dark:bg-[#19263A] hover:bg-slate-200 dark:hover:bg-[#1E2E44] text-[#22D3EE] text-xs font-medium border border-slate-200 dark:border-[rgba(148,163,184,0.15)] flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>{isSpeaking ? 'Speaking...' : 'Listen to Audio'}</span>
                </button>

                <button
                  onClick={() => handleCopy(result.translatedText)}
                  className="h-10 px-4 rounded-[10px] bg-slate-100 dark:bg-[#19263A] hover:bg-slate-200 dark:hover:bg-[#1E2E44] text-slate-800 dark:text-[#F8FAFC] text-xs font-medium border border-slate-200 dark:border-[rgba(148,163,184,0.15)] flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {isCopied ? <Check className="w-4 h-4 text-[#34D399]" /> : <Copy className="w-4 h-4" />}
                  <span>{isCopied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
