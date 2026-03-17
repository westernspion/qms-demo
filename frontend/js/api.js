// ============================================================================
// api.js — All fetch() calls live here. API_BASE_URL is set once.
// This is the only file that knows the backend URL.
// ============================================================================

export const API_BASE = '/api';

/**
 * Fetch JSON from the API with consistent error handling.
 * @param {string} path - Path under /api, e.g. '/documents'
 * @param {RequestInit} opts - fetch options
 * @returns {Promise<any>} parsed JSON
 */
export async function apiFetch(path, opts = {}) {
  const url = `${API_BASE}${path}`;
  const defaultHeaders = { 'Content-Type': 'application/json' };

  // Don't set Content-Type for FormData (browser sets it with boundary)
  const headers = opts.body instanceof FormData
    ? {}
    : { ...defaultHeaders, ...(opts.headers || {}) };

  const res = await fetch(url, { ...opts, headers });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const err = await res.json();
      detail = err.detail || detail;
    } catch (_) {}
    throw new Error(`API error ${res.status}: ${detail}`);
  }

  // Return null for 204 No Content
  if (res.status === 204) return null;

  return res.json();
}

/**
 * Connect to an SSE endpoint (POST with JSON body).
 * Calls onEvent(parsedObject) for each data: line received.
 * Returns a cleanup function to abort the stream.
 *
 * @param {string} path - Path under /api, e.g. '/search'
 * @param {object} body - JSON request body
 * @param {function} onEvent - callback(event: object)
 * @returns {function} abort — call to cancel the stream
 */
export function apiStream(path, body, onEvent) {
  const controller = new AbortController();
  const url = `${API_BASE}${path}`;

  (async () => {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!res.ok) {
        onEvent({ type: 'error', message: `HTTP ${res.status}` });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep incomplete line

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const raw = trimmed.slice(6);
            try {
              onEvent(JSON.parse(raw));
            } catch (_) {
              // ignore malformed events
            }
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        onEvent({ type: 'error', message: err.message });
      }
    }
  })();

  return () => controller.abort();
}

// ---------------------------------------------------------------------------
// Convenience wrappers for each API area
// ---------------------------------------------------------------------------

export const api = {
  // Health
  health: () => apiFetch('/health'),

  // Documents
  listDocuments: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/documents${qs ? '?' + qs : ''}`);
  },
  getDocument: (id) => apiFetch(`/documents/${id}`),
  uploadDocument: (formData) => apiFetch('/documents/upload', {
    method: 'POST',
    body: formData,
  }),
  analyzeDocument: (id) => apiFetch(`/documents/${id}/analyze`, { method: 'POST' }),

  // Search
  search: (query, onEvent) => apiStream('/search', { query }, onEvent),

  // CAPAs
  listCapas: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/capas${qs ? '?' + qs : ''}`);
  },
  getCapa: (id) => apiFetch(`/capas/${id}`),
  createCapa: (data) => apiFetch('/capas', { method: 'POST', body: JSON.stringify(data) }),
  updateCapa: (id, data) => apiFetch(`/capas/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  analyzeCapa: (id) => apiFetch(`/capas/${id}/analyze`, { method: 'POST' }),

  // Audit
  getAudit: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/audit${qs ? '?' + qs : ''}`);
  },

  // Graph
  getGraph: () => apiFetch('/graph'),
};
