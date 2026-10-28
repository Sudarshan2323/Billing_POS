let accessToken = null;

export function setAccessToken(token) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export async function apiRequest(endpoint, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
    const error = new Error(message);
    error.code = data?.error?.code || 'HTTP_ERROR';
    error.status = response.status;
    error.details = data?.error?.details;
    throw error;
  }

  return data;
}
