import React, { useState, useEffect } from 'react';
import { 
  Mic, 
  MicOff, 
  VolumeX, 
  HelpCircle, 
  X
} from 'lucide-react';
import { useCommunication } from '../context/CommunicationContext';
import { voiceNavigationService, VoiceCommandResult, VoiceNavStatus } from '../services/voiceNavigationService';

interface VoiceAccessibilityBarProps {
  onToggleTheme?: () => void;
  onOpenSettings?: () => void;
  onOpenVault?: () => void;
  onOpenLab?: () => void;
  onOpenArchitecture?: () => void;
}

export const VoiceAccessibilityBar: React.FC<VoiceAccessibilityBarProps> = ({
  onToggleTheme,
  onOpenSettings,
  onOpenVault,
  onOpenLab,
  onOpenArchitecture,
}) => {
  const {
    communicationState,
    setCommunicationState,
    audioLevel,
    setAudioLevel,
    setActiveModule,
    isVoiceNavActive,
    setVoiceNavActive,
    lastRecognizedCommand,
    setLastRecognizedCommand,
    isSpeaking,
    stopSpeech,
    pulseSuccess,
    reportError,
  } = useCommunication();

  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [navStatus, setNavStatus] = useState<VoiceNavStatus>('idle');
  const [interimSpokenText, setInterimSpokenText] = useState('');
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  // Handle detected voice command
  const handleVoiceCommand = (cmd: VoiceCommandResult) => {
    setLastRecognizedCommand(cmd.rawTranscript);
    setInterimSpokenText('');

    switch (cmd.action) {
      case 'navigate_studio':
        setActiveModule('studio');
        pulseSuccess('Opened Sign Language Studio & 3D Hands');
        document.getElementById('module-workspace')?.scrollIntoView({ behavior: 'smooth' });
        break;
      case 'navigate_assistant':
        setActiveModule('assistant');
        pulseSuccess('Opened AI Communication Assistant');
        document.getElementById('module-workspace')?.scrollIntoView({ behavior: 'smooth' });
        break;
      case 'navigate_translate':
        setActiveModule('translate');
        pulseSuccess('Opened Universal Language Translator');
        document.getElementById('module-workspace')?.scrollIntoView({ behavior: 'smooth' });
        break;
      case 'navigate_captions':
        setActiveModule('captions');
        pulseSuccess('Opened Live Speech Captions');
        document.getElementById('module-workspace')?.scrollIntoView({ behavior: 'smooth' });
        break;
      case 'navigate_documents':
        setActiveModule('documents');
        pulseSuccess('Opened Document OCR Reader');
        document.getElementById('module-workspace')?.scrollIntoView({ behavior: 'smooth' });
        break;
      case 'open_settings':
        onOpenSettings?.();
        pulseSuccess('Opened Accessibility Preferences');
        break;
      case 'open_vault':
        onOpenVault?.();
        pulseSuccess('Opened Cloud Storage Vault');
        break;
      case 'open_lab':
        onOpenLab?.();
        pulseSuccess('Opened Evaluation & Testing Lab');
        break;
      case 'open_architecture':
        onOpenArchitecture?.();
        pulseSuccess('Opened Cloud Architecture & Transparency');
        break;
      case 'stop_speech':
        stopSpeech();
        pulseSuccess('Stopped all spoken audio playback');
        break;
      case 'toggle_theme':
        onToggleTheme?.();
        pulseSuccess('Toggled visual color theme');
        break;
      case 'scroll_top':
        window.scrollTo({ top: 0, behavior: 'smooth' });
        pulseSuccess('Scrolled to top of page');
        break;
      case 'help':
        setIsHelpOpen(true);
        pulseSuccess('Displayed available voice navigation commands');
        break;
    }
  };

  // Toggle voice navigation state
  const handleToggleVoiceNav = async () => {
    if (isVoiceNavActive) {
      voiceNavigationService.stop();
      setVoiceNavActive(false);
      setNavStatus('idle');
      setAudioLevel(0);
      setCommunicationState('idle', 'Voice navigation paused.');
      setStatusNotification('Voice navigation deactivated.');
    } else {
      setCommunicationState('listening', 'Microphone active • Listening for commands...');
      const started = await voiceNavigationService.start(
        handleVoiceCommand,
        (interim) => {
          setInterimSpokenText(interim);
          setCommunicationState('listening', `Hearing: "${interim}"...`);
        },
        (volume) => {
          setAudioLevel(volume);
        },
        (status, msg) => {
          setNavStatus(status);
          if (msg) setStatusNotification(msg);
          if (status === 'permission_denied') {
            setVoiceNavActive(false);
            reportError('Microphone permission denied.');
          } else if (status === 'unsupported') {
            setVoiceNavActive(false);
            reportError('Speech recognition unsupported in this browser.');
          }
        }
      );

      if (started) {
        setVoiceNavActive(true);
        setNavStatus('listening');
      }
    }
  };

  // Keyboard shortcut Alt+V to toggle voice navigation hands-free
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
        handleToggleVoiceNav();
      }
      if (e.key === 'Escape') {
        setIsHelpOpen(false);
        if (isSpeaking) {
          stopSpeech();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVoiceNavActive, isSpeaking]);

  return (
    <>
      {/* Floating or Docked Voice Accessibility Quick Bar */}
      <aside 
        aria-label="Voice Navigation Assistant" 
        className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-40 max-w-lg"
      >
        <div className="p-3 sm:p-3.5 rounded-[14px] bg-white/95 dark:bg-[#121C2D]/95 backdrop-blur-xl border border-slate-200 dark:border-[rgba(148,163,184,0.15)] shadow-xl flex items-center justify-between gap-3 text-slate-900 dark:text-[#F8FAFC]">
          
          {/* Left: Mic Status & Live Audio Waveform */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={handleToggleVoiceNav}
              className={`w-9 h-9 rounded-[8px] transition-colors cursor-pointer shrink-0 flex items-center justify-center ${
                isVoiceNavActive
                  ? 'bg-[#22D3EE] text-[#080D18] font-bold shadow-xs'
                  : 'bg-slate-100 dark:bg-[#19263A] text-slate-700 dark:text-[#B6C2D2] hover:text-[#22D3EE]'
              }`}
              title={isVoiceNavActive ? 'Deactivate Voice Navigation (Alt+V)' : 'Activate Voice Navigation (Alt+V)'}
              aria-label={isVoiceNavActive ? 'Deactivate Voice Navigation' : 'Activate Voice Navigation'}
            >
              {isVoiceNavActive ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 leading-tight">
                <span className="text-xs font-semibold text-slate-900 dark:text-[#F8FAFC] truncate">
                  Voice Navigation
                </span>
                <span className="text-[11px] font-mono text-[#22D3EE]">
                  · {isVoiceNavActive ? 'Listening' : 'Ready (Alt+V)'}
                </span>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-[#8493A8] truncate mt-0.5">
                {interimSpokenText 
                  ? `"${interimSpokenText}"` 
                  : statusNotification 
                  ? statusNotification 
                  : 'Say "open assistant", "translate", or "help"'}
              </p>
            </div>
          </div>

          {/* Right: Quick Action Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Live Audio Meter */}
            {isVoiceNavActive && (
              <div className="hidden sm:flex items-center gap-0.5 px-2 py-1 bg-slate-100 dark:bg-[#080D18] rounded-[6px] border border-slate-200 dark:border-[rgba(148,163,184,0.12)]">
                <span 
                  className="w-1 bg-[#22D3EE] rounded-full transition-all duration-75"
                  style={{ height: `${Math.max(4, audioLevel * 0.22)}px` }}
                />
                <span 
                  className="w-1 bg-[#22D3EE] rounded-full transition-all duration-75"
                  style={{ height: `${Math.max(4, audioLevel * 0.3)}px` }}
                />
                <span 
                  className="w-1 bg-[#22D3EE] rounded-full transition-all duration-75"
                  style={{ height: `${Math.max(4, audioLevel * 0.18)}px` }}
                />
              </div>
            )}

            {/* Stop Speech / Mute button */}
            {isSpeaking && (
              <button
                onClick={stopSpeech}
                className="h-8 px-2.5 rounded-[8px] bg-[#FBBF24]/15 hover:bg-[#FBBF24]/25 border border-[#FBBF24]/30 text-[#FBBF24] text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
                title="Stop Speech Playback (Esc)"
              >
                <VolumeX className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mute</span>
              </button>
            )}

            {/* Help / Voice Commands Cheat Sheet */}
            <button
              onClick={() => setIsHelpOpen(true)}
              className="w-8 h-8 rounded-[8px] bg-slate-100 dark:bg-[#19263A] hover:bg-slate-200 dark:hover:bg-[#1E2E44] text-slate-700 dark:text-[#B6C2D2] flex items-center justify-center transition-colors cursor-pointer"
              title="Voice Commands Guide"
              aria-label="Open Voice Commands Guide"
            >
              <HelpCircle className="w-4 h-4 text-[#22D3EE]" />
            </button>
          </div>
        </div>
      </aside>

      {/* Voice Commands Cheat Sheet Modal */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white dark:bg-[#0D1422] border border-slate-200 dark:border-[rgba(148,163,184,0.15)] rounded-[20px] max-w-lg w-full shadow-2xl p-6 space-y-4 animate-in fade-in duration-150 text-slate-900 dark:text-[#F8FAFC]">
            
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[rgba(148,163,184,0.12)] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-[8px] bg-[#22D3EE]/10 text-[#22D3EE] flex items-center justify-center">
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-[#F8FAFC]">
                    Voice Navigation Commands
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-[#8493A8]">
                    Control EjjiLink hands-free with deterministic speech commands.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsHelpOpen(false)}
                className="w-8 h-8 rounded-[8px] bg-slate-100 dark:bg-[#19263A] hover:bg-slate-200 dark:hover:bg-[#1E2E44] text-slate-600 dark:text-[#B6C2D2] flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Command Cheat List */}
            <div className="space-y-1.5 text-xs max-h-72 overflow-y-auto pr-1">
              {[
                { cmd: '“Open Studio” / “Sign Language”', desc: 'Navigates to Sign Studio & 3D Hands' },
                { cmd: '“Open Assistant” / “Simplify Text”', desc: 'Navigates to plain-language AI Assistant' },
                { cmd: '“Open Translator” / “Translate”', desc: 'Navigates to Universal Amharic/English Translator' },
                { cmd: '“Open Captions” / “Live Captions”', desc: 'Navigates to Speech-to-Text streaming captions' },
                { cmd: '“Open Documents” / “Document OCR”', desc: 'Navigates to Accessible Document Reader' },
                { cmd: '“Open Settings” / “Preferences”', desc: 'Opens Accessibility & Sound Preferences modal' },
                { cmd: '“Open Cloud Vault”', desc: 'Opens Cloud Firestore Saved Signs Vault' },
                { cmd: '“Stop Speech” / “Mute”', desc: 'Halts ongoing voice playback' },
                { cmd: '“Toggle Theme” / “Dark Mode”', desc: 'Switches between light and deep dark themes' },
                { cmd: '“Scroll Up” / “Top”', desc: 'Smoothly scrolls to the top of the page' },
              ].map((item, idx) => (
                <div 
                  key={idx}
                  className="p-2.5 rounded-[8px] bg-slate-50 dark:bg-[#121C2D] border border-slate-200 dark:border-[rgba(148,163,184,0.1)] flex items-start justify-between gap-3"
                >
                  <span className="font-mono text-[#22D3EE] font-medium shrink-0">{item.cmd}</span>
                  <span className="text-slate-500 dark:text-[#8493A8] text-right text-[11px]">{item.desc}</span>
                </div>
              ))}
            </div>

            {/* Footer Notice */}
            <div className="pt-3 border-t border-slate-200 dark:border-[rgba(148,163,184,0.12)] flex items-center justify-between text-xs text-slate-500 dark:text-[#8493A8]">
              <span>Shortcut: <kbd className="px-1.5 py-0.5 rounded-[6px] bg-slate-100 dark:bg-[#19263A] border border-slate-200 dark:border-[rgba(148,163,184,0.15)] font-mono text-[#22D3EE]">Alt+V</kbd> to toggle</span>
              <button
                onClick={() => setIsHelpOpen(false)}
                className="h-8 px-4 rounded-[8px] bg-[#22D3EE] hover:bg-[#2DD4BF] text-[#080D18] font-semibold text-xs cursor-pointer transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
