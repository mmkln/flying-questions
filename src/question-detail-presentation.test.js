import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DETAIL_CONTEXT_MODE,
  DETAIL_STATE,
  DETAIL_VIEW_MODE,
  getQuestionDetailPresentation,
} from './question-detail-presentation.js';

function questionWith(status, latestRun = null, researchNote = '') {
  return {
    id: 'question-id',
    text: 'What should I research?',
    workflow: status
      ? { status, latest_run: latestRun, research_note: researchNote }
      : null,
  };
}

test('presents an unqueued question as ready for research', () => {
  const presentation = getQuestionDetailPresentation(questionWith(null));

  assert.equal(presentation.state, DETAIL_STATE.READY_FOR_RESEARCH);
  assert.equal(presentation.title, 'Create a research draft');
  assert.equal(
    presentation.description,
    'Review it before saving anything as an answer.',
  );
  assert.equal(presentation.contextMode, DETAIL_CONTEXT_MODE.EDITABLE);
  assert.deepEqual(presentation.primaryAction, {
    action: 'queue',
    label: 'Research with AI',
  });
});

test('presents queued and in-progress workflow states without a draft', () => {
  const queued = getQuestionDetailPresentation(questionWith('queued'));
  const inProgress = getQuestionDetailPresentation(questionWith('in_progress'));

  assert.equal(queued.state, DETAIL_STATE.QUEUED);
  assert.equal(queued.title, 'Research requested');
  assert.equal(queued.contextMode, DETAIL_CONTEXT_MODE.HIDDEN);
  assert.equal(inProgress.state, DETAIL_STATE.IN_PROGRESS);
  assert.equal(inProgress.title, 'Preparing a draft');
});

test('shows saved research context only as a summary after queuing', () => {
  const presentation = getQuestionDetailPresentation(
    questionWith('queued', null, 'Use evidence published after 2020.'),
  );

  assert.equal(presentation.contextMode, DETAIL_CONTEXT_MODE.SUMMARY);
  assert.equal(presentation.primaryAction, undefined);
});

test('lets a failed question be retried without losing its context', () => {
  const presentation = getQuestionDetailPresentation(questionWith('failed'));

  assert.equal(presentation.state, DETAIL_STATE.FAILED);
  assert.equal(presentation.title, 'Research couldn\'t finish');
  assert.equal(presentation.contextMode, DETAIL_CONTEXT_MODE.EDITABLE);
  assert.equal(presentation.primaryAction.label, 'Try again');
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
  assert.equal(getQuestionDetailPresentation(question).title, 'Draft ready');
  assert.equal(
    getQuestionDetailPresentation(question, DETAIL_VIEW_MODE.REVIEW_DRAFT).state,
    DETAIL_STATE.REVIEW_DRAFT,
  );
  assert.deepEqual(getQuestionDetailPresentation(question).primaryAction, {
    action: 'review-draft',
    label: 'Review draft',
  });
});

test('switches a saved answer into its local reader mode', () => {
  const question = questionWith('closed', {
    answer: { id: 'answer-id', text: 'A saved answer.' },
  });

  assert.equal(
    getQuestionDetailPresentation(question).state,
    DETAIL_STATE.ANSWER_SAVED,
  );
  assert.equal(getQuestionDetailPresentation(question).title, 'Answer saved');
  assert.equal(
    getQuestionDetailPresentation(question, DETAIL_VIEW_MODE.ANSWER).state,
    DETAIL_STATE.ANSWER,
  );
});
