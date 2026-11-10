import React, { useState, useEffect, useRef } from 'react';
import { 
  Captions, 
  Mic, 
  MicOff, 
  Copy, 
  Trash2, 
  Check, 
  Contrast, 
  AlertCircle, 
  Upload,
  Globe,
  Radio
} from 'lucide-react';
import { geminiVoiceRecorder, transcribeAudioBlob, TranscriptionResult } from '../services/transcribeService';
import { useCommunication } from '../context/CommunicationContext';

export const CaptionsWorkspace: React.FC = () => {
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
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleClear = () => {
    setCaptionHistory([]);
    setLiveInterim('');
  };

  const getTextClass = () => {
    if (textSize === 'xlarge') return 'text-2xl sm:text-3xl leading-relaxed';
    if (textSize === 'large') return 'text-xl sm:text-2xl leading-relaxed';
    return 'text-base sm:text-lg leading-relaxed';
  };

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="p-6 rounded-[18px] bg-white dark:bg-[#0D1422] border border-slate-200 dark:border-[rgba(148,163,184,0.12)] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-[10px] bg-[#60A5FA]/10 text-[#60A5FA] flex items-center justify-center shrink-0">
            <Captions className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-[#F8FAFC]">
                Live Speech Captions & Transcribe
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-[#8493A8] mt-0.5">
              Continuous live speech-to-text captions via browser Web Speech API, with Gemini cloud audio file transcription.
            </p>
          </div>
        </div>

        {/* Live Controls */}
        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          {isListening && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-[10px] bg-red-500/10 border border-red-500/20 text-[#F87171] text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-[#F87171]" />
              <span className="font-mono tabular-nums">Mic Level: {audioLevel}%</span>
            </div>
          )}

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="audio/*,.mp3,.wav,.webm,.m4a,.ogg"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="h-10 px-4 rounded-[10px] bg-slate-100 dark:bg-[#19263A] hover:bg-slate-200 dark:hover:bg-[#1E2E44] text-slate-800 dark:text-[#F8FAFC] border border-slate-200 dark:border-[rgba(148,163,184,0.15)] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
            title="Upload audio file for transcription"
          >
            <Upload className="w-3.5 h-3.5 text-[#22D3EE]" />
            <span>{isUploading ? 'Transcribing...' : 'Upload Audio'}</span>
          </button>

          <button
            onClick={handleToggleListening}
            className={`h-10 px-5 rounded-[10px] text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-xs ${
              isListening
                ? 'bg-red-500/10 hover:bg-red-500/20 text-[#F87171] border border-red-500/30'
                : 'bg-[#22D3EE] hover:bg-[#2DD4BF] text-[#080D18]'
            }`}
          >
            {isListening ? (
              <>
                <MicOff className="w-4 h-4" /> Stop Captions
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" /> Start Captions
              </>
            )}
          </button>
        </div>
      </div>

      {/* Control Bar: Language, Engine, and Status */}
      <div className="p-4 rounded-[14px] bg-white dark:bg-[#121C2D] border border-slate-200 dark:border-[rgba(148,163,184,0.12)] flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-[#B6C2D2]">
            <Globe className="w-3.5 h-3.5 text-[#22D3EE]" />
            <span>Language:</span>
            <div className="flex bg-slate-100 dark:bg-[#0D1422] rounded-[8px] p-0.5 border border-slate-200 dark:border-[rgba(148,163,184,0.12)]">
              <button
                onClick={() => handleLanguageChange('en-US')}
                className={`px-2.5 py-1 rounded-[6px] text-xs font-medium cursor-pointer transition-colors ${
                  selectedLanguage === 'en-US'
                    ? 'bg-[#22D3EE] text-[#080D18] font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-[#B6C2D2] hover:text-slate-900 dark:hover:text-[#F8FAFC]'
                }`}
              >
                English (US)
              </button>
              <button
                onClick={() => handleLanguageChange('am-ET')}
                className={`px-2.5 py-1 rounded-[6px] text-xs font-medium cursor-pointer transition-colors ${
                  selectedLanguage === 'am-ET'
                    ? 'bg-[#22D3EE] text-[#080D18] font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-[#B6C2D2] hover:text-slate-900 dark:hover:text-[#F8FAFC]'
                }`}
              >
                አማርኛ (Amharic)
              </button>
            </div>
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-[#19263A] hidden sm:block" />

          <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-[#B6C2D2]">
            <Radio className="w-3.5 h-3.5 text-[#60A5FA]" />
            <span>Engine:</span>
            <div className="flex bg-slate-100 dark:bg-[#0D1422] rounded-[8px] p-0.5 border border-slate-200 dark:border-[rgba(148,163,184,0.12)]">
              <button
                onClick={() => handleEngineChange('auto')}
                className={`px-2.5 py-1 rounded-[6px] text-xs font-medium cursor-pointer transition-colors ${
                  enginePreference === 'auto'
                    ? 'bg-slate-200 dark:bg-[#19263A] text-slate-900 dark:text-[#F8FAFC] shadow-xs'
                    : 'text-slate-600 dark:text-[#B6C2D2] hover:text-slate-900 dark:hover:text-[#F8FAFC]'
                }`}
                title="Continuous Web Speech with Gemini audio upload support"
              >
                Auto (Hybrid)
              </button>
              <button
                onClick={() => handleEngineChange('web-speech')}
                className={`px-2.5 py-1 rounded-[6px] text-xs font-medium cursor-pointer transition-colors ${
                  enginePreference === 'web-speech'
                    ? 'bg-slate-200 dark:bg-[#19263A] text-slate-900 dark:text-[#F8FAFC] shadow-xs'
                    : 'text-slate-600 dark:text-[#B6C2D2] hover:text-slate-900 dark:hover:text-[#F8FAFC]'
                }`}
                title="Browser Web Speech API"
              >
                Web Speech
              </button>
              <button
                onClick={() => handleEngineChange('gemini-cloud')}
                className={`px-2.5 py-1 rounded-[6px] text-xs font-medium cursor-pointer transition-colors ${
                  enginePreference === 'gemini-cloud'
                    ? 'bg-slate-200 dark:bg-[#19263A] text-slate-900 dark:text-[#F8FAFC] shadow-xs'
                    : 'text-slate-600 dark:text-[#B6C2D2] hover:text-slate-900 dark:hover:text-[#F8FAFC]'
                }`}
                title="Gemini 3.5 Transcribe Cloud Backend"
              >
                Gemini Cloud
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-500 dark:text-[#8493A8]">
          <span className="w-2 h-2 rounded-full bg-[#34D399]" />
          <span>Active: <strong className="text-slate-700 dark:text-[#B6C2D2]">{activeEngineName}</strong></span>
        </div>
      </div>

      {statusNotice && (
        <div className="px-4 py-2 rounded-[10px] bg-slate-100 dark:bg-[#121C2D] border border-slate-200 dark:border-[rgba(148,163,184,0.12)] text-slate-700 dark:text-[#B6C2D2] text-xs flex items-center justify-between">
          <span>{statusNotice}</span>
          <span className="text-[11px] text-slate-400 dark:text-[#8493A8] font-mono">Status</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-[10px] bg-red-500/10 border border-red-500/20 text-[#F87171] text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Caption Board */}
      <div
        className={`p-6 sm:p-8 rounded-[18px] border shadow-sm space-y-6 min-h-[420px] flex flex-col justify-between transition-all ${
          highContrast
            ? 'bg-black text-white border-yellow-400 font-bold'
            : 'bg-white dark:bg-[#121C2D] border-slate-200 dark:border-[rgba(148,163,184,0.12)] text-slate-900 dark:text-[#F8FAFC]'
        } ${dyslexicFont ? 'tracking-wide font-mono' : ''}`}
      >
        {/* Top Accessibility Quick Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-[rgba(148,163,184,0.12)] pb-4">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-500 dark:text-[#8493A8]">
              Display Size:
            </span>
            {(['normal', 'large', 'xlarge'] as const).map((size) => (
              <button
                key={size}
                onClick={() => setTextSize(size)}
                className={`px-2.5 py-1 rounded-[6px] text-xs font-semibold capitalize cursor-pointer transition-colors ${
                  textSize === size
                    ? 'bg-[#22D3EE] text-[#080D18]'
                    : 'bg-slate-100 dark:bg-[#0D1422] text-slate-700 dark:text-[#B6C2D2]'
                }`}
              >
                {size}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setHighContrast(!highContrast)}
              className={`h-8 px-3 rounded-[8px] text-xs font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer ${
                highContrast
                  ? 'bg-yellow-400 text-black border-yellow-300 font-bold'
                  : 'bg-slate-100 dark:bg-[#0D1422] border-slate-200 dark:border-[rgba(148,163,184,0.15)] text-slate-700 dark:text-[#B6C2D2]'
              }`}
            >
              <Contrast className="w-3.5 h-3.5" />
              <span>High Contrast</span>
            </button>
          </div>
        </div>

        {/* Captions Stream Area */}
        <div className="flex-1 space-y-3 overflow-y-auto max-h-[380px] p-2">
          {captionHistory.length > 0 ? (
            captionHistory.map((line, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-[10px] transition-all ${getTextClass()} ${
                  idx === captionHistory.length - 1 && !liveInterim
                    ? 'bg-[#22D3EE]/10 border border-[#22D3EE]/20 font-medium text-slate-900 dark:text-[#F8FAFC]'
                    : 'text-slate-700 dark:text-[#B6C2D2]'
                }`}
              >
                {line}
              </div>
            ))
          ) : (
            <div className="py-16 text-center text-slate-400 dark:text-[#8493A8]">
              <Captions className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Click "Start Captions" above to begin real-time speech transcription.</p>
            </div>
          )}

          {/* Real-time Interim Streaming Transcript */}
          {liveInterim && (
            <div className={`p-3 rounded-[10px] bg-[#22D3EE]/15 border border-[#22D3EE]/40 text-slate-900 dark:text-[#22D3EE] italic ${getTextClass()}`}>
              {liveInterim}
            </div>
          )}
        </div>

        {/* Bottom Actions Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-[rgba(148,163,184,0.12)] text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#34D399]" />
            <span className="text-slate-500 dark:text-[#8493A8]">
              {captionHistory.length} segments transcribed
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClear}
              disabled={captionHistory.length === 0}
              className="h-8 px-3 rounded-[8px] bg-slate-100 hover:bg-slate-200 dark:bg-[#19263A] dark:hover:bg-[#1E2E44] text-slate-700 dark:text-[#B6C2D2] font-medium flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-40"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear
            </button>

            <button
              onClick={handleCopyTranscript}
              disabled={captionHistory.length === 0}
              className="h-8 px-4 rounded-[8px] bg-[#22D3EE] hover:bg-[#2DD4BF] text-[#080D18] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
            >
              {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopied ? 'Copied' : 'Copy All'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
