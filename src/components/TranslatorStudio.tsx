import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Video,
  VideoOff,
  RefreshCw,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Trash2,
  Activity,
  Target,
  Database,
  Undo2,
  PlusCircle,
  Eye,
  HelpCircle,
  RotateCcw,
  Cpu,
  Clock,
  ShieldCheck,
  FlaskConical,
  Edit2,
  Save,
  X,
} from 'lucide-react';
import {
  GestureKey,
  TranslationHistoryItem,
  TranscriptItem,
  LandmarkPoint,
  DetectedHand,
  SystemDetectionStatus,
} from '../types';
import { GESTURE_DEFINITIONS, GESTURE_LIST } from '../data/gestures';
import {
  classifyHandPoseDetailed,
  ClassificationResult,
} from '../services/gestureClassifier';
import { TemporalStabilizer } from '../services/temporalStabilizer';
import { speechService } from '../services/speechService';
import {
  handLandmarkerService,
  ModelLifecycleState,
  DelegateType,
} from '../services/handLandmarkerService';
import { DatasetCollectorModal } from './DatasetCollectorModal';
import { EvaluationLabModal } from './EvaluationLabModal';
import { CameraStandbyEthslGuide } from './CameraStandbyEthslGuide';
import {
  Alert,
  Button,
  Card,
  IconButton,
  LoadingState,
  PermissionDeniedState,
  SelectField,
  StatusBadge,
  TextField,
  WorkspaceHeader,
  useToast,
} from './ui';

interface TranslatorStudioProps {
  onGestureRecognized?: (gestureKey: GestureKey) => void;
  activeGestureKey: GestureKey;
  onLiveLandmarksUpdate?: (landmarks: LandmarkPoint[], handedness: string) => void;
  embedded?: boolean;
}

