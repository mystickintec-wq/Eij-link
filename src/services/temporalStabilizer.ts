import { GestureKey } from '../types';

export interface StabilizerConfig {
  windowSize: number;           // default: 6 frames
  lockThreshold: number;        // default: 0.82
  requiredConsecutive: number;  // default: 5 frames
}

export interface StabilizedOutput {
  lockedGesture: GestureKey | null;
  activeGesture: GestureKey | 'unknown' | null;
  smoothedConfidence: number;
  isLocked: boolean;
  stabilityScore: number;       // 0 to 1 (1 = rock solid)
  statusMessage: string;
}

export class TemporalStabilizer {
  private history: Array<{ gesture: GestureKey | 'unknown' | null; confidence: number }> = [];
  private currentLockedGesture: GestureKey | null = null;
  private consecutiveCount: number = 0;
  private lastCandidate: GestureKey | 'unknown' | null = null;
  private config: StabilizerConfig;

  constructor(config?: Partial<StabilizerConfig>) {
    this.config = {
      windowSize: config?.windowSize ?? 6,
      lockThreshold: config?.lockThreshold ?? 0.82,
      requiredConsecutive: config?.requiredConsecutive ?? 5,
    };
  }

  public reset() {
    this.history = [];
    this.currentLockedGesture = null;
    this.consecutiveCount = 0;
    this.lastCandidate = null;
  }

  public update(rawGesture: GestureKey | 'unknown' | null, rawConfidence: number): StabilizedOutput {
    // Push into sliding window
    this.history.push({ gesture: rawGesture, confidence: rawConfidence });
    if (this.history.length > this.config.windowSize) {
      this.history.shift();
    }

    if (!rawGesture || rawGesture === 'unknown' || rawConfidence < 0.65) {
      this.consecutiveCount = Math.max(0, this.consecutiveCount - 1);
      return {
        lockedGesture: this.currentLockedGesture,
        activeGesture: rawGesture === 'unknown' ? 'unknown' : null,
        smoothedConfidence: rawConfidence,
        isLocked: false,
        stabilityScore: 0,
        statusMessage: rawGesture === 'unknown'
          ? 'Pose detected, but unverified template (Unknown Gesture)'
          : 'Hold your hand steady inside the camera frame',
      };
    }

    // Count occurrences in sliding window
    const counts: Record<string, number> = {};
    let confidenceSum = 0;
    let matchCount = 0;

    for (const item of this.history) {
      if (item.gesture && item.gesture !== 'unknown') {
        counts[item.gesture] = (counts[item.gesture] || 0) + 1;
        if (item.gesture === rawGesture) {
          confidenceSum += item.confidence;
          matchCount++;
        }
      }
    }

    const smoothedConfidence = matchCount > 0 ? confidenceSum / matchCount : rawConfidence;
    const stabilityScore = matchCount / this.history.length;

    // Track consecutive consistency
    if (this.lastCandidate === rawGesture) {
      this.consecutiveCount++;
    } else {
      this.lastCandidate = rawGesture;
      this.consecutiveCount = 1;
    }

    const hasReachedLock =
      this.consecutiveCount >= this.config.requiredConsecutive &&
      smoothedConfidence >= this.config.lockThreshold;

    let statusMessage = '';
    if (hasReachedLock) {
      this.currentLockedGesture = rawGesture;
      statusMessage = `Verified Sign: "${rawGesture.replace('_', ' ').toUpperCase()}" (${Math.round(smoothedConfidence * 100)}%)`;
    } else if (stabilityScore < 0.5) {
      statusMessage = 'Hand in motion — hold still to verify sign';
    } else {
      const remaining = Math.max(0, this.config.requiredConsecutive - this.consecutiveCount);
      statusMessage = `Analyzing pose (${this.consecutiveCount}/${this.config.requiredConsecutive} stable frames)...`;
    }

    return {
      lockedGesture: hasReachedLock ? rawGesture : this.currentLockedGesture,
      activeGesture: rawGesture,
      smoothedConfidence,
      isLocked: hasReachedLock,
      stabilityScore,
      statusMessage,
    };
  }
}
