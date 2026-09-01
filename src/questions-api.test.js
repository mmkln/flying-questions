import assert from 'node:assert/strict';
import test from 'node:test';

import {
  QUESTIONS_PATH,
  getQuestionsUrl,
  getThoughtSyncUrl,
  setQuestionAnchor,
} from './questions-api.js';

test('builds the server-filtered questions endpoint', () => {
  assert.equal(QUESTIONS_PATH, '/thoughts/?knowledge_kind=question');
  assert.equal(
    getQuestionsUrl('http://127.0.0.1:8001/api/v1/'),
    'http://127.0.0.1:8001/api/v1/thoughts/?knowledge_kind=question',
  );
});

test('builds the revision-safe thought sync endpoint', () => {
  assert.equal(
    getThoughtSyncUrl('http://127.0.0.1:8001/api/v1/', 'test-uuid'),
    'http://127.0.0.1:8001/api/v1/thoughts/test-uuid/sync/',
  );
});

test('patches only navigation when anchoring a question', async (t) => {
  const originalFetch = globalThis.fetch;
  let request;
  globalThis.fetch = async (url, options) => {
    request = { url, options };
    return {
      ok: true,
      json: async () => ({ id: 'test-uuid', revision: 5 }),
    };
  };
  t.after(() => { globalThis.fetch = originalFetch; });

  await setQuestionAnchor(
    'http://127.0.0.1:8001/api/v1',
    'access-token',
    {
      id: 'test-uuid',
      revision: 4,
      meta: {
        knowledge: { version: 1, kind: 'question' },
        navigation: { version: 2, preference: 'keep-me' },
      },
    },
    true,
  );

  const body = JSON.parse(request.options.body);

  assert.equal(request.url, 'http://127.0.0.1:8001/api/v1/thoughts/test-uuid/sync/');
  assert.equal(request.options.method, 'PATCH');
  assert.equal(Number.isFinite(body.meta_patch.navigation.anchor.createdAt), true);
  assert.deepEqual(body, {
    base_revision: 4,
    meta_patch: {
      navigation: {
        version: 2,
        preference: 'keep-me',
        anchor: { createdAt: body.meta_patch.navigation.anchor.createdAt },
      },
    },
  });
});

test('removes the navigation object only when it no longer has data', async (t) => {
  const originalFetch = globalThis.fetch;
  let request;
  globalThis.fetch = async (_url, options) => {
    request = options;
    return {
      ok: true,
      json: async () => ({ id: 'test-uuid', revision: 5 }),
    };
  };
  t.after(() => { globalThis.fetch = originalFetch; });

  await setQuestionAnchor(
    'http://127.0.0.1:8001/api/v1',
    'access-token',
    {
      id: 'test-uuid',
      revision: 4,
      meta: {
        knowledge: { version: 1, kind: 'question' },
        navigation: { version: 2, anchor: { createdAt: 123 } },
      },
    },
    false,
  );

  assert.deepEqual(JSON.parse(request.body), {
    base_revision: 4,
    meta_patch: { navigation: null },
  });
});
