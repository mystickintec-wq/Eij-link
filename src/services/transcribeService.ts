/**
 * Audio transcription service with dual-tier AI backend (Gemini 3.5 Transcribe + Gemini 3.8 Flash)
 * and seamless zero-quota Browser Web Speech API streaming engine for continuous live captions.
 */

export interface TranscriptionResult {
  text: string;
  source: 'gemini-3.5-transcribe' | 'gemini-3.8-flash' | 'web-speech-native' | 'web-speech-fallback';
  durationMs?: number;
  isInterim?: boolean;
}

export interface TranscribeResponse {
  text: string;
  modelUsed?: string;
  quotaExceeded?: boolean;
}

/**
 * Transcribe a recorded audio Blob via the protected backend /api/transcribe endpoint.
 */
export async function transcribeAudioBlob(blob: Blob): Promise<{ text: string; modelUsed: string }> {
  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);

  const response = await fetch('/api/transcribe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      audio: base64,
      mimeType: blob.type || 'audio/webm',
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    if (response.status === 429) {
      throw new Error(errData.error || 'Gemini transcription rate limit reached. Please try browser speech or wait 30 seconds.');
    }
    throw new Error(errData.error || `Server error (${response.status})`);
  }

  const data: TranscribeResponse = await response.json();
  return {
    text: data.text || '',
    modelUsed: data.modelUsed || 'gemini-3.5-transcribe',
  };
}

