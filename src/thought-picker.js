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
  const status = document.createElement('p');
  const list = document.createElement('ul');
  const footer = document.createElement('footer');
  const count = document.createElement('span');
  const done = document.createElement('button');
  let selected = [];
  let activeQuestionId = null;
  let searchTimer = null;
  let requestVersion = 0;

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
  status.className = 'thought-picker-status';
  status.hidden = true;
  list.className = 'thought-picker-list';
  footer.className = 'thought-picker-footer';
  count.className = 'thought-picker-count';
  done.type = 'button';
  done.className = 'thought-picker-done';
  done.textContent = 'Done';
  footer.append(count, done);
  form.append(header, search, status, list, footer);
  dialog.append(form);
  document.body.append(dialog);

  function renderList(thoughts = []) {
    list.replaceChildren();
    if (!thoughts.length) {
      const empty = document.createElement('li');
      empty.className = 'thought-picker-empty';
      empty.textContent = 'No thoughts found.';
      list.append(empty);
    }

    for (const thought of thoughts) {
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
        renderList(thoughts);
        renderCount();
      });
      list.append(item);
    }
  }

  function renderCount() {
    count.textContent = selected.length ? `${selected.length} selected` : 'Select up to 12';
  }

  async function showResults(loader) {
    const version = ++requestVersion;
    status.hidden = false;
    status.textContent = 'Loading…';
    try {
      const thoughts = await loader();
      if (version !== requestVersion) return;
      status.hidden = true;
      renderList(thoughts);
    } catch (error) {
      if (version !== requestVersion) return;
      status.textContent = error.message || 'Could not load thoughts.';
      renderList([]);
    }
  }

  async function open({ questionId, selectedThoughts = [] }) {
    activeQuestionId = questionId;
    selected = normalizeResearchContext({ thoughts: selectedThoughts }).thoughts;
    search.value = '';
    renderCount();
    if (!dialog.open) dialog.showModal();
    search.focus();
    await showResults(() => loadSuggestions?.(questionId) || []);
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
        void showResults(() => loadSuggestions?.(activeQuestionId) || []);
        return;
      }
      void showResults(() => searchThoughts?.(query) || []);
    }, 180);
  });
  dialog.addEventListener('close', () => {
    window.clearTimeout(searchTimer);
  });

  return { open };
}
