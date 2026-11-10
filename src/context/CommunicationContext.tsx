import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { CommunicationState, ThemeAccent, ActiveModule } from '../types';
import { speechService } from '../services/speechService';

interface CommunicationContextType {
  communicationState: CommunicationState;
  setCommunicationState: (state: CommunicationState, message?: string) => void;
  statusMessage: string;
  setStatusMessage: (msg: string) => void;
  audioLevel: number;
  setAudioLevel: (lvl: number) => void;
  activeModule: ActiveModule;
  setActiveModule: (mod: ActiveModule) => void;
  themeAccent: ThemeAccent;
  isVoiceNavActive: boolean;
  setVoiceNavActive: (active: boolean) => void;
  lastRecognizedCommand: string | null;
  setLastRecognizedCommand: (cmd: string | null) => void;
  disable3D: boolean;
  setDisable3D: (disabled: boolean) => void;
  isSpeaking: boolean;
  speakText: (text: string, lang?: string, onComplete?: () => void) => void;
  stopSpeech: () => void;
  pulseSuccess: (message?: string) => void;
  reportError: (message: string) => void;
}

const MODULE_ACCENT_MAP: Record<ActiveModule, ThemeAccent> = {
  studio: 'emerald',
  assistant: 'amber',
  translate: 'violet',
  captions: 'blue',
  documents: 'rose',
  settings: 'cyan',
};

const CommunicationContext = createContext<CommunicationContextType | undefined>(undefined);

export const CommunicationProvider: React.FC<{
  children: React.ReactNode;
  activeModule: ActiveModule;
  onSelectModule: (mod: ActiveModule) => void;
  disable3D?: boolean;
}> = ({ children, activeModule, onSelectModule, disable3D: initialDisable3D = false }) => {
  const [communicationState, setCommunicationStateRaw] = useState<CommunicationState>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('Ready for communication.');
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [isVoiceNavActive, setVoiceNavActive] = useState<boolean>(false);
  const [lastRecognizedCommand, setLastRecognizedCommand] = useState<string | null>(null);
  const [disable3D, setDisable3D] = useState<boolean>(initialDisable3D);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const resetTimerRef = useRef<any>(null);
  const syntheticAudioTimerRef = useRef<any>(null);

  // Derive theme accent from active module and current communication state
  const themeAccent: ThemeAccent = 
    communicationState === 'listening' 
      ? 'cyan' 
      : communicationState === 'translating' 
      ? 'violet' 
      : communicationState === 'speaking' 
      ? 'blue' 
      : communicationState === 'error'
      ? 'rose'
      : MODULE_ACCENT_MAP[activeModule] || 'cyan';

  // Set communication state with optional auto-reset for transient states
  const setCommunicationState = useCallback((state: CommunicationState, message?: string) => {
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }

    setCommunicationStateRaw(state);
    if (message) {
      setStatusMessage(message);
    }

    // Auto-revert transient states like success and error after 3 seconds
    if (state === 'success' || state === 'error') {
      resetTimerRef.current = setTimeout(() => {
        setCommunicationStateRaw('idle');
        setStatusMessage('Ready for communication.');
        resetTimerRef.current = null;
      }, 3500);
    }
  }, []);

  const pulseSuccess = useCallback((message = 'Operation completed successfully.') => {
    setCommunicationState('success', message);
  }, [setCommunicationState]);

  const reportError = useCallback((message: string) => {
    setCommunicationState('error', message);
  }, [setCommunicationState]);

  // Clean, unified Speech-to-Audio playback with amplitude simulation for visualizer
  const speakText = useCallback((text: string, lang = 'en-US', onComplete?: () => void) => {
    if (!text.trim()) return;

    speechService.cancel();
    if (syntheticAudioTimerRef.current) {
      clearInterval(syntheticAudioTimerRef.current);
      syntheticAudioTimerRef.current = null;
    }

    setCommunicationState('speaking', `Speaking: "${text.slice(0, 35)}..."`);
    setIsSpeaking(true);

    // Simulate gentle speech waveform levels (40 - 85) while speech is active
    let phase = 0;
    syntheticAudioTimerRef.current = setInterval(() => {
      phase += 0.25;
      const level = Math.round(50 + 35 * Math.sin(phase) * Math.sin(phase * 1.7));
      setAudioLevel(Math.max(15, Math.min(95, level)));
    }, 70);

    speechService.speakCustomText(
      text,
      lang,
      0.95,
      () => {
        // onStart
        setIsSpeaking(true);
      },
      () => {
        // onEnd
        setIsSpeaking(false);
        if (syntheticAudioTimerRef.current) {
          clearInterval(syntheticAudioTimerRef.current);
          syntheticAudioTimerRef.current = null;
        }
        setAudioLevel(0);
        setCommunicationState('idle', 'Speech completed.');
        onComplete?.();
      },
      (err) => {
        // onError
        console.warn('Speech playback error:', err);
        setIsSpeaking(false);
        if (syntheticAudioTimerRef.current) {
          clearInterval(syntheticAudioTimerRef.current);
          syntheticAudioTimerRef.current = null;
        }
        setAudioLevel(0);
        setCommunicationState('idle', 'Ready for communication.');
        onComplete?.();
      }
    );
  }, [setCommunicationState]);

  const stopSpeech = useCallback(() => {
    speechService.cancel();
    if (syntheticAudioTimerRef.current) {
      clearInterval(syntheticAudioTimerRef.current);
      syntheticAudioTimerRef.current = null;
    }
    setIsSpeaking(false);
    setAudioLevel(0);
    if (communicationState === 'speaking') {
      setCommunicationState('idle', 'Speech cancelled.');
    }
  }, [communicationState, setCommunicationState]);

  // Respect system reduced-motion preference
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      setDisable3D(true);
    }

    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setDisable3D(true);
      }
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      if (syntheticAudioTimerRef.current) clearInterval(syntheticAudioTimerRef.current);
      speechService.cancel();
    };
  }, []);

  return (
    <CommunicationContext.Provider
      value={{
        communicationState,
        setCommunicationState,
        statusMessage,
        setStatusMessage,
        audioLevel,
        setAudioLevel,
        activeModule,
        setActiveModule: onSelectModule,
        themeAccent,
        isVoiceNavActive,
        setVoiceNavActive,
        lastRecognizedCommand,
        setLastRecognizedCommand,
        disable3D,
        setDisable3D,
        isSpeaking,
        speakText,
        stopSpeech,
        pulseSuccess,
        reportError,
      }}
    >
      {children}
    </CommunicationContext.Provider>
  );
};

export const useCommunication = (): CommunicationContextType => {
  const context = useContext(CommunicationContext);
  if (!context) {
    throw new Error('useCommunication must be used within a CommunicationProvider');
  }
  return context;
};
