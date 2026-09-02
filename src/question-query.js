import { hasAnchor } from './anchors.js';
import {
  getQuestionResearchStatus,
  QUESTION_RESEARCH_STATUS,
} from './question-workflow.js';

export const QuestionScope = Object.freeze({
  ALL: 'all',
  ANCHORED: 'anchored',
});

export const QuestionStatusFilter = Object.freeze({
  ALL: 'all',
  ...QUESTION_RESEARCH_STATUS,
});

const knownStatusFilters = new Set(Object.values(QuestionStatusFilter));

const STATUS_FILTER_LABELS = Object.freeze({
  [QuestionStatusFilter.ALL]: 'Any research state',
  [QuestionStatusFilter.READY]: 'Ready to research',
  [QuestionStatusFilter.QUEUED]: 'Queued',
  [QuestionStatusFilter.IN_PROGRESS]: 'Researching',
  [QuestionStatusFilter.DRAFT_READY]: 'Draft ready',
  [QuestionStatusFilter.FAILED]: 'Needs attention',
  [QuestionStatusFilter.CLOSED]: 'Answered',
});

export function normalizeQuestionQuery(query = {}) {
  return {
    scope: query.scope === QuestionScope.ANCHORED
      ? QuestionScope.ANCHORED
      : QuestionScope.ALL,
    status: knownStatusFilters.has(query.status)
      ? query.status
      : QuestionStatusFilter.ALL,
    text: String(query.text ?? ''),
  };
}

export function getQuestionStatusFilterLabel(status) {
  return STATUS_FILTER_LABELS[status] ?? STATUS_FILTER_LABELS[QuestionStatusFilter.ALL];
}

export function selectQuestions(questions, query) {
  const normalized = normalizeQuestionQuery(query);
  const needle = normalized.text.trim().toLocaleLowerCase();

  return questions.filter((question) => {
    const matchesScope = normalized.scope !== QuestionScope.ANCHORED
      || hasAnchor(question);
    const matchesStatus = normalized.status === QuestionStatusFilter.ALL
      || getQuestionResearchStatus(question) === normalized.status;
    const matchesText = !needle
      || question.text.toLocaleLowerCase().includes(needle);

    return matchesScope && matchesStatus && matchesText;
  });
}

export function getQuestionCounts(questions) {
  const status = Object.fromEntries(
    Object.values(QuestionStatusFilter).map((filter) => [
      filter,
      filter === QuestionStatusFilter.ALL
        ? questions.length
        : questions.filter(
          (question) => getQuestionResearchStatus(question) === filter,
        ).length,
    ]),
  );

  return {
    all: questions.length,
    anchored: questions.filter(hasAnchor).length,
    status,
  };
}