export const TranslatorStudio: React.FC<TranslatorStudioProps> = ({
  onGestureRecognized,
  activeGestureKey,
  onLiveLandmarksUpdate,
  embedded = false,
}) => {
  const { showToast } = useToast();
  // DOM References
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Camera & Detection State Machine (Phase B Hardened)
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [detectionStatus, setDetectionStatus] = useState<SystemDetectionStatus>('ready');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isMirrored, setIsMirrored] = useState(true);

  // Pipeline Diagnostics & Freshness Tracking
  const [modelEngineState, setModelEngineState] = useState<ModelLifecycleState>(handLandmarkerService.getState());
  const [modelDelegate, setModelDelegate] = useState<DelegateType>(handLandmarkerService.getDelegate());
  const [lastDetectionTimestamp, setLastDetectionTimestamp] = useState<number | null>(null);
  const [lastDetectionTimeText, setLastDetectionTimeText] = useState<string>('None yet');
  const [currentRecognitionSource, setCurrentRecognitionSource] = useState<'camera' | 'simulation' | null>(null);

  // Real-Time Metrics & Predictions
  const [fps, setFps] = useState(0);
  const [handsDetected, setHandsDetected] = useState(0);
  const [currentHandedness, setCurrentHandedness] = useState('Right');
  const [liveLandmarks, setLiveLandmarks] = useState<LandmarkPoint[]>([]);
  const [detectedHandsList, setDetectedHandsList] = useState<DetectedHand[]>([]);
  const [multiHandClassifications, setMultiHandClassifications] = useState<{
    handedness: string;
    gesture: GestureKey | 'unknown' | null;
    confidence: number;
    labelEn: string;
  }[]>([]);
  const [classificationResult, setClassificationResult] = useState<ClassificationResult | null>(null);
  const [currentConfidence, setCurrentConfidence] = useState(0);
  const [stabilityScore, setStabilityScore] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Camera standby — Click "Start Camera" to initialize on-device vision.');

  // Translation Output & Settings
  const [selectedLanguage, setSelectedLanguage] = useState<'en-US' | 'am-ET' | 'es-ES' | 'fr-FR' | 'ar-SA'>('en-US');
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lockedGesture, setLockedGesture] = useState<GestureKey | null>(null);

  // Transcript Buffer
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [copiedTranscript, setCopiedTranscript] = useState(false);
  const lastTranscribedGestureRef = useRef<GestureKey | null>(null);
  const lastTranscribedTimeRef = useRef<number>(0);

  // History Log
  const [history, setHistory] = useState<TranslationHistoryItem[]>([]);

  // Dataset Collector & Evaluation Lab Modals
  const [isDatasetModalOpen, setIsDatasetModalOpen] = useState(false);
  const [isEvalLabOpen, setIsEvalLabOpen] = useState(false);

  // Services & Internal Tracking (Monotonic Session Token to prevent async race conditions)
  const stabilizerRef = useRef<TemporalStabilizer>(new TemporalStabilizer());
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const sessionTokenRef = useRef(0);
  const frameCountRef = useRef(0);
  const lastFpsTimeRef = useRef(performance.now());
  const isRunningRef = useRef(false);

  // Sync external active gesture
  useEffect(() => {
    if (activeGestureKey && activeGestureKey !== lockedGesture) {
      setLockedGesture(activeGestureKey);
    }
  }, [activeGestureKey]);

  // Draw landmarks for all detected hands (up to 2 hands) with distinct color coding & wrist badges
  const drawDetectedHands = (
    ctx: CanvasRenderingContext2D,
    hands: DetectedHand[],
    width: number,
    height: number
  ) => {
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4],       // Thumb
      [0, 5], [5, 6], [6, 7], [7, 8],       // Index
      [0, 9], [9, 10], [10, 11], [11, 12],  // Middle
      [0, 13], [13, 14], [14, 15], [15, 16],// Ring
      [0, 17], [17, 18], [18, 19], [19, 20] // Pinky
    ];

    hands.forEach((hand) => {
      const isLeft = hand.handedness === 'Left';
      // Left hand: Vibrant Cyan/Sky palette; Right hand: Axum Gold/Emerald palette
      const strokeColor = isLeft ? '#22d3ee' : '#eab308';
      const nodeColor = isLeft ? '#38bdf8' : '#10b981';

      ctx.save();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 3.5;

      for (const [start, end] of connections) {
        if (hand.landmarks[start] && hand.landmarks[end]) {
          ctx.beginPath();
          ctx.moveTo(hand.landmarks[start].x * width, hand.landmarks[start].y * height);
          ctx.lineTo(hand.landmarks[end].x * width, hand.landmarks[end].y * height);
          ctx.stroke();
        }
      }

      ctx.fillStyle = nodeColor;
      for (const lm of hand.landmarks) {
        ctx.beginPath();
        ctx.arc(lm.x * width, lm.y * height, 4.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Floating hand identification badge above wrist
      const wrist = hand.landmarks[0];
      if (wrist) {
        const badgeX = wrist.x * width;
        const badgeY = Math.max(24, wrist.y * height - 20);

        ctx.fillStyle = isLeft ? 'rgba(8, 145, 178, 0.9)' : 'rgba(180, 83, 9, 0.9)';
        ctx.beginPath();
        ctx.roundRect(badgeX - 44, badgeY - 12, 88, 22, 6);
        ctx.fill();

        ctx.strokeStyle = isLeft ? '#67e8f9' : '#fde047';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${hand.handedness} Hand`, badgeX, badgeY - 1);
      }
      ctx.restore();
    });
  };

  // Speak gesture
  const triggerSpeech = useCallback((gestureKey: GestureKey) => {
    const def = GESTURE_DEFINITIONS[gestureKey];
    if (!def) return;

    speechService.speak(
      def,
      selectedLanguage,
      0.95,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false),
      () => setIsSpeaking(false)
    );
  }, [selectedLanguage]);

  // Add Item to History
  const addToHistory = useCallback((gestureKey: GestureKey, confidence: number, source: 'camera' | 'simulation') => {
    const def = GESTURE_DEFINITIONS[gestureKey];
    if (!def) return;

    const newItem: TranslationHistoryItem = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      gestureKey,
      labelEn: def.labelEn,
      labelAm: def.labelAm,
      phoneticAm: def.phoneticAm,
      emoji: def.emoji,
      confidence: Math.round(confidence * 100),
      source,
    };

    setHistory((prev) => [newItem, ...prev.slice(0, 9)]);
  }, []);

  // Transcript Controls with Held-Sign Debouncing & Source Tracking
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editTextEn, setEditTextEn] = useState('');
  const [editTextAm, setEditTextAm] = useState('');

  const appendToTranscript = useCallback((gestureKey: GestureKey, confidence: number, source: 'camera' | 'simulation' = 'camera') => {
    const def = GESTURE_DEFINITIONS[gestureKey];
    if (!def) return;

    const newItem: TranscriptItem = {
      id: `tr-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      textEn: def.labelEn,
      textAm: def.labelAm,
      phoneticAm: def.phoneticAm,
      emoji: def.emoji,
      gestureKey,
      confidence: Math.round(confidence * 100),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      source,
    };

    setTranscript((prev) => [...prev, newItem]);
  }, []);

  const handleStartEdit = (item: TranscriptItem) => {
    setEditingItemId(item.id);
    setEditTextEn(item.textEn);
    setEditTextAm(item.textAm);
  };

  const handleSaveEdit = () => {
    if (!editingItemId) return;
    setTranscript((prev) =>
      prev.map((t) =>
        t.id === editingItemId
          ? {
              ...t,
              textEn: editTextEn.trim() || t.textEn,
              textAm: editTextAm.trim() || t.textAm,
              isEdited: true,
            }
          : t
      )
    );
    setEditingItemId(null);
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
  };

  const handleDeleteTranscriptItem = (id: string) => {
    setTranscript((prev) => prev.filter((t) => t.id !== id));
  };

  const handleSpeakFullTranscript = () => {
    if (transcript.length === 0) return;
    const fullText = transcript.map((t) => t.textEn).join('. ');
    speechService.speakCustomText(
      fullText,
      selectedLanguage,
      0.95,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false),
      () => setIsSpeaking(false)
    );
  };

  const handleUndoTranscript = () => {
    setTranscript((prev) => prev.slice(0, -1));
  };

  const handleClearTranscript = () => {
    setTranscript([]);
    lastTranscribedGestureRef.current = null;
    showToast('Transcript cleared', 'info');
  };

  const handleCopyTranscript = () => {
    if (transcript.length === 0) return;
    const fullText = transcript
      .map((t) => `${t.emoji} ${t.textEn} (${t.textAm})`)
      .join(' • ');

    navigator.clipboard.writeText(fullText);
    setCopiedTranscript(true);
    showToast('Transcript copied to clipboard', 'success');
    setTimeout(() => setCopiedTranscript(false), 2500);
  };

  // Video Frame Loop using modern HandLandmarkerService
  const processFrame = useCallback(() => {
    if (!isRunningRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && canvas && video.readyState >= 2) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Calculate FPS
        frameCountRef.current++;
        if (frameCountRef.current % 15 === 0) {
          const now = performance.now();
          const currentFps = Math.min(60, Math.round(1000 / ((now - lastFpsTimeRef.current) / 15)));
          lastFpsTimeRef.current = now;
          setFps(currentFps);
        }

        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (isMirrored) {
          ctx.scale(-1, 1);
          ctx.translate(-canvas.width, 0);
        }

        // Draw camera frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Detect hand landmarks using MediaPipe (up to 2 hands)
        const detection = handLandmarkerService.detectVideoFrame(video, performance.now());

        if (detection.hasHand && detection.hands.length > 0 && detection.isValid) {
          setDetectionStatus('hand_detected');
          setCurrentRecognitionSource('camera');
          setHandsDetected(detection.handCount);
          setDetectedHandsList(detection.hands);
          setCurrentHandedness(
            detection.handCount > 1
              ? `Dual Hands (${detection.hands.map((h) => h.handedness).join(' + ')})`
              : detection.handedness
          );
          setLiveLandmarks(detection.landmarks);
          onLiveLandmarksUpdate?.(detection.landmarks, detection.handedness);

          const now = performance.now();
          setLastDetectionTimestamp(now);
          setLastDetectionTimeText(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

          // Draw skeleton overlays for all detected hands
          drawDetectedHands(ctx, detection.hands, canvas.width, canvas.height);

          // Classify all detected hands simultaneously
          const multiResults = detection.hands.map((h) => {
            const cls = classifyHandPoseDetailed(h.landmarks);
            const def = cls.predictedGesture ? GESTURE_DEFINITIONS[cls.predictedGesture] : null;
            return {
              handedness: h.handedness,
              gesture: cls.predictedGesture,
              confidence: Math.round(cls.confidence * 100),
              labelEn: def ? def.labelEn : 'Neutral / Motion',
            };
          });
          setMultiHandClassifications(multiResults);

          // Primary hand feature extraction & temporal stabilization
          const detailed = classifyHandPoseDetailed(detection.landmarks);
          setClassificationResult(detailed);

          // Temporal smoothing & lock verification
          const stabilized = stabilizerRef.current.update(
            detailed.predictedGesture,
            detailed.confidence
          );

          setCurrentConfidence(Math.round(stabilized.smoothedConfidence * 100));
          setStabilityScore(Math.round(stabilized.stabilityScore * 100));
          setStatusMessage(
            detection.handCount > 1
              ? `Dual Hands Active (2 detected) — Tracking ${stabilized.lockedGesture || detailed.predictedGesture || 'poses'}...`
              : stabilized.statusMessage
          );

          if (stabilized.isLocked && stabilized.lockedGesture) {
            const currentLock = stabilized.lockedGesture;
            setLockedGesture(currentLock);

            // Debounced held-sign transcript addition:
            // Only add once per stable pose lock; don't re-add unless gesture changes or 3.5s elapsed
            const timeSinceLast = now - lastTranscribedTimeRef.current;
            const isNewGesture = lastTranscribedGestureRef.current !== currentLock;

            if (isNewGesture || timeSinceLast > 3500) {
              lastTranscribedGestureRef.current = currentLock;
              lastTranscribedTimeRef.current = now;
              appendToTranscript(currentLock, stabilized.smoothedConfidence, 'camera');
              addToHistory(currentLock, stabilized.smoothedConfidence, 'camera');
              onGestureRecognized?.(currentLock);

              if (autoSpeak) {
                triggerSpeech(currentLock);
              }
            }
          }
        } else {
          // Strictly flush out landmarks to prevent stale caching
          setDetectionStatus('no_hand_detected');
          setHandsDetected(0);
          setDetectedHandsList([]);
          setMultiHandClassifications([]);
          setLiveLandmarks([]);
          onLiveLandmarksUpdate?.([], 'Right');
          setClassificationResult(null);

          const stabilized = stabilizerRef.current.update(null, 0);
          setCurrentConfidence(0);
          setStabilityScore(0);
          setStatusMessage(stabilized.statusMessage);
        }

        ctx.restore();
      }
    }

    if (isRunningRef.current) {
      animFrameIdRef.current = requestAnimationFrame(processFrame);
    }
  }, [isMirrored, autoSpeak, appendToTranscript, addToHistory, onGestureRecognized, triggerSpeech]);

  // Start Camera with Monotonic Session Validation
  const startCamera = async () => {
    const currentSession = ++sessionTokenRef.current;
    try {
      setCameraError(null);
      setDetectionStatus('initializing');
      setStatusMessage('Initializing MediaPipe vision pipeline...');
      setModelEngineState('loading');

      // 1. Initialize HandLandmarker model first
      await handLandmarkerService.initialize();
      if (currentSession !== sessionTokenRef.current) return;

      setModelEngineState(handLandmarkerService.getState());
      setModelDelegate(handLandmarkerService.getDelegate());
      setStatusMessage('MediaPipe model ready. Requesting camera access...');

      // 2. Request user media stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 960 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: false,
      });

      if (currentSession !== sessionTokenRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      if (currentSession !== sessionTokenRef.current) {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
        return;
      }

      setIsCameraActive(true);
      isRunningRef.current = true;
      setDetectionStatus('ready');
      setStatusMessage('Camera ready — Point your hand toward the camera.');
      animFrameIdRef.current = requestAnimationFrame(processFrame);
    } catch (err: any) {
      if (currentSession !== sessionTokenRef.current) return;
      console.warn('Camera initialization error:', err);

      let formattedError = 'Camera permission denied or camera device unavailable.';
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        formattedError = 'Camera permission was denied. Please allow camera permissions in your browser bar.';
      } else if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
        formattedError = 'No camera device found on this system.';
      } else if (err?.name === 'NotReadableError' || err?.name === 'TrackStartError') {
        formattedError = 'Camera is currently locked or in use by another tab or program.';
      } else if (err?.message) {
        formattedError = err.message;
      }

      setCameraError(formattedError);
      setDetectionStatus('error');
      setIsCameraActive(false);
      isRunningRef.current = false;
      setModelEngineState(handLandmarkerService.getState());
      setStatusMessage('Camera error encountered. Please check permissions or retry.');
    }
  };

  // Stop Camera
  const stopCamera = () => {
    sessionTokenRef.current++;
    isRunningRef.current = false;
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsCameraActive(false);
    setDetectionStatus('ready');
    setFps(0);
    setHandsDetected(0);
    setCurrentConfidence(0);
    setStabilityScore(0);
    setLiveLandmarks([]);
    setClassificationResult(null);
    stabilizerRef.current.reset();
    setStatusMessage('Camera standby. Click "Start Camera" to resume.');

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  // Retry Camera
  const retryCamera = () => {
    stopCamera();
    setTimeout(() => {
      startCamera();
    }, 200);
  };

  // Simulate gesture manually
  const handleSimulateGesture = (gestureKey: GestureKey) => {
    setLockedGesture(gestureKey);
    setCurrentRecognitionSource('simulation');
    onGestureRecognized?.(gestureKey);
    addToHistory(gestureKey, 0.94, 'simulation');
    appendToTranscript(gestureKey, 0.94, 'simulation');
    if (autoSpeak) {
      triggerSpeech(gestureKey);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      sessionTokenRef.current++;
      isRunningRef.current = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      handLandmarkerService.close();
    };
  }, []);

  const lockedDef = lockedGesture ? GESTURE_DEFINITIONS[lockedGesture] : null;

  const statusTone =
    detectionStatus === 'hand_detected'
      ? 'success'
      : detectionStatus === 'initializing'
      ? 'warning'
      : detectionStatus === 'error'
      ? 'error'
      : isCameraActive
      ? 'info'
      : 'neutral';

  const statusLabel =
    detectionStatus === 'hand_detected'
      ? handsDetected > 1
        ? 'Dual Hands Detected (2 Active)'
        : `Hand Detected (${currentHandedness})`
      : detectionStatus === 'no_hand_detected'
      ? 'Searching for Hands (1 or 2)...'
      : detectionStatus === 'initializing'
      ? 'Initializing Vision...'
      : detectionStatus === 'error'
      ? 'Camera / Vision Error'
      : isCameraActive
      ? 'Camera Live'
      : 'Camera Standby';

  return (
    <div className="space-y-4">
      {!embedded && (
        <WorkspaceHeader
          title="Live Recognition Studio"
          description="Real-time on-device MediaPipe hand tracking (single & dual hand), temporal pose stabilization, and bilingual English / Amharic sign transcription."
          icon={<Video className="w-5 h-5" />}
          accent="cyan"
          meta={
            <>
              <StatusBadge tone={statusTone}>{statusLabel}</StatusBadge>
              <span className="font-mono tabular-nums text-xs text-slate-600 dark:text-[#A0AEC0]">
                {fps} FPS {handsDetected > 0 ? `· ${handsDetected === 2 ? 'Dual Hands' : `1 Hand (${currentHandedness})`}` : ''}
              </span>
            </>
          }
          actions={
            <>
              {!isCameraActive ? (
                <Button
                  variant="primary"
                  size="md"
                  onClick={startCamera}
                  isLoading={detectionStatus === 'initializing'}
                  leftIcon={<Video className="w-4 h-4" />}
                >
                  Start Camera
                </Button>
              ) : (
                <Button
                  variant="danger"
                  size="md"
                  onClick={stopCamera}
                  leftIcon={<VideoOff className="w-4 h-4" />}
                >
                  Stop Camera
                </Button>
              )}

              {isCameraActive && (
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => setIsMirrored(!isMirrored)}
                  leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                  title="Toggle Mirror View"
                >
                  {isMirrored ? 'Mirrored' : 'Normal'}
                </Button>
              )}

              <Button
                variant="secondary"
                size="md"
                onClick={() => setIsDatasetModalOpen(true)}
                leftIcon={<Database className="w-3.5 h-3.5 text-[#0E7490] dark:text-[#43D9E9]" />}
                title="Collect consented dataset samples for ML model training"
              >
                Dataset Collector
              </Button>

              <Button
                variant="secondary"
                size="md"
                onClick={() => setIsEvalLabOpen(true)}
                leftIcon={<FlaskConical className="w-3.5 h-3.5 text-[#4F46E5] dark:text-[#8585FF]" />}
                title="Open Scientific Evaluation Lab, Confusion Matrix, and Unit Tests"
              >
                Evaluation Lab
              </Button>
            </>
          }
        />
      )}

      {/* Embedded Action Bar (when nested inside TwoWayWorkspace) */}
      {embedded && (
        <Card padding="sm" className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <StatusBadge tone={statusTone}>{statusLabel}</StatusBadge>
            <span className="text-xs text-slate-600 dark:text-[#A0AEC0] font-mono tabular-nums">
              {fps} FPS {handsDetected > 0 ? `· ${handsDetected === 2 ? 'Dual Hands' : `1 Hand (${currentHandedness})`}` : ''}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!isCameraActive ? (
              <Button
                variant="primary"
                size="sm"
                onClick={startCamera}
                isLoading={detectionStatus === 'initializing'}
                leftIcon={<Video className="w-4 h-4" />}
              >
                Start Camera
              </Button>
            ) : (
              <Button
                variant="danger"
                size="sm"
                onClick={stopCamera}
                leftIcon={<VideoOff className="w-4 h-4" />}
              >
                Stop Camera
              </Button>
            )}

            {isCameraActive && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsMirrored(!isMirrored)}
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                {isMirrored ? 'Mirrored' : 'Normal'}
              </Button>
            )}

            {detectionStatus === 'error' && (
              <Button
                variant="outline"
                size="sm"
                onClick={retryCamera}
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Retry Camera
              </Button>
            )}

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsDatasetModalOpen(true)}
              leftIcon={<Database className="w-3.5 h-3.5 text-[#0E7490] dark:text-[#43D9E9]" />}
            >
              Dataset Collector
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsEvalLabOpen(true)}
              leftIcon={<FlaskConical className="w-3.5 h-3.5 text-[#4F46E5] dark:text-[#8585FF]" />}
            >
              Evaluation Lab
            </Button>
          </div>
        </Card>
      )}

      {/* Camera Permission / Initialization Errors */}
      {cameraError && (
        <PermissionDeniedState
          device="camera"
          message={cameraError}
          onRetry={retryCamera}
        />
      )}

      {detectionStatus === 'initializing' && !cameraError && (
        <LoadingState
          title="Initializing On-Device Vision Pipeline"
          description="Loading MediaPipe Hand Landmarker weights and requesting webcam stream..."
          className="py-4"
        />
      )}

      {/* Real-Time Pipeline Diagnostics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-[14px] bg-white dark:bg-[#101C2C] border border-slate-200 dark:border-[#253448] text-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-[10px] bg-[#0E7490]/10 dark:bg-[#43D9E9]/10 text-[#0E7490] dark:text-[#43D9E9]">
            <Activity className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-slate-600 dark:text-[#A0AEC0]">Pipeline State</div>
            <div className="font-semibold text-slate-900 dark:text-[#F4F7FB] capitalize truncate">
              {detectionStatus.replace(/_/g, ' ')}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
            <Cpu className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-slate-600 dark:text-[#A0AEC0]">Vision Engine</div>
            <div className="font-semibold text-slate-900 dark:text-[#F4F7FB] font-mono text-[11px] truncate">
              {modelEngineState === 'loaded' ? `MediaPipe (${modelDelegate})` : `Vision (${modelEngineState})`}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-[10px] bg-[#4F46E5]/10 dark:bg-[#8585FF]/15 text-[#4F46E5] dark:text-[#8585FF]">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-slate-600 dark:text-[#A0AEC0]">Landmarks Tracked</div>
            <div className="font-semibold text-slate-900 dark:text-[#F4F7FB] font-mono tabular-nums text-[11px] truncate">
              {handsDetected === 2
                ? '42 / 42 Pts (Dual)'
                : liveLandmarks.length === 21
                ? '21 / 21 Pts'
                : isCameraActive
                ? '0 Pts (Scanning)'
                : 'Standby'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-400">
            <Clock className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-slate-600 dark:text-[#A0AEC0]">Last Detection</div>
            <div className="font-semibold text-slate-900 dark:text-[#F4F7FB] font-mono tabular-nums text-[11px] truncate">
              {lastDetectionTimeText}
            </div>
          </div>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Primary Camera Viewport & Quick Vocabulary (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div
            className={`relative rounded-[16px] overflow-hidden border border-slate-200 dark:border-[#253448] shadow-sm flex items-center justify-center ${
              !isCameraActive
                ? 'min-h-[540px] md:min-h-[500px] lg:min-h-0 lg:aspect-[4/3] bg-white dark:bg-[#080D18]'
                : 'aspect-[4/3] bg-[#080D18]'
            }`}
          >
            <video ref={videoRef} playsInline muted className="hidden" />

            <canvas
              ref={canvasRef}
              width={960}
              height={720}
              aria-label="Live sign language camera detection preview"
              className={`w-full h-full object-cover ${isMirrored ? 'scale-x-[-1]' : ''} ${!isCameraActive ? 'hidden' : ''}`}
            />

            {!isCameraActive && (
              <CameraStandbyEthslGuide
                variant="overlay"
                onStartCamera={startCamera}
                onSelectGesture={(gestureKey) => handleSimulateGesture(gestureKey)}
              />
            )}

            {isCameraActive && (
              <>
                <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-2 pointer-events-none">
                  <div className="px-3 py-1.5 rounded-[8px] bg-[#080D18]/85 backdrop-blur-md border border-[#253448] text-[11px] text-[#F4F7FB] font-mono truncate max-w-[70%]">
                    {statusMessage}
                  </div>

                  {stabilityScore > 0 && (
                    <div className="px-3 py-1.5 rounded-[8px] bg-[#080D18]/85 backdrop-blur-md border border-emerald-500/40 text-[11px] text-emerald-300 font-mono tabular-nums flex items-center gap-1.5 shrink-0">
                      <Target className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Stability: {stabilityScore}%</span>
                    </div>
                  )}
                </div>

                {handsDetected === 2 && (
                  <div className="absolute bottom-3 inset-x-3 pointer-events-none flex items-center justify-center">
                    <div className="flex flex-wrap items-center justify-center gap-2 px-3.5 py-2 rounded-[10px] bg-[#080D18]/90 backdrop-blur-md border border-[#43D9E9]/50 text-xs shadow-lg">
                      <span className="font-semibold text-[#43D9E9]">Dual Hands Tracked</span>
                      <span className="text-slate-500">·</span>
                      <span className="font-mono tabular-nums text-[11px] text-slate-300">42 Landmarks</span>
                      {multiHandClassifications.length === 2 && (
                        <div className="flex items-center gap-2 border-l border-[#253448] pl-2 font-mono text-[11px]">
                          <span className="text-[#43D9E9]">
                            Left: <strong>{multiHandClassifications.find((h) => h.handedness === 'Left')?.labelEn || 'Active'}</strong>
                          </span>
                          <span className="text-slate-500">|</span>
                          <span className="text-amber-300">
                            Right: <strong>{multiHandClassifications.find((h) => h.handedness === 'Right')?.labelEn || 'Active'}</strong>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Interactive Vocabulary Simulation Row */}
          <Card padding="sm" className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-800 dark:text-[#F4F7FB]">
                Quick Gesture Test Cards
              </span>
              <span className="text-[11px] text-slate-600 dark:text-[#A0AEC0]">
                Test recognition and voice output without a webcam
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {GESTURE_LIST.map((g) => {
                const isSelected = lockedGesture === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => handleSimulateGesture(g.id)}
                    aria-pressed={isSelected}
                    className={`min-h-[36px] px-3 py-1.5 rounded-[10px] text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9] ${
                      isSelected
                        ? 'bg-[#0E7490] dark:bg-[#43D9E9] text-white dark:text-[#080D18] border-transparent font-semibold'
                        : 'bg-slate-50 hover:bg-slate-100 dark:bg-[#172438] dark:hover:bg-[#1e2f4a] text-slate-700 dark:text-[#F4F7FB] border-slate-200 dark:border-[#253448]'
                    }`}
                  >
                    <span aria-hidden="true">{g.emoji}</span>
                    <span>{g.labelEn}</span>
                    <span
                      className={`text-[11px] font-ethiopic ${
                        isSelected ? 'text-white dark:text-[#080D18]' : 'text-slate-600 dark:text-[#A0AEC0]'
                      }`}
                    >
                      ({g.labelAm})
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right Column: Recognition Results, Speech Output & Transcript (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Recognition Output Card */}
          <Card padding="sm" className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-[#253448] pb-2.5">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-[#0E7490] dark:text-[#43D9E9]" aria-hidden="true" />
                <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F4F7FB]">
                  Recognition Output & Speech
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <IconButton
                  variant={autoSpeak ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setAutoSpeak(!autoSpeak)}
                  aria-pressed={autoSpeak}
                  label={autoSpeak ? 'Disable auto speech' : 'Enable auto speech'}
                >
                  {autoSpeak ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </IconButton>

                <SelectField
                  aria-label="Speech output language"
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value as any)}
                  className="min-h-[36px] text-xs py-1"
                >
                  <option value="en-US">English (US)</option>
                  <option value="am-ET">አማርኛ (Amharic)</option>
                </SelectField>
              </div>
            </div>

            {classificationResult && !classificationResult.isUnknown && lockedDef ? (
              <div className="p-3.5 rounded-[12px] bg-cyan-50/70 dark:bg-[#43D9E9]/10 border border-cyan-200 dark:border-[#43D9E9]/30 space-y-2.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-4xl shrink-0" aria-hidden="true">{lockedDef.emoji}</span>
                    <div className="min-w-0">
                      <h4 className="text-lg font-bold text-slate-900 dark:text-[#F4F7FB] truncate">
                        {lockedDef.labelEn}
                      </h4>
                      <div className="text-sm font-bold text-[#0E7490] dark:text-[#43D9E9] font-ethiopic">
                        {lockedDef.labelAm}{' '}
                        <span className="text-xs font-normal text-slate-600 dark:text-[#A0AEC0] font-sans">
                          ("{lockedDef.phoneticAm}")
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xl font-mono tabular-nums font-bold text-emerald-700 dark:text-emerald-400">
                      {currentConfidence}%
                    </div>
                    <span className="text-[11px] text-slate-600 dark:text-[#A0AEC0]">Confidence</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-[#A0AEC0] pt-2 border-t border-cyan-200/60 dark:border-[#43D9E9]/20">
                  <div className="flex-1 min-w-0">
                    <strong className="text-slate-800 dark:text-[#F4F7FB]">Verification:</strong> {classificationResult.reason}
                  </div>
                  <StatusBadge tone={currentRecognitionSource === 'camera' ? 'success' : 'info'}>
                    {currentRecognitionSource === 'camera' ? 'Live Camera' : 'Card Simulation'}
                  </StatusBadge>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => speechService.speak(lockedDef, 'en-US')}
                    leftIcon={<Volume2 className="w-3.5 h-3.5" />}
                  >
                    Speak EN
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => speechService.speak(lockedDef, 'am-ET')}
                    leftIcon={<Volume2 className="w-3.5 h-3.5" />}
                    className="font-ethiopic"
                  >
                    አማርኛ አሰማ
                  </Button>
                </div>
              </div>
            ) : classificationResult && classificationResult.isUnknown ? (
              <Alert variant="warning" title="Unrecognized Hand Pose">
                {classificationResult.reason}. Hand landmarks are detected, but fingers do not match a calibrated static sign yet.
              </Alert>
            ) : lockedDef ? (
              <div className="p-3.5 rounded-[12px] bg-slate-50 dark:bg-[#172438] border border-slate-200 dark:border-[#253448] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-3xl shrink-0" aria-hidden="true">{lockedDef.emoji}</span>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-900 dark:text-[#F4F7FB] truncate">
                      {lockedDef.labelEn}{' '}
                      <span className="font-ethiopic text-[#0E7490] dark:text-[#43D9E9]">· {lockedDef.labelAm}</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-[#A0AEC0]">
                      {isCameraActive ? 'Scanning camera frames...' : 'Selected from quick vocabulary or history'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => triggerSpeech(lockedDef.id)}
                  leftIcon={<Volume2 className="w-3.5 h-3.5" />}
                  disabled={isSpeaking}
                >
                  {isSpeaking ? 'Speaking...' : 'Speak'}
                </Button>
              </div>
            ) : (
              <div className="p-5 text-center text-slate-600 dark:text-[#A0AEC0] border border-dashed border-slate-300 dark:border-[#253448] rounded-[12px] space-y-1.5">
                <Eye className="w-5 h-5 mx-auto text-slate-500 dark:text-[#A0AEC0]" aria-hidden="true" />
                <p className="text-xs font-medium">Start camera or select a gesture card to begin.</p>
              </div>
            )}

            {/* Live Finger Extension Features */}
            {classificationResult && (
              <div className="space-y-2 text-xs">
                <span className="text-slate-600 dark:text-[#A0AEC0] font-semibold text-xs">
                  Finger Extension Telemetry
                </span>
                <div className="grid grid-cols-5 gap-1.5 text-center font-mono text-[11px]">
                  {[
                    { name: 'Thumb', active: classificationResult.features.thumbExtendedAway },
                    { name: 'Index', active: classificationResult.features.indexExtended },
                    { name: 'Middle', active: classificationResult.features.middleExtended },
                    { name: 'Ring', active: classificationResult.features.ringExtended },
                    { name: 'Pinky', active: classificationResult.features.pinkyExtended },
                  ].map((finger) => (
                    <div
                      key={finger.name}
                      className={`p-2 rounded-[8px] border ${
                        finger.active
                          ? 'bg-cyan-50 dark:bg-[#43D9E9]/15 border-cyan-300 dark:border-[#43D9E9]/40 text-[#0E7490] dark:text-[#43D9E9] font-semibold'
                          : 'bg-slate-50 dark:bg-[#172438] border-slate-200 dark:border-[#253448] text-slate-600 dark:text-[#A0AEC0]'
                      }`}
                    >
                      {finger.name}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Candidate Breakdown */}
            {classificationResult && classificationResult.candidates.length > 0 && (
              <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-[#253448] text-xs">
                <span className="text-slate-600 dark:text-[#A0AEC0] font-semibold">
                  Top Candidates
                </span>
                <div className="space-y-1.5">
                  {classificationResult.candidates.slice(0, 3).map((c) => {
                    const def = GESTURE_DEFINITIONS[c.gesture];
                    const pct = Math.round(c.confidence * 100);
                    return (
                      <div
                        key={c.gesture}
                        className="flex items-center justify-between p-2.5 rounded-[10px] bg-slate-50 dark:bg-[#172438] border border-slate-200 dark:border-[#253448]"
                      >
                        <span className="font-medium text-slate-800 dark:text-[#F4F7FB] flex items-center gap-1.5">
                          <span aria-hidden="true">{def?.emoji}</span>
                          <span>{def?.labelEn}</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-slate-200 dark:bg-[#080D18] h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-[#0E7490] dark:bg-[#43D9E9] h-full rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="font-mono tabular-nums text-[11px] font-semibold text-slate-700 dark:text-[#A0AEC0] w-9 text-right">
                            {pct}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recent Recognition History Strip */}
            {history.length > 0 && (
              <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-[#253448] text-xs">
                <span className="text-slate-600 dark:text-[#A0AEC0] font-semibold">
                  Recent Detections
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {history.slice(0, 5).map((item) => (
                    <span
                      key={item.id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] bg-slate-50 dark:bg-[#172438] border border-slate-200 dark:border-[#253448] text-[11px] text-slate-700 dark:text-[#F4F7FB]"
                    >
                      <span aria-hidden="true">{item.emoji}</span>
                      <span className="font-medium">{item.labelEn}</span>
                      <span className="font-mono tabular-nums text-slate-600 dark:text-[#A0AEC0]">{item.confidence}%</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Transcript Panel */}
          <Card padding="sm" className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-[#253448] pb-2.5">
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F4F7FB]">
                  Transcript Stream
                </h3>
                <StatusBadge tone="info">
                  <span className="font-mono tabular-nums">{transcript.length} items</span>
                </StatusBadge>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleSpeakFullTranscript}
                  disabled={transcript.length === 0}
                  leftIcon={<Volume2 className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />}
                  title="Speak Full Transcript aloud"
                >
                  Speak All
                </Button>

                <IconButton
                  variant="ghost"
                  size="sm"
                  onClick={handleUndoTranscript}
                  disabled={transcript.length === 0}
                  label="Undo last transcript item"
                >
                  <Undo2 className="w-4 h-4" />
                </IconButton>

                <IconButton
                  variant="ghost"
                  size="sm"
                  onClick={handleClearTranscript}
                  disabled={transcript.length === 0}
                  label="Clear all transcript items"
                  className="text-rose-700 dark:text-rose-400"
                >
                  <Trash2 className="w-4 h-4" />
                </IconButton>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCopyTranscript}
                  disabled={transcript.length === 0}
                  leftIcon={
                    copiedTranscript ? (
                      <Check className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )
                  }
                >
                  {copiedTranscript ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </div>

            {editingItemId && (
              <div className="p-3 rounded-[12px] bg-cyan-50/70 dark:bg-[#43D9E9]/10 border border-cyan-200 dark:border-[#43D9E9]/30 space-y-2.5 text-xs">
                <div className="flex items-center justify-between font-semibold text-[#0E7490] dark:text-[#43D9E9]">
                  <span>Edit Transcript Item</span>
                  <IconButton
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelEdit}
                    label="Cancel editing"
                  >
                    <X className="w-3.5 h-3.5" />
                  </IconButton>
                </div>
                <div className="grid sm:grid-cols-2 gap-2.5">
                  <TextField
                    label="English Text"
                    value={editTextEn}
                    onChange={(e) => setEditTextEn(e.target.value)}
                  />
                  <TextField
                    label="Amharic Fidel"
                    value={editTextAm}
                    onChange={(e) => setEditTextAm(e.target.value)}
                    className="font-ethiopic"
                  />
                </div>
                <div className="flex items-center justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSaveEdit}
                    leftIcon={<Save className="w-3.5 h-3.5" />}
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            )}

            <div className="min-h-16 p-3 rounded-[12px] bg-slate-50 dark:bg-[#080D18] border border-slate-200 dark:border-[#253448] flex flex-wrap gap-2 items-center">
              {transcript.map((item) => (
                <div
                  key={item.id}
                  className="px-3 py-1.5 rounded-[10px] bg-white dark:bg-[#172438] border border-slate-200 dark:border-[#253448] text-xs font-medium text-slate-800 dark:text-[#F4F7FB] flex items-center gap-2"
                >
                  <span aria-hidden="true">{item.emoji}</span>
                  <span className="font-semibold">{item.textEn}</span>
                  <span className="text-[11px] font-ethiopic text-[#0E7490] dark:text-[#43D9E9]">
                    ({item.textAm})
                  </span>

                  <div className="flex items-center gap-0.5 pl-1.5 border-l border-slate-200 dark:border-[#253448]">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(item)}
                      className="p-1 rounded text-slate-600 dark:text-[#A0AEC0] hover:text-[#0E7490] dark:hover:text-[#43D9E9] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9]"
                      aria-label={`Edit ${item.textEn}`}
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTranscriptItem(item.id)}
                      className="p-1 rounded text-slate-600 dark:text-[#A0AEC0] hover:text-rose-700 dark:hover:text-rose-400 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9]"
                      aria-label={`Delete ${item.textEn}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}

              {transcript.length === 0 && (
                <div className="w-full py-1.5 text-center text-xs text-slate-600 dark:text-[#A0AEC0] flex items-center justify-center gap-2">
                  <HelpCircle className="w-4 h-4 text-slate-500 dark:text-[#A0AEC0]" aria-hidden="true" />
                  <span>Recognized Ethiopian Sign Language signs will appear here in real time.</span>
                </div>
              )}
            </div>

            {lockedDef && (
              <Button
                variant="secondary"
                size="md"
                onClick={() =>
                  appendToTranscript(
                    lockedDef.id,
                    currentConfidence / 100 || 0.9,
                    currentRecognitionSource || 'camera'
                  )
                }
                leftIcon={<PlusCircle className="w-4 h-4 text-[#0E7490] dark:text-[#43D9E9]" />}
                className="w-full"
              >
                Add "{lockedDef.labelEn}" to Transcript
              </Button>
            )}
          </Card>
        </div>
      </div>

      {/* Consented Dataset Collector Modal */}
      <DatasetCollectorModal
        isOpen={isDatasetModalOpen}
        onClose={() => setIsDatasetModalOpen(false)}
        currentLandmarks={liveLandmarks}
        currentHandedness={currentHandedness}
      />

      {/* Scientific Evaluation & Testing Lab Modal */}
      <EvaluationLabModal
        isOpen={isEvalLabOpen}
        onClose={() => setIsEvalLabOpen(false)}
      />
    </div>
  );
};
