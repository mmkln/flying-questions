const DEFAULT_API_URL = 'http://127.0.0.1:8001/api/v1';
const AUTH_STORAGE_KEY = 'flying-questions:auth:v1';
const REFRESH_TOKEN_STORAGE_KEY = 'flying-questions:refresh-token:v1';

export const API_URL = (
  import.meta.env.VITE_API_URL?.trim().replace(/\/$/, '')
  || DEFAULT_API_URL
);

const SSO_RETURN_URL = (
  import.meta.env.VITE_SSO_RETURN_URL?.trim()
  || `${window.location.origin}${import.meta.env.BASE_URL}`
);

let accessToken = null;
let refreshToken = localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
let account = null;

class ApiError extends Error {
  constructor(status, payload) {
    super(typeof payload?.detail === 'string' ? payload.detail : 'Request failed.');
    this.status = status;
  }
}

function bearerHeaders({ token = null, hasBody = false } = {}) {
  const headers = { Accept: 'application/json' };
  if (hasBody) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function parseAccount(value) {
  if (!value || typeof value.id !== 'string' || typeof value.email !== 'string') {
    return null;
  }

  return { id: value.id, email: value.email };
}

function storeAccount(nextAccount) {
  account = nextAccount;
  if (account) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(account));
  } else {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

function storeRefreshToken(nextRefreshToken) {
  refreshToken = nextRefreshToken;
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
  } else {
    localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  }
}

function clearSession() {
  accessToken = null;
  storeRefreshToken(null);
  storeAccount(null);
}

function applyTokenSession(payload) {
  const nextAccount = parseAccount(payload?.user);
  if (
    !nextAccount
    || typeof payload?.access !== 'string'
    || !payload.access
    || typeof payload?.refresh !== 'string'
    || !payload.refresh
  ) {
    throw new Error('The server returned an invalid sign-in response.');
  }

  accessToken = payload.access;
  storeRefreshToken(payload.refresh);
  storeAccount(nextAccount);
}

function parseSsoFragment() {
  const parameters = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  return {
    code: parameters.get('sso_code'),
    error: parameters.get('sso_error'),
  };
}

function clearSsoFragment() {
  window.history.replaceState(
    null,
    document.title,
    `${window.location.pathname}${window.location.search}`,
  );
}

async function exchangeSsoCallback() {
  const { code, error } = parseSsoFragment();
  if (!code && !error) return false;
  clearSsoFragment();

  if (error === 'access_denied') return false;
  if (error) throw new Error('Sign in could not be completed.');

  const response = await fetch(`${API_URL}/auth/sso/exchange/`, {
    method: 'POST',
    headers: bearerHeaders({ hasBody: true }),
    body: JSON.stringify({ code }),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(response.status, payload);

  applyTokenSession(payload);
  return true;
}

async function refreshAccessToken() {
  if (!refreshToken) throw new Error('Authentication required.');

  const response = await fetch(`${API_URL}/auth/token/refresh/`, {
    method: 'POST',
    headers: bearerHeaders({ hasBody: true }),
    body: JSON.stringify({ refresh: refreshToken }),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(response.status, payload);
  if (typeof payload?.access !== 'string' || !payload.access) {
    throw new Error('The server returned an invalid token refresh.');
  }

  accessToken = payload.access;
  if (typeof payload.refresh === 'string' && payload.refresh) {
    storeRefreshToken(payload.refresh);
  }
}

async function loadCurrentAccount() {
  const response = await fetch(`${API_URL}/auth/sso/me/`, {
    headers: bearerHeaders({ token: accessToken }),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(response.status, payload);

  const nextAccount = parseAccount(payload?.user);
  if (!nextAccount) throw new Error('The server returned an invalid account identity.');
  storeAccount(nextAccount);
  return nextAccount;
}

export function beginLogin({ switchAccount = false } = {}) {
  const query = new URLSearchParams({ return_to: SSO_RETURN_URL });
  if (switchAccount) query.set('switch', '1');
  window.location.assign(`${API_URL}/auth/sso/login/?${query}`);
}

export async function restoreSession() {
  try {
    const completedLogin = await exchangeSsoCallback();
    if (!completedLogin && !refreshToken) return null;

    if (!completedLogin) await refreshAccessToken();
    return await loadCurrentAccount();
  } catch (error) {
    clearSession();
    throw error;
  }
}

export function getAccessToken() {
  return accessToken;
}

export async function signOut() {
  const tokenToRevoke = refreshToken;
  clearSession();

  if (!tokenToRevoke) return;
  await fetch(`${API_URL}/auth/token/blacklist/`, {
    method: 'POST',
    headers: bearerHeaders({ hasBody: true }),
    body: JSON.stringify({ refresh: tokenToRevoke }),
  }).catch(() => undefined);
}
