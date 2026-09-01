import assert from 'node:assert/strict';
import test from 'node:test';

import { QUESTIONS_PATH, getQuestionsUrl } from './questions-api.js';

test('builds the server-filtered questions endpoint', () => {
  assert.equal(QUESTIONS_PATH, '/thoughts/?knowledge_kind=question');
  assert.equal(
    getQuestionsUrl('http://127.0.0.1:8001/api/v1/'),
    'http://127.0.0.1:8001/api/v1/thoughts/?knowledge_kind=question',
  );
});
