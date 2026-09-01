export const QUESTIONS_PATH = '/thoughts/?knowledge_kind=question';

export function getQuestionsUrl(apiUrl) {
  return `${String(apiUrl).replace(/\/$/, '')}${QUESTIONS_PATH}`;
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
