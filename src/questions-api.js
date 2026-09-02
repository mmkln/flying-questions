import { withAnchor, withoutAnchor } from './anchors.js';

export const QUESTIONS_INBOX_PATH = '/questions/inbox/';

export function getQuestionsUrl(apiUrl) {
  return `${String(apiUrl).replace(/\/$/, '')}${QUESTIONS_INBOX_PATH}`;
}

export function getThoughtSyncUrl(apiUrl, thoughtId) {
  return `${String(apiUrl).replace(/\/$/, '')}/thoughts/${thoughtId}/sync/`;
}

export function getQuestionQueueUrl(apiUrl, questionId) {
  return `${String(apiUrl).replace(/\/$/, '')}/questions/${questionId}/queue/`;
}

export function getQuestionMaterializeUrl(apiUrl, runId) {
  return `${String(apiUrl).replace(/\/$/, '')}/questions/runs/${runId}/materialize/`;
}

async function parseThoughtSyncResponse(response, fallbackMessage) {
  const payload = await response.json().catch(() => null);

  if (response.ok && payload && typeof payload.id === 'string') {
    return payload;
  }

  const error = new Error(
    typeof payload?.detail === 'string' ? payload.detail : fallbackMessage,
  );
  error.status = response.status;
  error.current = payload?.current ?? null;
  throw error;
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

export async function queueQuestion(apiUrl, accessToken, questionId, priority, researchNote) {
  const body = {};

  if (Number.isInteger(priority)) body.priority = priority;
  if (typeof researchNote === 'string') body.research_note = researchNote;
  const response = await fetch(getQuestionQueueUrl(apiUrl, questionId), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload || typeof payload.id !== 'string') {
    const detail = typeof payload?.detail === 'string'
      ? payload.detail
      : 'Could not queue this question.';
    throw new Error(detail);
  }

  return payload;
}

export async function materializeQuestionDraft(apiUrl, accessToken, runId) {
  const response = await fetch(getQuestionMaterializeUrl(apiUrl, runId), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({}),
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.answer?.id) {
    const detail = typeof payload?.detail === 'string'
      ? payload.detail
      : 'Could not create an answer from this draft.';
    throw new Error(detail);
  }

  return payload;
}

export async function createQuestion(
  apiUrl,
  accessToken,
  { draftId, text, createdAt },
) {
  const response = await fetch(getThoughtSyncUrl(apiUrl, draftId), {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      text,
      color: 'purple',
      is_pinned: false,
      created_at: createdAt,
      meta: {
        knowledge: {
          version: 1,
          kind: 'question',
        },
      },
    }),
  });

  return parseThoughtSyncResponse(response, 'Could not create the question.');
}

export async function updateQuestionText(apiUrl, accessToken, question, text) {
  const response = await fetch(getThoughtSyncUrl(apiUrl, question.id), {
    method: 'PATCH',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      base_revision: question.revision,
      text,
    }),
  });

  return parseThoughtSyncResponse(response, 'Could not update the question.');
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
  return parseThoughtSyncResponse(response, 'Could not update the anchor.');
}
