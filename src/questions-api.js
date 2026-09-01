import { withAnchor, withoutAnchor } from './anchors.js';

export const QUESTIONS_PATH = '/thoughts/?knowledge_kind=question';

export function getQuestionsUrl(apiUrl) {
  return `${String(apiUrl).replace(/\/$/, '')}${QUESTIONS_PATH}`;
}

export function getThoughtSyncUrl(apiUrl, thoughtId) {
  return `${String(apiUrl).replace(/\/$/, '')}/thoughts/${thoughtId}/sync/`;
}

export async function loadQuestions(apiUrl, accessToken) {
  const response = await fetch(getQuestionsUrl(apiUrl), {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const detail = typeof payload?.detail === 'string'
      ? payload.detail
      : 'Could not load questions.';
    throw new Error(detail);
  }

  if (!Array.isArray(payload)) {
    throw new Error('The server returned an invalid questions list.');
  }

  return payload;
}

export async function setQuestionAnchor(
  apiUrl,
  accessToken,
  question,
  shouldAnchor,
) {
  const nextMeta = shouldAnchor
    ? withAnchor(question.meta)
    : withoutAnchor(question.meta);
  const navigationPatch = Object.prototype.hasOwnProperty.call(nextMeta, 'navigation')
    ? nextMeta.navigation
    : null;
  const response = await fetch(getThoughtSyncUrl(apiUrl, question.id), {
    method: 'PATCH',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      base_revision: question.revision,
      meta_patch: {
        navigation: navigationPatch,
      },
    }),
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(
      typeof payload?.detail === 'string'
        ? payload.detail
        : 'Could not update the anchor.',
    );
    error.status = response.status;
    error.current = payload?.current ?? null;
    throw error;
  }

  return payload;
}
