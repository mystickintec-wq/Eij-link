import { DocumentExtractRequest, DocumentExtractResponse } from '../types';
import { apiFetch } from './apiClient';

export const documentService = {
  async extractText(request: DocumentExtractRequest): Promise<DocumentExtractResponse> {
    const response = await apiFetch('/api/documents', {
      method: 'POST',
      timeoutMs: 25000,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({ error: 'Document extraction failed' }));
      throw new Error(errData.error || `Error ${response.status}: Document extraction failed`);
    }

    return response.json();
  },
};
