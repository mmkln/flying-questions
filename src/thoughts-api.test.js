import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getRelatedThoughtReferencesUrl,
  getThoughtReferencesUrl,
  loadRelatedThoughtReferences,
  searchThoughtReferences,
} from './thoughts-api.js';

test('builds the lightweight thought search and direct-neighbour endpoints', () => {
  assert.equal(
    getThoughtReferencesUrl('http://127.0.0.1:8001/api/v1/', 'mental models'),
    'http://127.0.0.1:8001/api/v1/thoughts/references/?q=mental+models&limit=20',
  );
  assert.equal(
    getRelatedThoughtReferencesUrl('http://127.0.0.1:8001/api/v1/', 'thought-id'),
    'http://127.0.0.1:8001/api/v1/thoughts/thought-id/related-references/?limit=12',
  );
});

test('loads only array reference payloads', async (t) => {
  const originalFetch = globalThis.fetch;
  const requests = [];
  const controller = new AbortController();
  globalThis.fetch = async (url, options) => {
    requests.push({ url, options });
    return {
      ok: true,
      json: async () => [{ id: 'thought-id', text: 'A thought' }],
    };
  };
  t.after(() => { globalThis.fetch = originalFetch; });

  const search = await searchThoughtReferences(
    'http://127.0.0.1:8001/api/v1',
    'token',
    'thought',
    { signal: controller.signal },
  );
  const related = await loadRelatedThoughtReferences(
    'http://127.0.0.1:8001/api/v1',
    'token',
    'thought-id',
  );

  assert.equal(search[0].id, 'thought-id');
  assert.equal(related[0].id, 'thought-id');
  assert.equal(requests[0].options.headers.Authorization, 'Bearer token');
  assert.equal(requests[0].options.signal, controller.signal);
  assert.match(requests[1].url, /related-references/);
});
