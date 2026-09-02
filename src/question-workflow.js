export const WORKFLOW_STATUS = Object.freeze({
  QUEUED: 'queued',
  IN_PROGRESS: 'in_progress',
  DRAFT_READY: 'draft_ready',
  CLOSED: 'closed',
});

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
  [WORKFLOW_STATUS.CLOSED]: {
    list: 'Answered',
    detail: 'Answer saved',
  },
});

export function getWorkflowLabel(workflow, context = 'detail') {
  return WORKFLOW_LABELS[workflow?.status]?.[context] ?? null;
}

export function getLatestRun(question) {
  return question?.workflow?.latest_run ?? null;
}
