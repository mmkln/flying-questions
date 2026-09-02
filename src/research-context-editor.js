import {
  hasResearchContext,
  normalizeResearchContext,
} from './research-context.js';

function createButton(label, className) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.textContent = label;
  return button;
}

function compactText(value) {
  const text = String(value || '').trim();
  return text || 'Untitled thought';
}

export function createResearchContextEditor({ onAddThoughts } = {}) {
  const element = document.createElement('section');
  const heading = document.createElement('p');
  const toggle = createButton('Add research context', 'research-context-toggle');
  const content = document.createElement('div');
  const noteLabel = document.createElement('label');
  const note = document.createElement('textarea');
  const thoughtsHeader = document.createElement('div');
  const thoughtsLabel = document.createElement('p');
  const addThoughts = createButton('Add thoughts', 'research-context-add-thoughts');
  const thoughts = document.createElement('ul');
  const summary = document.createElement('div');
  let value = normalizeResearchContext();
  let mode = 'hidden';
  let expanded = false;

  element.className = 'research-context';
  heading.className = 'question-inspector-section-label';
  heading.textContent = 'Research context';
  toggle.setAttribute('aria-expanded', 'false');
  content.className = 'research-context-editable';
  noteLabel.className = 'sr-only';
  noteLabel.textContent = 'Instructions for AI';
  note.className = 'research-context-note';
  note.rows = 3;
  note.maxLength = 5000;
  note.placeholder = 'Context, constraints, links, or preferred format…';
  note.setAttribute('aria-label', 'Instructions for AI');
  noteLabel.htmlFor = 'research-context-note';
  note.id = 'research-context-note';

  thoughtsHeader.className = 'research-context-thoughts-header';
  thoughtsLabel.className = 'research-context-thoughts-label';
  thoughts.className = 'research-context-thoughts';
  thoughts.setAttribute('aria-label', 'Selected thoughts');
  thoughtsHeader.append(thoughtsLabel, addThoughts);
  content.append(noteLabel, note, thoughtsHeader, thoughts);
  summary.className = 'research-context-summary';
  element.append(heading, toggle, content, summary);

  function renderThoughts({ editable }) {
    thoughts.replaceChildren();
    for (const thought of value.thoughts) {
      const item = document.createElement('li');
      const text = document.createElement('span');
      const kind = document.createElement('small');

      item.className = 'research-context-thought';
      text.className = 'research-context-thought-text';
      text.textContent = compactText(thought.text);
      kind.className = 'research-context-thought-kind';
      kind.textContent = thought.kind;
      item.append(text, kind);

      if (editable) {
        const remove = createButton('Remove', 'research-context-remove-thought');
        remove.setAttribute('aria-label', `Remove ${compactText(thought.text)} from context`);
        remove.addEventListener('click', () => {
          value = normalizeResearchContext({
            ...value,
            thoughts: value.thoughts.filter(({ id }) => id !== thought.id),
          });
          render();
        });
        item.append(remove);
      }
      thoughts.append(item);
    }
  }

  function renderSummary() {
    summary.replaceChildren();
    const noteText = value.note.trim();
    if (noteText) {
      const copy = document.createElement('p');
      copy.textContent = noteText;
      summary.append(copy);
    }
    if (value.thoughts.length) {
      const list = document.createElement('ul');
      list.className = 'research-context-summary-thoughts';
      for (const thought of value.thoughts) {
        const item = document.createElement('li');
        item.textContent = compactText(thought.text);
        list.append(item);
      }
      summary.append(list);
    }
  }

  function render() {
    const canEdit = mode === 'editable';
    const isSummary = mode === 'summary';
    const hasContext = hasResearchContext(value);

    element.hidden = mode === 'hidden';
    element.classList.toggle('is-summary', isSummary);
    heading.hidden = canEdit && !expanded && !hasContext;
    toggle.hidden = !canEdit;
    toggle.textContent = expanded
      ? 'Hide context'
      : hasContext
        ? 'Edit research context'
        : 'Add research context';
    toggle.setAttribute('aria-expanded', String(expanded));
    content.hidden = !canEdit || !expanded;
    summary.hidden = !isSummary || !hasContext;
    note.value = value.note;
    thoughtsLabel.textContent = value.thoughts.length
      ? `Thoughts · ${value.thoughts.length}`
      : 'Thoughts';
    addThoughts.disabled = value.thoughts.length >= 12;
    renderThoughts({ editable: canEdit && expanded });
    renderSummary();
  }

  toggle.addEventListener('click', () => {
    expanded = !expanded;
    render();
    if (expanded) requestAnimationFrame(() => note.focus());
  });
  note.addEventListener('input', () => {
    value = normalizeResearchContext({ ...value, note: note.value });
  });
  addThoughts.addEventListener('click', () => {
    onAddThoughts?.({ selectedThoughts: value.thoughts });
  });

  return {
    element,
    getValue() {
      return normalizeResearchContext(value);
    },
    setMode(nextMode) {
      mode = nextMode;
      if (mode !== 'editable') expanded = false;
      render();
    },
    setValue(nextValue) {
      value = normalizeResearchContext(nextValue);
      render();
    },
    setThoughts(nextThoughts) {
      value = normalizeResearchContext({ ...value, thoughts: nextThoughts });
      expanded = true;
      render();
    },
  };
}
