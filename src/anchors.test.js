import assert from 'node:assert/strict';
import test from 'node:test';

import { hasAnchor, withAnchor, withoutAnchor } from './anchors.js';

test('adding an anchor preserves unrelated thought metadata', () => {
  const meta = {
    knowledge: { version: 1, kind: 'question' },
    navigation: { version: 2, preference: 'keep-me' },
  };

  assert.deepEqual(withAnchor(meta, 123), {
    knowledge: { version: 1, kind: 'question' },
    navigation: {
      version: 2,
      preference: 'keep-me',
      anchor: { createdAt: 123 },
    },
  });
});

test('removing the last navigation property removes only navigation', () => {
  const meta = {
    knowledge: { version: 1, kind: 'question' },
    navigation: { version: 2, anchor: { createdAt: 123 } },
  };

  assert.deepEqual(withoutAnchor(meta), {
    knowledge: { version: 1, kind: 'question' },
  });
});

test('legacy space anchors are still treated as anchors', () => {
  assert.equal(hasAnchor({
    meta: {
      navigation: {
        anchors: {
          'space-1': { createdAt: 123 },
        },
      },
    },
  }), true);
});
