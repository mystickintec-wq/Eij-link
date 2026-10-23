import { GestureKey, LandmarkPoint } from '../types';
import { GESTURE_DEFINITIONS } from '../data/gestures';

export interface ClassificationCandidate {
  gesture: GestureKey;
  confidence: number;
  reason: string;
}

export interface ClassificationFeatures {
  palmScale: number;
  indexExtended: boolean;
  middleExtended: boolean;
  ringExtended: boolean;
  pinkyExtended: boolean;
  thumbExtendedAway: boolean;
  thumbUpward: boolean;
  thumbDownward: boolean;
  totalSpread: number;
  avgAdjacentGap: number;
}

export interface ClassificationResult {
  predictedGesture: GestureKey | 'unknown';
  confidence: number;
  isUnknown: boolean;
  reason: string;
  candidates: ClassificationCandidate[];
  normalizedLandmarks: LandmarkPoint[];
  features: ClassificationFeatures;
}

function dist2D(p1: LandmarkPoint, p2: LandmarkPoint): number {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}

function isFingerExtended(
  tip: LandmarkPoint,
  dip: LandmarkPoint,
  pip: LandmarkPoint,
  mcp: LandmarkPoint,
  wrist: LandmarkPoint
): boolean {
  const tipDist = dist2D(tip, wrist);
  const pipDist = dist2D(pip, wrist);
  const mcpDist = dist2D(mcp, wrist);
  // Tip must be significantly further from wrist than PIP and MCP
  return tipDist > pipDist * 1.12 && tipDist > mcpDist * 1.25;
}

/**
 * Preprocessing & Normalization:
 * 1. Translates all landmarks so wrist (landmark 0) is at origin (0, 0, 0)
 * 2. Scales by palm distance (wrist to middle MCP) to achieve scale invariance
 */
export function normalizeLandmarks(landmarks: LandmarkPoint[]): LandmarkPoint[] {
  if (!landmarks || landmarks.length < 21) return [];

  const wrist = landmarks[0];
  const middleMcp = landmarks[9];
  const palmScale = dist2D(wrist, middleMcp) || 1.0;

  return landmarks.map((pt) => ({
    x: (pt.x - wrist.x) / palmScale,
    y: (pt.y - wrist.y) / palmScale,
    z: ((pt.z ?? 0) - (wrist.z ?? 0)) / palmScale,
  }));
}

/**
 * Custom Gesture Classifier:
 * Pipeline: Normalized landmarks -> Geometric feature extraction ->
 * Rule-based template matching -> Multi-candidate confidence evaluation ->
 * Unknown state fallback.
 */
export function classifyHandPose(landmarks: LandmarkPoint[]): ClassificationCandidate[] {
  const result = classifyHandPoseDetailed(landmarks);
  return result.candidates;
}

