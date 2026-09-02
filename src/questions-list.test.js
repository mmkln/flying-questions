import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getActiveFilterSummary,
  isQuestionSelected,
} from './questions-list.js';

test('marks only the selected question as current', () => {
  const question = { id: 'question-a' };

  assert.equal(isQuestionSelected(question, 'question-a'), true);
  assert.equal(isQuestionSelected(question, 'question-b'), false);
  assert.equal(isQuestionSelected(question, null), false);
});

test('summarizes only the active filters in the toolbar', () => {
  assert.equal(getActiveFilterSummary({ scope: 'all', status: 'all' }), '');
  assert.equal(
    getActiveFilterSummary({ scope: 'anchored', status: 'draft_ready' }),
    'Anchored · Draft ready',
  );
});
