import { getLatestRun, WORKFLOW_STATUS } from './question-workflow.js';

export const DETAIL_VIEW_MODE = Object.freeze({
  OVERVIEW: 'overview',
  REVIEW_DRAFT: 'review_draft',
  ANSWER: 'answer',
});

export const DETAIL_STATE = Object.freeze({
  READY_FOR_RESEARCH: 'ready_for_research',
  QUEUED: 'queued',
  IN_PROGRESS: 'in_progress',
  FAILED: 'failed',
  DRAFT_PREVIEW: 'draft_preview',
  REVIEW_DRAFT: 'review_draft',
  ANSWER_SAVED: 'answer_saved',
  ANSWER: 'answer',
});

export const DETAIL_CONTEXT_MODE = Object.freeze({
  HIDDEN: 'hidden',
  EDITABLE: 'editable',
  SUMMARY: 'summary',
});

function hasResearchContext(question) {
  return Boolean(question?.workflow?.research_note?.trim());
}

export function getQuestionDetailPresentation(
  question,
  viewMode = DETAIL_VIEW_MODE.OVERVIEW,
) {
  const workflow = question?.workflow;
  const latestRun = getLatestRun(question);

  if (!workflow) {
    return {
      state: DETAIL_STATE.READY_FOR_RESEARCH,
      sectionLabel: 'Research',
      title: 'Create a research draft',
      description: 'Review it before saving anything as an answer.',
      contextMode: DETAIL_CONTEXT_MODE.EDITABLE,
      primaryAction: { action: 'queue', label: 'Research with AI' },
    };
  }

  if (workflow.status === WORKFLOW_STATUS.QUEUED) {
    return {
      state: DETAIL_STATE.QUEUED,
      sectionLabel: 'Research',
      title: 'Research requested',
      description: 'A draft will appear here when it is ready.',
      contextMode: hasResearchContext(question)
        ? DETAIL_CONTEXT_MODE.SUMMARY
        : DETAIL_CONTEXT_MODE.HIDDEN,
    };
  }

  if (workflow.status === WORKFLOW_STATUS.IN_PROGRESS) {
    return {
      state: DETAIL_STATE.IN_PROGRESS,
      sectionLabel: 'Research',
      title: 'Preparing a draft',
      description: 'You can close this sheet while research continues.',
      contextMode: hasResearchContext(question)
        ? DETAIL_CONTEXT_MODE.SUMMARY
        : DETAIL_CONTEXT_MODE.HIDDEN,
    };
  }

  if (workflow.status === WORKFLOW_STATUS.FAILED) {
    return {
      state: DETAIL_STATE.FAILED,
      sectionLabel: 'Research',
      title: 'Research couldn\'t finish',
      description: 'Your question and AI context are still here. You can try again.',
      contextMode: DETAIL_CONTEXT_MODE.EDITABLE,
      primaryAction: { action: 'queue', label: 'Try again' },
    };
  }

  if (workflow.status === WORKFLOW_STATUS.DRAFT_READY && latestRun?.draft) {
    return {
      state: viewMode === DETAIL_VIEW_MODE.REVIEW_DRAFT
        ? DETAIL_STATE.REVIEW_DRAFT
        : DETAIL_STATE.DRAFT_PREVIEW,
      sectionLabel: 'Draft',
      title: 'Draft ready',
      draft: latestRun.draft,
      runId: latestRun.id,
      contextMode: viewMode === DETAIL_VIEW_MODE.REVIEW_DRAFT
        ? DETAIL_CONTEXT_MODE.HIDDEN
        : hasResearchContext(question)
          ? DETAIL_CONTEXT_MODE.SUMMARY
          : DETAIL_CONTEXT_MODE.HIDDEN,
      primaryAction: viewMode === DETAIL_VIEW_MODE.REVIEW_DRAFT
        ? { action: 'create-answer', label: 'Save as answer' }
        : { action: 'review-draft', label: 'Review draft' },
    };
  }

  if (workflow.status === WORKFLOW_STATUS.CLOSED) {
    const answer = latestRun?.answer ?? null;
    return {
      state: answer && viewMode === DETAIL_VIEW_MODE.ANSWER
        ? DETAIL_STATE.ANSWER
        : DETAIL_STATE.ANSWER_SAVED,
      sectionLabel: 'Answer',
      title: 'Answer saved',
      answer,
      contextMode: DETAIL_CONTEXT_MODE.HIDDEN,
      primaryAction: answer && viewMode !== DETAIL_VIEW_MODE.ANSWER
        ? { action: 'open-answer', label: 'Open answer' }
        : null,
    };
  }

  return {
    state: DETAIL_STATE.QUEUED,
    sectionLabel: 'Research',
    title: 'Research requested',
    contextMode: DETAIL_CONTEXT_MODE.HIDDEN,
  };
}
