import { hasAnchor } from './anchors.js';

export const QuestionScope = Object.freeze({
  ALL: 'all',
  ANCHORED: 'anchored',
});

export function normalizeQuestionQuery(query = {}) {
  return {
    scope: query.scope === QuestionScope.ANCHORED
      ? QuestionScope.ANCHORED
      : QuestionScope.ALL,
    text: String(query.text ?? ''),
  };
}

export function selectQuestions(questions, query) {
  const normalized = normalizeQuestionQuery(query);
  const needle = normalized.text.trim().toLocaleLowerCase();

  return questions.filter((question) => {
    const matchesScope = normalized.scope !== QuestionScope.ANCHORED
      || hasAnchor(question);
    const matchesText = !needle
      || question.text.toLocaleLowerCase().includes(needle);

    return matchesScope && matchesText;
  });
}

export function getQuestionCounts(questions) {
  return {
    all: questions.length,
    anchored: questions.filter(hasAnchor).length,
  };
}
