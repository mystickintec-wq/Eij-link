import React, { useState } from 'react';
import { 
  Languages, 
  ArrowLeftRight, 
  Volume2, 
  Copy, 
  Check, 
  RefreshCw, 
  Sparkles, 
  AlertCircle,
  BookmarkPlus
} from 'lucide-react';
import { translationService } from '../services/translationService';
import { TranslateResponse } from '../types';
import { speechService } from '../services/speechService';

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

  const handleTranslate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await translationService.translate({
        text: inputText.trim(),
        sourceLang,
        targetLang,
      });
      setResult(data);
    } catch (err: any) {
      console.error('Translation error:', err);
      setError(err.message || 'Translation failed. Please check your network.');
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
      () => setIsSpeaking(true),
      () => setIsSpeaking(false),
      () => setIsSpeaking(false)
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Workspace Header */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/15 border border-sky-500/30 text-sky-500 flex items-center justify-center shrink-0">
            <Languages className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold font-heading text-slate-900 dark:text-white">
                Universal Text & Speech Translation
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30">
                POST /api/translate
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              High-accuracy translation between Ethiopian languages (Amharic Ge'ez, Afaan Oromoo, Tigrinya) and world languages with phonetic transcription.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-700 dark:text-sky-300 text-xs font-semibold self-start md:self-auto">
          <span>Gemini 3.8 Flash • Neural Translation</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Source Language Column */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-lg space-y-4">
            
            {/* Language Selection Header with Swap */}
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-gray-200 dark:border-slate-800">
              <div className="flex-1">
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Source Language</label>
                <select
                  value={sourceLang}
                  onChange={(e) => setSourceLang(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
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
                className="mt-4 p-2.5 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                title="Swap languages"
              >
                <ArrowLeftRight className="w-4 h-4" />
              </button>

              <div className="flex-1">
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Target Language</label>
                <select
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
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
                className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none resize-none"
              />
              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-1">
                <span>{inputText.length} / 5,000 characters</span>
                {inputText && (
                  <button
                    onClick={() => handleSpeak(inputText, sourceLang)}
                    className="flex items-center gap-1 hover:text-sky-500 cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" /> Speak Input
                  </button>
                )}
              </div>
            </div>

            {error && (
              <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  setInputText('');
                  setResult(null);
                  setError(null);
                }}
                disabled={!inputText}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 cursor-pointer"
              >
                Clear
              </button>

              <button
                type="button"
                onClick={() => handleTranslate()}
                disabled={isLoading || !inputText.trim()}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all disabled:opacity-50 cursor-pointer"
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
          <div className="p-4 rounded-3xl bg-white/60 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-800/80 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block font-heading">
              Common Ethiopian Expressions:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_PHRASES.map((phrase, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInputText(phrase.text);
                    setResult(null);
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-gray-50 dark:bg-slate-950 hover:bg-sky-500/10 dark:hover:bg-sky-500/10 border border-gray-200 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300 font-medium transition-colors cursor-pointer"
                >
                  {phrase.text}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Translation Output Column */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xl space-y-4 min-h-[350px] flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${result ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                  <span className="text-xs font-bold font-heading text-slate-900 dark:text-white uppercase tracking-wider">
                    Translation Output
                  </span>
                </div>
                {result?.detectedSourceLang && (
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    Detected: {result.detectedSourceLang}
                  </span>
                )}
              </div>

              {result ? (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Translated Text Container */}
                  <div className="p-5 rounded-2xl bg-sky-500/5 dark:bg-slate-950 border border-sky-500/20 space-y-3">
                    <p className="text-base sm:text-lg font-medium text-slate-900 dark:text-white leading-relaxed">
                      {result.translatedText}
                    </p>

                    {result.phoneticPronunciation && (
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">
                          Phonetic Pronunciation:
                        </span>
                        <p className="text-xs font-mono text-sky-600 dark:text-sky-400">
                          {result.phoneticPronunciation}
                        </p>
                      </div>
                    )}

                    {result.notes && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                        "{result.notes}"
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center text-slate-400 space-y-2">
                  <Languages className="w-10 h-10 mx-auto opacity-30" />
                  <p className="text-xs font-medium">Your translated text will appear here.</p>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            {result && (
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-slate-800">
                <button
                  onClick={() => handleSpeak(result.translatedText, targetLang)}
                  className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-sky-600 dark:text-sky-400 text-xs font-semibold border border-gray-200 dark:border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>{isSpeaking ? 'Speaking...' : 'Listen in Target Audio'}</span>
                </button>

                <button
                  onClick={() => handleCopy(result.translatedText)}
                  className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-gray-200 dark:border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {isCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
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
