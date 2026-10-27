import { DocumentExtractRequest, DocumentExtractResponse } from '../types';

export const documentService = {
  async extractText(request: DocumentExtractRequest): Promise<DocumentExtractResponse> {
    const response = await fetch('/api/documents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({ error: 'Document extraction failed' }));
      throw new Error(errData.error || `Error ${response.status}: Document extraction failed`);
    }

    return response.json();
  },
};
