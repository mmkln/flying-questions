import { getLatestRun, getWorkflowLabel, WORKFLOW_STATUS } from './question-workflow.js';

export const DETAIL_VIEW_MODE = Object.freeze({
  OVERVIEW: 'overview',
  REVIEW_DRAFT: 'review_draft',
  ANSWER: 'answer',
});

export const DETAIL_STATE = Object.freeze({
  READY_FOR_RESEARCH: 'ready_for_research',
  QUEUED: 'queued',
  IN_PROGRESS: 'in_progress',
  DRAFT_PREVIEW: 'draft_preview',
  REVIEW_DRAFT: 'review_draft',
  ANSWER_SAVED: 'answer_saved',
  ANSWER: 'answer',
});

export function getQuestionDetailPresentation(
  question,
  viewMode = DETAIL_VIEW_MODE.OVERVIEW,
) {
  const workflow = question?.workflow;
  const latestRun = getLatestRun(question);

  if (!workflow) {
    return {
      state: DETAIL_STATE.READY_FOR_RESEARCH,
      title: 'Research with AI',
      description: 'Creates a draft. Nothing is saved as an answer yet.',
    };
  }

  if (workflow.status === WORKFLOW_STATUS.QUEUED) {
    return {
      state: DETAIL_STATE.QUEUED,
      title: getWorkflowLabel(workflow),
      description: 'This question is waiting in the research queue.',
    };
  }

  if (workflow.status === WORKFLOW_STATUS.IN_PROGRESS) {
    return {
      state: DETAIL_STATE.IN_PROGRESS,
      title: getWorkflowLabel(workflow),
      description: 'You can close this sheet while research continues.',
    };
  }

  if (workflow.status === WORKFLOW_STATUS.DRAFT_READY && latestRun?.draft) {
    return {
      state: viewMode === DETAIL_VIEW_MODE.REVIEW_DRAFT
        ? DETAIL_STATE.REVIEW_DRAFT
        : DETAIL_STATE.DRAFT_PREVIEW,
      title: getWorkflowLabel(workflow),
      draft: latestRun.draft,
      runId: latestRun.id,
    };
  }

  if (workflow.status === WORKFLOW_STATUS.CLOSED) {
    const answer = latestRun?.answer ?? null;
    return {
      state: answer && viewMode === DETAIL_VIEW_MODE.ANSWER
        ? DETAIL_STATE.ANSWER
        : DETAIL_STATE.ANSWER_SAVED,
      title: getWorkflowLabel(workflow),
      answer,
    };
  }

  return { state: DETAIL_STATE.QUEUED, title: getWorkflowLabel(workflow) };
}
