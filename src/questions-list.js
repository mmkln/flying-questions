import { hasAnchor } from './anchors.js';
import { createContextMenu } from './context-menu.js';
import { createAnchorIcon, createQuestionIcon } from './icons.js';
import {
  getQuestionStatusFilterLabel,
  QuestionScope,
  QuestionStatusFilter,
} from './question-query.js';
import { getWorkflowLabel } from './question-workflow.js';

const statusFilterOptions = [
  QuestionStatusFilter.ALL,
  QuestionStatusFilter.READY,
  QuestionStatusFilter.QUEUED,
  QuestionStatusFilter.IN_PROGRESS,
  QuestionStatusFilter.DRAFT_READY,
  QuestionStatusFilter.FAILED,
  QuestionStatusFilter.CLOSED,
];

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

export function getActiveFilterSummary(query) {
  const summary = [];

  if (query.scope === QuestionScope.ANCHORED) summary.push('Anchored');
  if (query.status !== QuestionStatusFilter.ALL) {
    summary.push(getQuestionStatusFilterLabel(query.status));
  }

  return summary.join(' · ');
}

function createQuestionRowView({ onSelect } = {}) {
  const article = document.createElement('article');
  const button = document.createElement('button');
  const icon = document.createElement('span');
  const content = document.createElement('div');
  const text = document.createElement('p');
  const workflow = document.createElement('span');
  const date = document.createElement('time');
  const anchor = document.createElement('span');
  let currentQuestion = null;

  article.className = 'question-item';
  button.className = 'question-row';
  button.type = 'button';
  button.addEventListener('click', () => {
    if (currentQuestion) onSelect?.(currentQuestion);
  });
  icon.className = 'question-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.append(createQuestionIcon());

  content.className = 'question-content';
  text.className = 'question-text';
  workflow.className = 'question-workflow-status';
  workflow.hidden = true;

  date.className = 'question-date';

  anchor.className = 'question-anchor-marker';
  anchor.hidden = true;
  anchor.title = 'Anchored';
  anchor.setAttribute('aria-label', 'Anchored');
  anchor.append(createAnchorIcon());

  content.append(text, workflow);
  button.append(icon, content, date, anchor);
  article.append(button);

  function render(question, { selectedQuestionId = null } = {}) {
    currentQuestion = question;

    const isSelected = isQuestionSelected(question, selectedQuestionId);
    button.classList.toggle('is-selected', isSelected);
    if (isSelected) button.setAttribute('aria-current', 'true');
    else button.removeAttribute('aria-current');

    text.textContent = question.text;

    const label = getWorkflowLabel(question.workflow, 'list');
    workflow.textContent = label || '';
    workflow.hidden = !label;

    date.dateTime = question.created_at;
    date.textContent = formatQuestionDate(question.created_at);
    anchor.hidden = !hasAnchor(question);
  }

  return { element: article, render };
}

function getEmptyStateMessage(query) {
  if (query.text.trim()) return 'No matching questions.';
  if (query.scope === QuestionScope.ANCHORED) return 'No anchored questions yet.';
  if (query.status !== QuestionStatusFilter.ALL) {
    return `No questions are ${getQuestionStatusFilterLabel(query.status).toLocaleLowerCase()}.`;
  }
  return 'No questions yet.';
}

function formatResultCount(count, query) {
  const countLabel = `${count} ${count === 1 ? 'question' : 'questions'}`;
  const searchText = query.text.trim();
  const filters = getActiveFilterSummary(query);

  if (searchText) return `${countLabel} for “${searchText}”`;
  return filters ? `${countLabel} · ${filters}` : countLabel;
}

function createMenuLabel(text) {
  const label = document.createElement('p');
  label.className = 'question-filter-menu-label';
  label.textContent = text;
  return label;
}

function createFilterMenuItem({ label, group, value, onChoose } = {}) {
  const item = document.createElement('button');

  item.className = 'question-filter-menu-item';
  item.type = 'button';
  item.dataset.group = group;
  item.dataset.value = value;
  item.setAttribute('role', 'menuitemradio');
  item.addEventListener('click', () => onChoose?.(value));
  item.textContent = label;

  return item;
}

