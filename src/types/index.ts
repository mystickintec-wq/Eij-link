export type GestureKey = 
  | 'hello'
  | 'thank_you'
  | 'yes'
  | 'no'
  | 'help'
  | 'water'
  | 'please'
  | 'peace'
  | 'love'
  | 'ok'
  | 'call'
  | 'stop';

export type SystemDetectionStatus = 
  | 'initializing'
  | 'ready'
  | 'hand_detected'
  | 'no_hand_detected'
  | 'error';

export interface GestureDefinition {
  id: GestureKey;
  labelEn: string;
  labelAm: string;
  phoneticAm: string;
  emoji: string;
  description: string;
  poseInstructions: string;
  threshold: number;
  category: 'greeting' | 'politeness' | 'affirmation' | 'urgent' | 'need' | 'expression';
  signLanguage: 'EthSL' | 'Universal Gestures';
  validationStatus: 'verified' | 'provisional';
  isNew?: boolean;
}

export interface LandmarkPoint {
  x: number;
  y: number;
  z: number;
}

export interface DetectionResult {
  gesture: GestureKey | 'unknown' | null;
  confidence: number;
  rawConfidence: number;
  isLocked: boolean;
  stabilityScore: number;
  handCount: number;
  fps: number;
  statusMessage: string;
  landmarks?: LandmarkPoint[];
  source: 'camera' | 'simulation';
}

export interface TranslationHistoryItem {
  id: string;
  timestamp: string;
  gestureKey: GestureKey;
  labelEn: string;
  labelAm: string;
  phoneticAm: string;
  emoji: string;
  confidence: number;
  source: 'camera' | 'simulation';
  syncedToCloud?: boolean;
}

export interface DigitPose {
  spread: number;
  curl1: number;
  curl2: number;
  curl3: number;
}

export interface SignJointPose {
  thumb: DigitPose;
  index: DigitPose;
  middle: DigitPose;
  ring: DigitPose;
  pinky: DigitPose;
  wristTilt: [number, number, number];
}

export interface SignSequenceStep {
  id: string;
  signKey: GestureKey | 'neutral';
  glossEn: string;
  glossAm: string;
  phoneticAm: string;
  emoji: string;
  durationMs: number;
  description: string;
  isHold?: boolean;
}

export interface SignSequence {
  id: string;
  titleEn: string;
  titleAm: string;
  scenario: 'classroom' | 'service' | 'daily';
  scenarioLabelEn: string;
  scenarioLabelAm: string;
  description: string;
  validationStatus: 'verified' | 'provisional';
  steps: SignSequenceStep[];
  totalDurationMs: number;
}

export interface TranscriptItem {
  id: string;
  textEn: string;
  textAm: string;
  phoneticAm: string;
  emoji: string;
  gestureKey: GestureKey;
  confidence: number;
  timestamp: string;
  isEdited?: boolean;
  source?: 'camera' | 'simulation';
}

export interface DatasetSample {
  id: string;
  timestamp: string;
  label: GestureKey | string;
  signerId: string;
  signLanguage: 'EthSL' | 'Universal Gestures';
  landmarks: LandmarkPoint[];
  normalizedLandmarks: LandmarkPoint[];
  handedness: string;
  split?: 'train' | 'val' | 'test';
  lighting?: 'bright' | 'normal' | 'low';
  distance?: 'close' | 'medium' | 'far';
  hasConsent?: boolean;
  sampleHash?: string;
  source?: 'camera' | 'simulation';
  notes?: string;
}

export type EvaluationOutcome = 'correct' | 'incorrect' | 'rejected';
export type EvaluationSource = 'real_camera' | 'recorded_landmarks' | 'simulation';

export interface EvaluationSampleRecord {
  id: string;
  timestamp: string;
  expectedLabel: GestureKey | 'unknown';
  predictedLabel: GestureKey | 'unknown';
  confidence: number;
  outcome: EvaluationOutcome;
  source: EvaluationSource;
  latencyMs: number;
  signerId?: string;
  lighting?: string;
  distance?: string;
  notes?: string;
}

