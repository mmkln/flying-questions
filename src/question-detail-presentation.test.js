import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DETAIL_STATE,
  DETAIL_VIEW_MODE,
  getQuestionDetailPresentation,
} from './question-detail-presentation.js';

function questionWith(status, latestRun = null) {
  return {
    id: 'question-id',
    text: 'What should I research?',
    workflow: status ? { status, latest_run: latestRun } : null,
  };
}

test('presents an unqueued question as ready for research', () => {
  const presentation = getQuestionDetailPresentation(questionWith(null));

  assert.equal(presentation.state, DETAIL_STATE.READY_FOR_RESEARCH);
  assert.match(presentation.description, /Nothing is saved/);
});

test('presents queued and in-progress workflow states without a draft', () => {
  assert.equal(
    getQuestionDetailPresentation(questionWith('queued')).state,
    DETAIL_STATE.QUEUED,
  );
  assert.equal(
    getQuestionDetailPresentation(questionWith('in_progress')).state,
    DETAIL_STATE.IN_PROGRESS,
  );
});

test('switches a ready draft between preview and review modes', () => {
  const question = questionWith('draft_ready', {
    id: 'run-id',
    draft: 'A proposed answer.',
  });

  assert.equal(
    getQuestionDetailPresentation(question).state,
    DETAIL_STATE.DRAFT_PREVIEW,
  );
  assert.equal(
    getQuestionDetailPresentation(question, DETAIL_VIEW_MODE.REVIEW_DRAFT).state,
    DETAIL_STATE.REVIEW_DRAFT,
  );
});

test('switches a saved answer into its local reader mode', () => {
  const question = questionWith('closed', {
    answer: { id: 'answer-id', text: 'A saved answer.' },
  });

  assert.equal(
    getQuestionDetailPresentation(question).state,
    DETAIL_STATE.ANSWER_SAVED,
  );
  assert.equal(
    getQuestionDetailPresentation(question, DETAIL_VIEW_MODE.ANSWER).state,
    DETAIL_STATE.ANSWER,
  );
});
