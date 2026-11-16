import React, { useState } from 'react';
import {
  Languages,
  ArrowLeftRight,
  Volume2,
  Copy,
  Check,
  Sparkles,
} from 'lucide-react';
import { translationService } from '../services/translationService';
import { TranslateResponse } from '../types';
import { speechService } from '../services/speechService';
import { useCommunication } from '../context/CommunicationContext';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  IconButton,
  LoadingState,
  SelectField,
  StatusBadge,
  TextArea,
  WorkspaceHeader,
  useToast,
} from './ui';

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
  const { showToast } = useToast();

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
    showToast('Translation copied to clipboard', 'success');
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
      <WorkspaceHeader
        title="Universal Text & Speech Translation"
        description="High-accuracy translation between Ethiopian languages (Amharic Ge'ez, Afaan Oromoo, Tigrinya) and world languages with phonetic pronunciation."
        icon={<Languages className="w-5 h-5" />}
        accent="cyan"
        meta={
          <StatusBadge tone="info">Amharic · English · Oromoo · Tigrinya</StatusBadge>
        }
      />

      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Source Language Column */}
        <div className="lg:col-span-6 space-y-4">
          <Card padding="md" className="space-y-4">
            <div className="flex items-end justify-between gap-2.5 pb-4 border-b border-slate-200 dark:border-[#253448]">
              <SelectField
                label="Source Language"
                containerClassName="flex-1"
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
              >
                <option value="auto">Auto-Detect</option>
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.name}
                  </option>
                ))}
              </SelectField>

              <IconButton
                variant="secondary"
                size="md"
                onClick={handleSwapLanguages}
                disabled={sourceLang === 'auto'}
                label="Swap source and target languages"
              >
                <ArrowLeftRight className="w-4 h-4" />
              </IconButton>

              <SelectField
                label="Target Language"
                containerClassName="flex-1"
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.name}
                  </option>
                ))}
              </SelectField>
            </div>

            <TextArea
              label="Source Text"
              headerRight={`${inputText.length} / 5,000 chars`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={6}
              placeholder="Type or paste text here to translate..."
              className="font-ethiopic"
            />

            {inputText && (
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSpeak(inputText, sourceLang)}
                  leftIcon={<Volume2 className="w-3.5 h-3.5" />}
                >
                  Speak Source Input
                </Button>
              </div>
            )}

            {error && (
              <ErrorState
                title="Translation failed"
                message={error}
                onRetry={() => handleTranslate()}
              />
            )}

            <div className="flex items-center justify-between pt-1">
              <Button
                variant="ghost"
                size="md"
                onClick={() => {
                  setInputText('');
                  setResult(null);
                  setError(null);
                }}
                disabled={!inputText}
              >
                Clear
              </Button>

              <Button
                variant="primary"
                size="md"
                onClick={() => handleTranslate()}
                isLoading={isLoading}
                disabled={!inputText.trim()}
                leftIcon={<Sparkles className="w-4 h-4" />}
              >
                {isLoading ? 'Translating...' : 'Translate Now'}
              </Button>
            </div>
          </Card>

          <Card padding="md" className="space-y-3">
            <span className="text-xs font-semibold text-slate-800 dark:text-[#F4F7FB] block">
              Common Ethiopian & Global Expressions
            </span>
            <div className="flex flex-wrap gap-2">
              {PRESET_PHRASES.map((phrase, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setInputText(phrase.text);
                    setResult(null);
                  }}
                  className="min-h-[36px] px-3 py-1.5 rounded-[8px] bg-slate-50 dark:bg-[#172438] hover:border-[#0E7490]/50 dark:hover:border-[#43D9E9]/50 border border-slate-200 dark:border-[#253448] text-xs text-slate-700 dark:text-[#F4F7FB] font-ethiopic transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9]"
                >
                  {phrase.text}
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Translation Output Column */}
        <div className="lg:col-span-6 space-y-4">
          {isLoading ? (
            <LoadingState
              title="Translating text..."
              description="Resolving meaning, Ge'ez script, and phonetic pronunciation."
              className="min-h-[360px]"
            />
          ) : (
            <Card padding="md" className="space-y-4 min-h-[360px] flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-[#253448] pb-3.5">
                  <StatusBadge tone={result ? 'success' : 'neutral'}>
                    Translation Output
                  </StatusBadge>
                  {result?.detectedSourceLang && (
                    <span className="text-xs font-mono text-slate-600 dark:text-[#A0AEC0]">
                      Detected: {result.detectedSourceLang}
                    </span>
                  )}
                </div>

                {result ? (
                  <div className="space-y-4">
                    <div className="p-5 rounded-[12px] bg-slate-50 dark:bg-[#172438] border border-slate-200 dark:border-[#253448] space-y-3">
                      <p className="text-base sm:text-lg font-medium text-slate-900 dark:text-[#F4F7FB] leading-relaxed font-ethiopic">
                        {result.translatedText}
                      </p>

                      {result.phoneticPronunciation && (
                        <div className="p-3 rounded-[10px] bg-white dark:bg-[#101C2C] border border-slate-200 dark:border-[#253448]">
                          <span className="text-[11px] text-slate-600 dark:text-[#A0AEC0] font-semibold block mb-0.5">
                            Phonetic Pronunciation
                          </span>
                          <p className="text-xs font-mono text-[#0E7490] dark:text-[#43D9E9]">
                            {result.phoneticPronunciation}
                          </p>
                        </div>
                      )}

                      {result.notes && (
                        <p className="text-xs text-slate-600 dark:text-[#A0AEC0] italic">
                          "{result.notes}"
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    icon={<Languages className="w-5 h-5" />}
                    title="Ready to Translate"
                    description="Enter text or choose a common expression on the left to translate with phonetic pronunciation and audio playback."
                    className="my-4"
                  />
                )}
              </div>

              {result && (
                <div className="flex items-center justify-between gap-2 pt-4 border-t border-slate-200 dark:border-[#253448]">
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => handleSpeak(result.translatedText, targetLang)}
                    leftIcon={<Volume2 className="w-4 h-4 text-[#0E7490] dark:text-[#43D9E9]" />}
                  >
                    {isSpeaking ? 'Speaking...' : 'Listen to Audio'}
                  </Button>

                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => handleCopy(result.translatedText)}
                    leftIcon={
                      isCopied ? (
                        <Check className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )
                    }
                  >
                    {isCopied ? 'Copied' : 'Copy Translation'}
                  </Button>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