export function createQuestionsList({ onQueryChange, onSelect } = {}) {
  const element = document.createElement('section');
  const toolbar = document.createElement('div');
  const search = document.createElement('div');
  const searchInput = document.createElement('input');
  const clearButton = document.createElement('button');
  const listControls = document.createElement('div');
  const filterContainer = document.createElement('div');
  const filterTrigger = document.createElement('button');
  const filterMenu = document.createElement('div');
  const resultSummary = document.createElement('p');
  const results = document.createElement('div');
  const emptyState = document.createElement('p');
  const list = document.createElement('div');
  const rowViews = new Map();
  const filterItems = [];
  let shouldResetScroll = false;

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

  listControls.className = 'question-list-controls';
  filterContainer.className = 'question-filter-menu-container';
  filterTrigger.className = 'question-filter-trigger';
  filterTrigger.type = 'button';
  filterTrigger.setAttribute('aria-haspopup', 'menu');
  filterTrigger.setAttribute('aria-expanded', 'false');
  filterMenu.className = 'question-filter-menu';
  filterMenu.setAttribute('role', 'menu');
  filterMenu.setAttribute('aria-label', 'Filter questions');
  filterMenu.hidden = true;

  const scopeLabel = createMenuLabel('Show');
  const allScopeItem = createFilterMenuItem({
    label: 'All questions',
    group: 'scope',
    value: QuestionScope.ALL,
    onChoose: (scope) => requestQueryChange({ scope }),
  });
  const anchoredScopeItem = createFilterMenuItem({
    label: 'Anchored',
    group: 'scope',
    value: QuestionScope.ANCHORED,
    onChoose: (scope) => requestQueryChange({ scope }),
  });
  const statusLabel = createMenuLabel('Research');
  const statusItems = statusFilterOptions.map((status) => createFilterMenuItem({
    label: getQuestionStatusFilterLabel(status),
    group: 'status',
    value: status,
    onChoose: (nextStatus) => requestQueryChange({ status: nextStatus }),
  }));
  filterItems.push(allScopeItem, anchoredScopeItem, ...statusItems);
  filterMenu.append(scopeLabel, allScopeItem, anchoredScopeItem, statusLabel, ...statusItems);
  filterContainer.append(filterTrigger, filterMenu);

  resultSummary.className = 'question-results-summary';
  resultSummary.setAttribute('aria-live', 'polite');
  results.className = 'questions-list-results';
  emptyState.className = 'empty-state';
  emptyState.hidden = true;
  list.className = 'questions-list';
  list.hidden = true;
  search.append(searchInput, clearButton);
  listControls.append(filterContainer, resultSummary);
  toolbar.append(search, listControls);
  results.append(emptyState, list);
  element.append(toolbar, results);

  const filterMenuController = createContextMenu({
    container: filterContainer,
    trigger: filterTrigger,
    menu: filterMenu,
    onOpen() {
      filterMenu.querySelector('[aria-checked="true"]')?.focus();
    },
  });

  searchInput.addEventListener('input', () => {
    requestQueryChange({ text: searchInput.value });
  });

  searchInput.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !searchInput.value) return;

    event.preventDefault();
    searchInput.value = '';
    requestQueryChange({ text: '' });
  });

  clearButton.addEventListener('click', () => {
    searchInput.value = '';
    requestQueryChange({ text: '' });
    searchInput.focus();
  });

  function requestQueryChange(patch) {
    shouldResetScroll = true;
    filterMenuController.close();
    onQueryChange?.(patch);
  }

  function renderRows(questions, selectedQuestionId) {
    const nextQuestionIds = new Set();

    questions.forEach((question, index) => {
      nextQuestionIds.add(question.id);

      let rowView = rowViews.get(question.id);
      if (!rowView) {
        rowView = createQuestionRowView({ onSelect });
        rowViews.set(question.id, rowView);
      }

      rowView.render(question, { selectedQuestionId });

      const currentRow = list.children[index];
      if (currentRow !== rowView.element) {
        list.insertBefore(rowView.element, currentRow || null);
      }
    });

    for (const [questionId, rowView] of rowViews) {
      if (nextQuestionIds.has(questionId)) continue;

      rowView.element.remove();
      rowViews.delete(questionId);
    }
  }

  function renderFilterMenu(query, counts) {
    const summary = getActiveFilterSummary(query);
    filterTrigger.textContent = summary || 'Filter';
    filterTrigger.classList.toggle('has-active-filter', Boolean(summary));
    filterTrigger.setAttribute(
      'aria-label',
      summary ? `Filter questions: ${summary}` : 'Filter questions',
    );

    filterItems.forEach((item) => {
      const value = item.dataset.value;
      const isActive = item.dataset.group === 'scope'
        ? value === query.scope
        : value === query.status;
      const count = item.dataset.group === 'scope'
        ? (value === QuestionScope.ANCHORED ? counts.anchored : counts.all)
        : (counts.status?.[value] ?? 0);

      item.classList.toggle('is-active', isActive);
      item.setAttribute('aria-checked', String(isActive));
      item.dataset.count = String(count);
    });
  }

  function render({ questions, query, counts, selectedQuestionId = null }) {
    if (document.activeElement !== searchInput && searchInput.value !== query.text) {
      searchInput.value = query.text;
    }

    clearButton.hidden = !query.text;
    renderFilterMenu(query, counts);
    resultSummary.textContent = formatResultCount(questions.length, query);

    if (!questions.length) {
      emptyState.textContent = getEmptyStateMessage(query);
      emptyState.hidden = false;
      list.hidden = true;
      list.replaceChildren();
      rowViews.clear();
      shouldResetScroll = false;
      return;
    }

    emptyState.hidden = true;
    list.hidden = false;
    renderRows(questions, selectedQuestionId);

    if (shouldResetScroll) list.scrollTop = 0;
    shouldResetScroll = false;
  }

  return { element, render };
}
