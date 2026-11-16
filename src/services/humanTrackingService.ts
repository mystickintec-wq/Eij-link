import {
  FilesetResolver,
  FaceLandmarker,
  PoseLandmarker,
  HandLandmarker,
  NormalizedLandmark,
} from '@mediapipe/tasks-vision';
import { DetectedHand, LandmarkPoint } from '../types';

export type TrackerEngineState = 'unloaded' | 'loading' | 'ready' | 'partial' | 'error';

export interface TrackerAvailability {
  face: boolean;
  body: boolean;
  hands: boolean;
  delegateFace: 'GPU' | 'CPU' | 'none';
  delegateBody: 'GPU' | 'CPU' | 'none';
  delegateHands: 'GPU' | 'CPU' | 'none';
  errorMessage: string | null;
}

export interface TrackingOptions {
  enableFace: boolean;
  enableBody: boolean;
  enableHands: boolean;
}

export interface HumanTrackingFrame {
  timestampMs: number;
  faceLandmarks: LandmarkPoint[] | null;
  poseLandmarks: LandmarkPoint[] | null;
  poseRawLandmarks: NormalizedLandmark[] | null;
  hands: DetectedHand[];
  leftHand: DetectedHand | null;
  rightHand: DetectedHand | null;
  faceDetected: boolean;
  bodyDetected: boolean;
  leftHandDetected: boolean;
  rightHandDetected: boolean;
}

export interface DrawTrackingOverlayOptions {
  showVideoFeed: boolean;
  isMirrored: boolean;
  enableFace: boolean;
  enableBody: boolean;
  enableHands: boolean;
  videoOpacity?: number;
}

const WASM_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.1.1/wasm';
const FACE_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';
const POSE_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';
const HAND_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

// Clean upper & full-body pose connections (excludes noisy face 0..10 and pose hand tips 17..22)
const BODY_SKELETON_CONNECTIONS: Array<[number, number]> = [
  [11, 12], // Shoulders
  [11, 23], // Left torso
  [12, 24], // Right torso
  [23, 24], // Hips
  [11, 13], // Left upper arm
  [13, 15], // Left forearm
  [12, 14], // Right upper arm
  [14, 16], // Right forearm
  [23, 25], // Left thigh
  [25, 27], // Left shin
  [24, 26], // Right thigh
  [26, 28], // Right shin
];

const BODY_JOINT_INDICES = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];

// Colorful 21-landmark hand rendering palette matching reference video
const PALM_CONNECTIONS: Array<[number, number]> = [
  [0, 1],
  [0, 5],
  [0, 9],
  [0, 13],
  [0, 17],
  [5, 9],
  [9, 13],
  [13, 17],
];

const FINGER_GROUPS: Array<{
  name: string;
  color: string;
  nodeColor: string;
  edges: Array<[number, number]>;
  indices: number[];
}> = [
  {
    name: 'thumb',
    color: '#F59E0B',
    nodeColor: '#FCD34D',
    edges: [
      [1, 2],
      [2, 3],
      [3, 4],
    ],
    indices: [1, 2, 3, 4],
  },
  {
    name: 'index',
    color: '#06B6D4',
    nodeColor: '#67E8F9',
    edges: [
      [5, 6],
      [6, 7],
      [7, 8],
    ],
    indices: [5, 6, 7, 8],
  },
  {
    name: 'middle',
    color: '#10B981',
    nodeColor: '#6EE7B7',
    edges: [
      [9, 10],
      [10, 11],
      [11, 12],
    ],
    indices: [9, 10, 11, 12],
  },
  {
    name: 'ring',
    color: '#8B5CF6',
    nodeColor: '#C4B5FD',
    edges: [
      [13, 14],
      [14, 15],
      [15, 16],
    ],
    indices: [13, 14, 15, 16],
  },
  {
    name: 'pinky',
    color: '#EC4899',
    nodeColor: '#F9A8D4',
    edges: [
      [17, 18],
      [18, 19],
      [19, 20],
    ],
    indices: [17, 18, 19, 20],
  },
];

