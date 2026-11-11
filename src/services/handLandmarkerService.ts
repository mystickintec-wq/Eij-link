import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { LandmarkPoint, DetectedHand } from '../types';

export interface HandDetectionOutput {
  hasHand: boolean;
  handCount: number;
  landmarks: LandmarkPoint[];
  allHandsLandmarks: LandmarkPoint[][];
  hands: DetectedHand[];
  handedness: string; // 'Left' | 'Right' | 'Dual Hands' | 'Unknown'
  handednessScore: number;
  timestamp: number;
  isValid: boolean;
}

export type ModelLifecycleState = 'unloaded' | 'loading' | 'loaded' | 'error';
export type DelegateType = 'GPU' | 'CPU' | 'none';

class HandLandmarkerService {
  private landmarker: HandLandmarker | null = null;
  private state: ModelLifecycleState = 'unloaded';
  private activeDelegate: DelegateType = 'none';
  private errorMessage: string | null = null;
  private initPromise: Promise<HandLandmarker> | null = null;
  private lastVideoTime: number = -1;
  private lastDetectionTimestamp: number | null = null;

  public getState(): ModelLifecycleState {
    return this.state;
  }

  public getDelegate(): DelegateType {
    return this.activeDelegate;
  }

  public getErrorMessage(): string | null {
    return this.errorMessage;
  }

  public getLastDetectionTimestamp(): number | null {
    return this.lastDetectionTimestamp;
  }

  /**
   * Validates that a 21-point hand landmark array contains finite, bounded coordinates.
   */
  public static validateLandmarks(landmarks: unknown[]): landmarks is LandmarkPoint[] {
    if (!Array.isArray(landmarks) || landmarks.length !== 21) {
      return false;
    }

    for (let i = 0; i < 21; i++) {
      const pt = landmarks[i] as any;
      if (!pt || typeof pt !== 'object') return false;
      if (typeof pt.x !== 'number' || !Number.isFinite(pt.x) || Number.isNaN(pt.x)) return false;
      if (typeof pt.y !== 'number' || !Number.isFinite(pt.y) || Number.isNaN(pt.y)) return false;
      if (typeof pt.z !== 'number' || !Number.isFinite(pt.z) || Number.isNaN(pt.z)) return false;

      // Allow slight bounds margin [-0.3, 1.3] for wrist/finger tip near frame borders
      if (pt.x < -0.3 || pt.x > 1.3 || pt.y < -0.3 || pt.y > 1.3) {
        return false;
      }
    }

    return true;
  }

  public async initialize(): Promise<HandLandmarker> {
    if (this.landmarker && this.state === 'loaded') {
      return this.landmarker;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.state = 'loading';
    this.errorMessage = null;

    this.initPromise = (async () => {
      try {
        // First attempt local /wasm bundle matching @mediapipe/tasks-vision@1.1.1, fallback to 1.1.1 CDN
        let vision: any;
        try {
          const localWasm = typeof window !== 'undefined' ? `${window.location.origin}/wasm` : '/wasm';
          vision = await FilesetResolver.forVisionTasks(localWasm);
        } catch (localErr) {
          console.warn('Local wasm resolver fallback to CDN:', localErr);
          vision = await FilesetResolver.forVisionTasks(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.1.1/wasm'
          );
        }

        // Attempt GPU delegate first, fallback cleanly to CPU
        try {
          this.landmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
              delegate: 'GPU',
            },
            runningMode: 'VIDEO',
            numHands: 2,
            minHandDetectionConfidence: 0.42,
            minHandPresenceConfidence: 0.42,
            minTrackingConfidence: 0.42,
          });
          this.activeDelegate = 'GPU';
        } catch (gpuError) {
          console.warn('GPU delegate failed for HandLandmarker, falling back to CPU:', gpuError);
          this.landmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
              delegate: 'CPU',
            },
            runningMode: 'VIDEO',
            numHands: 2,
            minHandDetectionConfidence: 0.42,
            minHandPresenceConfidence: 0.42,
            minTrackingConfidence: 0.42,
          });
          this.activeDelegate = 'CPU';
        }

        this.state = 'loaded';
        return this.landmarker;
      } catch (err: any) {
        this.state = 'error';
        this.activeDelegate = 'none';
        this.errorMessage = err?.message || 'Failed to load MediaPipe Hand Landmarker model.';
        console.error('HandLandmarker initialization failed:', err);
        throw err;
      } finally {
        this.initPromise = null;
      }
    })();

    return this.initPromise;
  }

  public detectVideoFrame(video: HTMLVideoElement, timestampMs: number): HandDetectionOutput {
    const emptyOutput = (isValid = false): HandDetectionOutput => ({
      hasHand: false,
      handCount: 0,
      landmarks: [],
      allHandsLandmarks: [],
      hands: [],
      handedness: 'Unknown',
      handednessScore: 0,
      timestamp: timestampMs,
      isValid,
    });

    if (!this.landmarker || this.state !== 'loaded' || video.readyState < 2) {
      return emptyOutput(false);
    }

    // Skip redundant processing if timestamp hasn't changed or video is paused
    if (video.currentTime === this.lastVideoTime) {
      return emptyOutput(true);
    }
    this.lastVideoTime = video.currentTime;

    try {
      const results = this.landmarker.detectForVideo(video, timestampMs);

      if (results.landmarks && results.landmarks.length > 0) {
        const hands: DetectedHand[] = [];
        const allHandsLandmarks: LandmarkPoint[][] = [];

        for (let i = 0; i < results.landmarks.length; i++) {
          const rawHand = results.landmarks[i].map((lm) => ({
            x: lm.x,
            y: lm.y,
            z: lm.z ?? 0,
          }));

          if (HandLandmarkerService.validateLandmarks(rawHand)) {
            let handedness: 'Left' | 'Right' | 'Unknown' = 'Right';
            let handednessScore = 0.9;

            if (results.handedness && results.handedness[i] && results.handedness[i].length > 0) {
              const hCategory = results.handedness[i][0];
              const rawName = (hCategory.displayName || hCategory.categoryName || 'Right').toLowerCase();
              handedness = rawName.includes('left') ? 'Left' : 'Right';
              handednessScore = hCategory.score ?? 0.9;
            } else if (i === 1) {
              handedness = hands[0]?.handedness === 'Right' ? 'Left' : 'Right';
            }

            allHandsLandmarks.push(rawHand);
            hands.push({
              index: i,
              landmarks: rawHand,
              handedness,
              handednessScore,
            });
          }
        }

        if (hands.length > 0) {
          this.lastDetectionTimestamp = timestampMs;
          const primaryHand = hands[0];

          return {
            hasHand: true,
            handCount: hands.length,
            landmarks: primaryHand.landmarks,
            allHandsLandmarks,
            hands,
            handedness: hands.length > 1 ? 'Dual Hands' : primaryHand.handedness,
            handednessScore: primaryHand.handednessScore,
            timestamp: timestampMs,
            isValid: true,
          };
        }
      }
    } catch (detectErr) {
      console.warn('Frame detection warning:', detectErr);
      return emptyOutput(false);
    }

    return emptyOutput(true);
  }

  public close() {
    if (this.landmarker) {
      try {
        this.landmarker.close();
      } catch (e) {
        // ignore
      }
      this.landmarker = null;
    }
    this.state = 'unloaded';
    this.activeDelegate = 'none';
    this.errorMessage = null;
    this.lastVideoTime = -1;
    this.lastDetectionTimestamp = null;
  }
}

export const handLandmarkerService = new HandLandmarkerService();
