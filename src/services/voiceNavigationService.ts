/**
 * Voice Navigation & Accessibility Service
 * Provides deterministic spoken command parsing, live microphone volume analysis,
 * and browser compatibility guards for hands-free and voice-accessible navigation.
 */

export interface VoiceCommandResult {
  action: 
    | 'navigate_overview'
    | 'navigate_live_recognition'
    | 'navigate_studio'
    | 'navigate_assistant'
    | 'navigate_translate'
    | 'navigate_captions'
    | 'navigate_documents'
    | 'navigate_hand_studio'
    | 'navigate_vocabulary'
    | 'open_settings'
    | 'open_vault'
    | 'open_lab'
    | 'open_architecture'
    | 'stop_speech'
    | 'toggle_theme'
    | 'scroll_top'
    | 'scroll_workspace'
    | 'help'
    | 'unknown';
  rawTranscript: string;
  confidence: number;
  feedbackText: string;
}

export type VoiceNavStatus = 
  | 'idle' 
  | 'requesting_permission' 
  | 'listening' 
  | 'processing' 
  | 'error' 
  | 'permission_denied' 
  | 'unsupported';

class VoiceNavigationService {
  private recognition: any = null;
  private audioStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private animFrameId: number | null = null;
  private isListening = false;
  private status: VoiceNavStatus = 'idle';

  private onCommandCallback: ((result: VoiceCommandResult) => void) | null = null;
  private onInterimCallback: ((text: string) => void) | null = null;
  private onVolumeCallback: ((volume: number) => void) | null = null;
  private onStatusCallback: ((status: VoiceNavStatus, message?: string) => void) | null = null;

