import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Loader2,
  Mic,
  MicOff,
  RotateCcw,
  ShieldAlert,
  VolumeX,
} from 'lucide-react';
import { AppLanguage } from '../config/navigation';
import { useCommunication } from '../context/CommunicationContext';
import {
  voiceNavigationService,
  VoiceCommandResult,
  VoiceNavStatus,
} from '../services/voiceNavigationService';
import { Button, IconButton, Modal, StatusBadge } from './ui';

interface VoiceAccessibilityBarProps {
  language?: AppLanguage;
  onToggleTheme?: () => void;
  onOpenSettings?: () => void;
  onOpenVault?: () => void;
  onOpenLab?: () => void;
  onOpenArchitecture?: () => void;
}

type UiVoiceState = 'idle' | 'listening' | 'processing' | 'success' | 'error';

export const VoiceAccessibilityBar: React.FC<VoiceAccessibilityBarProps> = ({
  language = 'en',
  onToggleTheme,
  onOpenSettings,
  onOpenVault,
  onOpenLab,
  onOpenArchitecture,
}) => {
  const {
    setCommunicationState,
    audioLevel,
    setAudioLevel,
    setActiveModule,
    isVoiceNavActive,
    setVoiceNavActive,
    setLastRecognizedCommand,
    isSpeaking,
    stopSpeech,
    pulseSuccess,
    reportError,
  } = useCommunication();

  const isAm = language === 'am';

  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [navStatus, setNavStatus] = useState<VoiceNavStatus>('idle');
  const [interimSpokenText, setInterimSpokenText] = useState('');
  const [statusNotification, setStatusNotification] = useState<string | null>(null);
  const [commandFeedback, setCommandFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const feedbackTimerRef = useRef<number | null>(null);

  const clearFeedbackTimer = useCallback(() => {
    if (feedbackTimerRef.current !== null) {
      window.clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearFeedbackTimer();
  }, [clearFeedbackTimer]);

  const scheduleFeedbackClear = useCallback(
    (delayMs = 2600) => {
      clearFeedbackTimer();
      feedbackTimerRef.current = window.setTimeout(() => {
        setCommandFeedback(null);
      }, delayMs);
    },
    [clearFeedbackTimer]
  );

  const handleVoiceCommand = useCallback(
    (cmd: VoiceCommandResult) => {
      setLastRecognizedCommand(cmd.rawTranscript);
      setInterimSpokenText('');

      if (cmd.action === 'unknown') {
        const msg = isAm
          ? `ያልታወቀ ትእዛዝ፦ "${cmd.rawTranscript}"`
          : `Unrecognized: "${cmd.rawTranscript}" — say "help"`;
        setCommandFeedback({ type: 'error', message: msg });
        setStatusNotification(msg);
        reportError(msg);
        scheduleFeedbackClear(3400);
        return;
      }

      let successMsg = cmd.feedbackText;

      switch (cmd.action) {
        case 'navigate_overview':
          setActiveModule('overview');
          successMsg = isAm ? 'ወደ አጠቃላይ እይታ ተከፍቷል' : 'Opened Overview';
          break;
        case 'navigate_live_recognition':
          setActiveModule('live-recognition');
          successMsg = isAm ? 'ቀጥታ ምልክት ማንበቢያ ተከፍቷል' : 'Opened Live Recognition';
          break;
        case 'navigate_studio':
          setActiveModule('studio');
          successMsg = isAm ? 'ባለሁለት አቅጣጫ መገናኛ ተከፍቷል' : 'Opened Two-Way Studio';
          break;
        case 'navigate_tracking_studio':
          setActiveModule('tracking-studio');
          successMsg = isAm ? '2D መከታተያ ስቱዲዮ ተከፍቷል' : 'Opened 2D Tracking Studio';
          break;
        case 'navigate_vocabulary':
          setActiveModule('vocabulary');
          successMsg = isAm ? 'የEthSL መዝገበ-ቃላት ተከፍቷል' : 'Opened EthSL Vocabulary';
          break;
        case 'navigate_assistant':
          setActiveModule('assistant');
          successMsg = isAm ? 'የAI አጋዥ ተከፍቷል' : 'Opened AI Assistant';
          break;
        case 'navigate_translate':
          setActiveModule('translate');
          successMsg = isAm ? 'የቋንቋ ተርጓሚ ተከፍቷል' : 'Opened Translator';
          break;
        case 'navigate_captions':
          setActiveModule('captions');
          successMsg = isAm ? 'ቀጥታ መግለጫዎች ተከፍተዋል' : 'Opened Speech Captions';
          break;
        case 'navigate_documents':
          setActiveModule('documents');
          successMsg = isAm ? 'ሰነድ OCR ተከፍቷል' : 'Opened Document OCR';
          break;
        case 'open_settings':
          onOpenSettings?.();
          successMsg = isAm ? 'ተደራሽነት ቅንብሮች ተከፍተዋል' : 'Opened Settings';
          break;
        case 'open_vault':
          onOpenVault?.();
          successMsg = isAm ? 'የተቀመጡ ምልክቶች ማከማቻ ተከፍቷል' : 'Opened Saved Vault';
          break;
        case 'open_lab':
          onOpenLab?.();
          successMsg = isAm ? 'የግምገማ ላብራቶሪ ተከፍቷል' : 'Opened Evaluation Lab';
          break;
        case 'open_architecture':
          onOpenArchitecture?.();
          successMsg = isAm ? 'የስርዓት መዋቅር ተከፍቷል' : 'Opened System Architecture';
          break;
        case 'stop_speech':
          stopSpeech();
          successMsg = isAm ? 'ድምፅ ቆሟል' : 'Stopped spoken audio';
          break;
        case 'toggle_theme':
          onToggleTheme?.();
          successMsg = isAm ? 'ገጽታ ተቀይሯል' : 'Toggled color theme';
          break;
        case 'scroll_top':
          window.scrollTo({ top: 0, behavior: 'smooth' });
          successMsg = isAm ? 'ወደ ላይ ተመልሷል' : 'Scrolled to top';
          break;
        case 'help':
          setIsHelpOpen(true);
          successMsg = isAm ? 'የድምፅ ትእዛዞች መመሪያ' : 'Voice commands opened';
          break;
      }

      pulseSuccess(successMsg);
      setCommandFeedback({ type: 'success', message: successMsg });
      setStatusNotification(successMsg);
      scheduleFeedbackClear(2400);
    },
    [
      isAm,
      onOpenArchitecture,
      onOpenLab,
      onOpenSettings,
      onOpenVault,
      onToggleTheme,
      pulseSuccess,
      reportError,
      scheduleFeedbackClear,
      setActiveModule,
      setLastRecognizedCommand,
      stopSpeech,
    ]
  );

  const handleToggleVoiceNav = useCallback(async () => {
    clearFeedbackTimer();
    setCommandFeedback(null);

    if (isVoiceNavActive) {
      voiceNavigationService.stop();
      setVoiceNavActive(false);
      setNavStatus('idle');
      setAudioLevel(0);
      setInterimSpokenText('');
      const pausedText = isAm ? 'የድምፅ አሰሳ ቆሟል።' : 'Voice navigation paused.';
      setCommunicationState('idle', pausedText);
      setStatusNotification(pausedText);
    } else {
      setIsExpanded(true);
      setNavStatus('requesting_permission');
      const requestingText = isAm ? 'የማይክሮፎን ፍቃድ በመጠየቅ ላይ...' : 'Requesting microphone access...';
      setStatusNotification(requestingText);
      setCommunicationState('listening', requestingText);

      const started = await voiceNavigationService.start(
        handleVoiceCommand,
        (interim) => {
          setInterimSpokenText(interim);
          setCommunicationState('listening', `Hearing: "${interim}"`);
        },
        (volume) => {
          setAudioLevel(volume);
        },
        (status, msg) => {
          setNavStatus(status);
          if (msg) setStatusNotification(msg);

          if (status === 'permission_denied') {
            setVoiceNavActive(false);
            setAudioLevel(0);
            const deniedMsg = isAm
              ? 'የማይክሮፎን ፍቃድ ተከልክሏል። በአሳሹ ቅንብሮች ፍቃድ ይስጡ።'
              : 'Microphone access blocked. Allow mic permission in your browser.';
            setStatusNotification(deniedMsg);
            reportError(deniedMsg);
          } else if (status === 'unsupported') {
            setVoiceNavActive(false);
            setAudioLevel(0);
            const unsupportedMsg = isAm
              ? 'ይህ አሳሽ የድምፅ መቆጣጠሪያን አይደግፍም። በቁልፍ ሰሌዳ (Alt+V / Tab) ይጠቀሙ።'
              : 'Voice recognition unavailable in this browser. Use keyboard shortcuts instead.';
            setStatusNotification(unsupportedMsg);
            reportError(unsupportedMsg);
          } else if (status === 'error') {
            setVoiceNavActive(false);
            setAudioLevel(0);
            const errMsg = msg || (isAm ? 'የድምፅ አሰሳ ችግር አጋጥሟል።' : 'Voice recognition encountered an error.');
            setStatusNotification(errMsg);
            reportError(errMsg);
          }
        }
      );

      if (started) {
        setVoiceNavActive(true);
      }
    }
  }, [
    clearFeedbackTimer,
    handleVoiceCommand,
    isAm,
    isVoiceNavActive,
    reportError,
    setAudioLevel,
    setCommunicationState,
    setVoiceNavActive,
  ]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
        void handleToggleVoiceNav();
      }
      if (e.key === 'Escape') {
        if (isSpeaking) {
          stopSpeech();
        } else if (isExpanded && !isVoiceNavActive && !isHelpOpen) {
          setIsExpanded(false);
          setCommandFeedback(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleToggleVoiceNav, isExpanded, isHelpOpen, isSpeaking, isVoiceNavActive, stopSpeech]);

  const isErrorNavState =
    navStatus === 'permission_denied' ||
    navStatus === 'unsupported' ||
    navStatus === 'error';

  const uiState: UiVoiceState =
    commandFeedback?.type === 'success'
      ? 'success'
      : commandFeedback?.type === 'error' || isErrorNavState
      ? 'error'
      : navStatus === 'processing' || navStatus === 'requesting_permission'
      ? 'processing'
      : isVoiceNavActive && navStatus === 'listening'
      ? 'listening'
      : 'idle';

  const showExpanded =
    isExpanded ||
    isVoiceNavActive ||
    isSpeaking ||
    uiState === 'processing' ||
    uiState === 'success' ||
    uiState === 'error';

  const stateBadgeConfig: Record<
    UiVoiceState,
    { tone: 'neutral' | 'info' | 'success' | 'warning' | 'error'; label: string }
  > = {
    idle: {
      tone: 'neutral',
      label: 'Alt+V',
    },
    listening: {
      tone: 'info',
      label: isAm ? 'በማዳመጥ ላይ' : 'Listening',
    },
    processing: {
      tone: 'info',
      label:
        navStatus === 'requesting_permission'
          ? isAm
            ? 'ፍቃድ...'
            : 'Starting'
          : isAm
          ? 'በመተንተን ላይ'
          : 'Processing',
    },
    success: {
      tone: 'success',
      label: isAm ? 'ተሳክቷል' : 'Recognized',
    },
    error: {
      tone: navStatus === 'permission_denied' ? 'warning' : 'error',
      label:
        navStatus === 'permission_denied'
          ? isAm
            ? 'ፍቃድ የለም'
            : 'Mic Blocked'
          : navStatus === 'unsupported'
          ? isAm
            ? 'አይደገፍም'
            : 'Unsupported'
          : isAm
          ? 'ስህተት'
          : 'Error',
    },
  };

  const badge = stateBadgeConfig[uiState];

  const stateBorderClass =
    uiState === 'listening'
      ? 'border-[#0E7490]/60 dark:border-[#43D9E9]/55 shadow-[0_12px_32px_rgba(14,116,144,0.14)] dark:shadow-[0_12px_32px_rgba(67,217,233,0.12)]'
      : uiState === 'processing'
      ? 'border-[#4F46E5]/60 dark:border-[#8585FF]/55'
      : uiState === 'success'
      ? 'border-emerald-500/60 dark:border-emerald-500/50'
      : uiState === 'error'
      ? navStatus === 'permission_denied'
        ? 'border-amber-500/70 dark:border-amber-500/50'
        : 'border-rose-500/70 dark:border-rose-500/50'
      : 'border-slate-300/80 dark:border-[#253448]';

  const statusLine =
    uiState === 'success' && commandFeedback
      ? commandFeedback.message
      : uiState === 'error'
      ? commandFeedback?.message ||
        statusNotification ||
        (isAm ? 'የድምፅ መቆጣጠሪያ አልተሳካም።' : 'Voice command failed.')
      : interimSpokenText
      ? `"${interimSpokenText}"`
      : statusNotification
      ? statusNotification
      : isAm
      ? '«open studio»፣ «translate» ወይም «help» ይበሉ'
      : 'Say "open studio", "translate", or "help"';

  const isMicActiveLive = isVoiceNavActive && navStatus === 'listening';

  return (
    <>
      {/* Header-Docked Voice Accessibility Control + Active Status Popover */}
      <aside
        aria-label={isAm ? 'የድምፅ አሰሳ መቆጣጠሪያ' : 'Voice Navigation Assistant'}
        className="relative inline-flex items-center shrink-0"
      >
        {/* Screen reader live status announcement */}
        <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {badge.label}: {statusLine}
        </div>

        {/* Always-accessible Header Trigger (Zero Workspace Overlap) */}
        <button
          type="button"
          onClick={() => {
            if (isVoiceNavActive) {
              void handleToggleVoiceNav();
            } else {
              setIsExpanded(true);
              void handleToggleVoiceNav();
            }
          }}
          aria-label={
            isVoiceNavActive
              ? isAm
                ? 'የድምፅ አሰሳን አቁም (Alt+V)'
                : 'Stop Voice Navigation (Alt+V)'
              : isAm
              ? 'የድምፅ አሰሳን ጀምር (Alt+V)'
              : 'Activate Voice Navigation (Alt+V)'
          }
          aria-pressed={isVoiceNavActive}
          aria-expanded={showExpanded}
          title={isAm ? 'የድምፅ አሰሳ (Alt+V)' : 'Voice Navigation (Alt+V)'}
          className={`h-9 px-2 lg:px-2.5 rounded-[10px] border flex items-center gap-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9] cursor-pointer shrink-0 font-ethiopic ${
            uiState === 'listening'
              ? 'bg-[#0E7490] dark:bg-[#43D9E9] text-white dark:text-[#080D18] border-[#0E7490] dark:border-[#43D9E9] font-semibold'
              : uiState === 'processing'
              ? 'bg-[#4F46E5]/12 dark:bg-[#8585FF]/20 text-[#4F46E5] dark:text-[#8585FF] border-[#4F46E5]/40 dark:border-[#8585FF]/40'
              : uiState === 'success'
              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40'
              : uiState === 'error'
              ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/40'
              : 'bg-slate-100 dark:bg-[#172438] hover:bg-slate-200 dark:hover:bg-[#1E2E46] border-slate-200 dark:border-[#253448] text-slate-700 dark:text-[#F4F7FB]'
          }`}
        >
          {uiState === 'processing' ? (
            <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none shrink-0" aria-hidden="true" />
          ) : uiState === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
          ) : uiState === 'error' ? (
            navStatus === 'permission_denied' ? (
              <ShieldAlert className="w-4 h-4 shrink-0" aria-hidden="true" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            )
          ) : isVoiceNavActive ? (
            <Mic className="w-4 h-4 shrink-0" aria-hidden="true" />
          ) : (
            <MicOff className="w-4 h-4 text-[#0E7490] dark:text-[#43D9E9] shrink-0" aria-hidden="true" />
          )}
          <span className="hidden lg:inline">{isAm ? 'የድምፅ አሰሳ' : 'Voice Nav'}</span>
          <span className="hidden xl:inline font-mono text-[10px] opacity-85 px-1 py-0.5 rounded bg-white/70 dark:bg-[#101C2C] text-slate-700 dark:text-[#A0AEC0] border border-slate-200 dark:border-[#253448]">
            Alt+V
          </span>
        </button>

        {/* Active Live Status Popover (Appears beneath Header only when active/expanded) */}
        {showExpanded && (
          <div
            data-voice-state={uiState}
            className={`ejji-animate-dock fixed top-[4.25rem] right-3 sm:right-6 z-40 w-[min(calc(100vw-1.5rem),27rem)] p-3 sm:p-3.5 rounded-[14px] bg-white/98 dark:bg-[#101C2C]/96 backdrop-blur-xl border shadow-xl flex items-center justify-between gap-2.5 text-slate-900 dark:text-[#F4F7FB] transition-[border-color,box-shadow] duration-200 ${stateBorderClass}`}
          >
            {/* Left: State Indicator / Mic Toggle + Status Copy */}
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <button
                type="button"
                onClick={() => void handleToggleVoiceNav()}
                aria-label={
                  isVoiceNavActive
                    ? isAm
                      ? 'የድምፅ አሰሳን አቁም (Alt+V)'
                      : 'Stop Voice Navigation (Alt+V)'
                    : isAm
                    ? 'የድምፅ አሰሳን ጀምር (Alt+V)'
                    : 'Start Voice Navigation (Alt+V)'
                }
                aria-pressed={isVoiceNavActive}
                className={`relative w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 transition-[colors,transform] duration-150 active:scale-95 motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9] cursor-pointer ${
                  uiState === 'listening'
                    ? 'bg-[#0E7490] dark:bg-[#43D9E9] text-white dark:text-[#080D18]'
                    : uiState === 'processing'
                    ? 'bg-[#4F46E5]/12 dark:bg-[#8585FF]/20 text-[#4F46E5] dark:text-[#8585FF] border border-[#4F46E5]/35 dark:border-[#8585FF]/35'
                    : uiState === 'success'
                    ? 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-400 border border-emerald-500/35'
                    : uiState === 'error'
                    ? navStatus === 'permission_denied'
                      ? 'bg-amber-500/12 text-amber-800 dark:text-amber-400 border border-amber-500/35'
                      : 'bg-rose-500/12 text-rose-700 dark:text-rose-400 border border-rose-500/35'
                    : 'bg-slate-100 dark:bg-[#172438] text-slate-700 dark:text-[#A0AEC0] hover:text-slate-900 dark:hover:text-[#F4F7FB] border border-slate-300/80 dark:border-[#253448]'
                }`}
              >
                {uiState === 'processing' ? (
                  <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                ) : uiState === 'success' ? (
                  <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                ) : uiState === 'error' ? (
                  navStatus === 'permission_denied' ? (
                    <ShieldAlert className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <AlertCircle className="w-4 h-4" aria-hidden="true" />
                  )
                ) : isVoiceNavActive ? (
                  <Mic className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <MicOff className="w-4 h-4" aria-hidden="true" />
                )}
              </button>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 leading-tight">
                  <span className="text-xs font-semibold text-slate-900 dark:text-[#F4F7FB] truncate font-ethiopic">
                    {isAm ? 'የድምፅ አሰሳ' : 'Voice Nav'}
                  </span>
                  <StatusBadge
                    tone={badge.tone}
                    className="font-mono py-0.5 px-1.5 text-[10px] shrink-0 font-ethiopic"
                  >
                    {badge.label}
                  </StatusBadge>
                </div>

                <p
                  title={statusLine}
                  className={`text-[11px] truncate mt-0.5 font-ethiopic ${
                    uiState === 'error'
                      ? navStatus === 'permission_denied'
                        ? 'text-amber-800 dark:text-amber-300 font-medium'
                        : 'text-rose-700 dark:text-rose-300 font-medium'
                      : uiState === 'success'
                      ? 'text-emerald-700 dark:text-emerald-300 font-medium'
                      : 'text-slate-600 dark:text-[#A0AEC0]'
                  }`}
                >
                  {statusLine}
                </p>
              </div>
            </div>

            {/* Right: Audio Meter (Strictly live mic only), Retry/Mute/Commands/Hide */}
            <div className="flex items-center gap-1.5 shrink-0">
              {isMicActiveLive && (
                <div
                  aria-hidden="true"
                  title={isAm ? 'ቀጥታ የድምፅ መጠን' : 'Live microphone input level'}
                  className="hidden sm:flex items-end gap-0.5 h-8 px-2 py-1.5 bg-slate-100 dark:bg-[#172438] rounded-[8px] border border-slate-200 dark:border-[#253448]"
                >
                  <span
                    className={`w-1 rounded-full transition-[height,opacity] duration-75 motion-reduce:transition-none ${
                      audioLevel > 4
                        ? 'bg-[#0E7490] dark:bg-[#43D9E9]'
                        : 'bg-[#0E7490]/45 dark:bg-[#43D9E9]/45'
                    }`}
                    style={{ height: `${Math.max(6, Math.min(18, 6 + audioLevel * 0.14))}px` }}
                  />
                  <span
                    className={`w-1 rounded-full transition-[height,opacity] duration-75 motion-reduce:transition-none ${
                      audioLevel > 4
                        ? 'bg-[#0E7490] dark:bg-[#43D9E9]'
                        : 'bg-[#0E7490]/45 dark:bg-[#43D9E9]/45'
                    }`}
                    style={{ height: `${Math.max(10, Math.min(20, 10 + audioLevel * 0.16))}px` }}
                  />
                  <span
                    className={`w-1 rounded-full transition-[height,opacity] duration-75 motion-reduce:transition-none ${
                      audioLevel > 4
                        ? 'bg-[#0E7490] dark:bg-[#43D9E9]'
                        : 'bg-[#0E7490]/45 dark:bg-[#43D9E9]/45'
                    }`}
                    style={{ height: `${Math.max(5, Math.min(16, 5 + audioLevel * 0.12))}px` }}
                  />
                </div>
              )}

              {uiState === 'error' && navStatus !== 'unsupported' && (
                <IconButton
                  size="sm"
                  variant="secondary"
                  onClick={() => void handleToggleVoiceNav()}
                  label={isAm ? 'እንደገና ሞክር' : 'Retry Microphone'}
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#0E7490] dark:text-[#43D9E9]" aria-hidden="true" />
                </IconButton>
              )}

              {isSpeaking && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={stopSpeech}
                  leftIcon={<VolumeX className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />}
                  title={isAm ? 'ድምፅ አቁም (Esc)' : 'Stop Speech Playback (Esc)'}
                  className="border-amber-300 dark:border-amber-500/40 text-amber-800 dark:text-amber-300 font-ethiopic"
                >
                  <span className="hidden sm:inline">{isAm ? 'ዝም አድርግ' : 'Mute'}</span>
                </Button>
              )}

              <IconButton
                size="sm"
                variant="secondary"
                onClick={() => setIsHelpOpen(true)}
                label={isAm ? 'የድምፅ ትእዛዞች መመሪያ ክፈት' : 'Open Voice Commands Guide'}
              >
                <HelpCircle className="w-4 h-4 text-[#0E7490] dark:text-[#43D9E9]" aria-hidden="true" />
              </IconButton>

              {!isVoiceNavActive && !isSpeaking && (
                <button
                  type="button"
                  onClick={() => {
                    clearFeedbackTimer();
                    setIsExpanded(false);
                    setNavStatus('idle');
                    setCommandFeedback(null);
                  }}
                  aria-label={isAm ? 'መቆጣጠሪያውን ደብቅ' : 'Minimize Voice Navigation Dock'}
                  className="min-h-[36px] min-w-[36px] px-2.5 rounded-[8px] text-[11px] font-medium text-slate-600 dark:text-[#A0AEC0] hover:text-slate-900 dark:hover:text-[#F4F7FB] hover:bg-slate-100 dark:hover:bg-[#172438] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9] font-ethiopic"
                >
                  {isAm ? 'ደብቅ' : 'Hide'}
                </button>
              )}
            </div>
          </div>
        )}
      </aside>

      {/* Voice Commands Cheat Sheet Modal */}
      <Modal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        title={isAm ? 'የድምፅ መቆጣጠሪያ ትእዛዞች' : 'Voice Navigation Commands'}
        description={
          isAm
            ? 'በንግግር ትእዛዞች ወደ ማንኛውም የስራ ቦታ በቀጥታ ይሂዱ።'
            : 'Control EjjiLink hands-free with deterministic speech commands.'
        }
        icon={<Mic className="w-4 h-4" />}
        maxWidthClass="max-w-lg"
        footer={
          <div className="w-full flex items-center justify-between text-xs text-slate-600 dark:text-[#A0AEC0]">
            <span className="font-ethiopic">
              {isAm ? 'አቋራጭ፦ ' : 'Shortcut: '}
              <kbd className="px-1.5 py-0.5 rounded-[6px] bg-slate-100 dark:bg-[#172438] border border-slate-300/80 dark:border-[#253448] font-mono text-[#0E7490] dark:text-[#43D9E9]">
                Alt+V
              </kbd>{' '}
              {isAm ? 'ለማብራት / ለማጥፋት' : 'to toggle'}
            </span>
            <Button variant="primary" size="sm" onClick={() => setIsHelpOpen(false)}>
              {isAm ? 'ዝጋ' : 'Done'}
            </Button>
          </div>
        }
      >
        <div className="space-y-1.5 text-xs max-h-72 overflow-y-auto pr-1">
          {[
            {
              cmd: '“Open Overview”',
              desc: isAm ? 'ወደ አጠቃላይ እይታ ይመልሳል' : 'Navigates to Overview Dashboard',
            },
            {
              cmd: '“Open Studio” / “Sign Language”',
              desc: isAm ? 'ወደ ባለሁለት አቅጣጫ መገናኛ ይሄዳል' : 'Navigates to Two-Way Communication',
            },
            {
              cmd: '“Open Live Recognition”',
              desc: isAm ? 'ወደ ቀጥታ የካሜራ ምልክት ማንበቢያ ይሄዳል' : 'Navigates to Camera Sign Recognition',
            },
            {
              cmd: '“Open 2D Tracking Studio”',
              desc: isAm ? 'ወደ 2D የመከታተያ ስቱዲዮ ይሄዳል' : 'Navigates to 2D Tracking Studio',
            },
            {
              cmd: '“Open Vocabulary”',
              desc: isAm ? 'ወደ EthSL መዝገበ-ቃላት ይሄዳል' : 'Navigates to EthSL Dictionary',
            },
            {
              cmd: '“Open Assistant” / “Simplify Text”',
              desc: isAm ? 'ወደ AI ጽሑፍ አቅላሊ ይሄዳል' : 'Navigates to plain-language AI Assistant',
            },
            {
              cmd: '“Open Translator” / “Translate”',
              desc: isAm ? 'ወደ አማርኛ / እንግሊዝኛ ተርጓሚ ይሄዳል' : 'Navigates to Amharic/English Translator',
            },
            {
              cmd: '“Open Captions” / “Live Captions”',
              desc: isAm ? 'ወደ ቀጥታ የንግግር ጽሑፍ መግለጫ ይሄዳል' : 'Navigates to Speech-to-Text captions',
            },
            {
              cmd: '“Open Documents” / “Document OCR”',
              desc: isAm ? 'ወደ ሰነድ OCR ማንበቢያ ይሄዳል' : 'Navigates to Accessible Document Reader',
            },
            {
              cmd: '“Open Settings” / “Preferences”',
              desc: isAm ? 'የተደራሽነት ቅንብሮችን ይከፍታል' : 'Opens Accessibility & Sound Preferences',
            },
            {
              cmd: '“Open Cloud Vault”',
              desc: isAm ? 'የተቀመጡ ምልክቶች ማከማቻ ይከፍታል' : 'Opens Cloud Firestore Saved Signs Vault',
            },
            {
              cmd: '“Stop Speech” / “Mute”',
              desc: isAm ? 'የሚነበብ ድምፅን ያቆማል' : 'Halts ongoing voice playback',
            },
            {
              cmd: '“Toggle Theme” / “Dark Mode”',
              desc: isAm ? 'ጨለማ / ብሩህ ገጽታ ይቀይራል' : 'Switches between light and dark themes',
            },
            {
              cmd: '“Scroll Up” / “Top”',
              desc: isAm ? 'ወደ ገጹ መጀመሪያ ይወጣል' : 'Smoothly scrolls to the top of the page',
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-[10px] bg-slate-50 dark:bg-[#172438] border border-slate-200 dark:border-[#253448] flex items-start justify-between gap-3"
            >
              <span className="font-mono text-[#0E7490] dark:text-[#43D9E9] font-medium shrink-0">
                {item.cmd}
              </span>
              <span className="text-slate-600 dark:text-[#A0AEC0] text-right text-[11px] font-ethiopic">
                {item.desc}
              </span>
            </div>
          ))}
        </div>
      </Modal>
    </>
  );
};
