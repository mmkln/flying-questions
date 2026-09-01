import { hasAnchor } from './anchors.js';
import { createAnchorIcon } from './icons.js';
import { formatQuestionDate } from './questions-list.js';

export function createQuestionDetailSheet({ onToggleAnchor } = {}) {
  const dialog = document.createElement('dialog');
  const form = document.createElement('form');
  const header = document.createElement('header');
  const icon = document.createElement('span');
  const title = document.createElement('h2');
  const headerActions = document.createElement('div');
  const anchorButton = document.createElement('button');
  const text = document.createElement('p');
  const footer = document.createElement('footer');
  const date = document.createElement('time');
  const actions = document.createElement('div');
  const done = document.createElement('button');
  const status = document.createElement('p');
  let currentQuestion = null;
  let isUpdatingAnchor = false;

  dialog.className = 'question-detail-dialog';
  dialog.setAttribute('aria-labelledby', 'question-detail-title');

  form.className = 'question-detail-form';
  form.method = 'dialog';
  header.className = 'question-detail-header';
  headerActions.className = 'question-detail-header-actions';

  icon.className = 'question-icon question-detail-icon';
  icon.textContent = '?';
  icon.setAttribute('aria-hidden', 'true');

  title.className = 'sr-only';
  title.id = 'question-detail-title';
  title.textContent = 'Question details';

  anchorButton.className = 'question-detail-anchor';
  anchorButton.type = 'button';
  anchorButton.setAttribute('aria-pressed', 'false');
  anchorButton.append(createAnchorIcon());

  text.className = 'question-detail-text';
  footer.className = 'question-detail-footer';
  date.className = 'question-detail-date';
  actions.className = 'question-detail-actions';
  status.className = 'question-detail-status';
  status.setAttribute('role', 'status');
  status.hidden = true;

  done.className = 'question-detail-primary';
  done.type = 'submit';
  done.textContent = 'Done';

  headerActions.append(anchorButton);
  header.append(icon, title, headerActions);
  actions.append(done);
  footer.append(date, actions);
  form.append(header, text, status, footer);
  dialog.append(form);
  document.body.append(dialog);

  function renderQuestion(question) {
    currentQuestion = question;
    text.textContent = question.text;
    date.dateTime = question.created_at;
    date.textContent = formatQuestionDate(question.created_at);

    const anchored = hasAnchor(question);
    anchorButton.classList.toggle('is-active', anchored);
    anchorButton.setAttribute('aria-pressed', String(anchored));
    anchorButton.setAttribute(
      'aria-label',
      anchored ? 'Remove from anchors' : 'Add to anchors',
    );
    anchorButton.title = anchored ? 'Remove from anchors' : 'Add to anchors';
  }

  anchorButton.addEventListener('click', async () => {
    if (!currentQuestion || isUpdatingAnchor || !onToggleAnchor) return;

    isUpdatingAnchor = true;
    anchorButton.disabled = true;
    status.hidden = true;

    try {
      const updatedQuestion = await onToggleAnchor(currentQuestion);
      if (updatedQuestion) renderQuestion(updatedQuestion);
    } catch (error) {
      status.textContent = error.message || 'Could not update the anchor.';
      status.hidden = false;
    } finally {
      isUpdatingAnchor = false;
      anchorButton.disabled = false;
    }
  });

  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    dialog.close();
  });

  return {
    open(question) {
      renderQuestion(question);
      status.hidden = true;

      if (!dialog.open) dialog.showModal();

      requestAnimationFrame(() => done.focus());
    },
  };
}
