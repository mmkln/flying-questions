function formatQuestionDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function createQuestionRow(question) {
  const article = document.createElement('article');
  const icon = document.createElement('span');
  const content = document.createElement('div');
  const text = document.createElement('p');
  const date = document.createElement('time');

  article.className = 'question-row';
  icon.className = 'question-icon';
  icon.textContent = '?';
  icon.setAttribute('aria-hidden', 'true');

  content.className = 'question-content';
  text.className = 'question-text';
  text.textContent = question.text;

  date.className = 'question-date';
  date.dateTime = question.created_at;
  date.textContent = formatQuestionDate(question.created_at);

  content.append(text);
  article.append(icon, content, date);
  return article;
}

export function renderQuestionsList(container, questions) {
  container.replaceChildren();

  if (!questions.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = 'No questions yet.';
    container.append(empty);
    return;
  }

  const list = document.createElement('div');
  list.className = 'questions-list';
  questions.forEach((question) => list.append(createQuestionRow(question)));
  container.append(list);
}