// Subtle nose bridge line to complement MediaPipe FACE_LANDMARKS_CONTOURS
const NOSE_BRIDGE_EDGES: Array<[number, number]> = [
  [168, 6],
  [6, 197],
  [197, 195],
  [195, 5],
  [5, 4],
  [4, 1],
  [1, 2],
  [98, 2],
  [2, 327],
];

function isValidHandSet(landmarks: unknown[]): landmarks is LandmarkPoint[] {
  if (!Array.isArray(landmarks) || landmarks.length !== 21) return false;
  for (let i = 0; i < 21; i++) {
    const pt = landmarks[i] as LandmarkPoint | undefined;
    if (
      !pt ||
      !Number.isFinite(pt.x) ||
      !Number.isFinite(pt.y) ||
      !Number.isFinite(pt.z) ||
      pt.x < -0.3 ||
      pt.x > 1.3 ||
      pt.y < -0.3 ||
      pt.y > 1.3
    ) {
      return false;
    }
  }
  return true;
}

class HumanTrackingService {
  private faceLandmarker: FaceLandmarker | null = null;
  private poseLandmarker: PoseLandmarker | null = null;
  private handLandmarker: HandLandmarker | null = null;

  private state: TrackerEngineState = 'unloaded';
  private initPromise: Promise<TrackerAvailability> | null = null;
  private lastTimestampMs = -1;

  private availability: TrackerAvailability = {
    face: false,
    body: false,
    hands: false,
    delegateFace: 'none',
    delegateBody: 'none',
    delegateHands: 'none',
    errorMessage: null,
  };

  public getState(): TrackerEngineState {
    return this.state;
  }

  public getAvailability(): TrackerAvailability {
    return { ...this.availability };
  }

  private async resolveVisionFileset() {
    try {
      const localWasm = typeof window !== 'undefined' ? `${window.location.origin}/wasm` : '/wasm';
      return await FilesetResolver.forVisionTasks(localWasm);
    } catch {
      return await FilesetResolver.forVisionTasks(WASM_CDN);
    }
  }

  private async createWithDelegateFallback<T>(
    factory: (delegate: 'GPU' | 'CPU') => Promise<T>
  ): Promise<{ instance: T; delegate: 'GPU' | 'CPU' }> {
    try {
      const instance = await factory('GPU');
      return { instance, delegate: 'GPU' };
    } catch {
      const instance = await factory('CPU');
      return { instance, delegate: 'CPU' };
    }
  }

