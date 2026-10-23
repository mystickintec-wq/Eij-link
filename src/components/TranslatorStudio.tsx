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
  Sparkles, 
  Lock, 
  AlertCircle,
  Database,
  Undo2,
  PlusCircle,
  Eye,
  Sliders,
  CheckCircle2,
  HelpCircle,
  RotateCcw,
  Cpu,
  Clock,
  ShieldCheck,
  FlaskConical,
  Edit2,
  Save,
  X
} from 'lucide-react';
import { 
  GestureKey, 
  TranslationHistoryItem, 
  TranscriptItem, 
  LandmarkPoint, 
  SystemDetectionStatus 
} from '../types';
import { GESTURE_DEFINITIONS, GESTURE_LIST } from '../data/gestures';
import { 
  classifyHandPoseDetailed, 
  ClassificationResult, 
  ClassificationCandidate 
} from '../services/gestureClassifier';
import { TemporalStabilizer } from '../services/temporalStabilizer';
import { speechService } from '../services/speechService';
import { 
  handLandmarkerService, 
  ModelLifecycleState, 
  DelegateType 
} from '../services/handLandmarkerService';
import { DatasetCollectorModal } from './DatasetCollectorModal';
import { EvaluationLabModal } from './EvaluationLabModal';
import { ThreeDHandViewer } from './ThreeDHandViewer';

interface TranslatorStudioProps {
  onGestureRecognized?: (gestureKey: GestureKey) => void;
  activeGestureKey: GestureKey;
  onLiveLandmarksUpdate?: (landmarks: LandmarkPoint[], handedness: string) => void;
}

