import assert from 'node:assert/strict';
import test from 'node:test';

import { getLatestRun, getWorkflowLabel } from './question-workflow.js';

test('uses context-specific workflow labels', () => {
  assert.equal(getWorkflowLabel({ status: 'draft_ready' }, 'list'), 'Draft ready');
  assert.equal(
    getWorkflowLabel({ status: 'draft_ready' }),
    'Draft ready for your review',
  );
  assert.equal(getWorkflowLabel({ status: 'unknown' }), null);
});

test('returns the latest run only when it exists', () => {
  const run = { id: 'run-id' };
  assert.equal(getLatestRun({ workflow: { latest_run: run } }), run);
  assert.equal(getLatestRun({ workflow: null }), null);
});