export function classifyHandPoseDetailed(landmarks: LandmarkPoint[]): ClassificationResult {
  const defaultFeatures: ClassificationFeatures = {
    palmScale: 0.2,
    indexExtended: false,
    middleExtended: false,
    ringExtended: false,
    pinkyExtended: false,
    thumbExtendedAway: false,
    thumbUpward: false,
    thumbDownward: false,
    totalSpread: 0,
    avgAdjacentGap: 0,
  };

  if (!landmarks || landmarks.length < 21) {
    return {
      predictedGesture: 'unknown',
      confidence: 0,
      isUnknown: true,
      reason: 'No hand landmarks available for inference',
      candidates: [],
      normalizedLandmarks: [],
      features: defaultFeatures,
    };
  }

  const normalized = normalizeLandmarks(landmarks);

  const wrist = landmarks[0];
  const thumbTip = landmarks[4];

  const indexMcp = landmarks[5];
  const indexPip = landmarks[6];
  const indexDip = landmarks[7];
  const indexTip = landmarks[8];

  const middleMcp = landmarks[9];
  const middlePip = landmarks[10];
  const middleDip = landmarks[11];
  const middleTip = landmarks[12];

  const ringMcp = landmarks[13];
  const ringPip = landmarks[14];
  const ringDip = landmarks[15];
  const ringTip = landmarks[16];

  const pinkyMcp = landmarks[17];
  const pinkyPip = landmarks[18];
  const pinkyDip = landmarks[19];
  const pinkyTip = landmarks[20];

  // Palm scale reference (wrist to middle MCP)
  const palmScale = dist2D(wrist, middleMcp) || 0.2;

  // Check extension of each finger
  const indexExtended = isFingerExtended(indexTip, indexDip, indexPip, indexMcp, wrist);
  const middleExtended = isFingerExtended(middleTip, middleDip, middlePip, middleMcp, wrist);
  const ringExtended = isFingerExtended(ringTip, ringDip, ringPip, ringMcp, wrist);
  const pinkyExtended = isFingerExtended(pinkyTip, pinkyDip, pinkyPip, pinkyMcp, wrist);

  // Check finger curls (tip closer to MCP than PIP is)
  const indexCurled = dist2D(indexTip, indexMcp) < dist2D(indexPip, indexMcp) * 0.95;
  const middleCurled = dist2D(middleTip, middleMcp) < dist2D(middlePip, middleMcp) * 0.95;
  const ringCurled = dist2D(ringTip, ringMcp) < dist2D(ringPip, ringMcp) * 0.95;
  const pinkyCurled = dist2D(pinkyTip, pinkyMcp) < dist2D(pinkyPip, pinkyMcp) * 0.95;

  const fourFingersCurled = indexCurled && middleCurled && ringCurled && pinkyCurled;
  const fourFingersExtended = indexExtended && middleExtended && ringExtended && pinkyExtended;

  // Finger tip distances (spread)
  const gapIndexMiddle = dist2D(indexTip, middleTip) / palmScale;
  const gapMiddleRing = dist2D(middleTip, ringTip) / palmScale;
  const gapRingPinky = dist2D(ringTip, pinkyTip) / palmScale;
  const totalSpread = dist2D(indexTip, pinkyTip) / palmScale;
  const avgAdjacentGap = (gapIndexMiddle + gapMiddleRing + gapRingPinky) / 3;

  // Thumb analysis
  const thumbExtendedAway = dist2D(thumbTip, indexMcp) > palmScale * 0.65;
  const thumbUpward = thumbTip.y < indexMcp.y - 0.08 * (palmScale / 0.2);
  const thumbDownward = thumbTip.y > wrist.y + 0.04 * (palmScale / 0.2);

  const features: ClassificationFeatures = {
    palmScale,
    indexExtended,
    middleExtended,
    ringExtended,
    pinkyExtended,
    thumbExtendedAway,
    thumbUpward,
    thumbDownward,
    totalSpread,
    avgAdjacentGap,
  };

  const candidates: ClassificationCandidate[] = [];

  // 1. YES (Thumbs Up)
  if (fourFingersCurled && thumbUpward) {
    const curlScore = (dist2D(middleTip, middleMcp) / palmScale < 0.6) ? 0.94 : 0.86;
    candidates.push({
      gesture: 'yes',
      confidence: curlScore,
      reason: 'Fist curled with thumb pointed distinctly upward',
    });
  }

  // 2. NO (Thumbs Down)
  if (fourFingersCurled && thumbDownward) {
    candidates.push({
      gesture: 'no',
      confidence: 0.92,
      reason: 'Fist curled with thumb pointed downward below wrist',
    });
  }

  // 3. HELP (Tight Fist)
  if (fourFingersCurled && !thumbUpward && !thumbDownward) {
    const thumbTucked = dist2D(thumbTip, indexPip) < palmScale * 0.6 || dist2D(thumbTip, middlePip) < palmScale * 0.6;
    const fistCompactness = (dist2D(middleTip, wrist) + dist2D(indexTip, wrist) + dist2D(ringTip, wrist)) / (3 * palmScale);
    if (fistCompactness < 1.15) {
      const conf = thumbTucked ? 0.92 : 0.86;
      candidates.push({
        gesture: 'help',
        confidence: conf,
        reason: 'Closed solid fist facing camera',
      });
    }
  }

  // 4. PEACE / VICTORY (✌️ Index & Middle Extended in V-shape, Ring & Pinky Curled)
  if (indexExtended && middleExtended && ringCurled && pinkyCurled) {
    const vSpread = dist2D(indexTip, middleTip) / palmScale;
    const conf = vSpread > 0.15 ? 0.94 : 0.86;
    candidates.push({
      gesture: 'peace',
      confidence: conf,
      reason: 'Index and middle fingers extended apart in a classic V sign',
    });
  }

  // 5. I LOVE YOU (🤟 Thumb, Index, and Pinky Extended, Middle & Ring Curled)
  if (indexExtended && pinkyExtended && middleCurled && ringCurled && thumbExtendedAway) {
    candidates.push({
      gesture: 'love',
      confidence: 0.93,
      reason: 'Thumb, index, and pinky extended with middle and ring curled',
    });
  }

  // 6. CALL ME (🤙 Thumb and Pinky Extended, Index, Middle, Ring Curled)
  if (pinkyExtended && thumbExtendedAway && indexCurled && middleCurled && ringCurled) {
    candidates.push({
      gesture: 'call',
      confidence: 0.92,
      reason: 'Thumb and pinky extended outwards like a telephone receiver',
    });
  }

  // 7. OK / PERFECT (👌 Thumb and Index Tip pinched together into O, Middle, Ring, Pinky extended)
  const pinchDist = dist2D(thumbTip, indexTip) / palmScale;
  if (pinchDist < 0.28 && middleExtended && ringExtended && pinkyExtended) {
    const conf = Math.min(0.96, Math.max(0.85, 1 - pinchDist * 0.5));
    candidates.push({
      gesture: 'ok',
      confidence: conf,
      reason: 'Thumb and index tips touching to form O with outer fingers raised',
    });
  }

  // 8. WATER (💧 Three fingers: Index, Middle, Ring extended upright in W-shape, or gentle pinch)
  if (indexExtended && middleExtended && ringExtended && (pinkyCurled || pinchDist < 0.32)) {
    candidates.push({
      gesture: 'water',
      confidence: 0.89,
      reason: 'Water sign ("W" formation with 3 fingers upright)',
    });
  }

  // 9. STOP / WAIT (🛑 Flat upright hand held forward, fingers extended and held firmly together)
  if (fourFingersExtended && middleTip.y < middleMcp.y - 0.15 && avgAdjacentGap < 0.16 && totalSpread < 0.52) {
    candidates.push({
      gesture: 'stop',
      confidence: 0.93,
      reason: 'Flat open palm facing camera with fingers held firmly together upright',
    });
  }

  // 10. HELLO (👋 Open Hand, fingers spread comfortably apart)
  if (fourFingersExtended && avgAdjacentGap > 0.22 && totalSpread > 0.62) {
    const spreadBonus = Math.min(0.10, (totalSpread - 0.62) * 0.2);
    candidates.push({
      gesture: 'hello',
      confidence: Math.min(0.96, 0.86 + spreadBonus),
      reason: 'Open upright palm with distinct finger separation',
    });
  }

  // 11. PLEASE (🤲 Flat Hand with fingers aligned gently, thumb tucked respectfully)
  if (fourFingersExtended && avgAdjacentGap >= 0.12 && avgAdjacentGap <= 0.21 && totalSpread <= 0.60) {
    const thumbTucked = dist2D(thumbTip, indexMcp) < palmScale * 0.65;
    const conf = Math.min(0.94, 0.86 + (thumbTucked ? 0.06 : 0));
    candidates.push({
      gesture: 'please',
      confidence: conf,
      reason: 'Flat respectful hand with fingers aligned and thumb tucked',
    });
  }

  // 12. THANK YOU (🙏 Flat hand angled respectfully forward or toward chest)
  if (fourFingersExtended && middleTip.y >= middleMcp.y - 0.15 && avgAdjacentGap < 0.24) {
    candidates.push({
      gesture: 'thank_you',
      confidence: 0.92,
      reason: 'Flat hand held in forward angled respectful posture',
    });
  }

  // Sort candidates by highest confidence
  candidates.sort((a, b) => b.confidence - a.confidence);

  // Unknown state check: if no candidate passes 0.70 threshold or no candidates exist
  if (candidates.length === 0 || candidates[0].confidence < 0.70) {
    return {
      predictedGesture: 'unknown',
      confidence: candidates.length > 0 ? candidates[0].confidence : 0,
      isUnknown: true,
      reason: 'Hand detected, but pose does not match verified vocabulary templates',
      candidates,
      normalizedLandmarks: normalized,
      features,
    };
  }

  const best = candidates[0];
  return {
    predictedGesture: best.gesture,
    confidence: best.confidence,
    isUnknown: false,
    reason: best.reason,
    candidates,
    normalizedLandmarks: normalized,
    features,
  };
}
