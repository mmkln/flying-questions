import assert from 'node:assert/strict';
import test from 'node:test';

import {
  QUESTIONS_INBOX_PATH,
  createQuestion,
  getQuestionMaterializeUrl,
  getQuestionQueueUrl,
  getQuestionsUrl,
  getThoughtSyncUrl,
  queueQuestion,
  setQuestionAnchor,
  updateQuestionText,
} from './questions-api.js';

test('builds the dedicated questions inbox endpoint', () => {
  assert.equal(QUESTIONS_INBOX_PATH, '/questions/inbox/');
  assert.equal(
    getQuestionsUrl('http://127.0.0.1:8001/api/v1/'),
    'http://127.0.0.1:8001/api/v1/questions/inbox/',
  );
  assert.equal(
    getQuestionQueueUrl('http://127.0.0.1:8001/api/v1/', 'question-id'),
    'http://127.0.0.1:8001/api/v1/questions/question-id/queue/',
  );
  assert.equal(
    getQuestionMaterializeUrl('http://127.0.0.1:8001/api/v1/', 'run-id'),
    'http://127.0.0.1:8001/api/v1/questions/runs/run-id/materialize/',
  );
});

test('queues a question without altering its metadata', async (t) => {
  const originalFetch = globalThis.fetch;
  let request;
  globalThis.fetch = async (url, options) => {
    request = { url, options };
    return {
      ok: true,
      json: async () => ({ id: 'question-id', workflow: { status: 'queued' } }),
    };
  };
  t.after(() => { globalThis.fetch = originalFetch; });

  await queueQuestion(
    'http://127.0.0.1:8001/api/v1',
    'access-token',
    'question-id',
    {
      priority: 3,
      researchContext: {
        note: 'Use primary sources.',
        thoughts: [{ id: 'source-one' }, { id: 'source-two' }],
      },
    },
  );

  assert.equal(request.url, 'http://127.0.0.1:8001/api/v1/questions/question-id/queue/');
  assert.equal(request.options.method, 'POST');
  assert.deepEqual(JSON.parse(request.options.body), {
    priority: 3,
    research_note: 'Use primary sources.',
    context_thought_ids: ['source-one', 'source-two'],
  });
});

test('builds the revision-safe thought sync endpoint', () => {
  assert.equal(
    getThoughtSyncUrl('http://127.0.0.1:8001/api/v1/', 'test-uuid'),
    'http://127.0.0.1:8001/api/v1/thoughts/test-uuid/sync/',
  );
});

test('creates a question through an idempotent sync PUT', async (t) => {
  const originalFetch = globalThis.fetch;
  let request;
  globalThis.fetch = async (url, options) => {
    request = { url, options };
    return {
      ok: true,
      status: 201,
      json: async () => ({ id: 'draft-uuid', revision: 1 }),
    };
  };
  t.after(() => { globalThis.fetch = originalFetch; });

  await createQuestion(
    'http://127.0.0.1:8001/api/v1',
    'access-token',
    {
      draftId: 'draft-uuid',
      text: 'How should I prioritize my questions?',
      createdAt: '2026-09-02T12:00:00.000Z',
    },
  );

  assert.equal(request.url, 'http://127.0.0.1:8001/api/v1/thoughts/draft-uuid/sync/');
  assert.equal(request.options.method, 'PUT');
  assert.deepEqual(JSON.parse(request.options.body), {
    text: 'How should I prioritize my questions?',
    color: 'purple',
    is_pinned: false,
    created_at: '2026-09-02T12:00:00.000Z',
    meta: {
      knowledge: {
        version: 1,
        kind: 'question',
      },
    },
  });
});

test('patches only text when editing a question', async (t) => {
  const originalFetch = globalThis.fetch;
  let request;
  globalThis.fetch = async (url, options) => {
    request = { url, options };
    return {
      ok: true,
      status: 200,
      json: async () => ({ id: 'question-uuid', revision: 5 }),
    };
  };
  t.after(() => { globalThis.fetch = originalFetch; });

  await updateQuestionText(
    'http://127.0.0.1:8001/api/v1',
    'access-token',
    { id: 'question-uuid', revision: 4, meta: { navigation: { anchor: {} } } },
    'What should I do next?',
  );

  assert.equal(request.url, 'http://127.0.0.1:8001/api/v1/thoughts/question-uuid/sync/');
  assert.equal(request.options.method, 'PATCH');
  assert.deepEqual(JSON.parse(request.options.body), {
    base_revision: 4,
    text: 'What should I do next?',
  });
});

test('keeps the current server version on a conflicting text update', async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: false,
    status: 409,
    json: async () => ({
      detail: 'This question was updated elsewhere.',
      current: { id: 'question-uuid', revision: 5, text: 'Current text' },
    }),
  });
  t.after(() => { globalThis.fetch = originalFetch; });

  await assert.rejects(
    updateQuestionText(
      'http://127.0.0.1:8001/api/v1',
      'access-token',
      { id: 'question-uuid', revision: 4 },
      'Local text',
    ),
    (error) => (
      error.status === 409
      && error.current?.text === 'Current text'
    ),
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
