import { normalizeResearchContext } from './research-context.js';

function compactText(value) {
  return String(value || '').trim() || 'Untitled thought';
}

export function createThoughtPicker({
  loadSuggestions,
  searchThoughts,
  onDone,
} = {}) {
  const dialog = document.createElement('dialog');
  const form = document.createElement('form');
  const header = document.createElement('header');
  const title = document.createElement('h2');
  const close = document.createElement('button');
  const search = document.createElement('input');
  const scope = document.createElement('p');
  const status = document.createElement('p');
  const list = document.createElement('ul');
  const footer = document.createElement('footer');
  const count = document.createElement('span');
  const done = document.createElement('button');
  let selected = [];
  let activeQuestionId = null;
  let searchTimer = null;
  let activeRequestController = null;

  dialog.className = 'thought-picker-dialog';
  dialog.setAttribute('aria-labelledby', 'thought-picker-title');
  form.className = 'thought-picker';
  form.method = 'dialog';
  title.id = 'thought-picker-title';
  title.textContent = 'Add thoughts';
  close.type = 'button';
  close.className = 'thought-picker-close';
  close.setAttribute('aria-label', 'Close');
  close.textContent = '×';
  header.append(title, close);
  search.type = 'search';
  search.className = 'thought-picker-search';
  search.placeholder = 'Search your thoughts';
  search.autocomplete = 'off';
  search.setAttribute('aria-label', 'Search your thoughts');
  scope.className = 'thought-picker-scope';
  status.className = 'thought-picker-status';
  status.hidden = true;
  list.className = 'thought-picker-list';
  footer.className = 'thought-picker-footer';
  count.className = 'thought-picker-count';
  done.type = 'button';
  done.className = 'thought-picker-done';
  done.textContent = 'Done';
  footer.append(count, done);
  form.append(header, search, scope, status, list, footer);
  dialog.append(form);
  document.body.append(dialog);

  function renderList(thoughts = [], emptyMessage = 'No thoughts found.') {
    const selectableThoughts = thoughts.filter(
      (thought) => thought?.id && thought.id !== activeQuestionId,
    );
    list.replaceChildren();
    if (!selectableThoughts.length) {
      const empty = document.createElement('li');
      empty.className = 'thought-picker-empty';
      empty.textContent = emptyMessage;
      list.append(empty);
    }

    for (const thought of selectableThoughts) {
      const item = document.createElement('li');
      const button = document.createElement('button');
      const check = document.createElement('span');
      const copy = document.createElement('span');
      const kind = document.createElement('small');
      const isSelected = selected.some(({ id }) => id === thought.id);

      item.className = 'thought-picker-item';
      button.type = 'button';
      button.className = 'thought-picker-option';
      button.classList.toggle('is-selected', isSelected);
      button.setAttribute('aria-pressed', String(isSelected));
      check.className = 'thought-picker-check';
      check.textContent = isSelected ? '✓' : '';
      copy.className = 'thought-picker-copy';
      copy.textContent = compactText(thought.text);
      kind.className = 'thought-picker-kind';
      kind.textContent = thought.kind || 'thought';
      button.append(check, copy, kind);
      button.addEventListener('click', () => {
        if (isSelected) {
          selected = selected.filter(({ id }) => id !== thought.id);
        } else if (selected.length < 12) {
          selected = normalizeResearchContext({
            thoughts: [...selected, thought],
          }).thoughts;
        }
        renderList(thoughts, emptyMessage);
        renderCount();
      });
      list.append(item);
    }
  }

  function renderCount() {
    count.textContent = selected.length ? `${selected.length} selected` : 'Select up to 12';
  }

  async function showResults(
    loader,
    {
      label,
      empty = 'No thoughts found.',
      loading = 'Loading…',
    } = {},
  ) {
    activeRequestController?.abort();

    const controller = new AbortController();
    activeRequestController = controller;
    scope.textContent = label || '';
    scope.hidden = !label;
    list.replaceChildren();
    status.hidden = false;
    status.classList.remove('is-error');
    status.textContent = loading;

    try {
      const thoughts = await loader({ signal: controller.signal });
      if (controller !== activeRequestController) return;

      renderList(Array.isArray(thoughts) ? thoughts : [], empty);
    } catch (error) {
      if (error?.name === 'AbortError' || controller !== activeRequestController) return;

      status.classList.add('is-error');
      status.textContent = error.message || 'Could not load thoughts.';
    } finally {
      if (
        controller === activeRequestController
      ) {
        activeRequestController = null;
        if (!status.classList.contains('is-error')) status.hidden = true;
      }
    }
  }

  async function open({ questionId, selectedThoughts = [] }) {
    activeQuestionId = questionId;
    selected = normalizeResearchContext({ thoughts: selectedThoughts }).thoughts;
    search.value = '';
    renderCount();
    if (!dialog.open) dialog.showModal();
    search.focus();
    await showResults(
      (options) => loadSuggestions?.(questionId, options) || [],
      {
        label: 'Related thoughts',
        empty: 'No directly connected thoughts. Search all thoughts instead.',
      },
    );
  }

  close.addEventListener('click', () => dialog.close());
  done.addEventListener('click', () => {
    onDone?.(selected);
    dialog.close();
  });
  search.addEventListener('input', () => {
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(() => {
      const query = search.value.trim();
      if (!query) {
        void showResults(
          (options) => loadSuggestions?.(activeQuestionId, options) || [],
          {
            label: 'Related thoughts',
            empty: 'No directly connected thoughts. Search all thoughts instead.',
          },
        );
        return;
      }
      void showResults(
        (options) => searchThoughts?.(query, options) || [],
        {
          label: 'All thoughts',
          loading: 'Searching…',
          empty: `No thoughts match “${query}”.`,
        },
      );
    }, 180);
  });
  dialog.addEventListener('close', () => {
    window.clearTimeout(searchTimer);
    activeRequestController?.abort();
    activeRequestController = null;
  });

  return { open };
}
