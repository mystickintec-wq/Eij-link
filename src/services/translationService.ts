import { TranslateRequest, TranslateResponse } from '../types';

const COMMON_DICTIONARY: Record<string, { am: string; amPhonetic: string; en: string }> = {
  hello: { am: 'ሰላም', amPhonetic: 'Selam', en: 'Hello' },
  hi: { am: 'ሰላም', amPhonetic: 'Selam', en: 'Hi' },
  'thank you': { am: 'አመሰግናለሁ', amPhonetic: 'Ameseginalehu', en: 'Thank you' },
  thanks: { am: 'አመሰግናለሁ', amPhonetic: 'Ameseginalehu', en: 'Thanks' },
  yes: { am: 'አዎ', amPhonetic: 'Awo', en: 'Yes' },
  no: { am: 'አይደለም / አይ', amPhonetic: 'Aydelem / Aye', en: 'No' },
  please: { am: 'እባክዎ', amPhonetic: 'Ebakwo', en: 'Please' },
  help: { am: 'እባክዎን እርዱኝ', amPhonetic: 'Ebakwon erdugn', en: 'Please help me' },
  water: { am: 'ውሃ', amPhonetic: 'Wuha', en: 'Water' },
  food: { am: 'ምግብ', amPhonetic: 'Migib', en: 'Food' },
  'how are you': { am: 'እንደምን አለህ / አለሽ?', amPhonetic: 'Endemin aleh / alesh?', en: 'How are you?' },
  'good morning': { am: 'እንደምን አደሩ', amPhonetic: 'Endemin aderachu', en: 'Good morning' },
  'good evening': { am: 'እንደምን አመሹ', amPhonetic: 'Endemin ameshu', en: 'Good evening' },
  goodbye: { am: 'ደህና ሁን / ሁኚ', amPhonetic: 'Dehna hun / hugni', en: 'Goodbye' },
  peace: { am: 'ሰላም', amPhonetic: 'Selam', en: 'Peace' },
  love: { am: 'ፍቅር', amPhonetic: 'Fikir', en: 'Love' },
  ok: { am: 'እሺ', amPhonetic: 'Ishi', en: 'OK / Alright' },
  doctor: { am: 'ዶክተር / ሐኪም', amPhonetic: 'Hakim', en: 'Doctor' },
  hospital: { am: 'ሆስፒታል', amPhonetic: 'Hospital', en: 'Hospital' },
  school: { am: 'ትምህርት ቤት', amPhonetic: 'Timhirt bet', en: 'School' },
  teacher: { am: 'አስተማሪ', amPhonetic: 'Astemari', en: 'Teacher' },
  friend: { am: 'ጓደኛ', amPhonetic: 'Gwadegna', en: 'Friend' },
};

export function getLocalTranslationFallback(request: TranslateRequest, reason?: string): TranslateResponse {
  const norm = request.text.trim().toLowerCase();
  const target = request.targetLang.toLowerCase();

  const match = COMMON_DICTIONARY[norm];
  if (match) {
    if (target.includes('amharic') || target.includes('am')) {
      return {
        translatedText: match.am,
        phoneticPronunciation: match.amPhonetic,
        sourceLanguage: request.sourceLang || 'en',
        targetLanguage: request.targetLang,
        notes: `Instant dictionary translation. ${reason ? `(${reason})` : ''}`,
        isOfflineFallback: true,
        offlineNotice: 'AI cloud experiencing high demand. Provided via instant local dictionary.',
      };
    } else if (target.includes('english') || target.includes('en')) {
      return {
        translatedText: match.en,
        sourceLanguage: request.sourceLang || 'am',
        targetLanguage: request.targetLang,
        notes: `Instant dictionary translation. ${reason ? `(${reason})` : ''}`,
        isOfflineFallback: true,
        offlineNotice: 'AI cloud experiencing high demand. Provided via instant local dictionary.',
      };
    }
  }

  return {
    translatedText: `[Standby Mode] "${request.text}" (${request.targetLang})`,
    sourceLanguage: request.sourceLang || 'auto',
    targetLanguage: request.targetLang,
    notes: 'Cloud AI is currently experiencing high demand. Please retry in a few moments.',
    isOfflineFallback: true,
    offlineNotice: 'AI cloud experiencing high demand. Please click Retry in a few moments.',
  };
}

export const translationService = {
  async translate(request: TranslateRequest): Promise<TranslateResponse> {
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (response.ok) {
        return await response.json();
      }

      const errData = await response.json().catch(() => ({}));
      return getLocalTranslationFallback(request, errData.error || 'High Cloud Demand');
    } catch (networkErr: any) {
      console.warn('Network issue reaching translation service:', networkErr);
      return getLocalTranslationFallback(request, 'Offline Standby Mode');
    }
  },
};
