import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BookOpen,
  Camera,
  Check,
  Copy,
  Eye,
  EyeOff,
  FlipHorizontal,
  Hand,
  Languages,
  RefreshCw,
  RotateCcw,
  ScanFace,
  Trash2,
  User,
  Video,
  VideoOff,
  Volume2,
} from 'lucide-react';
import { AppLanguage } from '../config/navigation';
import { GESTURE_DEFINITIONS, GESTURE_LIST } from '../data/gestures';
import { classifyHandPoseDetailed } from '../services/gestureClassifier';
import {
  drawHumanTrackingOverlay,
  humanTrackingService,
  TrackerAvailability,
  TrackerEngineState,
} from '../services/humanTrackingService';
import { speechService } from '../services/speechService';
import { TemporalStabilizer } from '../services/temporalStabilizer';
import { translationService } from '../services/translationService';
import { GestureKey } from '../types';
import { HandPoseDiagram } from './HandPoseDiagram';
import {
  Alert,
  Button,
  Card,
  SelectField,
  StatusBadge,
  TextArea,
  WorkspaceHeader,
  useToast,
} from './ui';

interface HumanTrackingStudio2DProps {
  activeGestureKey: GestureKey | 'neutral';
  onSelectGesture: (gestureKey: GestureKey) => void;
  language?: AppLanguage;
  onOpenVocabulary?: () => void;
}

interface MediaDeviceOption {
  deviceId: string;
  label: string;
}

interface StatusSnapshot {
  cameraActive: boolean;
  cameraStarting: boolean;
  engineState: TrackerEngineState;
  faceDetected: boolean;
  bodyDetected: boolean;
  leftHandDetected: boolean;
  rightHandDetected: boolean;
  fps: number;
}

