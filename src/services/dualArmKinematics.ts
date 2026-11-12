// Dual Arm Kinematics & Authentic PDF Picture Movement Presets
// Sourced from "Ethiopian Sign Language Useful Words & Phrases"

export interface ArmJoints {
  shoulderPitch: number; // Elevation up/down (radians)
  shoulderYaw: number;   // Swing forward/back
  shoulderRoll: number;  // Inward / outward rotation
  elbowBend: number;     // Flexion at elbow (0 = straight, ~2.2 = fully bent)
  elbowTwist: number;    // Forearm pronation / supination
  wristPitch: number;    // Flexion / extension
  wristRoll: number;     // Deviation left/right
  fingerCurl: number;    // 0 = flat open hand, 1.5 = tight fist
  fingerSpread: number;  // -0.2 = aligned together, 0.4 = spread wide
}

export interface DualArmPose {
  id: string;
  labelEn: string;
  labelAm: string;
  phoneticAm: string;
  emoji: string;
  pdfPage: number;
  description: string;
  leftArm: ArmJoints;
  rightArm: ArmJoints;
  torsoTilt?: [number, number, number]; // [pitch, yaw, roll]
  head?: {
    pitch: number; // nodding up/down
    yaw: number;   // turning left/right
    roll: number;  // tilting sideways
  };
  isDynamic?: boolean;
  dynamicCycle?: {
    durationSec: number;
    leftArmDelta?: Partial<ArmJoints>;
    rightArmDelta?: Partial<ArmJoints>;
    torsoDelta?: [number, number, number];
    headDelta?: { pitch?: number; yaw?: number; roll?: number };
  };
}

