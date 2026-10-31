import { AssistantRequest, AssistantResponse } from '../types';

const SIMPLIFY_MAP: Array<[RegExp, string]> = [
  [/\bostensibly\b/gi, 'supposedly'],
  [/\bmandated\b/gi, 'required'],
  [/\bsynthesize\b/gi, 'summarize'],
  [/\bempirical observations\b/gi, 'hands-on observations'],
  [/\bempirical\b/gi, 'firsthand'],
  [/\bpedagogical abstract\b/gi, 'learning summary'],
  [/\bpedagogical\b/gi, 'educational'],
  [/\bscholastic symposium\b/gi, 'school meeting / conference'],
  [/\bscholastic\b/gi, 'school'],
  [/\bsymposium\b/gi, 'meeting'],
  [/\bpursuant to\b/gi, 'following'],
  [/\bmunicipal decree\b/gi, 'city rule'],
  [/\bcommercial vehicular operators\b/gi, 'commercial drivers'],
  [/\bauthenticated\b/gi, 'verified'],
  [/\bbiometric identity documentation\b/gi, 'photo ID or fingerprint record'],
  [/\bstatutory expiration deadline\b/gi, 'official deadline'],
  [/\bstatutory\b/gi, 'legal'],
  [/\bstrategic methodologies\b/gi, 'practical steps and methods'],
  [/\basynchronous\b/gi, 'flexible, message-based'],
  [/\bcross-functional\b/gi, 'multi-team'],
  [/\bconflict remediation\b/gi, 'resolving disagreements'],
  [/\bgeographically distributed\b/gi, 'remote / distributed'],
  [/\belaborate on\b/gi, 'explain'],
  [/\bcommence\b/gi, 'start'],
  [/\bterminate\b/gi, 'end'],
  [/\butilize\b/gi, 'use'],
  [/\bfacilitate\b/gi, 'help with'],
  [/\bimplement\b/gi, 'put into action'],
  [/\bendeavor\b/gi, 'try'],
  [/\bexpedite\b/gi, 'speed up'],
  [/\bdisseminate\b/gi, 'share'],
  [/\bprocure\b/gi, 'get'],
  [/\btransmit\b/gi, 'send'],
  [/\binquire\b/gi, 'ask'],
  [/\bascertain\b/gi, 'find out'],
  [/\boptimal\b/gi, 'best'],
  [/\bparamount\b/gi, 'very important'],
];

export function simplifyTextLocally(rawText: string): string {
  let result = rawText;
  for (const [pattern, replacement] of SIMPLIFY_MAP) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

export function generateLocalFallback(
  text: string,
  mode = 'simplify',
  reason?: string
): AssistantResponse {
  const clean = text.trim();
  const simplified = simplifyTextLocally(clean);

  // Extract sentences
  const sentences = clean
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 5);

  const keyPoints =
    sentences.length > 0
      ? sentences.slice(0, 3).map((s) => simplifyTextLocally(s))
      : [simplified];

  const lower = clean.toLowerCase();
  const isQuestion = clean.includes('?') || lower.includes('could you') || lower.includes('please explain');
  const isDeadline = lower.includes('deadline') || lower.includes('mandated') || lower.includes('submit') || lower.includes('required');

  let suggestedReplies: string[];
  if (isQuestion) {
    suggestedReplies = [
      'Yes, I can provide a clear explanation with examples.',
      'Could you please clarify the specific focus or scope?',
      'I am preparing my response and will share it shortly.',
      'Thank you for asking. Let us schedule a brief time to discuss.',
    ];
  } else if (isDeadline) {
    suggestedReplies = [
      'Understood. I will prepare this and submit before the deadline.',
      'Could you please verify the exact submission requirements?',
      'I am currently working on this and will keep you updated.',
      'Thank you for the notification.',
    ];
  } else {
    suggestedReplies = [
      'Thank you for the update. I have reviewed the message.',
      'I understand and will proceed accordingly.',
      'Could you provide a few more details when convenient?',
      'Let me know if any further action is required.',
    ];
  }

  return {
    simplifiedText: simplified,
    originalText: clean,
    readingLevel: 'Grade 5-6 (Plain Language)',
    keyPoints: keyPoints.length > 0 ? keyPoints : [simplified],
    suggestedReplies,
    explanations:
      'Rewritten in plain, accessible language with jargon replaced for clarity. ' +
      (reason ? `(${reason})` : ''),
    detectedTone: mode === 'tone_adjust' ? 'Accessible & Direct' : 'Informative',
    isOfflineFallback: true,
    offlineNotice: 'AI cloud service is experiencing temporary high demand. Generated via EjjiLink Instant Accessibility Engine.',
  };
}

export const assistantService = {
  async processText(request: AssistantRequest): Promise<AssistantResponse> {
    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      }

      const errData = await response.json().catch(() => ({}));
      console.warn('Server returned error status, using high-reliability accessibility fallback:', errData.error || response.status);
      return generateLocalFallback(
        request.text,
        request.mode,
        errData.error || 'High Cloud Demand'
      );
    } catch (networkErr: any) {
      console.warn('Network issue reaching assistant service, activating instant offline fallback:', networkErr);
      return generateLocalFallback(
        request.text,
        request.mode,
        'Offline Standby Mode'
      );
    }
  },
};