  public async initialize(): Promise<TrackerAvailability> {
    if (
      (this.state === 'ready' || this.state === 'partial') &&
      (this.faceLandmarker || this.poseLandmarker || this.handLandmarker)
    ) {
      return this.getAvailability();
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.state = 'loading';
    this.availability.errorMessage = null;

    this.initPromise = (async () => {
      try {
        const vision = await this.resolveVisionFileset();

        const [faceRes, poseRes, handRes] = await Promise.allSettled([
          this.createWithDelegateFallback((delegate) =>
            FaceLandmarker.createFromOptions(vision, {
              baseOptions: { modelAssetPath: FACE_MODEL_URL, delegate },
              runningMode: 'VIDEO',
              numFaces: 1,
              minFaceDetectionConfidence: 0.45,
              minFacePresenceConfidence: 0.45,
              minTrackingConfidence: 0.45,
              outputFaceBlendshapes: false,
              outputFacialTransformationMatrixes: false,
            })
          ),
          this.createWithDelegateFallback((delegate) =>
            PoseLandmarker.createFromOptions(vision, {
              baseOptions: { modelAssetPath: POSE_MODEL_URL, delegate },
              runningMode: 'VIDEO',
              numPoses: 1,
              minPoseDetectionConfidence: 0.45,
              minPosePresenceConfidence: 0.45,
              minTrackingConfidence: 0.45,
              outputSegmentationMasks: false,
            })
          ),
          this.createWithDelegateFallback((delegate) =>
            HandLandmarker.createFromOptions(vision, {
              baseOptions: { modelAssetPath: HAND_MODEL_URL, delegate },
              runningMode: 'VIDEO',
              numHands: 2,
              minHandDetectionConfidence: 0.42,
              minHandPresenceConfidence: 0.42,
              minTrackingConfidence: 0.42,
            })
          ),
        ]);

        const errors: string[] = [];

        if (faceRes.status === 'fulfilled') {
          this.faceLandmarker = faceRes.value.instance;
          this.availability.face = true;
          this.availability.delegateFace = faceRes.value.delegate;
        } else {
          this.availability.face = false;
          this.availability.delegateFace = 'none';
          errors.push('Face Landmarker unavailable');
        }

        if (poseRes.status === 'fulfilled') {
          this.poseLandmarker = poseRes.value.instance;
          this.availability.body = true;
          this.availability.delegateBody = poseRes.value.delegate;
        } else {
          this.availability.body = false;
          this.availability.delegateBody = 'none';
          errors.push('Pose Landmarker unavailable');
        }

        if (handRes.status === 'fulfilled') {
          this.handLandmarker = handRes.value.instance;
          this.availability.hands = true;
          this.availability.delegateHands = handRes.value.delegate;
        } else {
          this.availability.hands = false;
          this.availability.delegateHands = 'none';
          errors.push('Hand Landmarker unavailable');
        }

        const loadedCount =
          Number(this.availability.face) +
          Number(this.availability.body) +
          Number(this.availability.hands);

        if (loadedCount === 0) {
          this.state = 'error';
          this.availability.errorMessage =
            'MediaPipe Face, Pose, and Hand tracking models could not be loaded.';
        } else if (loadedCount < 3) {
          this.state = 'partial';
          this.availability.errorMessage = errors.join(' · ');
        } else {
          this.state = 'ready';
          this.availability.errorMessage = null;
        }

        return this.getAvailability();
      } catch (err: any) {
        this.state = 'error';
        this.availability = {
          face: false,
          body: false,
          hands: false,
          delegateFace: 'none',
          delegateBody: 'none',
          delegateHands: 'none',
          errorMessage: err?.message || 'Failed to initialize MediaPipe 2D tracking runtime.',
        };
        return this.getAvailability();
      } finally {
        this.initPromise = null;
      }
    })();

    return this.initPromise;
  }

  public detectFrame(
    video: HTMLVideoElement,
    rawTimestampMs: number,
    options: TrackingOptions,
    isMirrored: boolean
  ): HumanTrackingFrame {
    // MediaPipe requires strictly monotonically increasing integer timestamps in ms
    const safeTs = Math.max(Math.round(rawTimestampMs), this.lastTimestampMs + 1);
    this.lastTimestampMs = safeTs;

    const empty: HumanTrackingFrame = {
      timestampMs: safeTs,
      faceLandmarks: null,
      poseLandmarks: null,
      poseRawLandmarks: null,
      hands: [],
      leftHand: null,
      rightHand: null,
      faceDetected: false,
      bodyDetected: false,
      leftHandDetected: false,
      rightHandDetected: false,
    };

    if (
      video.readyState < 2 ||
      video.videoWidth === 0 ||
      video.videoHeight === 0 ||
      (this.state !== 'ready' && this.state !== 'partial')
    ) {
      return empty;
    }

    let faceLandmarks: LandmarkPoint[] | null = null;
    let poseLandmarks: LandmarkPoint[] | null = null;
    let poseRawLandmarks: NormalizedLandmark[] | null = null;
    const hands: DetectedHand[] = [];

    // 1. Face Landmarker
    if (options.enableFace && this.faceLandmarker) {
      try {
        const res = this.faceLandmarker.detectForVideo(video, safeTs);
        if (res.faceLandmarks && res.faceLandmarks.length > 0) {
          faceLandmarks = res.faceLandmarks[0].map((lm) => ({
            x: lm.x,
            y: lm.y,
            z: lm.z ?? 0,
          }));
        }
      } catch {
        // Ignore transient single-frame errors
      }
    }

    // 2. Pose Landmarker (Body Skeleton)
    if (options.enableBody && this.poseLandmarker) {
      try {
        const res = this.poseLandmarker.detectForVideo(video, safeTs);
        if (res.landmarks && res.landmarks.length > 0) {
          poseRawLandmarks = res.landmarks[0];
          poseLandmarks = res.landmarks[0].map((lm) => ({
            x: lm.x,
            y: lm.y,
            z: lm.z ?? 0,
          }));
        }
      } catch {
        // Ignore transient single-frame errors
      }
    }

    // 3. Hand Landmarker (Left + Right Hands, 21 points each)
    if (options.enableHands && this.handLandmarker) {
      try {
        const res = this.handLandmarker.detectForVideo(video, safeTs);
        if (res.landmarks && res.landmarks.length > 0) {
          for (let i = 0; i < res.landmarks.length; i++) {
            const pts: LandmarkPoint[] = res.landmarks[i].map((lm) => ({
              x: lm.x,
              y: lm.y,
              z: lm.z ?? 0,
            }));

            if (!isValidHandSet(pts)) continue;

            let handedness: 'Left' | 'Right' | 'Unknown' = 'Right';
            let score = 0.9;

            if (res.handedness && res.handedness[i] && res.handedness[i].length > 0) {
              const cat = res.handedness[i][0];
              const rawName = (cat.displayName || cat.categoryName || 'Right').toLowerCase();
              const isRawLeft = rawName.includes('left');
              // In MediaPipe selfie-camera view, mirroring flips perceived left/right labels
              handedness = isMirrored
                ? isRawLeft
                  ? 'Right'
                  : 'Left'
                : isRawLeft
                ? 'Left'
                : 'Right';
              score = cat.score ?? 0.9;
            } else if (hands.length === 1) {
              handedness = hands[0].handedness === 'Left' ? 'Right' : 'Left';
            }

            // Avoid duplicate Left/Right if 2 hands detected with identical label
            if (hands.some((h) => h.handedness === handedness)) {
              handedness = handedness === 'Left' ? 'Right' : 'Left';
            }

            hands.push({
              index: i,
              landmarks: pts,
              handedness,
              handednessScore: score,
            });
          }
        }
      } catch {
        // Ignore transient single-frame errors
      }
    }

    const leftHand = hands.find((h) => h.handedness === 'Left') || null;
    const rightHand = hands.find((h) => h.handedness === 'Right') || null;

    return {
      timestampMs: safeTs,
      faceLandmarks,
      poseLandmarks,
      poseRawLandmarks,
      hands,
      leftHand,
      rightHand,
      faceDetected: Boolean(faceLandmarks && faceLandmarks.length > 0),
      bodyDetected: Boolean(poseLandmarks && poseLandmarks.length > 0),
      leftHandDetected: Boolean(leftHand),
      rightHandDetected: Boolean(rightHand),
    };
  }

  public dispose() {
    if (this.faceLandmarker) {
      try {
        this.faceLandmarker.close();
      } catch {
        // ignore
      }
      this.faceLandmarker = null;
    }
    if (this.poseLandmarker) {
      try {
        this.poseLandmarker.close();
      } catch {
        // ignore
      }
      this.poseLandmarker = null;
    }
    if (this.handLandmarker) {
      try {
        this.handLandmarker.close();
      } catch {
        // ignore
      }
      this.handLandmarker = null;
    }
    this.state = 'unloaded';
    this.initPromise = null;
    this.lastTimestampMs = -1;
    this.availability = {
      face: false,
      body: false,
      hands: false,
      delegateFace: 'none',
      delegateBody: 'none',
      delegateHands: 'none',
      errorMessage: null,
    };
  }
}

export const humanTrackingService = new HumanTrackingService();

/**
 * Draws the synchronized 2D camera / dark-backdrop visualization with:
 * - Red Face landmark connections
 * - Red 2D Body skeleton connections
 * - Colorful 21-point Left & Right Hand landmarks
 */
export function drawHumanTrackingOverlay(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  frame: HumanTrackingFrame,
  width: number,
  height: number,
  options: DrawTrackingOverlayOptions
): void {
  if (width <= 0 || height <= 0) return;

  const mapX = (x: number) => (options.isMirrored ? (1 - x) * width : x * width);
  const mapY = (y: number) => y * height;

  // 1. Background: either dark studio canvas or live video feed
  ctx.save();
  ctx.fillStyle = '#06090F';
  ctx.fillRect(0, 0, width, height);

  if (options.showVideoFeed && video.readyState >= 2) {
    ctx.save();
    ctx.globalAlpha = options.videoOpacity ?? 0.78;
    if (options.isMirrored) {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, width, height);
    ctx.restore();
  } else {
    // Subtle precision coordinate grid on dark tracking panel
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
    ctx.lineWidth = 1;
    const step = 48;
    for (let x = step; x < width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = step; y < height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }

  // 2. RED BODY SKELETON OVERLAY (drawn behind hands for crisp layering)
  if (options.enableBody && frame.poseLandmarks && frame.poseLandmarks.length >= 29) {
    const pose = frame.poseLandmarks;
    const rawPose = frame.poseRawLandmarks;

    const isVisible = (idx: number) => {
      const lm = pose[idx];
      if (!lm || !Number.isFinite(lm.x) || !Number.isFinite(lm.y)) return false;
      const vis = rawPose?.[idx]?.visibility;
      return vis === undefined || vis >= 0.25;
    };

    ctx.save();
    ctx.strokeStyle = '#FF3B30';
    ctx.lineWidth = 3.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (const [startIdx, endIdx] of BODY_SKELETON_CONNECTIONS) {
      if (isVisible(startIdx) && isVisible(endIdx)) {
        ctx.beginPath();
        ctx.moveTo(mapX(pose[startIdx].x), mapY(pose[startIdx].y));
        ctx.lineTo(mapX(pose[endIdx].x), mapY(pose[endIdx].y));
        ctx.stroke();
      }
    }

    // Subtle neck spine connector between shoulders midpoint and chin/nose if pose nose visible
    if (isVisible(11) && isVisible(12) && isVisible(0)) {
      const neckX = (mapX(pose[11].x) + mapX(pose[12].x)) / 2;
      const neckY = (mapY(pose[11].y) + mapY(pose[12].y)) / 2;
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 59, 48, 0.72)';
      ctx.lineWidth = 2.4;
      ctx.moveTo(neckX, neckY);
      ctx.lineTo(mapX(pose[0].x), mapY(pose[0].y));
      ctx.stroke();
    }

    // Body skeleton joints
    for (const idx of BODY_JOINT_INDICES) {
      if (!isVisible(idx)) continue;
      const px = mapX(pose[idx].x);
      const py = mapY(pose[idx].y);

      ctx.beginPath();
      ctx.fillStyle = '#FF3B30';
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.fillStyle = '#FFE4E6';
      ctx.arc(px, py, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 3. RED FACE LANDMARK CONNECTIONS OVERLAY
  if (options.enableFace && frame.faceLandmarks && frame.faceLandmarks.length > 0) {
    const face = frame.faceLandmarks;
    const contourConnections = FaceLandmarker.FACE_LANDMARKS_CONTOURS || [];

    ctx.save();
    ctx.strokeStyle = '#FF3B30';
    ctx.lineWidth = 1.65;
    ctx.lineCap = 'round';

    for (const conn of contourConnections) {
      const a = face[conn.start];
      const b = face[conn.end];
      if (!a || !b) continue;
      ctx.beginPath();
      ctx.moveTo(mapX(a.x), mapY(a.y));
      ctx.lineTo(mapX(b.x), mapY(b.y));
      ctx.stroke();
    }

    // Nose bridge definition
    ctx.strokeStyle = 'rgba(255, 75, 66, 0.85)';
    ctx.lineWidth = 1.4;
    for (const [startIdx, endIdx] of NOSE_BRIDGE_EDGES) {
      const a = face[startIdx];
      const b = face[endIdx];
      if (!a || !b) continue;
      ctx.beginPath();
      ctx.moveTo(mapX(a.x), mapY(a.y));
      ctx.lineTo(mapX(b.x), mapY(b.y));
      ctx.stroke();
    }

    // Subtle landmark points on contour vertices
    ctx.fillStyle = '#FCA5A5';
    const drawnVertices = new Set<number>();
    for (const conn of contourConnections) {
      if (!drawnVertices.has(conn.start) && face[conn.start]) {
        drawnVertices.add(conn.start);
        ctx.beginPath();
        ctx.arc(mapX(face[conn.start].x), mapY(face[conn.start].y), 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  // 4. COLORFUL 21-LANDMARK HAND TRACKING OVERLAY (Left & Right simultaneously)
  if (options.enableHands && frame.hands.length > 0) {
    for (const hand of frame.hands) {
      const lms = hand.landmarks;
      ctx.save();

      // Palm base bones
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 2.6;
      ctx.lineCap = 'round';
      for (const [aIdx, bIdx] of PALM_CONNECTIONS) {
        const a = lms[aIdx];
        const b = lms[bIdx];
        if (!a || !b) continue;
        ctx.beginPath();
        ctx.moveTo(mapX(a.x), mapY(a.y));
        ctx.lineTo(mapX(b.x), mapY(b.y));
        ctx.stroke();
      }

      // Per-finger colored bone segments + landmarks
      for (const group of FINGER_GROUPS) {
        ctx.strokeStyle = group.color;
        ctx.lineWidth = 3;
        for (const [aIdx, bIdx] of group.edges) {
          const a = lms[aIdx];
          const b = lms[bIdx];
          if (!a || !b) continue;
          ctx.beginPath();
          ctx.moveTo(mapX(a.x), mapY(a.y));
          ctx.lineTo(mapX(b.x), mapY(b.y));
          ctx.stroke();
        }

        for (const idx of group.indices) {
          const pt = lms[idx];
          if (!pt) continue;
          const isTip = idx % 4 === 0;
          const px = mapX(pt.x);
          const py = mapY(pt.y);

          ctx.beginPath();
          ctx.fillStyle = group.color;
          ctx.arc(px, py, isTip ? 5 : 3.6, 0, Math.PI * 2);
          ctx.fill();

          ctx.beginPath();
          ctx.fillStyle = group.nodeColor;
          ctx.arc(px, py, isTip ? 2.2 : 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Wrist node (landmark 0)
      const wrist = lms[0];
      if (wrist) {
        const wx = mapX(wrist.x);
        const wy = mapY(wrist.y);

        ctx.beginPath();
        ctx.fillStyle = '#FFFFFF';
        ctx.arc(wx, wy, 5.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = hand.handedness === 'Left' ? '#06B6D4' : '#F59E0B';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Upright wrist handedness tag
        const label = `${hand.handedness} Hand`;
        const tagY = Math.min(height - 16, wy + 22);
        ctx.font = '600 11px "Plus Jakarta Sans", system-ui, sans-serif';
        const textWidth = ctx.measureText(label).width;
        const boxW = textWidth + 16;

        ctx.fillStyle =
          hand.handedness === 'Left'
            ? 'rgba(8, 145, 178, 0.9)'
            : 'rgba(180, 83, 9, 0.9)';
        ctx.beginPath();
        ctx.roundRect(wx - boxW / 2, tagY - 11, boxW, 22, 6);
        ctx.fill();

        ctx.strokeStyle =
          hand.handedness === 'Left'
            ? 'rgba(103, 232, 249, 0.85)'
            : 'rgba(252, 211, 77, 0.85)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, wx, tagY);
      }

      ctx.restore();
    }
  }

  ctx.restore();
}
