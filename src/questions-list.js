import { hasAnchor } from './anchors.js';
import { createAnchorIcon, createQuestionIcon } from './icons.js';
import { QuestionScope } from './question-query.js';
import { getWorkflowLabel } from './question-workflow.js';

export function formatQuestionDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function isQuestionSelected(question, selectedQuestionId) {
  return question?.id === selectedQuestionId;
}

function createQuestionRow(question, { onSelect, selectedQuestionId } = {}) {
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
  const isSelected = isQuestionSelected(question, selectedQuestionId);
  button.classList.toggle('is-selected', isSelected);
  if (isSelected) button.setAttribute('aria-current', 'true');
  button.addEventListener('click', () => onSelect?.(question));
  icon.className = 'question-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.append(createQuestionIcon());

  content.className = 'question-content';
  text.className = 'question-text';
  text.textContent = question.text;

  const label = getWorkflowLabel(question.workflow, 'list');
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

function createFilterButton(value, label, onQueryChange) {
  const button = document.createElement('button');
  button.className = 'question-filter';
  button.type = 'button';
  button.addEventListener('click', () => onQueryChange?.({ scope: value }));
  button.dataset.label = label;
  button.dataset.scope = value;
  return button;
}

function createEmptyState(query) {
  const empty = document.createElement('p');
  empty.className = 'empty-state';
  empty.textContent = query.text.trim()
    ? 'No matching questions.'
    : query.scope === QuestionScope.ANCHORED
      ? 'No anchored questions yet.'
      : 'No questions yet.';
  return empty;
}

function formatResultCount(count, query) {
  const searchText = query.text.trim();
  if (!searchText) return '';

  return `${count} ${count === 1 ? 'result' : 'results'} for “${searchText}”`;
}

export function createQuestionsList({ onQueryChange, onSelect } = {}) {
  const element = document.createElement('section');
  const toolbar = document.createElement('div');
  const search = document.createElement('div');
  const searchInput = document.createElement('input');
  const clearButton = document.createElement('button');
  const filters = document.createElement('nav');
  const allButton = createFilterButton(QuestionScope.ALL, 'All', onQueryChange);
  const anchoredButton = createFilterButton(
    QuestionScope.ANCHORED,
    'Anchored',
    onQueryChange,
  );
  const resultsSummary = document.createElement('p');
  const results = document.createElement('div');

  element.className = 'questions-list-view';
  toolbar.className = 'questions-list-toolbar';
  search.className = 'question-search';
  searchInput.className = 'question-search-input';
  searchInput.type = 'search';
  searchInput.placeholder = 'Search questions';
  searchInput.autocomplete = 'off';
  searchInput.setAttribute('aria-label', 'Search questions');
  clearButton.className = 'question-search-clear';
  clearButton.type = 'button';
  clearButton.textContent = 'Clear';
  clearButton.hidden = true;
  filters.className = 'question-filters';
  filters.setAttribute('aria-label', 'Question filter');
  filters.append(allButton, anchoredButton);
  resultsSummary.className = 'question-results-summary';
  resultsSummary.setAttribute('aria-live', 'polite');
  resultsSummary.hidden = true;
  results.className = 'questions-list-results';
  search.append(searchInput, clearButton);
  toolbar.append(search, filters);
  element.append(toolbar, resultsSummary, results);

  searchInput.addEventListener('input', () => {
    onQueryChange?.({ text: searchInput.value });
  });

  searchInput.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !searchInput.value) return;

    event.preventDefault();
    searchInput.value = '';
    onQueryChange?.({ text: '' });
  });

  clearButton.addEventListener('click', () => {
    searchInput.value = '';
    onQueryChange?.({ text: '' });
    searchInput.focus();
  });

  function render({ questions, query, counts, selectedQuestionId = null }) {
    if (document.activeElement !== searchInput && searchInput.value !== query.text) {
      searchInput.value = query.text;
    }

    clearButton.hidden = !query.text;
    allButton.textContent = `${allButton.dataset.label} ${counts.all}`;
    anchoredButton.textContent = `${anchoredButton.dataset.label} ${counts.anchored}`;

    for (const button of [allButton, anchoredButton]) {
      const isActive = button.dataset.scope === query.scope;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    }

    const summary = formatResultCount(questions.length, query);
    resultsSummary.textContent = summary;
    resultsSummary.hidden = !summary;

    if (!questions.length) {
      results.replaceChildren(createEmptyState(query));
      return;
    }

    const list = document.createElement('div');
    list.className = 'questions-list';
    questions.forEach((question) => {
      list.append(createQuestionRow(question, { onSelect, selectedQuestionId }));
    });
    results.replaceChildren(list);
  }

  return { element, render };
}