export const TranslatorStudio: React.FC<TranslatorStudioProps> = ({
  onGestureRecognized,
  activeGestureKey,
  onLiveLandmarksUpdate,
}) => {
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

  // Clean draw landmarks helper
  const drawLandmarks = (ctx: CanvasRenderingContext2D, landmarks: LandmarkPoint[], width: number, height: number) => {
    ctx.strokeStyle = '#eab308'; // Axum Gold lines
    ctx.lineWidth = 3;

    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4],       // Thumb
      [0, 5], [5, 6], [6, 7], [7, 8],       // Index
      [0, 9], [9, 10], [10, 11], [11, 12],  // Middle
      [0, 13], [13, 14], [14, 15], [15, 16],// Ring
      [0, 17], [17, 18], [18, 19], [19, 20] // Pinky
    ];

    for (const [start, end] of connections) {
      if (landmarks[start] && landmarks[end]) {
        ctx.beginPath();
        ctx.moveTo(landmarks[start].x * width, landmarks[start].y * height);
        ctx.lineTo(landmarks[end].x * width, landmarks[end].y * height);
        ctx.stroke();
      }
    }

    // Glowing green nodes
    ctx.fillStyle = '#10b981';
    for (const lm of landmarks) {
      ctx.beginPath();
      ctx.arc(lm.x * width, lm.y * height, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
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

  // Transcript Controls with Held-Sign Debouncing
  const appendToTranscript = useCallback((gestureKey: GestureKey, confidence: number) => {
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
    };

    setTranscript((prev) => [...prev, newItem]);
  }, []);

  const handleUndoTranscript = () => {
    setTranscript((prev) => prev.slice(0, -1));
  };

  const handleClearTranscript = () => {
    setTranscript([]);
    lastTranscribedGestureRef.current = null;
  };

  const handleCopyTranscript = () => {
    if (transcript.length === 0) return;
    const fullText = transcript
      .map((t) => `${t.emoji} ${t.textEn} (${t.textAm})`)
      .join(' • ');

    navigator.clipboard.writeText(fullText);
    setCopiedTranscript(true);
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

        // Detect hand landmarks using MediaPipe
        const detection = handLandmarkerService.detectVideoFrame(video, performance.now());

        if (detection.hasHand && detection.landmarks.length === 21 && detection.isValid) {
          setDetectionStatus('hand_detected');
          setCurrentRecognitionSource('camera');
          setHandsDetected(detection.handCount);
          setCurrentHandedness(detection.handedness);
          setLiveLandmarks(detection.landmarks);

          const now = performance.now();
          setLastDetectionTimestamp(now);
          setLastDetectionTimeText(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

          // Draw skeleton overlays
          drawLandmarks(ctx, detection.landmarks, canvas.width, canvas.height);

          // Geometric feature extraction & pose classification
          const detailed = classifyHandPoseDetailed(detection.landmarks);
          setClassificationResult(detailed);

          // Temporal smoothing & lock verification
          const stabilized = stabilizerRef.current.update(
            detailed.predictedGesture,
            detailed.confidence
          );

          setCurrentConfidence(Math.round(stabilized.smoothedConfidence * 100));
          setStabilityScore(Math.round(stabilized.stabilityScore * 100));
          setStatusMessage(stabilized.statusMessage);

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
              appendToTranscript(currentLock, stabilized.smoothedConfidence);
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
          setLiveLandmarks([]);
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
    appendToTranscript(gestureKey, 0.94);
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

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-md">
        
        {/* Status Pill */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`w-3 h-3 rounded-full ${
                detectionStatus === 'hand_detected'
                  ? 'bg-emerald-500 animate-pulse'
                  : detectionStatus === 'initializing'
                  ? 'bg-amber-500 animate-ping'
                  : detectionStatus === 'error'
                  ? 'bg-red-500'
                  : 'bg-slate-400'
              }`}
            />
            <span className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-gray-200">
              {detectionStatus === 'hand_detected' && 'Hand Detected (Active)'}
              {detectionStatus === 'no_hand_detected' && 'Searching for Hand...'}
              {detectionStatus === 'initializing' && 'Initializing MediaPipe...'}
              {detectionStatus === 'ready' && (isCameraActive ? 'Camera Live' : 'Camera Standby')}
              {detectionStatus === 'error' && 'Camera / Vision Error'}
            </span>
          </div>

          <span className="hidden sm:inline-block text-gray-400">•</span>

          <span className="text-xs text-slate-500 dark:text-gray-400 font-mono">
            {fps} FPS {handsDetected > 0 ? `• ${handsDetected} Hand (${currentHandedness})` : ''}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {!isCameraActive ? (
            <button
              onClick={startCamera}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
            >
              <Video className="w-4 h-4" /> Start Camera
            </button>
          ) : (
            <button
              onClick={stopCamera}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
            >
              <VideoOff className="w-4 h-4" /> Stop Camera
            </button>
          )}

          {isCameraActive && (
            <button
              onClick={() => setIsMirrored(!isMirrored)}
              className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-gray-300 font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Toggle Mirror View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isMirrored ? 'Mirrored' : 'Normal'}</span>
            </button>
          )}

          {detectionStatus === 'error' && (
            <button
              onClick={retryCamera}
              className="px-3.5 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry Camera
            </button>
          )}

          <button
            onClick={() => setIsDatasetModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Collect consented dataset samples for ML model training"
          >
            <Database className="w-3.5 h-3.5" /> Dataset Collector
          </button>

          <button
            onClick={() => setIsEvalLabOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Open Scientific Evaluation Lab, Confusion Matrix, and Unit Tests"
          >
            <FlaskConical className="w-3.5 h-3.5 text-purple-500" /> Evaluation Lab
          </button>
        </div>
      </div>

      {/* Phase B: Real-Time Pipeline Diagnostics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-xs shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">State Machine</div>
            <div className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${
                detectionStatus === 'hand_detected' ? 'bg-emerald-500 animate-pulse' :
                detectionStatus === 'initializing' ? 'bg-amber-500 animate-ping' :
                detectionStatus === 'error' ? 'bg-red-500' :
                isCameraActive ? 'bg-sky-500' : 'bg-slate-400'
              }`} />
              <span className="capitalize">{detectionStatus.replace('_', ' ')}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">Vision Engine</div>
            <div className="font-semibold text-slate-800 dark:text-slate-100 font-mono text-[11px]">
              {modelEngineState === 'loaded' ? `Tasks Vision (${modelDelegate})` : `Vision (${modelEngineState})`}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">Landmarks Validity</div>
            <div className="font-semibold text-slate-800 dark:text-slate-100 font-mono text-[11px]">
              {liveLandmarks.length === 21 ? '21 / 21 Points' : isCameraActive ? '0 Points (Scanning)' : 'Standby'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">Last Detection</div>
            <div className="font-semibold text-slate-800 dark:text-slate-100 font-mono text-[11px]">
              {lastDetectionTimeText}
            </div>
          </div>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Live Camera Video & Overlay (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-slate-950 border-2 border-gray-200 dark:border-slate-800 shadow-xl flex items-center justify-center">
            
            {/* Hidden Video Source */}
            <video
              ref={videoRef}
              playsInline
              muted
              className="hidden"
            />

            {/* Visual Canvas Display */}
            <canvas
              ref={canvasRef}
              width={960}
              height={720}
              className={`w-full h-full object-cover ${isMirrored ? 'scale-x-[-1]' : ''}`}
            />

            {/* Standby Placeholder when camera is inactive */}
            {!isCameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-slate-400 bg-slate-950/90 space-y-3">
                <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400">
                  <Video className="w-8 h-8 opacity-80" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-base font-heading">Camera Vision is Inactive</h4>
                  <p className="text-xs text-gray-400 max-w-sm mt-1">
                    Click <strong>"Start Camera"</strong> above to begin real-time hand tracking, or click any sign card below to test the pipeline.
                  </p>
                </div>
                <button
                  onClick={startCamera}
                  className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg cursor-pointer transition-all flex items-center gap-2"
                >
                  <Video className="w-4 h-4" /> Start Camera
                </button>
              </div>
            )}

            {/* Error Overlay */}
            {cameraError && (
              <div className="absolute inset-x-4 bottom-4 p-4 rounded-2xl bg-red-950/90 border border-red-500 text-red-200 text-xs flex items-start gap-3 backdrop-blur-md">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <strong className="block text-white font-bold">Webcam Error</strong>
                  <span>{cameraError}</span>
                </div>
                <button
                  onClick={retryCamera}
                  className="px-3 py-1 bg-red-800 hover:bg-red-700 text-white font-bold rounded-lg shrink-0 cursor-pointer text-[11px]"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Live Guidance Bar Over Video */}
            {isCameraActive && (
              <div className="absolute top-4 inset-x-4 flex items-center justify-between pointer-events-none">
                <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[11px] text-gray-300 font-mono">
                  {statusMessage}
                </div>

                {stabilityScore > 0 && (
                  <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[11px] text-emerald-400 font-mono flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Stability: {stabilityScore}%</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Simulation Row */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-gray-300 font-heading">
                Interactive Vocabulary Cards:
              </span>
              <span className="text-[11px] text-slate-400">Tap to test translation without camera</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {GESTURE_LIST.map((g) => (
                <button
                  key={g.id}
                  onClick={() => handleSimulateGesture(g.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                    lockedGesture === g.id
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-xs'
                      : 'bg-gray-50 hover:bg-gray-100 dark:bg-slate-950 dark:hover:bg-slate-800 text-slate-700 dark:text-gray-300 border-gray-200 dark:border-slate-800'
                  }`}
                >
                  <span>{g.emoji}</span>
                  <span>{g.labelEn}</span>
                  <span className="text-[10px] opacity-75 font-ethiopic">({g.labelAm})</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Recognition Test Panel & Transcript (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Recognition Test Panel */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-amber-500/40 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-amber-500" />
                <h4 className="font-bold text-sm uppercase tracking-wider text-slate-900 dark:text-white font-heading">
                  Recognition Test Panel
                </h4>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setAutoSpeak(!autoSpeak)}
                  className={`p-1.5 rounded-xl border text-xs transition-colors cursor-pointer ${
                    autoSpeak
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                      : 'bg-gray-100 dark:bg-slate-800 text-slate-400 border-gray-200 dark:border-slate-700'
                  }`}
                  title={autoSpeak ? 'Auto-Speech is ON' : 'Auto-Speech is OFF'}
                >
                  {autoSpeak ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                </button>

                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value as any)}
                  className="bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-slate-800 dark:text-gray-200 rounded-xl px-2 py-1 text-xs font-medium"
                >
                  <option value="en-US">English (US)</option>
                  <option value="am-ET">አማርኛ (Amharic)</option>
                </select>
              </div>
            </div>

            {/* Current Prediction Display */}
            {classificationResult && !classificationResult.isUnknown && lockedDef ? (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{lockedDef.emoji}</span>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white font-heading">
                        {lockedDef.labelEn}
                      </h3>
                      <div className="text-sm font-bold text-amber-600 dark:text-amber-400 font-ethiopic">
                        {lockedDef.labelAm} <span className="text-xs text-gray-500 font-sans">("{lockedDef.phoneticAm}")</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xl font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {currentConfidence}%
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                      Confidence
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-gray-300 leading-relaxed pt-1.5 border-t border-amber-500/20">
                  <div className="flex-1">
                    <strong>Verification:</strong> {classificationResult.reason}
                  </div>
                  <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold shrink-0 ${
                    currentRecognitionSource === 'camera'
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                  }`}>
                    {currentRecognitionSource === 'camera' ? '● Real Camera Detection' : '○ Card Simulation'}
                  </span>
                </div>
              </div>
            ) : classificationResult && classificationResult.isUnknown ? (
              /* Explicit UNKNOWN State */
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-400 dark:border-amber-500/40 space-y-2">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-bold text-sm font-heading">
                  <HelpCircle className="w-5 h-5 text-amber-500 shrink-0" />
                  <span>Unknown Hand Pose / Unverified Sign</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-gray-300 leading-relaxed">
                  {classificationResult.reason}. Hand landmarks are detected, but fingers do not match any verified static gesture template.
                </p>
                <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                  Try adjusting fingers closer to standard pose, or check the reference guide.
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-slate-400 border border-dashed border-gray-200 dark:border-slate-800 rounded-2xl space-y-1">
                <Eye className="w-6 h-6 mx-auto opacity-50" />
                <p className="text-xs font-medium">Awaiting live hand movement...</p>
              </div>
            )}

            {/* Live Geometric Feature Inspection */}
            {classificationResult && (
              <div className="space-y-2 text-xs">
                <span className="text-slate-500 dark:text-gray-400 font-bold uppercase tracking-wider text-[11px]">
                  Live Finger Extension Features
                </span>
                <div className="grid grid-cols-5 gap-1.5 text-center font-mono text-[11px]">
                  <div className={`p-2 rounded-xl border ${classificationResult.features.thumbExtendedAway ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 font-bold' : 'bg-gray-50 dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-gray-500'}`}>
                    Thumb
                  </div>
                  <div className={`p-2 rounded-xl border ${classificationResult.features.indexExtended ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 font-bold' : 'bg-gray-50 dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-gray-500'}`}>
                    Index
                  </div>
                  <div className={`p-2 rounded-xl border ${classificationResult.features.middleExtended ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 font-bold' : 'bg-gray-50 dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-gray-500'}`}>
                    Middle
                  </div>
                  <div className={`p-2 rounded-xl border ${classificationResult.features.ringExtended ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 font-bold' : 'bg-gray-50 dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-gray-500'}`}>
                    Ring
                  </div>
                  <div className={`p-2 rounded-xl border ${classificationResult.features.pinkyExtended ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 font-bold' : 'bg-gray-50 dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-gray-500'}`}>
                    Pinky
                  </div>
                </div>
              </div>
            )}

            {/* Candidate Breakdown */}
            {classificationResult && classificationResult.candidates.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-slate-800 text-xs">
                <span className="text-slate-500 dark:text-gray-400 font-semibold text-[11px]">
                  Top Recognition Candidates:
                </span>
                <div className="space-y-1.5">
                  {classificationResult.candidates.slice(0, 3).map((c) => {
                    const def = GESTURE_DEFINITIONS[c.gesture];
                    return (
                      <div key={c.gesture} className="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800/80">
                        <span className="font-medium text-slate-800 dark:text-gray-200 flex items-center gap-1.5">
                          <span>{def?.emoji}</span>
                          <span>{def?.labelEn}</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-amber-500 h-full rounded-full"
                              style={{ width: `${Math.round(c.confidence * 100)}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-gray-300">
                            {Math.round(c.confidence * 100)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Transcript Panel with Add, Undo, Clear, Copy */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-3">
              <h4 className="font-bold text-sm uppercase tracking-wider text-slate-900 dark:text-white font-heading flex items-center gap-2">
                <span>Transcript Stream</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 text-[10px] font-mono font-bold">
                  {transcript.length} Words
                </span>
              </h4>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleUndoTranscript}
                  disabled={transcript.length === 0}
                  className="p-1.5 rounded-xl text-slate-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
                  title="Undo Last Sign"
                >
                  <Undo2 className="w-4 h-4" />
                </button>

                <button
                  onClick={handleClearTranscript}
                  disabled={transcript.length === 0}
                  className="p-1.5 rounded-xl text-red-500 hover:bg-red-500/10 disabled:opacity-40 transition-colors cursor-pointer"
                  title="Clear All"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <button
                  onClick={handleCopyTranscript}
                  disabled={transcript.length === 0}
                  className="px-2.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-gray-200 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  title="Copy Full Transcript"
                >
                  {copiedTranscript ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedTranscript ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Transcript Chips Box */}
            <div className="min-h-24 p-4 rounded-2xl bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 flex flex-wrap gap-2 items-center">
              {transcript.map((item) => (
                <span
                  key={item.id}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xs text-xs font-medium text-slate-800 dark:text-gray-200 flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-150"
                >
                  <span>{item.emoji}</span>
                  <span className="font-bold">{item.textEn}</span>
                  <span className="text-amber-600 dark:text-amber-400 font-ethiopic text-[11px]">({item.textAm})</span>
                </span>
              ))}

              {transcript.length === 0 && (
                <div className="text-xs text-slate-400 italic">
                  Transcript is empty. Verified signs will appear here automatically, or use the "Add Current Sign" button.
                </div>
              )}
            </div>

            {/* Manual Add Sign Button */}
            {lockedDef && (
              <button
                onClick={() => appendToTranscript(lockedDef.id, currentConfidence / 100 || 0.9)}
                className="w-full py-2.5 rounded-2xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-gray-200 font-bold text-xs flex items-center justify-center gap-2 border border-gray-200 dark:border-slate-700 transition-colors cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-emerald-500" />
                <span>Add "{lockedDef.labelEn}" to Transcript</span>
              </button>
            )}
          </div>
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
