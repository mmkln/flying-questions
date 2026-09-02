import assert from 'node:assert/strict';
import test from 'node:test';

import {
  QuestionScope,
  normalizeQuestionQuery,
  selectQuestions,
} from './question-query.js';

const questions = [
  { id: 'first', text: 'Що таке влюбленність?', meta: {} },
  {
    id: 'second',
    text: 'Як досліджувати системне мислення?',
    meta: { navigation: { anchor: { createdAt: 1 } } },
  },
];

test('normalizes an unknown question scope to all', () => {
  assert.deepEqual(
    normalizeQuestionQuery({ scope: 'unknown', text: '  query  ' }),
    { scope: QuestionScope.ALL, text: '  query  ' },
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
