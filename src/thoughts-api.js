function getThoughtsBaseUrl(apiUrl) {
  return `${String(apiUrl).replace(/\/$/, '')}/thoughts`;
}

export function getThoughtReferencesUrl(apiUrl, query = '') {
  const url = new URL(`${getThoughtsBaseUrl(apiUrl)}/references/`);
  const normalizedQuery = String(query || '').trim();
  if (normalizedQuery) url.searchParams.set('q', normalizedQuery);
  url.searchParams.set('limit', '20');
  return url.toString();
}

export function getRelatedThoughtReferencesUrl(apiUrl, thoughtId) {
  const url = new URL(
    `${getThoughtsBaseUrl(apiUrl)}/${encodeURIComponent(thoughtId)}/related-references/`,
  );
  url.searchParams.set('limit', '12');
  return url.toString();
}

async function loadReferences(url, accessToken, fallbackMessage, { signal } = {}) {
  const response = await fetch(url, {
    signal,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok || !Array.isArray(payload)) {
    throw new Error(
      typeof payload?.detail === 'string' ? payload.detail : fallbackMessage,
    );
  }
  return payload;
}

export function searchThoughtReferences(apiUrl, accessToken, query, options) {
  return loadReferences(
    getThoughtReferencesUrl(apiUrl, query),
    accessToken,
    'Could not search thoughts.',
    options,
  );
}

export function loadRelatedThoughtReferences(apiUrl, accessToken, thoughtId, options) {
  return loadReferences(
    getRelatedThoughtReferencesUrl(apiUrl, thoughtId),
    accessToken,
    'Could not load related thoughts.',
    options,
  );
}