export const DUAL_ARM_PICTURE_PRESETS: DualArmPose[] = [
  // 1. Selam / Health (PDF Page 1)
  {
    id: 'selam',
    labelEn: 'Hello / Peace (Selam)',
    labelAm: 'ሰላም',
    phoneticAm: 'Selam',
    emoji: '👋',
    pdfPage: 1,
    description: 'Both hands start in "5" handshape with fingers on shoulders, palms facing shoulders. Hands move outward away from body to "s"-handshapes at shoulder height.',
    leftArm: {
      shoulderPitch: 0.85,
      shoulderYaw: 0.35,
      shoulderRoll: 0.6,
      elbowBend: 2.15,
      elbowTwist: -0.65,
      wristPitch: -0.25,
      wristRoll: 0.2,
      fingerCurl: 0.05,
      fingerSpread: 0.35,
    },
    rightArm: {
      shoulderPitch: 0.85,
      shoulderYaw: -0.35,
      shoulderRoll: -0.6,
      elbowBend: 2.15,
      elbowTwist: 0.65,
      wristPitch: -0.25,
      wristRoll: -0.2,
      fingerCurl: 0.05,
      fingerSpread: 0.35,
    },
    torsoTilt: [0, 0, 0],
    isDynamic: true,
    dynamicCycle: {
      durationSec: 2.2,
      leftArmDelta: {
        shoulderPitch: -0.45,
        shoulderYaw: -0.2,
        elbowBend: -1.0,
        fingerCurl: 1.45,
        fingerSpread: -0.3,
      },
      rightArmDelta: {
        shoulderPitch: -0.45,
        shoulderYaw: 0.2,
        elbowBend: -1.0,
        fingerCurl: 1.45,
        fingerSpread: -0.3,
      },
    },
  },

  // 2. Egziabher Yemesgen / God (PDF Page 1-2)
  {
    id: 'god',
    labelEn: 'Thanks be to God',
    labelAm: 'እግዚአብሔር ይመስገን',
    phoneticAm: 'Egziabher Yemesgen',
    emoji: '🙏',
    pdfPage: 1,
    description: 'Left arm: Across in front of stomach, hand flat with fingers together. Right arm: Elbow resting on top of left hand, making a right angle with hand flat.',
    leftArm: {
      shoulderPitch: 0.2,
      shoulderYaw: 0.5,
      shoulderRoll: 0.8,
      elbowBend: 1.65,
      elbowTwist: 0.2,
      wristPitch: 0.0,
      wristRoll: 0.1,
      fingerCurl: 0.0,
      fingerSpread: -0.15,
    },
    rightArm: {
      shoulderPitch: 0.45,
      shoulderYaw: -0.1,
      shoulderRoll: -0.2,
      elbowBend: 1.57, // Exact 90 degree right angle!
      elbowTwist: 0.0,
      wristPitch: 0.0,
      wristRoll: 0.0,
      fingerCurl: 0.0,
      fingerSpread: -0.15,
    },
    torsoTilt: [0.08, 0, 0],
    isDynamic: false,
  },

  // 3. Ameseginalehu / Thank You (PDF Page 2, 8)
  {
    id: 'thank_you',
    labelEn: 'Thank you',
    labelAm: 'አመሰግናለሁ',
    phoneticAm: 'Ameseginalehu',
    emoji: '✨',
    pdfPage: 8,
    description: 'Right hand flat at chin moving away until it meets the left hand a few inches away in front of stomach, bending forward slightly.',
    leftArm: {
      shoulderPitch: 0.15,
      shoulderYaw: 0.4,
      shoulderRoll: 0.6,
      elbowBend: 1.5,
      elbowTwist: 0.3,
      wristPitch: -0.2,
      wristRoll: 0.0,
      fingerCurl: 0.0,
      fingerSpread: -0.1,
    },
    rightArm: {
      shoulderPitch: 0.95,
      shoulderYaw: -0.1,
      shoulderRoll: -0.3,
      elbowBend: 2.1,
      elbowTwist: 0.4,
      wristPitch: -0.35,
      wristRoll: 0.0,
      fingerCurl: 0.0,
      fingerSpread: -0.1,
    },
    torsoTilt: [0.05, 0, 0],
    isDynamic: true,
    dynamicCycle: {
      durationSec: 2.0,
      rightArmDelta: {
        shoulderPitch: -0.7,
        elbowBend: -0.7,
        wristPitch: 0.25,
      },
      torsoDelta: [0.12, 0, 0], // Gentle respectful bow forward
    },
  },

  // 4. Welcome / Enquan Dehena Metachu (PDF Page 3)
  {
    id: 'welcome',
    labelEn: 'Welcome',
    labelAm: 'እንኳን ደህና መጣችሁ',
    phoneticAm: 'Enquan Dehena Metachu',
    emoji: '🤝',
    pdfPage: 3,
    description: 'Signed in 3 parts: Enquan (right pointer touches cheek), Selam (hands to shoulders), Metachu (both hands move in welcoming circles toward chest).',
    leftArm: {
      shoulderPitch: 0.4,
      shoulderYaw: 0.3,
      shoulderRoll: 0.4,
      elbowBend: 1.4,
      elbowTwist: -0.2,
      wristPitch: 0.1,
      wristRoll: 0.0,
      fingerCurl: 0.1,
      fingerSpread: 0.1,
    },
    rightArm: {
      shoulderPitch: 0.85,
      shoulderYaw: -0.25,
      shoulderRoll: -0.3,
      elbowBend: 2.05,
      elbowTwist: 0.4,
      wristPitch: -0.2,
      wristRoll: -0.1,
      fingerCurl: 1.3, // "1" pointer finger touch cheek
      fingerSpread: -0.1,
    },
    torsoTilt: [0.04, 0, 0],
    isDynamic: true,
    dynamicCycle: {
      durationSec: 2.5,
      leftArmDelta: {
        shoulderPitch: 0.15,
        elbowBend: 0.25,
        fingerCurl: -0.05,
      },
      rightArmDelta: {
        shoulderPitch: -0.4,
        elbowBend: -0.65,
        fingerCurl: -1.2,
      },
    },
  },

  // 5. Coffee / Buna Grinding (PDF Page 25)
  {
    id: 'coffee',
    labelEn: 'Coffee (Buna)',
    labelAm: 'ቡና',
    phoneticAm: 'Buna',
    emoji: '☕',
    pdfPage: 25,
    description: 'Both hands in "s" handshapes. Left hand sits in front of chest with palm facing right. Right hand starts above, moving down to hit left hand and grind.',
    leftArm: {
      shoulderPitch: 0.35,
      shoulderYaw: 0.3,
      shoulderRoll: 0.5,
      elbowBend: 1.6,
      elbowTwist: 0.4,
      wristPitch: 0.1,
      wristRoll: 0.0,
      fingerCurl: 1.45, // "s" fist
      fingerSpread: -0.2,
    },
    rightArm: {
      shoulderPitch: 0.55,
      shoulderYaw: -0.25,
      shoulderRoll: -0.4,
      elbowBend: 1.7,
      elbowTwist: -0.3,
      wristPitch: -0.1,
      wristRoll: 0.0,
      fingerCurl: 1.45, // "s" fist
      fingerSpread: -0.2,
    },
    torsoTilt: [0.06, 0, 0],
    isDynamic: true,
    dynamicCycle: {
      durationSec: 1.6,
      rightArmDelta: {
        shoulderPitch: -0.2,
        elbowTwist: 0.5,
        elbowBend: -0.25,
      },
    },
  },

  // 6. Rest / Take a Break (PDF Page 39)
  {
    id: 'rest',
    labelEn: 'Rest (Take a break)',
    labelAm: 'እረፍት',
    phoneticAm: 'Erefit',
    emoji: '🛋️',
    pdfPage: 39,
    description: 'Both hands flat, lay arms on top of one another from elbow to fingertips across the chest.',
    leftArm: {
      shoulderPitch: 0.3,
      shoulderYaw: 0.55,
      shoulderRoll: 0.8,
      elbowBend: 1.8,
      elbowTwist: 0.2,
      wristPitch: 0.0,
      wristRoll: 0.0,
      fingerCurl: 0.0,
      fingerSpread: -0.2,
    },
    rightArm: {
      shoulderPitch: 0.35,
      shoulderYaw: -0.55,
      shoulderRoll: -0.8,
      elbowBend: 1.8,
      elbowTwist: -0.2,
      wristPitch: 0.0,
      wristRoll: 0.0,
      fingerCurl: 0.0,
      fingerSpread: -0.2,
    },
    torsoTilt: [0.05, 0, 0],
    isDynamic: false,
  },

  // 7. School / Clapping (PDF Page 20)
  {
    id: 'school',
    labelEn: 'School (Clapping)',
    labelAm: 'ትምህርት ቤት',
    phoneticAm: 'Timhirt Bet',
    emoji: '🏫',
    pdfPage: 20,
    description: 'Both hands in "5" handshapes. Left palm facing up, right palm facing down. Clap right palm on left palm.',
    leftArm: {
      shoulderPitch: 0.3,
      shoulderYaw: 0.35,
      shoulderRoll: 0.5,
      elbowBend: 1.55,
      elbowTwist: 0.8, // Palm facing up
      wristPitch: 0.05,
      wristRoll: 0.0,
      fingerCurl: 0.0,
      fingerSpread: 0.2,
    },
    rightArm: {
      shoulderPitch: 0.45,
      shoulderYaw: -0.3,
      shoulderRoll: -0.4,
      elbowBend: 1.65,
      elbowTwist: -0.8, // Palm facing down
      wristPitch: -0.1,
      wristRoll: 0.0,
      fingerCurl: 0.0,
      fingerSpread: 0.2,
    },
    torsoTilt: [0.04, 0, 0],
    isDynamic: true,
    dynamicCycle: {
      durationSec: 1.2,
      rightArmDelta: {
        shoulderPitch: -0.15,
        elbowBend: -0.2,
      },
    },
  },

  // 8. Family / Beteseb (PDF Page 14)
  {
    id: 'family',
    labelEn: 'Family (Beteseb)',
    labelAm: 'ቤተሰብ',
    phoneticAm: 'Beteseb',
    emoji: '👨‍👩‍👧‍👦',
    pdfPage: 14,
    description: 'Both hands in Ethiopian "b" handshapes start together near body, separate in a circle, and meet ending away from body.',
    leftArm: {
      shoulderPitch: 0.35,
      shoulderYaw: 0.2,
      shoulderRoll: 0.3,
      elbowBend: 1.5,
      elbowTwist: 0.0,
      wristPitch: 0.0,
      wristRoll: 0.1,
      fingerCurl: 0.3,
      fingerSpread: 0.1,
    },
    rightArm: {
      shoulderPitch: 0.35,
      shoulderYaw: -0.2,
      shoulderRoll: -0.3,
      elbowBend: 1.5,
      elbowTwist: 0.0,
      wristPitch: 0.0,
      wristRoll: -0.1,
      fingerCurl: 0.3,
      fingerSpread: 0.1,
    },
    torsoTilt: [0.04, 0, 0],
    isDynamic: true,
    dynamicCycle: {
      durationSec: 2.2,
      leftArmDelta: {
        shoulderYaw: 0.35,
        shoulderRoll: 0.4,
        elbowBend: -0.3,
      },
      rightArmDelta: {
        shoulderYaw: -0.35,
        shoulderRoll: -0.4,
        elbowBend: -0.3,
      },
    },
  },

  // 9. Help / Eredagn (PDF Page 21)
  {
    id: 'help',
    labelEn: 'Help (Eredagn)',
    labelAm: 'እርዳኝ',
    phoneticAm: 'Eredagn',
    emoji: '🆘',
    pdfPage: 21,
    description: 'Left hand flat, palm facing up. Right hand in "a" handshape resting on left hand. Both hands move up together.',
    leftArm: {
      shoulderPitch: 0.3,
      shoulderYaw: 0.3,
      shoulderRoll: 0.5,
      elbowBend: 1.6,
      elbowTwist: 0.85,
      wristPitch: 0.0,
      wristRoll: 0.0,
      fingerCurl: 0.0,
      fingerSpread: -0.1,
    },
    rightArm: {
      shoulderPitch: 0.35,
      shoulderYaw: -0.2,
      shoulderRoll: -0.3,
      elbowBend: 1.65,
      elbowTwist: -0.2,
      wristPitch: 0.0,
      wristRoll: 0.0,
      fingerCurl: 1.4, // "a" fist
      fingerSpread: -0.2,
    },
    torsoTilt: [0.04, 0, 0],
    isDynamic: true,
    dynamicCycle: {
      durationSec: 1.8,
      leftArmDelta: {
        shoulderPitch: 0.25,
      },
      rightArmDelta: {
        shoulderPitch: 0.25,
      },
    },
  },

  // 10. Water / Wuha (PDF Page 23)
  {
    id: 'water',
    labelEn: 'Water (Wuha)',
    labelAm: 'ውሃ',
    phoneticAm: 'Wuha',
    emoji: '💧',
    pdfPage: 23,
    description: 'Ethiopian "w" handshape at chin, palm facing in.',
    leftArm: {
      shoulderPitch: 0.05,
      shoulderYaw: 0.1,
      shoulderRoll: 0.2,
      elbowBend: 0.4,
      elbowTwist: 0.0,
      wristPitch: 0.0,
      wristRoll: 0.0,
      fingerCurl: 0.2,
      fingerSpread: 0.0,
    },
    rightArm: {
      shoulderPitch: 0.95,
      shoulderYaw: -0.15,
      shoulderRoll: -0.4,
      elbowBend: 2.2,
      elbowTwist: 0.6,
      wristPitch: -0.3,
      wristRoll: 0.0,
      fingerCurl: 0.6, // "w" handshape
      fingerSpread: 0.3,
    },
    torsoTilt: [0.02, 0, 0],
    isDynamic: false,
  },

  // 11. Line Up (PDF Page 27)
  {
    id: 'line_up',
    labelEn: 'Line up',
    labelAm: 'ተሰለፉ',
    phoneticAm: 'Teselefu',
    emoji: '🧍‍♂️🧍‍♀️',
    pdfPage: 27,
    description: 'Both hands in "5" handshapes, palms facing opposite directions, start next to each other and move apart horizontally.',
    leftArm: {
      shoulderPitch: 0.45,
      shoulderYaw: 0.1,
      shoulderRoll: 0.3,
      elbowBend: 1.45,
      elbowTwist: -0.4,
      wristPitch: 0.2,
      wristRoll: 0.0,
      fingerCurl: 0.0,
      fingerSpread: 0.25,
    },
    rightArm: {
      shoulderPitch: 0.45,
      shoulderYaw: -0.1,
      shoulderRoll: -0.3,
      elbowBend: 1.45,
      elbowTwist: 0.4,
      wristPitch: 0.2,
      wristRoll: 0.0,
      fingerCurl: 0.0,
      fingerSpread: 0.25,
    },
    torsoTilt: [0.02, 0, 0],
    isDynamic: true,
    dynamicCycle: {
      durationSec: 2.0,
      leftArmDelta: {
        shoulderYaw: 0.5,
        shoulderRoll: 0.3,
      },
      rightArmDelta: {
        shoulderYaw: -0.5,
        shoulderRoll: -0.3,
      },
    },
  },

  // 12. Neutral Signing Stance
  {
    id: 'neutral',
    labelEn: 'Natural Rest Stance',
    labelAm: 'የተፈጥሮ አቋም',
    phoneticAm: 'Yetefet’ro Aq’wam',
    emoji: '🧍',
    pdfPage: 0,
    description: 'Anatomical relaxed signing posture with both arms in front of body and fingers in natural gentle curve.',
    leftArm: {
      shoulderPitch: 0.2,
      shoulderYaw: 0.2,
      shoulderRoll: 0.3,
      elbowBend: 1.1,
      elbowTwist: 0.0,
      wristPitch: 0.0,
      wristRoll: 0.0,
      fingerCurl: 0.2,
      fingerSpread: 0.05,
    },
    rightArm: {
      shoulderPitch: 0.2,
      shoulderYaw: -0.2,
      shoulderRoll: -0.3,
      elbowBend: 1.1,
      elbowTwist: 0.0,
      wristPitch: 0.0,
      wristRoll: 0.0,
      fingerCurl: 0.2,
      fingerSpread: 0.05,
    },
    torsoTilt: [0, 0, 0],
    isDynamic: false,
  },
];