export class GeminiVoiceRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private audioChunks: Blob[] = [];
  private isContinuous: boolean = false;
  private continuousTimer: any = null;
  private isRecording: boolean = false;
  private onTranscriptCallback: ((result: TranscriptionResult) => void) | null = null;
  private onVolumeCallback: ((volume: number) => void) | null = null;
  private onStatusCallback: ((status: string) => void) | null = null;
  private animFrameId: number | null = null;

  // Web Speech API for zero-quota live streaming
  private recognition: any = null;
  private enginePreference: 'auto' | 'web-speech' | 'gemini-cloud' = 'auto';
  private activeEngine: 'web-speech-native' | 'gemini-cloud' = 'web-speech-native';
  private currentLanguage: string = 'en-US';
  private quotaCooldownUntil: number = 0;

  public isRunning(): boolean {
    return this.isRecording;
  }

  public isContinuousMode(): boolean {
    return this.isContinuous;
  }

  public getActiveEngine(): string {
    return this.activeEngine;
  }

  public setEnginePreference(pref: 'auto' | 'web-speech' | 'gemini-cloud') {
    this.enginePreference = pref;
  }

  public getEnginePreference(): 'auto' | 'web-speech' | 'gemini-cloud' {
    return this.enginePreference;
  }

  public setLanguage(lang: string) {
    this.currentLanguage = lang;
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  public isWebSpeechAvailable(): boolean {
    if (typeof window === 'undefined') return false;
    return Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  }

  public async start(
    continuous: boolean,
    onTranscript: (result: TranscriptionResult) => void,
    onVolume?: (volume: number) => void,
    onStatus?: (status: string) => void
  ) {
    await this.stop();
    this.isContinuous = continuous;
    this.onTranscriptCallback = onTranscript;
    this.onVolumeCallback = onVolume || null;
    this.onStatusCallback = onStatus || null;
    this.isRecording = true;

    // Start Audio Stream & Volume Analyser for UI visual feedback
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      this.audioStream = stream;

      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          this.audioContext = ctx;
          const source = ctx.createMediaStreamSource(stream);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);
          this.analyser = analyser;
          this.monitorVolume();
        }
      } catch (e) {
        // Audio visualizer is optional
      }
    } catch (err) {
      console.warn('Microphone stream error for visualizer:', err);
      // If Web Speech is available, user might still be able to use it even if getUserMedia fails
    }

    // Determine engine: For continuous live speech captions, Web Speech API provides zero-rate-limit live transcription.
    const useWebSpeech =
      this.isWebSpeechAvailable() &&
      (this.enginePreference === 'web-speech' || (this.enginePreference === 'auto' && continuous));

    if (useWebSpeech) {
      this.activeEngine = 'web-speech-native';
      this.startWebSpeechStreaming();
    } else {
      this.activeEngine = 'gemini-cloud';
      this.startSegmentRecording();
    }
  }

  private startWebSpeechStreaming() {
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      console.warn('Web Speech not available, falling back to segment recorder.');
      this.activeEngine = 'gemini-cloud';
      this.startSegmentRecording();
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      this.recognition = recognition;
      recognition.continuous = this.isContinuous;
      recognition.interimResults = true;
      recognition.lang = this.currentLanguage;

      this.onStatusCallback?.('Streaming live speech via Web Speech Engine (Unlimited)');

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

        if (finalText.trim()) {
          this.onTranscriptCallback?.({
            text: finalText.trim(),
            source: 'web-speech-native',
            isInterim: false,
          });
        } else if (interimText.trim()) {
          this.onTranscriptCallback?.({
            text: interimText.trim(),
            source: 'web-speech-native',
            isInterim: true,
          });
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'no-speech') {
          // Normal when silent, ignore
          return;
        }
        if (event.error === 'network' || event.error === 'not-allowed') {
          console.warn('Web Speech error:', event.error);
          this.onStatusCallback?.(`Web Speech: ${event.error}.`);
        }
      };

      recognition.onend = () => {
        // Auto-restart if continuous mode is still active
        if (this.isRecording && this.isContinuous && this.recognition) {
          try {
            this.recognition.start();
          } catch (e) {
            // Already started or restarting
          }
        }
      };

      recognition.start();
    } catch (err) {
      console.error('Failed to initialize Web Speech API:', err);
      this.activeEngine = 'gemini-cloud';
      this.startSegmentRecording();
    }
  }

  private monitorVolume() {
    if (!this.analyser || !this.isRecording) return;
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const avg = sum / dataArray.length;
    const normalized = Math.min(100, Math.round((avg / 128) * 100));
    this.onVolumeCallback?.(normalized);

    this.animFrameId = requestAnimationFrame(() => this.monitorVolume());
  }

  private startSegmentRecording() {
    if (!this.audioStream || !this.isRecording) return;

    this.audioChunks = [];
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/webm')
      ? 'audio/webm'
      : 'audio/mp4';

    try {
      const recorder = new MediaRecorder(this.audioStream, { mimeType });
      this.mediaRecorder = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          this.audioChunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        if (this.audioChunks.length === 0) return;
        const audioBlob = new Blob(this.audioChunks, { type: mimeType });

        // Only process if blob has audible content (> 4KB)
        if (audioBlob.size > 4000) {
          // Check quota cooldown before sending
          const now = Date.now();
          if (now < this.quotaCooldownUntil) {
            const waitSec = Math.ceil((this.quotaCooldownUntil - now) / 1000);
            this.onStatusCallback?.(`Quota cooldown active. Retrying in ${waitSec}s...`);
          } else {
            const startTime = performance.now();
            try {
              this.onStatusCallback?.('Processing audio with Gemini...');
              const result = await transcribeAudioBlob(audioBlob);
              if (result.text && result.text.trim()) {
                const source =
                  result.modelUsed === 'gemini-3.8-flash'
                    ? 'gemini-3.8-flash'
                    : 'gemini-3.5-transcribe';

                this.onTranscriptCallback?.({
                  text: result.text.trim(),
                  source,
                  durationMs: Math.round(performance.now() - startTime),
                });
                this.onStatusCallback?.(`Transcribed via ${source}`);
              }
            } catch (err: any) {
              const msg = err.message || '';
              if (msg.includes('rate limit') || msg.includes('quota') || msg.includes('429')) {
                this.quotaCooldownUntil = Date.now() + 30000;
                this.onStatusCallback?.('AI rate limit reached. Pausing cloud requests for 30s.');
                // If Web Speech is supported, switch to it automatically to keep user's session uninterrupted!
                if (this.isWebSpeechAvailable() && this.isContinuous) {
                  this.activeEngine = 'web-speech-native';
                  this.startWebSpeechStreaming();
                  return;
                }
              } else {
                console.warn('Audio transcription error:', err);
              }
            }
          }
        }

        // If continuous mode is enabled and still using gemini-cloud, schedule next segment with safe interval
        if (this.isRecording && this.isContinuous && this.activeEngine === 'gemini-cloud') {
          // 8-second interval ensures requests stay under rate limits
          setTimeout(() => {
            if (this.isRecording && this.isContinuous) {
              this.startSegmentRecording();
            }
          }, 1500);
        }
      };

      recorder.start();

      // Segment duration: 8 seconds for continuous cloud listening, 7 seconds for single push-to-speak
      const segmentTime = this.isContinuous ? 8000 : 7000;
      this.continuousTimer = setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop();
        }
      }, segmentTime);
    } catch (err) {
      console.error('Failed to initialize MediaRecorder:', err);
    }
  }

  public stop(): Promise<void> {
    this.isRecording = false;
    this.isContinuous = false;

    if (this.continuousTimer) {
      clearTimeout(this.continuousTimer);
      this.continuousTimer = null;
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

    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      try {
        this.mediaRecorder.stop();
      } catch (e) {
        // ignore
      }
    }
    this.mediaRecorder = null;

    if (this.audioStream) {
      this.audioStream.getTracks().forEach((t) => t.stop());
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

    this.onVolumeCallback?.(0);
    return Promise.resolve();
  }
}

export const geminiVoiceRecorder = new GeminiVoiceRecorder();
