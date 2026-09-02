import assert from 'node:assert/strict';
import test from 'node:test';

import {
  MAX_RESEARCH_CONTEXT_THOUGHTS,
  hasResearchContext,
  normalizeResearchContext,
  researchContextFromWorkflow,
} from './research-context.js';

test('normalizes selected context thoughts without mutating the order', () => {
  const context = normalizeResearchContext({
    note: 'Compare these sources.',
    thoughts: [
      { id: 'second', text: 'Second' },
      { id: 'first', text: 'First' },
      { id: 'second', text: 'Duplicate' },
      { text: 'Missing id' },
    ],
  });

  assert.deepEqual(context, {
    note: 'Compare these sources.',
    thoughts: [
      {
        id: 'second',
        text: 'Second',
        kind: 'thought',
        revision: 0,
        created_at: null,
      },
      {
        id: 'first',
        text: 'First',
        kind: 'thought',
        revision: 0,
        created_at: null,
      },
    ],
  });
});

test('caps context references and reads the workflow payload', () => {
  const thoughts = Array.from({ length: MAX_RESEARCH_CONTEXT_THOUGHTS + 2 }, (_value, index) => ({
    id: `thought-${index}`,
  }));
  const context = researchContextFromWorkflow({
    research_note: '',
    context_thoughts: thoughts,
  });

  assert.equal(context.thoughts.length, MAX_RESEARCH_CONTEXT_THOUGHTS);
  assert.equal(hasResearchContext(context), true);
  assert.equal(hasResearchContext({}), false);
});
