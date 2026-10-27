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
  Sparkles,
  Upload,
  Globe,
  Radio,
  FileAudio
} from 'lucide-react';
import { geminiVoiceRecorder, transcribeAudioBlob, TranscriptionResult } from '../services/transcribeService';

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

  const handleToggleListening = async () => {
    setErrorMessage(null);
    if (isListening) {
      await geminiVoiceRecorder.stop();
      setIsListening(false);
      setAudioLevel(0);
      setLiveInterim('');
      setStatusNotice('Captions stopped.');
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
          },
          (status) => {
            setStatusNotice(status);
          }
        );
        setIsListening(true);
        setStatusNotice('Listening active... Speak clearly.');
      } catch (err: any) {
        console.error('Failed to start microphone:', err);
        setErrorMessage(err.message || 'Microphone access denied or unavailable.');
        setIsListening(false);
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
          `[Audio File: ${file.name} via ${result.modelUsed}]: ${text}`
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
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Workspace Header */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-500 flex items-center justify-center shrink-0">
            <Captions className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold font-heading text-slate-900 dark:text-white">
                Live Speech Captions & Transcribe
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                Hybrid Zero-Quota Engine
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Continuous live captions powered by browser Web Speech API with seamless Gemini 3.5 / 3.8 Flash audio file transcription.
            </p>
          </div>
        </div>

        {/* Live Controls */}
        <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
          {isListening && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-600 dark:text-purple-300 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span>Mic Active • Level: {audioLevel}%</span>
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
            className="px-3.5 py-2.5 rounded-2xl border border-gray-300 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
            title="Upload audio file for Gemini cloud transcription"
          >
            <Upload className="w-3.5 h-3.5 text-purple-500" />
            <span>{isUploading ? 'Transcribing...' : 'Upload Audio'}</span>
          </button>

          <button
            onClick={handleToggleListening}
            className={`px-5 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer ${
              isListening
                ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse'
                : 'bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white'
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
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
            <Globe className="w-3.5 h-3.5 text-purple-500" />
            <span>Language:</span>
            <div className="flex bg-gray-100 dark:bg-slate-800 rounded-xl p-0.5">
              <button
                onClick={() => handleLanguageChange('en-US')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                  selectedLanguage === 'en-US'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                English (US)
              </button>
              <button
                onClick={() => handleLanguageChange('am-ET')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                  selectedLanguage === 'am-ET'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                አማርኛ (Amharic)
              </button>
            </div>
          </div>

          <div className="h-4 w-px bg-gray-200 dark:bg-slate-700 hidden sm:block" />

          <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
            <Radio className="w-3.5 h-3.5 text-purple-500" />
            <span>Engine:</span>
            <div className="flex bg-gray-100 dark:bg-slate-800 rounded-xl p-0.5">
              <button
                onClick={() => handleEngineChange('auto')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                  enginePreference === 'auto'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Continuous Web Speech with Gemini audio upload support"
              >
                Auto (Hybrid)
              </button>
              <button
                onClick={() => handleEngineChange('web-speech')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                  enginePreference === 'web-speech'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Browser Web Speech API (zero quota, real-time)"
              >
                Web Speech
              </button>
              <button
                onClick={() => handleEngineChange('gemini-cloud')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                  enginePreference === 'gemini-cloud'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Gemini 3.5 Transcribe / 3.8 Flash Cloud Backend"
              >
                Gemini Cloud
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="font-medium">Active: <span className="text-purple-600 dark:text-purple-400 font-bold">{activeEngineName}</span></span>
        </div>
      </div>

      {statusNotice && (
        <div className="px-4 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-700 dark:text-purple-300 text-xs flex items-center justify-between">
          <span>{statusNotice}</span>
          <span className="text-[10px] opacity-75 font-mono">Status</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Caption Board */}
      <div
        className={`p-6 sm:p-8 rounded-3xl border shadow-2xl space-y-6 min-h-[420px] flex flex-col justify-between transition-all ${
          highContrast
            ? 'bg-black text-white border-yellow-400 font-bold'
            : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-purple-500/30 text-slate-900 dark:text-slate-100'
        } ${dyslexicFont ? 'tracking-wide font-mono' : ''}`}
      >
        {/* Top Accessibility Quick Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px]">
              Display Size:
            </span>
            {(['normal', 'large', 'xlarge'] as const).map((size) => (
              <button
                key={size}
                onClick={() => setTextSize(size)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize cursor-pointer transition-colors ${
                  textSize === size
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {size}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setHighContrast(!highContrast)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer ${
                highContrast
                  ? 'bg-yellow-400 text-black border-yellow-300 font-bold'
                  : 'bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <Contrast className="w-3.5 h-3.5" />
              <span>High Contrast</span>
            </button>
          </div>
        </div>

        {/* Captions Stream Area */}
        <div className="flex-1 space-y-4 overflow-y-auto max-h-[380px] p-2">
          {captionHistory.length > 0 ? (
            captionHistory.map((line, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-2xl transition-all ${getTextClass()} ${
                  idx === captionHistory.length - 1 && !liveInterim
                    ? 'bg-purple-500/10 border border-purple-500/20 font-bold text-purple-700 dark:text-purple-300'
                    : 'text-slate-700 dark:text-slate-300 opacity-80'
                }`}
              >
                {line}
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-slate-400">
              <Captions className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Click "Start Captions" above to begin real-time speech transcription.</p>
            </div>
          )}

          {/* Real-time Interim Streaming Transcript */}
          {liveInterim && (
            <div className={`p-3 rounded-2xl bg-purple-500/15 border border-purple-500/40 text-purple-800 dark:text-purple-200 italic animate-pulse ${getTextClass()}`}>
              {liveInterim}
              <span className="inline-block w-2 h-4 ml-1 bg-purple-500 animate-ping" />
            </div>
          )}
        </div>

        {/* Bottom Actions Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              {captionHistory.length} segments transcribed
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClear}
              disabled={captionHistory.length === 0}
              className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-40"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear
            </button>

            <button
              onClick={handleCopyTranscript}
              disabled={captionHistory.length === 0}
              className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer disabled:opacity-40"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopied ? 'Copied Transcript' : 'Copy All'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