  public isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  }

  public getStatus(): VoiceNavStatus {
    return this.status;
  }

  public getIsListening(): boolean {
    return this.isListening;
  }

  /**
   * Start listening for voice navigation commands
   */
  public async start(
    onCommand: (result: VoiceCommandResult) => void,
    onInterim?: (text: string) => void,
    onVolume?: (volume: number) => void,
    onStatus?: (status: VoiceNavStatus, message?: string) => void
  ): Promise<boolean> {
    if (!this.isSupported()) {
      this.status = 'unsupported';
      onStatus?.('unsupported', 'Web Speech API is not supported in this browser. You can use keyboard shortcuts (Alt+V or Tab).');
      return false;
    }

    this.onCommandCallback = onCommand;
    this.onInterimCallback = onInterim || null;
    this.onVolumeCallback = onVolume || null;
    this.onStatusCallback = onStatus || null;

    // 1. Request microphone permission for live audio level visualizer
    this.status = 'requesting_permission';
    this.onStatusCallback?.('requesting_permission', 'Requesting microphone access...');

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        this.audioStream = stream;

        // Set up real AudioContext AnalyserNode for true audio-reactive visualizer
        try {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioCtx) {
            const ctx = new AudioCtx();
            this.audioContext = ctx;
            const source = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 128;
            analyser.smoothingTimeConstant = 0.65;
            source.connect(analyser);
            this.analyser = analyser;
            this.monitorVolume();
          }
        } catch (audioErr) {
          console.warn('AudioContext visualization setup note:', audioErr);
        }
      }
    } catch (permErr: any) {
      console.warn('Microphone permission status:', permErr);
      if (permErr?.name === 'NotAllowedError' || permErr?.name === 'PermissionDeniedError') {
        this.status = 'permission_denied';
        this.onStatusCallback?.('permission_denied', 'Microphone permission denied. Please allow microphone in browser settings.');
        return false;
      }
      // If getUserMedia fails for other reasons, speech recognition might still work
    }

    // 2. Initialize Speech Recognition
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    try {
      const recognition = new SpeechRecognitionClass();
      this.recognition = recognition;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        this.isListening = true;
        this.status = 'listening';
        this.onStatusCallback?.('listening', 'Listening for voice commands ("open studio", "translate", "help")...');
      };

      recognition.onresult = (event: any) => {
        let interimText = '';
        let finalText = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalText += transcript;
          } else {
            interimText += transcript;
          }
        }

        if (interimText.trim()) {
          this.onInterimCallback?.(interimText.trim());
        }

        if (finalText.trim()) {
          this.processCommand(finalText.trim());
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'no-speech') {
          // Normal when user is silent between commands
          return;
        }
        if (event.error === 'aborted') {
          return;
        }
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          this.status = 'permission_denied';
          this.onStatusCallback?.('permission_denied', 'Microphone permission denied. Allow mic access in browser settings.');
          this.stop({ silentStatus: true });
          return;
        }
        if (event.error === 'audio-capture') {
          this.status = 'error';
          this.onStatusCallback?.('error', 'No active microphone detected. Connect a microphone and try again.');
          this.stop({ silentStatus: true });
          return;
        }
        if (event.error === 'network') {
          this.status = 'error';
          this.onStatusCallback?.('error', 'Speech recognition service unavailable offline or blocked.');
          this.stop({ silentStatus: true });
          return;
        }
        this.status = 'error';
        this.onStatusCallback?.('error', `Voice recognition error (${event.error || 'unknown'}).`);
        this.stop({ silentStatus: true });
      };

      recognition.onend = () => {
        // If still marked as listening, restart automatically for continuous voice nav
        if (this.isListening && this.recognition) {
          try {
            this.recognition.start();
          } catch (e) {
            // ignore restart race
          }
        } else if (this.status === 'listening' || this.status === 'processing') {
          this.status = 'idle';
          this.onStatusCallback?.('idle', 'Voice navigation paused.');
        }
      };

      recognition.start();
      return true;
    } catch (initErr) {
      console.error('Failed to start speech recognition:', initErr);
      this.status = 'error';
      this.onStatusCallback?.('error', 'Could not initialize speech recognition.');
      this.stop({ silentStatus: true });
      return false;
    }
  }

  /**
   * Real audio volume monitoring loop using AnalyserNode
   */
  private monitorVolume() {
    if (!this.analyser || !this.isListening) return;
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const avg = sum / dataArray.length;
    // Normalize into 0 - 100 percentage
    const normalized = Math.min(100, Math.round((avg / 128) * 100));
    this.onVolumeCallback?.(normalized);

    this.animFrameId = requestAnimationFrame(() => this.monitorVolume());
  }

  /**
   * Deterministic Spoken Command Parsing
   */
  private processCommand(rawText: string) {
    this.status = 'processing';
    this.onStatusCallback?.('processing', `Matching "${rawText}"...`);

    const text = rawText.toLowerCase().trim();
    let result: VoiceCommandResult;

    if (text.includes('overview') || text.includes('dashboard')) {
      result = {
        action: 'navigate_overview',
        rawTranscript: rawText,
        confidence: 0.95,
        feedbackText: 'Opening Workspace Overview',
      };
    } else if (text.includes('live recognition') || text.includes('camera')) {
      result = {
        action: 'navigate_live_recognition',
        rawTranscript: rawText,
        confidence: 0.95,
        feedbackText: 'Opening Live Recognition Studio',
      };
    } else if (text.includes('3d') || text.includes('hand studio')) {
      result = {
        action: 'navigate_hand_studio',
        rawTranscript: rawText,
        confidence: 0.95,
        feedbackText: 'Opening 3D Hand Studio',
      };
    } else if (text.includes('vocabulary') || text.includes('dictionary') || text.includes('learn')) {
      result = {
        action: 'navigate_vocabulary',
        rawTranscript: rawText,
        confidence: 0.95,
        feedbackText: 'Opening EthSL Vocabulary',
      };
    } else if (text.includes('studio') || text.includes('sign') || text.includes('hand') || text.includes('gesture')) {
      result = {
        action: 'navigate_studio',
        rawTranscript: rawText,
        confidence: 0.95,
        feedbackText: 'Opening Two-Way Communication',
      };
    } else if (text.includes('assistant') || text.includes('simplify') || text.includes('reply') || text.includes('replies')) {
      result = {
        action: 'navigate_assistant',
        rawTranscript: rawText,
        confidence: 0.95,
        feedbackText: 'Opening AI Communication Assistant',
      };
    } else if (text.includes('translate') || text.includes('translator') || text.includes('amharic')) {
      result = {
        action: 'navigate_translate',
        rawTranscript: rawText,
        confidence: 0.95,
        feedbackText: 'Opening Universal Language Translator',
      };
    } else if (text.includes('caption') || text.includes('captions') || text.includes('transcribe') || text.includes('speech')) {
      result = {
        action: 'navigate_captions',
        rawTranscript: rawText,
        confidence: 0.95,
        feedbackText: 'Opening Live Speech Captions',
      };
    } else if (text.includes('document') || text.includes('ocr') || text.includes('extract') || text.includes('scan')) {
      result = {
        action: 'navigate_documents',
        rawTranscript: rawText,
        confidence: 0.95,
        feedbackText: 'Opening Document OCR Reader',
      };
    } else if (text.includes('setting') || text.includes('accessibility') || text.includes('preference')) {
      result = {
        action: 'open_settings',
        rawTranscript: rawText,
        confidence: 0.95,
        feedbackText: 'Opening Accessibility Preferences',
      };
    } else if (text.includes('vault') || text.includes('storage') || text.includes('saved')) {
      result = {
        action: 'open_vault',
        rawTranscript: rawText,
        confidence: 0.95,
        feedbackText: 'Opening Cloud Storage Vault',
      };
    } else if (text.includes('lab') || text.includes('eval') || text.includes('testing')) {
      result = {
        action: 'open_lab',
        rawTranscript: rawText,
        confidence: 0.95,
        feedbackText: 'Opening Evaluation & Testing Lab',
      };
    } else if (text.includes('architecture') || text.includes('privacy') || text.includes('cloud')) {
      result = {
        action: 'open_architecture',
        rawTranscript: rawText,
        confidence: 0.95,
        feedbackText: 'Opening Cloud Architecture & Privacy Specs',
      };
    } else if (text.includes('stop') || text.includes('quiet') || text.includes('mute') || text.includes('cancel')) {
      result = {
        action: 'stop_speech',
        rawTranscript: rawText,
        confidence: 0.95,
        feedbackText: 'Stopping audio playback',
      };
    } else if (text.includes('dark') || text.includes('light') || text.includes('theme') || text.includes('mode')) {
      result = {
        action: 'toggle_theme',
        rawTranscript: rawText,
        confidence: 0.9,
        feedbackText: 'Toggling application visual theme',
      };
    } else if (text.includes('top') || text.includes('scroll up') || text.includes('home')) {
      result = {
        action: 'scroll_top',
        rawTranscript: rawText,
        confidence: 0.9,
        feedbackText: 'Scrolling to top of page',
      };
    } else if (text.includes('help') || text.includes('commands') || text.includes('what can i say')) {
      result = {
        action: 'help',
        rawTranscript: rawText,
        confidence: 0.95,
        feedbackText: 'Showing available voice commands',
      };
    } else {
      result = {
        action: 'unknown',
        rawTranscript: rawText,
        confidence: 0.4,
        feedbackText: `Unrecognized command: "${rawText}". Say "help" to see valid commands.`,
      };
    }

    this.onCommandCallback?.(result);
    if (this.isListening) {
      this.status = 'listening';
    }
  }

  /**
   * Stop voice navigation and release microphone resources
   */
  public stop(options?: { silentStatus?: boolean }) {
    this.isListening = false;
    if (!options?.silentStatus) {
      this.status = 'idle';
    }

    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch (e) {
        // ignore
      }
      this.recognition = null;
    }

    if (this.audioStream) {
      this.audioStream.getTracks().forEach((track) => track.stop());
      this.audioStream = null;
    }

    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch (e) {
        // ignore
      }
      this.audioContext = null;
    }

    this.analyser = null;
    this.onVolumeCallback?.(0);
    if (!options?.silentStatus) {
      this.onStatusCallback?.('idle', 'Voice navigation turned off.');
    }
  }
}

export const voiceNavigationService = new VoiceNavigationService();
