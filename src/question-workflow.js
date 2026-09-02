export const WORKFLOW_STATUS = Object.freeze({
  QUEUED: 'queued',
  IN_PROGRESS: 'in_progress',
  DRAFT_READY: 'draft_ready',
  FAILED: 'failed',
  CLOSED: 'closed',
});

export const QUESTION_RESEARCH_STATUS = Object.freeze({
  READY: 'ready',
  ...WORKFLOW_STATUS,
});

const knownWorkflowStatuses = new Set(Object.values(WORKFLOW_STATUS));

const WORKFLOW_LABELS = Object.freeze({
  [WORKFLOW_STATUS.QUEUED]: {
    list: 'Queued',
    detail: 'Queued for research',
  },
  [WORKFLOW_STATUS.IN_PROGRESS]: {
    list: 'Researching',
    detail: 'Preparing a draft',
  },
  [WORKFLOW_STATUS.DRAFT_READY]: {
    list: 'Draft ready',
    detail: 'Draft ready for your review',
  },
  [WORKFLOW_STATUS.FAILED]: {
    list: 'Research couldn\'t finish',
    detail: 'Research couldn\'t finish',
  },
  [WORKFLOW_STATUS.CLOSED]: {
    list: 'Answered',
    detail: 'Answer saved',
  },
});

export function getWorkflowLabel(workflow, context = 'detail') {
  return WORKFLOW_LABELS[workflow?.status]?.[context] ?? null;
}

export function getQuestionResearchStatus(question) {
  const status = question?.workflow?.status;

  return knownWorkflowStatuses.has(status)
    ? status
    : QUESTION_RESEARCH_STATUS.READY;
}

export function getLatestRun(question) {
  return question?.workflow?.latest_run ?? null;
}
