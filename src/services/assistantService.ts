import { AssistantRequest, AssistantResponse } from '../types';

export const assistantService = {
  async processText(request: AssistantRequest): Promise<AssistantResponse> {
    const response = await fetch('/api/assistant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({ error: 'Assistant service request failed' }));
      throw new Error(errData.error || `Error ${response.status}: Failed to process text`);
    }

    return response.json();
  },
};
