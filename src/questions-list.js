import { hasAnchor } from './anchors.js';
import { createAnchorIcon, createQuestionIcon } from './icons.js';

export function formatQuestionDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function workflowLabel(workflow) {
  const labels = {
    queued: 'Queued',
    in_progress: 'Researching',
    draft_ready: 'Draft ready',
    closed: 'Answered',
  };
  return labels[workflow?.status] || null;
}

function createQuestionRow(question, { onSelect } = {}) {
  const article = document.createElement('article');
  const button = document.createElement('button');
  const icon = document.createElement('span');
  const content = document.createElement('div');
  const text = document.createElement('p');
  const workflow = document.createElement('span');
  const date = document.createElement('time');
  const anchor = document.createElement('span');

  article.className = 'question-item';
  button.className = 'question-row';
  button.type = 'button';
  button.addEventListener('click', () => onSelect?.(question));
  icon.className = 'question-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.append(createQuestionIcon());

  content.className = 'question-content';
  text.className = 'question-text';
  text.textContent = question.text;

  const label = workflowLabel(question.workflow);
  workflow.className = 'question-workflow-status';
  workflow.textContent = label || '';
  workflow.hidden = !label;

  date.className = 'question-date';
  date.dateTime = question.created_at;
  date.textContent = formatQuestionDate(question.created_at);

  anchor.className = 'question-anchor-marker';
  anchor.hidden = !hasAnchor(question);
  anchor.title = 'Anchored';
  anchor.setAttribute('aria-label', 'Anchored');
  anchor.append(createAnchorIcon());

  content.append(text, workflow);
  button.append(icon, content, date, anchor);
  article.append(button);
  return article;
}

function createFilterButton(value, label, count, activeFilter, onFilterChange) {
  const button = document.createElement('button');
  button.className = 'question-filter';
  button.type = 'button';
  button.textContent = `${label} ${count}`;
  button.classList.toggle('is-active', activeFilter === value);
  button.setAttribute('aria-pressed', String(activeFilter === value));
  button.addEventListener('click', () => onFilterChange?.(value));
  return button;
}

export function renderQuestionsList(
  container,
  questions,
  {
    onSelect,
    activeFilter = 'all',
    allCount = questions.length,
    anchoredCount = 0,
    onFilterChange,
  } = {},
) {
  container.replaceChildren();

  const filters = document.createElement('nav');
  filters.className = 'question-filters';
  filters.setAttribute('aria-label', 'Question filter');
  filters.append(
    createFilterButton('all', 'All', allCount, activeFilter, onFilterChange),
    createFilterButton('anchored', 'Anchored', anchoredCount, activeFilter, onFilterChange),
  );
  container.append(filters);

  if (!questions.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = activeFilter === 'anchored'
      ? 'No anchored questions yet.'
      : 'No questions yet.';
    container.append(empty);
    return;
  }

  const list = document.createElement('div');
  list.className = 'questions-list';
  questions.forEach((question) => {
    list.append(createQuestionRow(question, { onSelect }));
  });
  container.append(list);
}