export interface ClassEvaluationDetail {
  label: string;
  support: number;
  tp: number;
  fp: number;
  fn: number;
  precision: number;
  recall: number;
  f1: number;
}

export interface ConfusionMatrixData {
  labels: string[];
  matrix: number[][]; // rows: Ground Truth, cols: Predicted
}

export interface EvaluationReport {
  timestamp: string;
  evaluatedSampleCount: number;
  excludedCount: number;
  overallAccuracy: number;
  unknownRejectionRate: number;
  falseAcceptanceRate: number;
  medianLatencyMs: number;
  p95LatencyMs: number;
  perClassMetrics: Record<string, ClassEvaluationDetail>;
  confusionMatrix: ConfusionMatrixData;
  sourceBreakdown: {
    realCamera: number;
    recordedLandmarks: number;
    simulation: number;
  };
  auditDisclosures: {
    classifierArchitecture: string;
    hasTrainedModel: boolean;
    confidenceInterpretation: string;
    ethslLinguisticStatus: string;
  };
}

export interface CloudVaultItem {
  id: string;
  title: string;
  phraseEn: string;
  phraseAm: string;
  gestureKey: GestureKey;
  timestamp: string;
  notes?: string;
  tags: string[];
}

export interface AppSettings {
  language: 'en-US' | 'am-ET' | 'es-ES' | 'fr-FR' | 'ar-SA';
  autoSpeak: boolean;
  speechRate: number;
  lockConfidenceThreshold: number;
  requiredStableFrames: number;
  mirrorFeed: boolean;
  theme: 'dark' | 'light';
  continuousListening: boolean;
  cloudSyncEnabled: boolean;
}

// -----------------------------------------------------------------------------
// Part 2: System Architecture & Modular App Types
// -----------------------------------------------------------------------------

export type ActiveModule = 
  | 'studio'       // Sign Language Studio & 3D Hands
  | 'assistant'    // AI Communication Assistant (Simplify, Suggest Replies)
  | 'translate'    // Universal Multi-language Translator
  | 'captions'     // Live Speech Captions & Transcribe
  | 'documents'    // Document OCR Text Extractor
  | 'settings';    // Accessibility & App Settings

export type AssistantMode = 'simplify' | 'suggest_replies' | 'clarify' | 'tone_adjust';
export type AssistantTone = 'simple' | 'polite' | 'formal' | 'brief';

export interface AssistantRequest {
  text: string;
  mode?: AssistantMode;
  tone?: AssistantTone;
  targetAudience?: string;
  language?: string;
}

export interface AssistantResponse {
  simplifiedText: string;
  originalText: string;
  readingLevel: string;
  keyPoints: string[];
  suggestedReplies: string[];
  explanations?: string;
  detectedTone?: string;
}

export interface TranslateRequest {
  text: string;
  sourceLang?: string;
  targetLang: string;
}

export interface TranslateResponse {
  translatedText: string;
  phoneticPronunciation?: string;
  detectedSourceLang?: string;
  sourceLanguage: string;
  targetLanguage: string;
  notes?: string;
}

export interface DocumentExtractRequest {
  fileBase64: string;
  mimeType: string;
  filename?: string;
  simplifyLanguage?: boolean;
}

export interface DocumentExtractResponse {
  extractedText: string;
  summary: string;
  keyPoints: string[];
  detectedLanguage: string;
  documentType: string;
  wordCount: number;
  simplification?: string;
}

export interface AccessibilitySettings {
  textSize: 'normal' | 'large' | 'xlarge';
  highContrast: boolean;
  dyslexicFont: boolean;
  screenReaderOptimized: boolean;
  autoSpeak: boolean;
  speechRate: number;
  speechPitch: number;
  preferredLanguage: string;
}

