import React, { useState, useEffect, useRef } from 'react';
import {
  Captions,
  Mic,
  MicOff,
  Copy,
  Trash2,
  Check,
  Contrast,
  Upload,
  Globe,
  Radio,
} from 'lucide-react';
import { geminiVoiceRecorder, transcribeAudioBlob, TranscriptionResult } from '../services/transcribeService';
import { useCommunication } from '../context/CommunicationContext';
import {
  Alert,
  Button,
  Card,
  EmptyState,
  PermissionDeniedState,
  StatusBadge,
  WorkspaceHeader,
  useToast,
} from './ui';

export const CaptionsWorkspace: React.FC = () => {
  const { showToast } = useToast();
  const [isListening, setIsListening] = useState(false);
  const [liveInterim, setLiveInterim] = useState('');
  const [captionHistory, setCaptionHistory] = useState<string[]>([
    'Welcome to EjjiLink Live Speech Captions.',
    'Speak into your microphone in English or Amharic for real-time live captions.',
  ]);
  const [audioLevel, setAudioLevel] = useState(0);
  const [textSize, setTextSize] = useState<'normal' | 'large' | 'xlarge'>('large');
  const [highContrast, setHighContrast] = useState(false);
  const [dyslexicFont, setDyslexicFont] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<string>('Ready to listen.');
  const [selectedLanguage, setSelectedLanguage] = useState<'en-US' | 'am-ET'>('en-US');
  const [enginePreference, setEnginePreference] = useState<'auto' | 'web-speech' | 'gemini-cloud'>('auto');
  const [activeEngineName, setActiveEngineName] = useState<string>('Web Speech (Zero Quota)');
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (geminiVoiceRecorder.isRunning()) {
        geminiVoiceRecorder.stop();
      }
    };
  }, []);

  const handleLanguageChange = (lang: 'en-US' | 'am-ET') => {
    setSelectedLanguage(lang);
    geminiVoiceRecorder.setLanguage(lang);
  };

  const handleEngineChange = (mode: 'auto' | 'web-speech' | 'gemini-cloud') => {
    setEnginePreference(mode);
    geminiVoiceRecorder.setEnginePreference(mode);
    if (mode === 'web-speech') {
      setActiveEngineName('Web Speech API (Zero-Quota)');
    } else if (mode === 'gemini-cloud') {
      setActiveEngineName('Gemini Cloud Transcribe');
    } else {
      setActiveEngineName('Auto-Hybrid (Web Speech + Gemini)');
    }
  };

  const { setCommunicationState, setAudioLevel: setGlobalAudioLevel } = useCommunication();

  const handleToggleListening = async () => {
    setErrorMessage(null);
    if (isListening) {
      await geminiVoiceRecorder.stop();
      setIsListening(false);
      setAudioLevel(0);
      setGlobalAudioLevel(0);
      setLiveInterim('');
      setStatusNotice('Captions stopped.');
      setCommunicationState('idle');
    } else {
      geminiVoiceRecorder.setEnginePreference(enginePreference);
      geminiVoiceRecorder.setLanguage(selectedLanguage);

      try {
        await geminiVoiceRecorder.start(
          true,
          (result: TranscriptionResult) => {
            if (result.isInterim) {
              setLiveInterim(result.text);
            } else {
              const clean = result.text.trim();
              if (clean) {
                setCaptionHistory((prev) => [...prev, clean]);
                setLiveInterim('');
              }
            }
            if (result.source === 'web-speech-native') {
              setActiveEngineName('Web Speech (Zero-Quota)');
            } else if (result.source === 'gemini-3.8-flash') {
              setActiveEngineName('Gemini 3.8 Flash (High-Capacity)');
            } else {
              setActiveEngineName('Gemini 3.5 Transcribe');
            }
          },
          (volume) => {
            setAudioLevel(volume);
            setGlobalAudioLevel(volume);
          },
          (status) => {
            setStatusNotice(status);
          }
        );
        setIsListening(true);
        setStatusNotice('Listening active... Speak clearly.');
        setCommunicationState('listening');
      } catch (err: any) {
        console.error('Failed to start microphone:', err);
        setErrorMessage(err.message || 'Microphone access denied or unavailable.');
        setIsListening(false);
        setCommunicationState('error');
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMessage(null);
    setStatusNotice(`Uploading & transcribing ${file.name} with Gemini...`);

    try {
      const result = await transcribeAudioBlob(file);
      if (result.text && result.text.trim()) {
        const text = result.text.trim();
        setCaptionHistory((prev) => [
          ...prev,
          `[Audio File: ${file.name}]: ${text}`
        ]);
        setStatusNotice(`Audio file transcribed successfully using ${result.modelUsed}.`);
      } else {
        setStatusNotice('Audio file transcribed (empty or silent audio).');
      }
    } catch (err: any) {
      console.error('File transcription error:', err);
      setErrorMessage(err.message || 'Failed to transcribe audio file.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCopyTranscript = () => {
    const fullText = captionHistory.join('\n');
    navigator.clipboard.writeText(fullText);
    setIsCopied(true);
    showToast('Captions copied to clipboard', 'success');
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleClear = () => {
    setCaptionHistory([]);
    setLiveInterim('');
    showToast('Caption board cleared', 'info');
  };

  const getTextClass = () => {
    if (textSize === 'xlarge') return 'text-2xl sm:text-3xl leading-relaxed';
    if (textSize === 'large') return 'text-xl sm:text-2xl leading-relaxed';
    return 'text-base sm:text-lg leading-relaxed';
  };

  return (
    <div className="space-y-5">
      <WorkspaceHeader
        title="Live Speech Captions & Transcribe"
        description="Continuous live speech-to-text captions via Web Speech API with Gemini cloud audio file transcription."
        icon={<Captions className="w-5 h-5" />}
        accent="violet"
        meta={
          isListening ? (
            <StatusBadge tone="error">
              <span className="font-mono tabular-nums">Mic Active · {audioLevel}%</span>
            </StatusBadge>
          ) : (
            <StatusBadge tone="neutral">{activeEngineName}</StatusBadge>
          )
        }
        actions={
          <>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="audio/*,.mp3,.wav,.webm,.m4a,.ogg"
              className="hidden"
              aria-label="Upload audio file for transcription"
            />

            <Button
              variant="secondary"
              size="md"
              onClick={() => fileInputRef.current?.click()}
              isLoading={isUploading}
              leftIcon={<Upload className="w-4 h-4 text-[#0E7490] dark:text-[#43D9E9]" />}
              title="Upload audio file for transcription"
            >
              {isUploading ? 'Transcribing...' : 'Upload Audio'}
            </Button>

            <Button
              variant={isListening ? 'danger' : 'primary'}
              size="md"
              onClick={handleToggleListening}
              leftIcon={isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            >
              {isListening ? 'Stop Captions' : 'Start Captions'}
            </Button>
          </>
        }
      />

      {/* Control Bar: Language and Engine */}
      <Card padding="sm" className="flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-[#F4F7FB]">
            <Globe className="w-4 h-4 text-[#0E7490] dark:text-[#43D9E9]" aria-hidden="true" />
            <span>Language:</span>
            <div className="flex bg-slate-100 dark:bg-[#172438] rounded-[10px] p-1 border border-slate-200 dark:border-[#253448]">
              <button
                type="button"
                onClick={() => handleLanguageChange('en-US')}
                aria-pressed={selectedLanguage === 'en-US'}
                className={`min-h-[40px] sm:min-h-0 px-3 py-1.5 rounded-[7px] text-xs font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9] ${
                  selectedLanguage === 'en-US'
                    ? 'bg-[#0E7490] dark:bg-[#43D9E9] text-white dark:text-[#080D18] font-semibold'
                    : 'text-slate-600 dark:text-[#A0AEC0] hover:text-slate-900 dark:hover:text-[#F4F7FB]'
                }`}
              >
                English (US)
              </button>
              <button
                type="button"
                onClick={() => handleLanguageChange('am-ET')}
                aria-pressed={selectedLanguage === 'am-ET'}
                className={`min-h-[40px] sm:min-h-0 px-3 py-1.5 rounded-[7px] text-xs font-medium cursor-pointer transition-colors font-ethiopic focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9] ${
                  selectedLanguage === 'am-ET'
                    ? 'bg-[#0E7490] dark:bg-[#43D9E9] text-white dark:text-[#080D18] font-semibold'
                    : 'text-slate-600 dark:text-[#A0AEC0] hover:text-slate-900 dark:hover:text-[#F4F7FB]'
                }`}
              >
                አማርኛ (Amharic)
              </button>
            </div>
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-[#253448] hidden sm:block" />

          <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-[#F4F7FB]">
            <Radio className="w-4 h-4 text-[#4F46E5] dark:text-[#8585FF]" aria-hidden="true" />
            <span>Engine:</span>
            <div className="flex flex-wrap bg-slate-100 dark:bg-[#172438] rounded-[10px] p-1 border border-slate-200 dark:border-[#253448]">
              {[
                { id: 'auto' as const, label: 'Auto (Hybrid)' },
                { id: 'web-speech' as const, label: 'Web Speech' },
                { id: 'gemini-cloud' as const, label: 'Gemini Cloud' },
              ].map((eng) => (
                <button
                  key={eng.id}
                  type="button"
                  onClick={() => handleEngineChange(eng.id)}
                  aria-pressed={enginePreference === eng.id}
                  className={`min-h-[40px] sm:min-h-0 px-2.5 py-1.5 rounded-[7px] text-xs cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9] ${
                    enginePreference === eng.id
                      ? 'bg-white dark:bg-[#101C2C] text-[#0E7490] dark:text-[#43D9E9] border border-slate-300/80 dark:border-[#43D9E9]/35 font-semibold shadow-xs'
                      : 'border border-transparent font-medium text-slate-600 dark:text-[#A0AEC0] hover:text-slate-900 dark:hover:text-[#F4F7FB]'
                  }`}
                >
                  {eng.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {errorMessage && (
        <PermissionDeniedState
          device="microphone"
          message={errorMessage}
          onRetry={handleToggleListening}
        />
      )}

      {statusNotice && !errorMessage && (
        <Alert variant="info">{statusNotice}</Alert>
      )}

      {/* Main Caption Board */}
      <div
        className={`p-6 sm:p-8 rounded-[16px] border space-y-6 min-h-[420px] flex flex-col justify-between transition-colors ${
          highContrast
            ? 'bg-black text-white border-yellow-400 font-bold'
            : 'bg-white dark:bg-[#101C2C] border-slate-200 dark:border-[#253448] text-slate-900 dark:text-[#F4F7FB]'
        } ${dyslexicFont ? 'tracking-wide font-mono' : ''}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-[#253448] pb-4">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-slate-600 dark:text-[#A0AEC0]">Display Size:</span>
            {(['normal', 'large', 'xlarge'] as const).map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setTextSize(size)}
                aria-pressed={textSize === size}
                className={`min-h-[42px] sm:min-h-[34px] px-3 py-1 rounded-[8px] text-xs font-semibold capitalize cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9] ${
                  textSize === size
                    ? 'bg-[#0E7490] dark:bg-[#43D9E9] text-white dark:text-[#080D18]'
                    : 'bg-slate-100 dark:bg-[#172438] text-slate-700 dark:text-[#A0AEC0]'
                }`}
              >
                {size}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setDyslexicFont(!dyslexicFont)}
              aria-pressed={dyslexicFont}
            >
              Mono / Dyslexic
            </Button>

            <button
              type="button"
              onClick={() => setHighContrast(!highContrast)}
              aria-pressed={highContrast}
              className={`min-h-[42px] sm:min-h-0 sm:h-9 px-3.5 rounded-[8px] text-xs font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9] ${
                highContrast
                  ? 'bg-yellow-400 text-black border-yellow-300 font-bold'
                  : 'bg-slate-100 dark:bg-[#172438] border-slate-200 dark:border-[#253448] text-slate-700 dark:text-[#F4F7FB]'
              }`}
            >
              <Contrast className="w-3.5 h-3.5" aria-hidden="true" />
              <span>High Contrast</span>
            </button>
          </div>
        </div>

        {/* Captions Stream Area */}
        <div
          role="log"
          aria-live="polite"
          className="flex-1 space-y-3 overflow-y-auto max-h-[380px] pr-1"
        >
          {captionHistory.length > 0 ? (
            captionHistory.map((line, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-[10px] transition-colors font-ethiopic ${getTextClass()} ${
                  idx === captionHistory.length - 1 && !liveInterim
                    ? highContrast
                      ? 'bg-yellow-400/20 border border-yellow-400 text-white'
                      : 'bg-cyan-50/70 dark:bg-[#43D9E9]/10 border border-cyan-200 dark:border-[#43D9E9]/25 font-medium text-slate-900 dark:text-[#F4F7FB]'
                    : highContrast
                    ? 'text-yellow-100'
                    : 'text-slate-700 dark:text-[#A0AEC0]'
                }`}
              >
                {line}
              </div>
            ))
          ) : (
            <EmptyState
              icon={<Captions className="w-5 h-5" />}
              title="No Captions Yet"
              description="Click Start Captions above or upload an audio recording to begin real-time speech transcription."
            />
          )}

          {liveInterim && (
            <div
              className={`p-3.5 rounded-[10px] bg-cyan-50 dark:bg-[#43D9E9]/15 border border-cyan-300 dark:border-[#43D9E9]/40 text-slate-900 dark:text-[#43D9E9] italic font-ethiopic ${getTextClass()}`}
            >
              {liveInterim}
            </div>
          )}
        </div>

        {/* Bottom Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-[#253448] text-xs">
          <span className={`font-mono tabular-nums ${highContrast ? 'text-yellow-200' : 'text-slate-600 dark:text-[#A0AEC0]'}`}>
            {captionHistory.length} segments transcribed
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleClear}
              disabled={captionHistory.length === 0}
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Clear
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleCopyTranscript}
              disabled={captionHistory.length === 0}
              leftIcon={isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            >
              {isCopied ? 'Copied' : 'Copy All'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
