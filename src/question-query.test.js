import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getQuestionCounts,
  QuestionScope,
  QuestionStatusFilter,
  normalizeQuestionQuery,
  selectQuestions,
} from './question-query.js';

const questions = [
  { id: 'first', text: 'Що таке влюбленність?', meta: {} },
  {
    id: 'second',
    text: 'Як досліджувати системне мислення?',
    meta: { navigation: { anchor: { createdAt: 1 } } },
    workflow: { status: 'draft_ready' },
  },
];

test('normalizes an unknown question scope to all', () => {
  assert.deepEqual(
    normalizeQuestionQuery({ scope: 'unknown', text: '  query  ' }),
    {
      scope: QuestionScope.ALL,
      status: QuestionStatusFilter.ALL,
      text: '  query  ',
    },
  );
});

test('searches question text without regard to case', () => {
  assert.deepEqual(
    selectQuestions(questions, { text: 'ВЛЮБЛЕННІСТЬ' }).map(({ id }) => id),
    ['first'],
  );
});

test('treats a whitespace-only search as no query', () => {
  assert.deepEqual(
    selectQuestions(questions, { text: '   ' }).map(({ id }) => id),
    ['first', 'second'],
  );
});

test('combines text search with the anchored scope', () => {
  assert.deepEqual(
    selectQuestions(questions, {
      scope: QuestionScope.ANCHORED,
      text: 'мислення',
    }).map(({ id }) => id),
    ['second'],
  );
});

test('combines research status with scope and text filters', () => {
  assert.deepEqual(
    selectQuestions(questions, {
      scope: QuestionScope.ANCHORED,
      status: QuestionStatusFilter.DRAFT_READY,
      text: 'мислення',
    }).map(({ id }) => id),
    ['second'],
  );
});

test('does not mistake questions without a workflow for queued work', () => {
  assert.deepEqual(
    selectQuestions(questions, { status: QuestionStatusFilter.READY }).map(({ id }) => id),
    ['first'],
  );
});

test('normalizes an unknown status filter to all research states', () => {
  assert.equal(
    normalizeQuestionQuery({ status: 'not-a-workflow-state' }).status,
    QuestionStatusFilter.ALL,
  );
});

test('includes lifecycle counts for the filter menu', () => {
  assert.deepEqual(getQuestionCounts(questions).status, {
    all: 2,
    ready: 1,
    queued: 0,
    in_progress: 0,
    draft_ready: 1,
    failed: 0,
    closed: 0,
  });
});