export const HumanTrackingStudio2D: React.FC<HumanTrackingStudio2DProps> = ({
  activeGestureKey,
  onSelectGesture,
  language = 'en',
  onOpenVocabulary,
}) => {
  const { showToast } = useToast();
  const isAm = language === 'am';

  // DOM & Loop Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stageContainerRef = useRef<HTMLDivElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const isRunningRef = useRef<boolean>(false);
  const sessionTokenRef = useRef<number>(0);
  const stabilizerRef = useRef<TemporalStabilizer>(new TemporalStabilizer());

  // FPS & Debounce Tracking Refs
  const frameCountRef = useRef<number>(0);
  const lastFpsTimeRef = useRef<number>(performance.now());
  const lastTranscriptGestureRef = useRef<GestureKey | null>(null);
  const lastTranscriptTimeRef = useRef<number>(0);

  // Camera & Device Controls
  const [devices, setDevices] = useState<MediaDeviceOption[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [availability, setAvailability] = useState<TrackerAvailability>(() =>
    humanTrackingService.getAvailability()
  );

  // Feature Toggles (State + Live Refs for smooth rAF without restarts)
  const [enableFace, setEnableFace] = useState<boolean>(true);
  const [enableBody, setEnableBody] = useState<boolean>(true);
  const [enableHands, setEnableHands] = useState<boolean>(true);
  const [showVideoFeed, setShowVideoFeed] = useState<boolean>(true);
  const [isMirrored, setIsMirrored] = useState<boolean>(true);
  const [autoSpeak, setAutoSpeak] = useState<boolean>(false);

  const enableFaceRef = useRef(enableFace);
  const enableBodyRef = useRef(enableBody);
  const enableHandsRef = useRef(enableHands);
  const showVideoFeedRef = useRef(showVideoFeed);
  const isMirroredRef = useRef(isMirrored);
  const autoSpeakRef = useRef(autoSpeak);

  useEffect(() => {
    enableFaceRef.current = enableFace;
  }, [enableFace]);
  useEffect(() => {
    enableBodyRef.current = enableBody;
  }, [enableBody]);
  useEffect(() => {
    enableHandsRef.current = enableHands;
  }, [enableHands]);
  useEffect(() => {
    showVideoFeedRef.current = showVideoFeed;
  }, [showVideoFeed]);
  useEffect(() => {
    isMirroredRef.current = isMirrored;
  }, [isMirrored]);
  useEffect(() => {
    autoSpeakRef.current = autoSpeak;
  }, [autoSpeak]);

  // Live Tracking Telemetry
  const [status, setStatus] = useState<StatusSnapshot>({
    cameraActive: false,
    cameraStarting: false,
    engineState: humanTrackingService.getState(),
    faceDetected: false,
    bodyDetected: false,
    leftHandDetected: false,
    rightHandDetected: false,
    fps: 0,
  });

  // Sign Recognition & Text/Translation Workspace State
  const [recognizedGesture, setRecognizedGesture] = useState<GestureKey | null>(null);
  const [recognitionConfidence, setRecognitionConfidence] = useState<number>(0);
  const [recognitionStability, setRecognitionStability] = useState<number>(0);
  const [recognitionStatusText, setRecognitionStatusText] = useState<string>(
    isAm
      ? 'ካሜራ ዝግጁ ነው — መከታተል ለመጀመር "ካሜራ ጀምር" የሚለውን ይጫኑ።'
      : 'Camera inactive — click Start Camera to track face, body skeleton, and both hands.'
  );
  const [phraseWords, setPhraseWords] = useState<string[]>([]);
  const [workspaceText, setWorkspaceText] = useState<string>('');
  const [translatedText, setTranslatedText] = useState<string>('');
  const [translatedPhonetic, setTranslatedPhonetic] = useState<string>('');
  const [targetLang, setTargetLang] = useState<'Amharic' | 'English'>('Amharic');
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [translationNotice, setTranslationNotice] = useState<string | null>(null);

  const selectedRefKey: GestureKey =
    activeGestureKey === 'neutral' ? 'hello' : activeGestureKey;
  const referenceGesture = GESTURE_DEFINITIONS[selectedRefKey] || GESTURE_DEFINITIONS.hello;
  const liveSignDef = recognizedGesture ? GESTURE_DEFINITIONS[recognizedGesture] : null;

  // Enumerate connected video input devices safely
  const refreshCameraDevices = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
      return;
    }
    try {
      const list = await navigator.mediaDevices.enumerateDevices();
      const cams = list
        .filter((d) => d.kind === 'videoinput')
        .map((d, idx) => ({
          deviceId: d.deviceId,
          label: d.label || `Camera ${idx + 1}`,
        }));
      setDevices(cams);
      if (cams.length > 0 && !cams.some((c) => c.deviceId === selectedDeviceId)) {
        setSelectedDeviceId(cams[0].deviceId);
      }
    } catch {
      // Device enumeration unavailable before permission or unsupported
    }
  }, [selectedDeviceId]);

  useEffect(() => {
    refreshCameraDevices();
    const md = typeof navigator !== 'undefined' ? navigator.mediaDevices : undefined;
    if (!md?.addEventListener) return;
    md.addEventListener('devicechange', refreshCameraDevices);
    return () => md.removeEventListener('devicechange', refreshCameraDevices);
  }, [refreshCameraDevices]);

  // Keep canvas intrinsic dimensions synchronized to camera stream resolution
  const syncCanvasDimensions = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const targetW = video && video.videoWidth > 0 ? video.videoWidth : 960;
    const targetH = video && video.videoHeight > 0 ? video.videoHeight : 640;

    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }
  }, []);

  // Draw crisp standby canvas when camera is inactive
  const paintStandbyCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    syncCanvasDimensions();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#06090F';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle dark architectural coordinate grid
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
    ctx.lineWidth = 1;
    const step = 48;
    for (let x = step; x < canvas.width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = step; y < canvas.height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  }, [syncCanvasDimensions]);

  useEffect(() => {
    paintStandbyCanvas();
  }, [paintStandbyCanvas]);

  // Synchronized rAF Detection + Canvas Render Loop
  const processFrame = useCallback(() => {
    if (!isRunningRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && canvas && video.readyState >= 2 && video.videoWidth > 0) {
      syncCanvasDimensions();
      const ctx = canvas.getContext('2d');

      if (ctx) {
        const now = performance.now();
        frameCountRef.current += 1;
        let nextFps: number | null = null;
        if (frameCountRef.current % 12 === 0) {
          const elapsed = now - lastFpsTimeRef.current;
          if (elapsed > 0) {
            nextFps = Math.min(60, Math.round((12 * 1000) / elapsed));
          }
          lastFpsTimeRef.current = now;
        }

        const frame = humanTrackingService.detectFrame(
          video,
          now,
          {
            enableFace: enableFaceRef.current,
            enableBody: enableBodyRef.current,
            enableHands: enableHandsRef.current,
          },
          isMirroredRef.current
        );

        drawHumanTrackingOverlay(ctx, video, frame, canvas.width, canvas.height, {
          showVideoFeed: showVideoFeedRef.current,
          isMirrored: isMirroredRef.current,
          enableFace: enableFaceRef.current,
          enableBody: enableBodyRef.current,
          enableHands: enableHandsRef.current,
        });

        setStatus((prev) => ({
          cameraActive: true,
          cameraStarting: false,
          engineState: humanTrackingService.getState(),
          faceDetected: frame.faceDetected,
          bodyDetected: frame.bodyDetected,
          leftHandDetected: frame.leftHandDetected,
          rightHandDetected: frame.rightHandDetected,
          fps: nextFps ?? prev.fps,
        }));

        // Connect detected 21-point hands directly to verified gesture classifier + temporal stabilizer
        if (enableHandsRef.current && frame.hands.length > 0) {
          // Evaluate all detected hands and take the highest-confidence verified match
          let bestDetailed = classifyHandPoseDetailed(frame.hands[0].landmarks);
          for (let i = 1; i < frame.hands.length; i++) {
            const candidate = classifyHandPoseDetailed(frame.hands[i].landmarks);
            if (!candidate.isUnknown && candidate.confidence > bestDetailed.confidence) {
              bestDetailed = candidate;
            }
          }

          const stabilized = stabilizerRef.current.update(
            bestDetailed.predictedGesture,
            bestDetailed.confidence
          );

          setRecognitionConfidence(Math.round(stabilized.smoothedConfidence * 100));
          setRecognitionStability(Math.round(stabilized.stabilityScore * 100));
          setRecognitionStatusText(stabilized.statusMessage);

          if (stabilized.isLocked && stabilized.lockedGesture) {
            const locked = stabilized.lockedGesture;
            setRecognizedGesture(locked);

            const timeSinceLast = now - lastTranscriptTimeRef.current;
            const isNew = lastTranscriptGestureRef.current !== locked;
            if (isNew || timeSinceLast > 3500) {
              lastTranscriptGestureRef.current = locked;
              lastTranscriptTimeRef.current = now;
              onSelectGesture(locked);

              const def = GESTURE_DEFINITIONS[locked];
              if (def) {
                setPhraseWords((prev) => [...prev.slice(-15), def.labelEn]);
                setWorkspaceText((prev) => (prev ? `${prev} ${def.labelEn}` : def.labelEn));

                if (autoSpeakRef.current) {
                  speechService.speak(def, isAm ? 'am-ET' : 'en-US', 0.95);
                }
              }
            }
          }
        } else {
          // Strictly clear live prediction state when no hands are tracked
          const stabilized = stabilizerRef.current.update(null, 0);
          setRecognitionConfidence(0);
          setRecognitionStability(0);
          setRecognitionStatusText(
            enableHandsRef.current
              ? stabilized.statusMessage
              : isAm
              ? 'የእጅ መከታተያ ጠፍቷል — ለምልክት ማወቂያ ያብሩት።'
              : 'Hand tracking disabled — enable Hands to classify EthSL signs.'
          );
        }
      }
    }

    if (isRunningRef.current) {
      animFrameRef.current = requestAnimationFrame(processFrame);
    }
  }, [isAm, onSelectGesture, syncCanvasDimensions]);

  const stopCamera = useCallback(
    (preserveError = false) => {
      sessionTokenRef.current += 1;
      isRunningRef.current = false;

      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      stabilizerRef.current.reset();
      lastTranscriptGestureRef.current = null;

      if (!preserveError) {
        setCameraError(null);
      }

      setRecognitionConfidence(0);
      setRecognitionStability(0);
      setRecognitionStatusText(
        isAm
          ? 'ካሜራ ቆሟል — ለመቀጠል "ካሜራ ጀምር" የሚለውን ይጫኑ።'
          : 'Camera inactive — click Start Camera to resume live 2D tracking.'
      );

      setStatus({
        cameraActive: false,
        cameraStarting: false,
        engineState: humanTrackingService.getState(),
        faceDetected: false,
        bodyDetected: false,
        leftHandDetected: false,
        rightHandDetected: false,
        fps: 0,
      });

      paintStandbyCanvas();
    },
    [isAm, paintStandbyCanvas]
  );

  const startCamera = useCallback(
    async (overrideDeviceId?: string) => {
      const targetDevice = overrideDeviceId ?? selectedDeviceId;
      const currentSession = ++sessionTokenRef.current;

      // Stop any prior stream before opening new camera
      isRunningRef.current = false;
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      setCameraError(null);
      setStatus((prev) => ({
        ...prev,
        cameraStarting: true,
        cameraActive: false,
      }));
      setRecognitionStatusText(
        isAm
          ? 'የMediaPipe ፊት፣ ሰውነት እና እጅ ሞዴሎችን በመጫን ላይ...'
          : 'Loading MediaPipe Face, Pose, and Hand Landmarkers...'
      );

      try {
        if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
          throw new Error('Camera API (getUserMedia) is unavailable in this browser.');
        }

        // 1. Request webcam stream & initialize MediaPipe landmarkers
        const videoConstraints: MediaTrackConstraints = targetDevice
          ? { deviceId: { exact: targetDevice }, width: { ideal: 960 }, height: { ideal: 640 } }
          : { facingMode: 'user', width: { ideal: 960 }, height: { ideal: 640 } };

        const [stream, trackerAvail] = await Promise.all([
          navigator.mediaDevices.getUserMedia({ video: videoConstraints, audio: false }),
          humanTrackingService.initialize(),
        ]);

        if (currentSession !== sessionTokenRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        setAvailability(trackerAvail);

        const nextEngineState = humanTrackingService.getState();
        if (nextEngineState === 'error') {
          stream.getTracks().forEach((t) => t.stop());
          setCameraError(
            trackerAvail.errorMessage ||
              'Tracking unavailable — MediaPipe landmark models could not initialize.'
          );
          setStatus((prev) => ({
            ...prev,
            cameraActive: false,
            cameraStarting: false,
            engineState: 'error',
          }));
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        if (currentSession !== sessionTokenRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
          return;
        }

        await refreshCameraDevices();

        isRunningRef.current = true;
        frameCountRef.current = 0;
        lastFpsTimeRef.current = performance.now();

        setStatus({
          cameraActive: true,
          cameraStarting: false,
          engineState: nextEngineState,
          faceDetected: false,
          bodyDetected: false,
          leftHandDetected: false,
          rightHandDetected: false,
          fps: 0,
        });

        setRecognitionStatusText(
          isAm
            ? 'ካሜራ ንቁ ነው — ፊትዎን፣ ሰውነትዎን እና እጆችዎን በክፈፉ ውስጥ ያሳዩ።'
            : 'Camera active — position your face, upper body, and hands inside the frame.'
        );

        animFrameRef.current = requestAnimationFrame(processFrame);
      } catch (err: any) {
        if (currentSession !== sessionTokenRef.current) return;

        let msg = 'Camera permission denied or camera device unavailable.';
        if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
          msg =
            'Camera permission denied. Allow camera access in your browser settings and try again.';
        } else if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
          msg = 'No camera device was detected on this device.';
        } else if (err?.name === 'NotReadableError' || err?.name === 'TrackStartError') {
          msg = 'Camera is currently busy or locked by another application.';
        } else if (err?.message) {
          msg = err.message;
        }

        setCameraError(msg);
        stopCamera(true);
      }
    },
    [isAm, processFrame, refreshCameraDevices, selectedDeviceId, stopCamera]
  );

  const handleDeviceChange = (newDeviceId: string) => {
    setSelectedDeviceId(newDeviceId);
    if (status.cameraActive) {
      startCamera(newDeviceId);
    }
  };

  // Strict cleanup on unmount or route switch
  useEffect(() => {
    return () => {
      sessionTokenRef.current += 1;
      isRunningRef.current = false;
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      humanTrackingService.dispose();
    };
  }, []);

  // Translate live or typed text in side workspace
  const handleTranslateText = async () => {
    const clean = workspaceText.trim();
    if (!clean) {
      showToast(
        isAm ? 'ለመተርጎም መጀመሪያ ጽሑፍ ያስገቡ ወይም ምልክት ይፍጠሩ።' : 'Enter or sign text first to translate.',
        'info'
      );
      return;
    }

    setIsTranslating(true);
    setTranslationNotice(null);
    try {
      const res = await translationService.translate({
        text: clean,
        sourceLang: targetLang === 'Amharic' ? 'English' : 'Amharic',
        targetLang,
      });
      setTranslatedText(res.translatedText);
      setTranslatedPhonetic(res.phoneticPronunciation || '');
      if (res.isOfflineFallback && res.offlineNotice) {
        setTranslationNotice(res.offlineNotice);
      }
    } catch {
      setTranslationNotice('Translation unavailable right now. Please try again.');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleCopyWorkspaceText = async () => {
    const payload = translatedText ? `${workspaceText}\n${translatedText}` : workspaceText;
    if (!payload.trim()) return;
    try {
      await navigator.clipboard.writeText(payload);
      showToast(isAm ? 'ጽሑፉ ተቀድቷል።' : 'Copied text to clipboard.', 'success');
    } catch {
      showToast('Unable to access clipboard.', 'error');
    }
  };

  const handleClearWorkspace = () => {
    setPhraseWords([]);
    setWorkspaceText('');
    setTranslatedText('');
    setTranslatedPhonetic('');
    setTranslationNotice(null);
    setRecognizedGesture(null);
    lastTranscriptGestureRef.current = null;
  };

  // Status Indicator Helpers
  const cameraBadgeTone =
    status.engineState === 'error' || cameraError
      ? 'error'
      : status.cameraActive
      ? 'success'
      : status.cameraStarting
      ? 'warning'
      : 'neutral';

  const cameraBadgeLabel =
    status.engineState === 'error'
      ? isAm
        ? 'መከታተያ አይገኝም'
        : 'Tracking unavailable'
      : status.cameraActive
      ? isAm
        ? 'ካሜራ ንቁ ነው'
        : 'Camera active'
      : status.cameraStarting
      ? isAm
        ? 'በመጀመር ላይ...'
        : 'Starting camera...'
      : isAm
      ? 'ካሜራ ቆሟል'
      : 'Camera inactive';

  return (
    <div className="space-y-5">
      <WorkspaceHeader
        title={
          isAm
            ? '2D የሰውነት አፅም፣ የፊት እና የእጅ መከታተያ ስቱዲዮ'
            : '2D Human Skeleton & Hand Tracking Studio'
        }
        description={
          isAm
            ? 'በቀይ የፊት እና የሰውነት አፅም መስመሮች እንዲሁም በቀለማት የተለዩ የ21-ነጥብ የግራ እና የቀኝ እጅ መከታተያ ከጽሑፍ እና ትርጉም ጋር።'
            : 'Real-time MediaPipe Face, Pose, and dual 21-point Hand tracking rendered on a synchronized 2D dark canvas alongside sign recognition and bilingual translation.'
        }
        icon={<ScanFace className="w-5 h-5" />}
        accent="cyan"
        meta={
          <>
            <StatusBadge tone={cameraBadgeTone}>{cameraBadgeLabel}</StatusBadge>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              {status.cameraActive ? `${status.fps || '--'} FPS` : 'MediaPipe Tasks Vision'}
            </span>
          </>
        }
        actions={
          onOpenVocabulary && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onOpenVocabulary}
              leftIcon={<BookOpen className="w-3.5 h-3.5" />}
            >
              {isAm ? 'EthSL መዝገበ-ቃላት' : 'EthSL Dictionary'}
            </Button>
          )
        }
      />

      {/* Split Workspace: Left Text & Translation Panel + Right Dark 2D Tracking Viewport */}
      <div className="grid lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: Text, Sign Recognition & Translation Workspace */}
        <div className="lg:col-span-5 space-y-4">
          {/* 1. Live Sign Recognition & Output Card */}
          <Card padding="md" className="space-y-4">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-[#253448]">
              <div className="flex items-center gap-2">
                <Hand className="w-4 h-4 text-[#0E7490] dark:text-[#43D9E9]" aria-hidden="true" />
                <h3 className="font-heading text-sm font-bold text-slate-900 dark:text-[#F4F7FB]">
                  {isAm ? 'የምልክት እውቅና እና ትርጉም' : 'Sign Recognition & Output'}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setAutoSpeak((prev) => !prev)}
                aria-pressed={autoSpeak}
                className={`h-7 px-2.5 rounded-[8px] text-[11px] font-semibold border transition-colors cursor-pointer flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9] ${
                  autoSpeak
                    ? 'bg-[#0E7490] dark:bg-[#43D9E9] text-white dark:text-[#080D18] border-transparent'
                    : 'bg-slate-50 dark:bg-[#172438] text-slate-600 dark:text-[#A0AEC0] border-slate-200 dark:border-[#253448]'
                }`}
              >
                <Volume2 className="w-3 h-3" aria-hidden="true" />
                <span>{autoSpeak ? 'Auto-Speak ON' : 'Auto-Speak OFF'}</span>
              </button>
            </div>

            {liveSignDef ? (
              <div className="p-3.5 rounded-[12px] bg-emerald-50/75 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-2xl shrink-0" aria-hidden="true">
                      {liveSignDef.emoji}
                    </span>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
                        Verified Sign Locked
                      </span>
                      <div className="font-heading text-lg font-bold text-slate-900 dark:text-[#F4F7FB] truncate">
                        {liveSignDef.labelEn}
                      </div>
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="font-ethiopic text-base font-bold text-[#0E7490] dark:text-[#43D9E9]">
                          {liveSignDef.labelAm}
                        </span>
                        <span className="text-[11px] font-mono text-slate-600 dark:text-[#A0AEC0]">
                          /{liveSignDef.phoneticAm}/
                        </span>
                      </div>
                    </div>
                  </div>

                  <StatusBadge tone="success" className="font-mono tabular-nums shrink-0">
                    {recognitionConfidence > 0
                      ? `${recognitionConfidence}%`
                      : `${Math.round(liveSignDef.threshold * 100)}%`}
                  </StatusBadge>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => speechService.speak(liveSignDef, 'en-US')}
                    leftIcon={<Volume2 className="w-3.5 h-3.5 text-[#0E7490] dark:text-[#43D9E9]" />}
                  >
                    Speak EN
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => speechService.speak(liveSignDef, 'am-ET')}
                    leftIcon={<Volume2 className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />}
                    className="font-ethiopic"
                  >
                    አማርኛ አሰማ
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-[12px] bg-slate-50 dark:bg-[#172438]/75 border border-slate-200 dark:border-[#253448] space-y-1.5">
                <div className="text-xs font-semibold text-slate-900 dark:text-[#F4F7FB]">
                  {isAm ? 'የቀጥታ ምልክት መጠባበቂያ' : 'Awaiting Verified Sign Pose'}
                </div>
                <p className="text-xs text-slate-600 dark:text-[#A0AEC0] leading-relaxed">
                  {recognitionStatusText}
                </p>
              </div>
            )}

            {/* Temporal Confidence & Frame Stability Meter */}
            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between text-slate-600 dark:text-[#A0AEC0]">
                <span>{isAm ? 'የተረጋጋ ክትትል እርግጠኝነት' : 'Temporal Frame Stability'}</span>
                <span className="font-mono tabular-nums text-[#0E7490] dark:text-[#43D9E9]">
                  {recognitionStability}% · {recognitionConfidence}% conf
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-[#080D18] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#0E7490] to-emerald-500 dark:from-[#43D9E9] dark:to-emerald-400 transition-all duration-150"
                  style={{ width: `${Math.max(0, Math.min(100, recognitionStability))}%` }}
                />
              </div>
              {liveSignDef && (
                <p className="text-[11px] text-slate-600 dark:text-[#A0AEC0] pt-0.5">
                  {recognitionStatusText}
                </p>
              )}
            </div>
          </Card>

          {/* 2. Text & Translation Workspace (matching reference side workspace) */}
          <Card padding="md" className="space-y-3.5">
            <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-200 dark:border-[#253448]">
              <div className="flex items-center gap-2">
                <Languages className="w-4 h-4 text-[#4F46E5] dark:text-[#8585FF]" aria-hidden="true" />
                <h3 className="font-heading text-sm font-bold text-slate-900 dark:text-[#F4F7FB]">
                  {isAm ? 'የጽሑፍ እና የትርጉም ቦታ' : 'Text & Translation Workspace'}
                </h3>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleCopyWorkspaceText}
                  disabled={!workspaceText.trim() && !translatedText.trim()}
                  title="Copy text"
                  aria-label="Copy text"
                  className="w-7 h-7 rounded-[7px] border border-slate-200 dark:border-[#253448] text-slate-600 dark:text-[#A0AEC0] hover:text-slate-900 dark:hover:text-[#F4F7FB] disabled:opacity-40 flex items-center justify-center cursor-pointer transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleClearWorkspace}
                  disabled={!workspaceText.trim() && !translatedText.trim() && phraseWords.length === 0}
                  title="Clear workspace"
                  aria-label="Clear workspace"
                  className="w-7 h-7 rounded-[7px] border border-slate-200 dark:border-[#253448] text-slate-600 dark:text-[#A0AEC0] hover:text-rose-600 dark:hover:text-rose-400 disabled:opacity-40 flex items-center justify-center cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {phraseWords.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {phraseWords.map((word, idx) => (
                  <span
                    key={`${word}-${idx}`}
                    className="px-2 py-0.5 rounded-[6px] text-[11px] font-medium bg-cyan-50 dark:bg-[#172438] text-[#0E7490] dark:text-[#43D9E9] border border-cyan-200/80 dark:border-[#253448]"
                  >
                    {word}
                  </span>
                ))}
              </div>
            )}

            <TextArea
              label={isAm ? 'የተለዩ ምልክቶች ወይም ጽሑፍ' : 'Sign Transcript or Typed Text'}
              value={workspaceText}
              onChange={(e) => setWorkspaceText(e.target.value)}
              rows={3}
              placeholder={
                isAm
                  ? 'የተለዩ ምልክቶች እዚህ ይታያሉ፣ ወይም ለመተርጎም ጽሑፍ ይጻፉ...'
                  : 'Verified signs appear here automatically, or type text to translate and speak...'
              }
            />

            <div className="flex flex-wrap items-center gap-2">
              <div className="min-w-[140px] flex-1">
                <SelectField
                  aria-label="Target translation language"
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value as 'Amharic' | 'English')}
                >
                  <option value="Amharic">Translate to Amharic (አማርኛ)</option>
                  <option value="English">Translate to English</option>
                </SelectField>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={handleTranslateText}
                isLoading={isTranslating}
                disabled={!workspaceText.trim()}
              >
                {isAm ? 'ተርጉም' : 'Translate'}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={!workspaceText.trim()}
                onClick={() =>
                  speechService.speakCustomText(
                    workspaceText,
                    targetLang === 'Amharic' ? 'en-US' : 'am-ET',
                    0.95
                  )
                }
                leftIcon={<Volume2 className="w-3.5 h-3.5" />}
              >
                {isAm ? 'አንብብ' : 'Speak'}
              </Button>
            </div>

            {translatedText && (
              <div className="p-3 rounded-[10px] bg-indigo-50/75 dark:bg-[#172438] border border-indigo-200/80 dark:border-[#253448] space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#4F46E5] dark:text-[#8585FF]">
                    {targetLang} Translation
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      speechService.speakCustomText(
                        translatedText,
                        targetLang === 'Amharic' ? 'am-ET' : 'en-US',
                        0.95
                      )
                    }
                    className="text-[11px] font-semibold text-[#0E7490] dark:text-[#43D9E9] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Volume2 className="w-3 h-3" /> Speak
                  </button>
                </div>
                <p className="text-sm font-semibold text-slate-900 dark:text-[#F4F7FB] font-ethiopic leading-relaxed">
                  {translatedText}
                </p>
                {translatedPhonetic && (
                  <p className="text-[11px] font-mono text-slate-600 dark:text-[#A0AEC0]">
                    /{translatedPhonetic}/
                  </p>
                )}
              </div>
            )}

            {translationNotice && (
              <p className="text-[11px] text-amber-700 dark:text-amber-300">{translationNotice}</p>
            )}
          </Card>

          {/* 3. Clear Tracking Status Indicators Matrix */}
          <Card padding="sm" className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-900 dark:text-[#F4F7FB]">
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[#0E7490] dark:text-[#43D9E9]" aria-hidden="true" />
                <span>{isAm ? 'የመከታተያ ሁኔታ' : 'Tracking Status'}</span>
              </span>
              <span className="text-[11px] font-mono text-slate-600 dark:text-[#A0AEC0]">
                {status.cameraActive ? `${status.fps || '--'} FPS` : 'Standby'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                {
                  id: 'face',
                  label: isAm ? 'የፊት መከታተያ' : 'Face Tracking',
                  activeText: 'Face detected',
                  idleText: !enableFace
                    ? 'Disabled'
                    : status.cameraActive && !availability.face
                    ? 'Tracking unavailable'
                    : 'Standby',
                  detected: status.cameraActive && enableFace && status.faceDetected,
                  unavailable: status.cameraActive && enableFace && !availability.face,
                  swatch: 'bg-[#FF3B30]',
                },
                {
                  id: 'body',
                  label: isAm ? 'የሰውነት አፅም' : 'Body Skeleton',
                  activeText: 'Body detected',
                  idleText: !enableBody
                    ? 'Disabled'
                    : status.cameraActive && !availability.body
                    ? 'Tracking unavailable'
                    : 'Standby',
                  detected: status.cameraActive && enableBody && status.bodyDetected,
                  unavailable: status.cameraActive && enableBody && !availability.body,
                  swatch: 'bg-[#FF3B30]',
                },
                {
                  id: 'left-hand',
                  label: isAm ? 'ግራ እጅ (21-pt)' : 'Left Hand (21-pt)',
                  activeText: 'Left hand detected',
                  idleText: !enableHands
                    ? 'Disabled'
                    : status.cameraActive && !availability.hands
                    ? 'Tracking unavailable'
                    : 'Standby',
                  detected: status.cameraActive && enableHands && status.leftHandDetected,
                  unavailable: status.cameraActive && enableHands && !availability.hands,
                  swatch: 'bg-[#06B6D4]',
                },
                {
                  id: 'right-hand',
                  label: isAm ? 'ቀኝ እጅ (21-pt)' : 'Right Hand (21-pt)',
                  activeText: 'Right hand detected',
                  idleText: !enableHands
                    ? 'Disabled'
                    : status.cameraActive && !availability.hands
                    ? 'Tracking unavailable'
                    : 'Standby',
                  detected: status.cameraActive && enableHands && status.rightHandDetected,
                  unavailable: status.cameraActive && enableHands && !availability.hands,
                  swatch: 'bg-[#F59E0B]',
                },
              ].map((row) => (
                <div
                  key={row.id}
                  className="p-2.5 rounded-[10px] bg-slate-50 dark:bg-[#172438]/75 border border-slate-200 dark:border-[#253448] space-y-1"
                >
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 dark:text-[#A0AEC0]">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${row.swatch}`} aria-hidden="true" />
                    <span className="truncate">{row.label}</span>
                  </div>
                  <div>
                    <StatusBadge
                      tone={row.unavailable ? 'error' : row.detected ? 'success' : 'neutral'}
                    >
                      {row.detected ? row.activeText : row.idleText}
                    </StatusBadge>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* 4. Compact Reference Pose Inspector */}
          <Card padding="sm" className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-900 dark:text-[#F4F7FB]">
                {isAm ? 'የምልክት ልምምድ መመሪያ' : 'Sign Practice Reference'}
              </span>
              <span className="text-[11px] font-mono text-slate-600 dark:text-[#A0AEC0]">
                {referenceGesture.labelEn}
              </span>
            </div>

            <div className="grid grid-cols-12 gap-3 items-center">
              <div className="col-span-5">
                <HandPoseDiagram gestureKey={referenceGesture.id} variant="stage" />
              </div>
              <div className="col-span-7 space-y-1.5 text-xs">
                <div className="font-semibold text-slate-900 dark:text-[#F4F7FB] flex items-center gap-1.5">
                  <span aria-hidden="true">{referenceGesture.emoji}</span>
                  <span>{referenceGesture.labelEn}</span>
                  <span className="font-ethiopic text-[#0E7490] dark:text-[#43D9E9]">
                    · {referenceGesture.labelAm}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-[#A0AEC0] leading-relaxed">
                  {referenceGesture.poseInstructions}
                </p>
              </div>
            </div>

            <div
              className="grid grid-cols-3 sm:grid-cols-4 gap-1.5"
              role="group"
              aria-label="Select EthSL Practice Reference"
            >
              {GESTURE_LIST.map((g) => {
                const isSelected = g.id === referenceGesture.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => onSelectGesture(g.id)}
                    className={`min-h-[32px] px-2 py-1 rounded-[7px] text-[11px] font-medium border transition-colors cursor-pointer flex items-center gap-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9] ${
                      isSelected
                        ? 'bg-[#0E7490]/10 dark:bg-[#43D9E9]/15 border-[#0E7490] dark:border-[#43D9E9] text-[#0E7490] dark:text-[#43D9E9] font-semibold'
                        : 'bg-slate-50 dark:bg-[#172438] border-slate-200 dark:border-[#253448] text-slate-700 dark:text-[#A0AEC0] hover:text-slate-900 dark:hover:text-[#F4F7FB]'
                    }`}
                  >
                    <span aria-hidden="true" className="shrink-0">
                      {g.emoji}
                    </span>
                    <span className="truncate font-ethiopic">
                      {isAm ? g.labelAm : g.labelEn}
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN: Dark 2D Visualization Panel (Face, Body Skeleton & Colorful Hands) */}
        <div className="lg:col-span-7 space-y-4">
          <Card padding="none" className="overflow-hidden border-slate-200 dark:border-[#253448]">
            {/* Top Controls Toolbar */}
            <div className="p-3.5 sm:p-4 bg-slate-50/90 dark:bg-[#101C2C] border-b border-slate-200 dark:border-[#253448] flex flex-wrap items-center justify-between gap-2.5">
              {/* Camera Start / Stop & Device Select */}
              <div className="flex flex-wrap items-center gap-2">
                {!status.cameraActive ? (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => startCamera()}
                    isLoading={status.cameraStarting}
                    leftIcon={<Video className="w-4 h-4" />}
                  >
                    {isAm ? 'ካሜራ ጀምር' : 'Start Camera'}
                  </Button>
                ) : (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => stopCamera(false)}
                    leftIcon={<VideoOff className="w-4 h-4" />}
                  >
                    {isAm ? 'ካሜራ አቁም' : 'Stop Camera'}
                  </Button>
                )}

                {devices.length > 0 && (
                  <select
                    aria-label="Select camera device"
                    value={selectedDeviceId}
                    onChange={(e) => handleDeviceChange(e.target.value)}
                    className="h-8 max-w-[180px] px-2.5 rounded-[8px] text-xs font-medium bg-white dark:bg-[#172438] text-slate-800 dark:text-[#F4F7FB] border border-slate-300/80 dark:border-[#253448] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9]"
                  >
                    {devices.map((cam) => (
                      <option key={cam.deviceId} value={cam.deviceId}>
                        {cam.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Independent Tracking Layer Toggles + View Mode */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  {
                    id: 'toggle-face',
                    label: 'Face',
                    active: enableFace,
                    onClick: () => setEnableFace((v) => !v),
                    icon: <ScanFace className="w-3.5 h-3.5" aria-hidden="true" />,
                    activeClass:
                      'bg-rose-500/15 border-rose-500/60 text-rose-700 dark:text-rose-300 font-semibold',
                  },
                  {
                    id: 'toggle-body',
                    label: 'Body',
                    active: enableBody,
                    onClick: () => setEnableBody((v) => !v),
                    icon: <User className="w-3.5 h-3.5" aria-hidden="true" />,
                    activeClass:
                      'bg-rose-500/15 border-rose-500/60 text-rose-700 dark:text-rose-300 font-semibold',
                  },
                  {
                    id: 'toggle-hands',
                    label: 'Hands',
                    active: enableHands,
                    onClick: () => setEnableHands((v) => !v),
                    icon: <Hand className="w-3.5 h-3.5" aria-hidden="true" />,
                    activeClass:
                      'bg-[#0E7490]/15 dark:bg-[#43D9E9]/15 border-[#0E7490]/60 dark:border-[#43D9E9]/60 text-[#0E7490] dark:text-[#43D9E9] font-semibold',
                  },
                ].map((toggle) => (
                  <button
                    key={toggle.id}
                    type="button"
                    aria-pressed={toggle.active}
                    onClick={toggle.onClick}
                    className={`h-8 px-2.5 rounded-[8px] text-xs border transition-colors cursor-pointer flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9] ${
                      toggle.active
                        ? toggle.activeClass
                        : 'bg-white dark:bg-[#172438] border-slate-200 dark:border-[#253448] text-slate-600 dark:text-[#A0AEC0]'
                    }`}
                  >
                    {toggle.icon}
                    <span>{toggle.label}</span>
                    {toggle.active && <Check className="w-3 h-3" aria-hidden="true" />}
                  </button>
                ))}

                <button
                  type="button"
                  aria-pressed={!showVideoFeed}
                  onClick={() => setShowVideoFeed((v) => !v)}
                  title={
                    showVideoFeed
                      ? 'Switch to Dark Skeleton Backdrop (no raw camera video)'
                      : 'Show Camera Feed beneath Skeleton Overlay'
                  }
                  className={`h-8 px-2.5 rounded-[8px] text-xs border transition-colors cursor-pointer flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9] ${
                    !showVideoFeed
                      ? 'bg-[#080D18] text-[#43D9E9] border-[#43D9E9]/60 font-semibold'
                      : 'bg-white dark:bg-[#172438] border-slate-200 dark:border-[#253448] text-slate-700 dark:text-[#F4F7FB]'
                  }`}
                >
                  {showVideoFeed ? (
                    <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                  <span>{showVideoFeed ? 'Camera + 2D' : 'Dark Canvas'}</span>
                </button>

                <button
                  type="button"
                  aria-pressed={isMirrored}
                  onClick={() => setIsMirrored((v) => !v)}
                  title="Mirror tracking canvas horizontally"
                  aria-label="Toggle mirror view"
                  className={`h-8 w-8 rounded-[8px] border transition-colors cursor-pointer flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9] ${
                    isMirrored
                      ? 'bg-[#0E7490]/12 dark:bg-[#43D9E9]/15 border-[#0E7490]/50 dark:border-[#43D9E9]/50 text-[#0E7490] dark:text-[#43D9E9]'
                      : 'bg-white dark:bg-[#172438] border-slate-200 dark:border-[#253448] text-slate-600 dark:text-[#A0AEC0]'
                  }`}
                >
                  <FlipHorizontal className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Dark Visualization Canvas Stage */}
            <div
              ref={stageContainerRef}
              className="relative w-full aspect-[4/3] bg-[#06090F] overflow-hidden flex items-center justify-center"
            >
              {/* Hidden raw video source processed by MediaPipe & composited onto synchronized canvas */}
              <video
                ref={videoRef}
                playsInline
                muted
                aria-hidden="true"
                className="sr-only"
              />

              <canvas
                ref={canvasRef}
                aria-label="Real-time 2D Face, Body Skeleton, and Hand Tracking Overlay"
                className="w-full h-full object-contain block"
              />

              {/* Camera Standby Overlay */}
              {!status.cameraActive && !status.cameraStarting && !cameraError && (
                <div className="absolute inset-0 bg-[#06090F]/88 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#101C2C] border border-[#253448] flex items-center justify-center text-[#43D9E9]">
                    <Camera className="w-7 h-7" aria-hidden="true" />
                  </div>
                  <div className="max-w-md space-y-1.5">
                    <h4 className="font-heading text-base sm:text-lg font-bold text-[#F4F7FB]">
                      {isAm ? '2D የሰውነት እና የእጅ መከታተያ ዝግጁ ነው' : '2D Tracking Canvas Ready'}
                    </h4>
                    <p className="text-xs text-[#A0AEC0] leading-relaxed">
                      {isAm
                        ? 'የቀጥታ ካሜራውን ሲጀምሩ የፊት መስመሮች (በቀይ)፣ የሰውነት አፅም (በቀይ) እና የሁለቱም እጆች 21 ነጥቦች (በቀለማት) በቅጽበት ይሳላሉ።'
                        : 'Start your camera to visualize red facial contours, red 2D upper-body skeleton connections, and multi-colored 21-point left and right hand landmarks in real time.'}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2.5">
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => startCamera()}
                      leftIcon={<Video className="w-4 h-4" />}
                    >
                      {isAm ? 'ካሜራ ጀምር' : 'Start Camera'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Loading Models Overlay */}
              {status.cameraStarting && (
                <div className="absolute inset-0 bg-[#06090F]/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-[#43D9E9] animate-spin motion-reduce:animate-none" />
                  <p className="text-xs font-medium text-[#F4F7FB]">
                    Initializing MediaPipe Face, Body Pose &amp; Dual-Hand Landmarkers...
                  </p>
                </div>
              )}

              {/* Permission Denied / Tracking Unavailable Error Overlay */}
              {cameraError && (
                <div className="absolute inset-0 bg-[#06090F]/92 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/40 flex items-center justify-center text-rose-400">
                    <AlertTriangle className="w-6 h-6" aria-hidden="true" />
                  </div>
                  <div className="max-w-md space-y-1">
                    <h4 className="font-heading text-base font-bold text-[#F4F7FB]">
                      {status.engineState === 'error' ? 'Tracking Unavailable' : 'Camera Access Needed'}
                    </h4>
                    <p className="text-xs text-[#A0AEC0] leading-relaxed">{cameraError}</p>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => startCamera()}
                    leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                  >
                    Retry Camera
                  </Button>
                </div>
              )}
            </div>

            {/* Bottom Legend Bar inside Dark Stage Card */}
            <div className="px-4 py-2.5 bg-[#080D18] border-t border-[#253448] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#A0AEC0]">
              <div className="flex flex-wrap items-center gap-4">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-[#FF3B30] rounded-full" aria-hidden="true" />
                  <span>Face &amp; Body Skeleton (Red)</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-0.5" aria-hidden="true">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#EC4899]" />
                  </span>
                  <span>21-Landmark Hands (Color-Coded)</span>
                </span>
              </div>
              <span className="font-mono tabular-nums text-[10px]">
                {status.cameraActive
                  ? `${status.leftHandDetected || status.rightHandDetected ? 'Hands Live' : 'Scanning'} · On-Device`
                  : 'Zero video uploaded'}
              </span>
            </div>
          </Card>

          {availability.errorMessage && status.engineState === 'partial' && (
            <Alert variant="warning" title="Partial Tracking Availability">
              {availability.errorMessage}. Other enabled trackers continue running on-device.
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
};
