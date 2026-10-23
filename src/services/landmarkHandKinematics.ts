import { LandmarkPoint, SignJointPose, DigitPose } from '../types';

/**
 * Validates whether 21 MediaPipe landmarks are structurally sound and finite
 */
export function isValidLandmarkSet(landmarks: LandmarkPoint[] | null | undefined): boolean {
  if (!landmarks || landmarks.length !== 21) return false;
  return landmarks.every(
    (p) =>
      Number.isFinite(p.x) &&
      Number.isFinite(p.y) &&
      Number.isFinite(p.z) &&
      p.x >= -0.5 &&
      p.x <= 1.5 &&
      p.y >= -0.5 &&
      p.y <= 1.5
  );
}

function dist3d(p1: LandmarkPoint, p2: LandmarkPoint): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dz = (p1.z || 0) - (p2.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/**
 * Calculates anatomical joint angles (flexion curls and lateral spreads)
 * from real-time MediaPipe 3D landmarks with strict anatomical joint limits.
 *
 * Avoids direct image-space coordinate assignments to Euler rotations.
 */
export function computeJointPoseFromLandmarks(
  landmarks: LandmarkPoint[],
  handedness: string = 'Right'
): SignJointPose {
  if (!isValidLandmarkSet(landmarks)) {
    // Return neutral anatomical resting pose
    return {
      thumb: { spread: -0.35, curl1: 0.15, curl2: 0.15, curl3: 0.1 },
      index: { spread: -0.08, curl1: 0.12, curl2: 0.15, curl3: 0.1 },
      middle: { spread: 0.0, curl1: 0.14, curl2: 0.16, curl3: 0.1 },
      ring: { spread: 0.08, curl1: 0.16, curl2: 0.18, curl3: 0.12 },
      pinky: { spread: 0.16, curl1: 0.18, curl2: 0.2, curl3: 0.14 },
      wristTilt: [0, 0, 0],
    };
  }

  // If left hand is tracked, mirror horizontally to maintain proper anatomical orientation on the standard 3D right hand
  const isLeft = handedness.toLowerCase().includes('left');
  const pts: LandmarkPoint[] = landmarks.map((p) => ({
    x: isLeft ? 1 - p.x : p.x,
    y: p.y,
    z: p.z || 0,
  }));

  // Helper to compute finger curl fraction [0 = extended, 1 = fully curled]
  function getFingerCurl(mcpIdx: number, pipIdx: number, dipIdx: number, tipIdx: number): DigitPose {
    const mcp = pts[mcpIdx];
    const pip = pts[pipIdx];
    const dip = pts[dipIdx];
    const tip = pts[tipIdx];

    const totalSegLength = dist3d(mcp, pip) + dist3d(pip, dip) + dist3d(dip, tip);
    const directSpan = dist3d(mcp, tip);
    const ratio = totalSegLength > 0.0001 ? directSpan / totalSegLength : 1;

    // ratio ~ 0.95-1.0 = fully straight extended; ratio ~ 0.35 = tight fist
    const curlFraction = clamp((0.92 - ratio) / 0.58, 0, 1);

    // Anatomical flexion ranges
    const curl1 = clamp(curlFraction * 1.48, 0.0, 1.55); // MCP joint
    const curl2 = clamp(curlFraction * 1.52, 0.0, 1.58); // PIP joint
    const curl3 = clamp(curlFraction * 1.10, 0.0, 1.15); // DIP joint

    // Finger abduction / spread relative to wrist-middle vector
    const wrist = pts[0];
    const midMcp = pts[9];
    const palmVecX = midMcp.x - wrist.x;
    const fingerVecX = tip.x - mcp.x;
    const lateralDelta = fingerVecX - palmVecX;
    const spread = clamp(lateralDelta * 2.2, -0.35, 0.45);

    return { spread, curl1, curl2, curl3 };
  }

  // 1. Index, Middle, Ring, Pinky
  const indexPose = getFingerCurl(5, 6, 7, 8);
  const middlePose = getFingerCurl(9, 10, 11, 12);
  const ringPose = getFingerCurl(13, 14, 15, 16);
  const pinkyPose = getFingerCurl(17, 18, 19, 20);

  // Calibrate baseline resting lateral finger spread
  indexPose.spread = clamp(indexPose.spread - 0.08, -0.25, 0.05);
  middlePose.spread = clamp(middlePose.spread, -0.06, 0.06);
  ringPose.spread = clamp(ringPose.spread + 0.06, -0.02, 0.20);
  pinkyPose.spread = clamp(pinkyPose.spread + 0.16, 0.02, 0.40);

  // 2. Thumb: Special kinematics with abduction, extension, and opposition
  const wrist = pts[0];
  const thumbCmc = pts[1];
  const thumbMcp = pts[2];
  const thumbIp = pts[3];
  const thumbTip = pts[4];
  const indexMcp = pts[5];

  // Thumb tip distance to index MCP (opposition test)
  const thumbToIndexDist = dist3d(thumbTip, indexMcp);
  const thumbDirectSpan = dist3d(thumbCmc, thumbTip);
  const thumbTotalLength = dist3d(thumbCmc, thumbMcp) + dist3d(thumbMcp, thumbIp) + dist3d(thumbIp, thumbTip);
  const thumbRatio = thumbTotalLength > 0.0001 ? thumbDirectSpan / thumbTotalLength : 1;

  // Thumb curl: thumbs-up has thumb extended upward (curl1 < 0)
  // Closed fist has thumb wrapped over index/middle (curl1 > 1.0)
  const isThumbExtendedUpward = thumbTip.y < thumbMcp.y && thumbToIndexDist > 0.14;
  let thumbCurl1 = 0.2;
  let thumbCurl2 = 0.2;
  let thumbCurl3 = 0.1;
  let thumbSpread = -0.35;

  if (isThumbExtendedUpward) {
    // Thumbs-up / Peace / Call / ILY type extended thumb
    thumbCurl1 = clamp(-0.65 * (1 - clamp(thumbTip.y - pts[0].y, 0, 1)), -0.75, 0.0);
    thumbCurl2 = -0.15;
    thumbCurl3 = 0.0;
    thumbSpread = -0.42;
  } else {
    // Clenched or tucked thumb
    const thumbCurlFrac = clamp((0.92 - thumbRatio) / 0.52, 0, 1);
    thumbCurl1 = clamp(thumbCurlFrac * 1.45, -0.1, 1.55);
    thumbCurl2 = clamp(thumbCurlFrac * 1.10, 0.0, 1.20);
    thumbCurl3 = clamp(thumbCurlFrac * 0.70, 0.0, 0.80);
    thumbSpread = clamp(-0.35 + (thumbCurlFrac * 0.4), -0.45, 0.15);
  }

  const thumbPose: DigitPose = {
    spread: thumbSpread,
    curl1: thumbCurl1,
    curl2: thumbCurl2,
    curl3: thumbCurl3,
  };

  // 3. Wrist Orientation (Pitch, Yaw, Roll)
  // Normal of palm plane = (Index MCP - Wrist) x (Pinky MCP - Wrist)
  const v1 = { x: pts[5].x - pts[0].x, y: pts[5].y - pts[0].y, z: pts[5].z - pts[0].z };
  const v2 = { x: pts[17].x - pts[0].x, y: pts[17].y - pts[0].y, z: pts[17].z - pts[0].z };

  // Pitch (tilt up/down)
  const pitchAngle = clamp((pts[9].y - pts[0].y + 0.3) * 1.2, -0.5, 0.5);
  // Roll (tilt side-to-side)
  const rollAngle = clamp((pts[5].y - pts[17].y) * 1.5, -0.45, 0.45);
  // Yaw (rotation around Y)
  const yawAngle = clamp((pts[5].z - pts[17].z) * 2.0, -0.4, 0.4);

  return {
    thumb: thumbPose,
    index: indexPose,
    middle: middlePose,
    ring: ringPose,
    pinky: pinkyPose,
    wristTilt: [pitchAngle, yawAngle, rollAngle],
  };
}
