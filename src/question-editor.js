import { createQuestionIcon } from './icons.js';

const DEFAULT_MAXIMUM = 2000;
const DEFAULT_WARNING_THRESHOLD = 1700;

export function createQuestionEditor({
  onSave,
  onSaved,
  onCancel,
  maximum = DEFAULT_MAXIMUM,
  warningThreshold = DEFAULT_WARNING_THRESHOLD,
} = {}) {
  const dialog = document.createElement('dialog');
  const form = document.createElement('form');
  const header = document.createElement('header');
  const icon = document.createElement('span');
  const title = document.createElement('h2');
  const textarea = document.createElement('textarea');
  const status = document.createElement('p');
  const footer = document.createElement('footer');
  const counter = document.createElement('output');
  const actions = document.createElement('div');
  const cancelButton = document.createElement('button');
  const saveButton = document.createElement('button');
  let session = null;
  let opener = null;
  let isSaving = false;

  dialog.className = 'question-editor-dialog';
  dialog.setAttribute('aria-labelledby', 'question-editor-title');

  form.className = 'question-editor-form';
  form.method = 'dialog';
  header.className = 'question-editor-header';

  icon.className = 'question-icon question-editor-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.append(createQuestionIcon());

  title.className = 'sr-only';
  title.id = 'question-editor-title';

  textarea.className = 'question-editor-textarea';
  textarea.maxLength = maximum;
  textarea.required = true;
  textarea.setAttribute('aria-describedby', 'question-editor-counter question-editor-status');

  status.className = 'question-editor-status';
  status.id = 'question-editor-status';
  status.setAttribute('role', 'status');
  status.hidden = true;

  footer.className = 'question-editor-footer';
  counter.className = 'question-editor-counter';
  counter.id = 'question-editor-counter';
  counter.setAttribute('aria-live', 'polite');
  counter.hidden = true;
  actions.className = 'question-editor-actions';

  cancelButton.className = 'question-editor-secondary';
  cancelButton.type = 'button';
  cancelButton.textContent = 'Cancel';

  saveButton.className = 'question-editor-primary';
  saveButton.type = 'submit';

  header.append(icon, title);
  actions.append(cancelButton, saveButton);
  footer.append(counter, actions);
  form.append(header, textarea, status, footer);
  dialog.append(form);
  document.body.append(dialog);

  function updateCounter() {
    const count = textarea.value.length;
    counter.hidden = count < warningThreshold;
    counter.textContent = `${count} / ${maximum}`;
  }

  function setBusy(nextIsSaving) {
    isSaving = nextIsSaving;
    textarea.readOnly = nextIsSaving;
    cancelButton.disabled = nextIsSaving;
    saveButton.disabled = nextIsSaving;
  }

  function close({ restoreFocus = true } = {}) {
    if (dialog.open) dialog.close();

    const lastOpener = opener;
    session = null;
    opener = null;
    status.hidden = true;

    if (restoreFocus && lastOpener instanceof HTMLElement) {
      lastOpener.focus();
    }
  }

  function open(nextSession) {
    close({ restoreFocus: false });

    session = nextSession;
    opener = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    title.textContent = session.mode === 'create' ? 'New question' : 'Edit question';
    textarea.value = session.originalText;
    textarea.placeholder = 'Write a question…';
    textarea.setAttribute('aria-label', 'Question text');
    saveButton.textContent = session.mode === 'create' ? 'Create' : 'Save';
    status.hidden = true;
    setBusy(false);
    updateCounter();

    if (!dialog.open) dialog.showModal();

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    });
  }

  function discard() {
    if (!session || isSaving) return;

    const cancelledSession = session;
    close({ restoreFocus: false });
    onCancel?.(cancelledSession);
  }

  async function save() {
    if (!session || isSaving) return;

    const text = textarea.value.trim();
    if (!text) {
      status.textContent = 'Enter a question before saving.';
      status.hidden = false;
      textarea.focus();
      return;
    }

    if (session.mode === 'edit' && text === session.originalText) {
      const unchangedQuestion = session.question;
      close({ restoreFocus: false });
      onSaved?.(unchangedQuestion);
      return;
    }

    setBusy(true);
    status.hidden = true;

    try {
      const savedQuestion = await onSave?.({
        ...session,
        text,
      });

      if (!savedQuestion) {
        throw new Error('Could not save the question.');
      }

      close({ restoreFocus: false });
      onSaved?.(savedQuestion);
    } catch (error) {
      status.textContent = error?.message || 'Could not save the question.';
      status.hidden = false;
      setBusy(false);
    }
  }

  textarea.addEventListener('input', updateCounter);
  textarea.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      void save();
    }
  });
  cancelButton.addEventListener('click', discard);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    void save();
  });
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    discard();
  });

  return {
    openForCreate() {
      open({
        mode: 'create',
        question: null,
        draftId: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        originalText: '',
      });
    },
    openForEdit(question) {
      open({
        mode: 'edit',
        question,
        draftId: null,
        createdAt: null,
        originalText: question.text,
      });
    },
    close,
  };
}
