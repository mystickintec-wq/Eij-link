import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { LandmarkPoint } from '../types';

export interface HandDetectionOutput {
  hasHand: boolean;
  handCount: number;
  landmarks: LandmarkPoint[];
  allHandsLandmarks: LandmarkPoint[][];
  handedness: string; // 'Left' | 'Right' | 'Unknown'
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
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
        );

        // Attempt GPU delegate first, fallback cleanly to CPU
        try {
          this.landmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
              delegate: 'GPU',
            },
            runningMode: 'VIDEO',
            numHands: 2,
            minHandDetectionConfidence: 0.5,
            minHandPresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
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
            minHandDetectionConfidence: 0.5,
            minHandPresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
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
        const rawFirstHand = results.landmarks[0].map((lm) => ({
          x: lm.x,
          y: lm.y,
          z: lm.z ?? 0,
        }));

        // Strict 21-point validation
        if (HandLandmarkerService.validateLandmarks(rawFirstHand)) {
          const allHandsLandmarks: LandmarkPoint[][] = [];
          for (const hand of results.landmarks) {
            const mapped = hand.map((lm) => ({ x: lm.x, y: lm.y, z: lm.z ?? 0 }));
            if (HandLandmarkerService.validateLandmarks(mapped)) {
              allHandsLandmarks.push(mapped);
            }
          }

          let handedness = 'Right';
          let handednessScore = 0.9;
          if (results.handedness && results.handedness.length > 0 && results.handedness[0].length > 0) {
            const topHandedness = results.handedness[0][0];
            handedness = topHandedness.displayName || topHandedness.categoryName || 'Right';
            handednessScore = topHandedness.score || 0.9;
          }

          this.lastDetectionTimestamp = timestampMs;

          return {
            hasHand: true,
            handCount: allHandsLandmarks.length,
            landmarks: rawFirstHand,
            allHandsLandmarks,
            handedness,
            handednessScore,
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
