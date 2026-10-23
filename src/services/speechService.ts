import { GestureDefinition } from '../types';

export interface SpeechVoiceInfo {
  isSupported: boolean;
  hasAmharicVoice: boolean;
  availableVoices: SpeechSynthesisVoice[];
  defaultVoiceName?: string;
}

class SpeechService {
  private synth: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private voicesLoaded: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  private loadVoices() {
    if (!this.synth) return;
    this.voices = this.synth.getVoices();
    this.voicesLoaded = true;
  }

  public getVoiceInfo(): SpeechVoiceInfo {
    if (!this.synth) {
      return { isSupported: false, hasAmharicVoice: false, availableVoices: [] };
    }
    const hasAmharic = this.voices.some(v => v.lang.startsWith('am'));
    return {
      isSupported: true,
      hasAmharicVoice: hasAmharic,
      availableVoices: this.voices,
      defaultVoiceName: this.voices.find(v => v.default)?.name,
    };
  }

  public speak(
    gesture: GestureDefinition,
    language: string = 'en-US',
    rate: number = 0.95,
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (err: any) => void
  ) {
    if (!this.synth) {
      onError?.(new Error('Speech Synthesis is not supported in this browser environment.'));
      return;
    }

    this.synth.cancel();

    const voiceInfo = this.getVoiceInfo();
    let textToSpeak = gesture.labelEn;
    let targetLang = language;

    if (language.startsWith('am')) {
      if (voiceInfo.hasAmharicVoice) {
        textToSpeak = gesture.labelAm;
        targetLang = 'am-ET';
      } else {
        // Honest fallback to phonetic Amharic pronunciation via English/universal phonetics
        textToSpeak = `${gesture.phoneticAm}. ${gesture.labelEn}`;
        targetLang = 'en-US';
      }
    } else {
      textToSpeak = gesture.labelEn;
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = targetLang;
    utterance.rate = rate;

    // Pick best voice for language if available
    const matchedVoice = this.voices.find(v => v.lang.toLowerCase() === targetLang.toLowerCase());
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.onstart = () => onStart?.();
    utterance.onend = () => onEnd?.();
    utterance.onerror = (e) => {
      console.warn('Speech synthesis utterance error:', e);
      onError?.(e);
      onEnd?.();
    };

    try {
      this.synth.speak(utterance);
    } catch (err) {
      console.error('Failed to trigger speech utterance:', err);
      onError?.(err);
      onEnd?.();
    }
  }

  public speakCustomText(
    text: string,
    language: string = 'en-US',
    rate: number = 0.95,
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (err: any) => void
  ) {
    if (!this.synth) {
      onError?.(new Error('Speech Synthesis is not supported in this browser environment.'));
      return;
    }

    this.synth.cancel();

    const voiceInfo = this.getVoiceInfo();
    let textToSpeak = text;
    let targetLang = language;

    if (language.startsWith('am') && !voiceInfo.hasAmharicVoice) {
      // Fallback: If no Amharic TTS engine, speak in English voice
      targetLang = 'en-US';
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = targetLang;
    utterance.rate = rate;

    const matchedVoice = this.voices.find(v => v.lang.toLowerCase() === targetLang.toLowerCase());
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.onstart = () => onStart?.();
    utterance.onend = () => onEnd?.();
    utterance.onerror = (e) => {
      console.warn('Speech synthesis utterance error:', e);
      onError?.(e);
      onEnd?.();
    };

    try {
      this.synth.speak(utterance);
    } catch (err) {
      console.error('Failed to trigger custom speech utterance:', err);
      onError?.(err);
      onEnd?.();
    }
  }

  public cancel() {
    if (this.synth) {
      this.synth.cancel();
    }
  }
}

export const speechService = new SpeechService();
