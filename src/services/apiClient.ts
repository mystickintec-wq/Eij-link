import { auth } from './firebase';

export interface ApiFetchOptions extends RequestInit {
  timeoutMs?: number;
}

/**
 * Shared API fetch helper that attaches the active Firebase Auth ID token
 * (when signed in) and enforces a clean request timeout via AbortController.
 */
export async function apiFetch(url: string, options: ApiFetchOptions = {}): Promise<Response> {
  const { timeoutMs = 15000, headers, signal, ...rest } = options;

  const mergedHeaders = new Headers(headers);
  if (!mergedHeaders.has('Content-Type') && rest.body) {
    mergedHeaders.set('Content-Type', 'application/json');
  }

  try {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      if (token) {
        mergedHeaders.set('Authorization', `Bearer ${token}`);
      }
    }
  } catch (tokenErr) {
    console.warn('Could not attach Firebase ID token to request:', tokenErr);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const forwardAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) {
      clearTimeout(timeoutId);
      controller.abort();
    } else {
      signal.addEventListener('abort', forwardAbort, { once: true });
    }
  }

  try {
    return await fetch(url, {
      ...rest,
      headers: mergedHeaders,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
    if (signal) {
      signal.removeEventListener('abort', forwardAbort);
    }
  }
}
