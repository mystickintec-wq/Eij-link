import { SignSequence } from '../types';

export const SIGN_SEQUENCES: SignSequence[] = [
  // ==========================================
  // SCENARIO 1: CLASSROOM COMMUNICATION
  // ==========================================
  {
    id: 'seq-classroom-help',
    titleEn: 'Hello teacher, please help',
    titleAm: 'ሰላም አስተማሪ፣ እባክዎ ይርዱኝ',
    scenario: 'classroom',
    scenarioLabelEn: 'Classroom Communication',
    scenarioLabelAm: 'የትምህርት ቤት ተግባቦት',
    description: 'A student respectfully greeting their instructor and requesting academic or practical assistance.',
    validationStatus: 'verified',
    totalDurationMs: 6500,
    steps: [
      {
        id: 'c1-1',
        signKey: 'hello',
        glossEn: 'HELLO',
        glossAm: 'ሰላም',
        phoneticAm: 'Selam',
        emoji: '👋',
        durationMs: 1400,
        description: 'Open raised upright palm facing front toward instructor.',
      },
      {
        id: 'c1-2',
        signKey: 'please',
        glossEn: 'PLEASE',
        glossAm: 'እባክዎ',
        phoneticAm: 'Ebakwo',
        emoji: '🙏',
        durationMs: 1500,
        description: 'Flat hand held flush over chest in polite request posture.',
      },
      {
        id: 'c1-3',
        signKey: 'help',
        glossEn: 'HELP',
        glossAm: 'እርዳኝ',
        phoneticAm: 'Eredagn',
        emoji: '🆘',
        durationMs: 1600,
        description: 'Firm closed fist held forward indicating need for assistance.',
      },
      {
        id: 'c1-4',
        signKey: 'thank_you',
        glossEn: 'THANK YOU',
        glossAm: 'አመሰግናለሁ',
        phoneticAm: 'Ameseginalehu',
        emoji: '🤝',
        durationMs: 1600,
        description: 'Flat respectful hand moving forward in gratitude.',
      },
      {
        id: 'c1-5',
        signKey: 'neutral',
        glossEn: 'REST',
        glossAm: 'እረፍት',
        phoneticAm: 'Erefet',
        emoji: '🖐️',
        durationMs: 400,
        description: 'Hand returns to neutral relaxed resting pose.',
      },
    ],
  },
  {
    id: 'seq-classroom-ack',
    titleEn: 'Yes, thank you teacher',
    titleAm: 'አዎን፣ አመሰግናለሁ',
    scenario: 'classroom',
    scenarioLabelEn: 'Classroom Communication',
    scenarioLabelAm: 'የትምህርት ቤት ተግባቦት',
    description: 'Confirming understanding and thanking the educator during classroom instruction.',
    validationStatus: 'verified',
    totalDurationMs: 4400,
    steps: [
      {
        id: 'c2-1',
        signKey: 'yes',
        glossEn: 'YES / UNDERSTOOD',
        glossAm: 'አዎን / ገብቶኛል',
        phoneticAm: 'Awon',
        emoji: '👍',
        durationMs: 1800,
        description: 'Clear thumbs-up affirmation gesture.',
      },
      {
        id: 'c2-2',
        signKey: 'thank_you',
        glossEn: 'THANK YOU',
        glossAm: 'አመሰግናለሁ',
        phoneticAm: 'Ameseginalehu',
        emoji: '🤝',
        durationMs: 2000,
        description: 'Respectful palmar inclination forward.',
      },
      {
        id: 'c2-3',
        signKey: 'neutral',
        glossEn: 'REST',
        glossAm: 'እረፍት',
        phoneticAm: 'Erefet',
        emoji: '🖐️',
        durationMs: 600,
        description: 'Hand returns smoothly to resting position.',
      },
    ],
  },
  {
    id: 'seq-classroom-stop',
    titleEn: 'Stop, wait please',
    titleAm: 'ቁም፣ እባክዎ ጠብቁ',
    scenario: 'classroom',
    scenarioLabelEn: 'Classroom Communication',
    scenarioLabelAm: 'የትምህርት ቤት ተግባቦት',
    description: 'Asking the teacher or peer to pause or slow down during a lesson.',
    validationStatus: 'provisional',
    totalDurationMs: 4600,
    steps: [
      {
        id: 'c3-1',
        signKey: 'stop',
        glossEn: 'STOP / PAUSE',
        glossAm: 'ቁም / ቆም በል',
        phoneticAm: 'Qum',
        emoji: '✋',
        durationMs: 1800,
        description: 'Vertical palm pushing outwards requesting a pause.',
      },
      {
        id: 'c3-2',
        signKey: 'please',
        glossEn: 'PLEASE',
        glossAm: 'እባክዎ',
        phoneticAm: 'Ebakwo',
        emoji: '🙏',
        durationMs: 2000,
        description: 'Polite fingers aligned over heart.',
      },
      {
        id: 'c3-3',
        signKey: 'neutral',
        glossEn: 'REST',
        glossAm: 'እረፍት',
        phoneticAm: 'Erefet',
        emoji: '🖐️',
        durationMs: 800,
        description: 'Return to neutral baseline.',
      },
    ],
  },

  // ==========================================
  // SCENARIO 2: EVERYDAY SERVICE INTERACTIONS
  // ==========================================
  {
    id: 'seq-service-water',
    titleEn: 'Water please, thank you',
    titleAm: 'ውሃ እባክዎ፣ አመሰግናለሁ',
    scenario: 'service',
    scenarioLabelEn: 'Everyday Service Interactions',
    scenarioLabelAm: 'የአገልግሎትና የሸመታ ተግባቦት',
    description: 'Ordering drinking water politely at a café, clinic, restaurant, or government service desk.',
    validationStatus: 'verified',
    totalDurationMs: 5800,
    steps: [
      {
        id: 's1-1',
        signKey: 'water',
        glossEn: 'WATER',
        glossAm: 'ውሃ',
        phoneticAm: 'Wuha',
        emoji: '💧',
        durationMs: 1700,
        description: 'Pinched index and thumb with 3 outer fingers extended in W shape.',
      },
      {
        id: 's1-2',
        signKey: 'please',
        glossEn: 'PLEASE',
        glossAm: 'እባክዎ',
        phoneticAm: 'Ebakwo',
        emoji: '🙏',
        durationMs: 1700,
        description: 'Flat palm courteous request motion.',
      },
      {
        id: 's1-3',
        signKey: 'thank_you',
        glossEn: 'THANK YOU',
        glossAm: 'አመሰግናለሁ',
        phoneticAm: 'Ameseginalehu',
        emoji: '🤝',
        durationMs: 1800,
        description: 'Forward gratitude bowing motion.',
      },
      {
        id: 's1-4',
        signKey: 'neutral',
        glossEn: 'REST',
        glossAm: 'እረፍት',
        phoneticAm: 'Erefet',
        emoji: '🖐️',
        durationMs: 600,
        description: 'Hand resting.',
      },
    ],
  },
  {
    id: 'seq-service-ok',
    titleEn: 'Okay, perfect, thank you',
    titleAm: 'እሺ፣ ትክክል፣ አመሰግናለሁ',
    scenario: 'service',
    scenarioLabelEn: 'Everyday Service Interactions',
    scenarioLabelAm: 'የአገልግሎትና የሸመታ ተግባቦት',
    description: 'Confirming satisfactory service, payment, or completion of an order.',
    validationStatus: 'verified',
    totalDurationMs: 4800,
    steps: [
      {
        id: 's2-1',
        signKey: 'ok',
        glossEn: 'OKAY / PERFECT',
        glossAm: 'እሺ / ትክክል',
        phoneticAm: 'Eshi / Tikkikkil',
        emoji: '👌',
        durationMs: 1800,
        description: 'O-ring thumb and index loop with remaining digits fanned.',
      },
      {
        id: 's2-2',
        signKey: 'thank_you',
        glossEn: 'THANK YOU',
        glossAm: 'አመሰግናለሁ',
        phoneticAm: 'Ameseginalehu',
        emoji: '🤝',
        durationMs: 2200,
        description: 'Gratitude gesture.',
      },
      {
        id: 's2-3',
        signKey: 'neutral',
        glossEn: 'REST',
        glossAm: 'እረፍት',
        phoneticAm: 'Erefet',
        emoji: '🖐️',
        durationMs: 800,
        description: 'Rest pose.',
      },
    ],
  },
  {
    id: 'seq-service-decline',
    titleEn: 'No, thank you',
    titleAm: 'አይ፣ አመሰግናለሁ',
    scenario: 'service',
    scenarioLabelEn: 'Everyday Service Interactions',
    scenarioLabelAm: 'የአገልግሎትና የሸመታ ተግባቦት',
    description: 'Politely declining an offered item, upgrade, or additional service.',
    validationStatus: 'verified',
    totalDurationMs: 4400,
    steps: [
      {
        id: 's3-1',
        signKey: 'no',
        glossEn: 'NO / DECLINE',
        glossAm: 'አይ / አልፈልግም',
        phoneticAm: 'Ay',
        emoji: '👎',
        durationMs: 1800,
        description: 'Thumb down / negative indicator.',
      },
      {
        id: 's3-2',
        signKey: 'thank_you',
        glossEn: 'THANK YOU',
        glossAm: 'አመሰግናለሁ',
        phoneticAm: 'Ameseginalehu',
        emoji: '🤝',
        durationMs: 2000,
        description: 'Polite gratitude acknowledgement.',
      },
      {
        id: 's3-3',
        signKey: 'neutral',
        glossEn: 'REST',
        glossAm: 'እረፍት',
        phoneticAm: 'Erefet',
        emoji: '🖐️',
        durationMs: 600,
        description: 'Resting pose.',
      },
    ],
  },

  // ==========================================
  // SCENARIO 3: GENERAL DAILY COMMUNICATION
  // ==========================================
  {
    id: 'seq-daily-peacelove',
    titleEn: 'Hello, peace and love to all',
    titleAm: 'ሰላም፣ ፍቅርና ሰላም ለሁሉ',
    scenario: 'daily',
    scenarioLabelEn: 'General Daily Communication',
    scenarioLabelAm: 'የዕለት ተዕለት ተግባቦት',
    description: 'A warm, community greeting embodying Ethiopian culture of harmony and kinship.',
    validationStatus: 'verified',
    totalDurationMs: 6000,
    steps: [
      {
        id: 'd1-1',
        signKey: 'hello',
        glossEn: 'HELLO',
        glossAm: 'ሰላም',
        phoneticAm: 'Selam',
        emoji: '👋',
        durationMs: 1600,
        description: 'Open hand welcoming wave.',
      },
      {
        id: 'd1-2',
        signKey: 'peace',
        glossEn: 'PEACE',
        glossAm: 'ሰላም ለሁሉ',
        phoneticAm: 'Selam lehulu',
        emoji: '✌️',
        durationMs: 1800,
        description: 'Index and middle finger V-victory peace sign.',
      },
      {
        id: 'd1-3',
        signKey: 'love',
        glossEn: 'LOVE',
        glossAm: 'ፍቅር',
        phoneticAm: 'Fikir',
        emoji: '🤟',
        durationMs: 1800,
        description: 'Thumb, index, and pinky extended in I-Love-You sign.',
      },
      {
        id: 'd1-4',
        signKey: 'neutral',
        glossEn: 'REST',
        glossAm: 'እረፍት',
        phoneticAm: 'Erefet',
        emoji: '🖐️',
        durationMs: 800,
        description: 'Return to relaxed natural hand.',
      },
    ],
  },
  {
    id: 'seq-daily-callme',
    titleEn: 'Please call me later',
    titleAm: 'እባክህ ደውልልኝ',
    scenario: 'daily',
    scenarioLabelEn: 'General Daily Communication',
    scenarioLabelAm: 'የዕለት ተዕለት ተግባቦት',
    description: 'Asking a family member, colleague, or friend to reach out by telephone.',
    validationStatus: 'verified',
    totalDurationMs: 4800,
    steps: [
      {
        id: 'd2-1',
        signKey: 'please',
        glossEn: 'PLEASE',
        glossAm: 'እባክህ',
        phoneticAm: 'Ebakih',
        emoji: '🙏',
        durationMs: 1800,
        description: 'Respectful flat palm request.',
      },
      {
        id: 'd2-2',
        signKey: 'call',
        glossEn: 'CALL ME',
        glossAm: 'ደውልልኝ',
        phoneticAm: 'Dewillign',
        emoji: '🤙',
        durationMs: 2200,
        description: 'Thumb and pinky extended mimicking phone receiver.',
      },
      {
        id: 'd2-3',
        signKey: 'neutral',
        glossEn: 'REST',
        glossAm: 'እረፍት',
        phoneticAm: 'Erefet',
        emoji: '🖐️',
        durationMs: 800,
        description: 'Neutral baseline.',
      },
    ],
  },
  {
    id: 'seq-daily-helpemergency',
    titleEn: 'Emergency, please help!',
    titleAm: 'አስቸኳይ፣ እባክዎ እርዳኝ!',
    scenario: 'daily',
    scenarioLabelEn: 'General Daily Communication',
    scenarioLabelAm: 'የዕለት ተዕለት ተግባቦት',
    description: 'Urgent call for bystander or emergency service assistance.',
    validationStatus: 'verified',
    totalDurationMs: 4600,
    steps: [
      {
        id: 'd3-1',
        signKey: 'help',
        glossEn: 'HELP / SOS',
        glossAm: 'እርዳኝ / አስቸኳይ',
        phoneticAm: 'Eredagn',
        emoji: '🆘',
        durationMs: 2000,
        description: 'Closed fist held firmly forward signaling urgent distress.',
      },
      {
        id: 'd3-2',
        signKey: 'please',
        glossEn: 'PLEASE',
        glossAm: 'እባክዎ',
        phoneticAm: 'Ebakwo',
        emoji: '🙏',
        durationMs: 1800,
        description: 'Polite flat hand appeal.',
      },
      {
        id: 'd3-3',
        signKey: 'neutral',
        glossEn: 'REST',
        glossAm: 'እረፍት',
        phoneticAm: 'Erefet',
        emoji: '🖐️',
        durationMs: 800,
        description: 'Rest.',
      },
    ],
  },
];

export function findSequenceById(id: string): SignSequence | undefined {
  return SIGN_SEQUENCES.find((s) => s.id === id);
}

export function findSequencesByScenario(scenario: 'classroom' | 'service' | 'daily'): SignSequence[] {
  return SIGN_SEQUENCES.filter((s) => s.scenario === scenario);
}

export function searchSequencesAndGestures(query: string): {
  matchedSequence?: SignSequence;
  matchedGestureKey?: string;
} {
  const clean = query.trim().toLowerCase();
  if (!clean) return {};

  // Check sequences first
  for (const seq of SIGN_SEQUENCES) {
    if (
      clean.includes(seq.titleEn.toLowerCase()) ||
      seq.titleEn.toLowerCase().includes(clean) ||
      clean.includes(seq.titleAm) ||
      seq.titleAm.includes(clean)
    ) {
      return { matchedSequence: seq };
    }
  }

  return {};
}
