import { TranslateRequest, TranslateResponse } from '../types';

export const translationService = {
  async translate(request: TranslateRequest): Promise<TranslateResponse> {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({ error: 'Translation service request failed' }));
      throw new Error(errData.error || `Error ${response.status}: Translation failed`);
    }

    return response.json();
  },
};
