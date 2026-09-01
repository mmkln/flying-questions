import { formatQuestionDate } from './questions-list.js';

export function createQuestionDetailSheet() {
  const dialog = document.createElement('dialog');
  const form = document.createElement('form');
  const header = document.createElement('header');
  const icon = document.createElement('span');
  const title = document.createElement('h2');
  const text = document.createElement('p');
  const footer = document.createElement('footer');
  const date = document.createElement('time');
  const actions = document.createElement('div');
  const done = document.createElement('button');

  dialog.className = 'question-detail-dialog';
  dialog.setAttribute('aria-labelledby', 'question-detail-title');

  form.className = 'question-detail-form';
  form.method = 'dialog';
  header.className = 'question-detail-header';

  icon.className = 'question-icon question-detail-icon';
  icon.textContent = '?';
  icon.setAttribute('aria-hidden', 'true');

  title.className = 'sr-only';
  title.id = 'question-detail-title';
  title.textContent = 'Question details';

  text.className = 'question-detail-text';
  footer.className = 'question-detail-footer';
  date.className = 'question-detail-date';
  actions.className = 'question-detail-actions';

  done.className = 'question-detail-primary';
  done.type = 'submit';
  done.textContent = 'Done';

  header.append(icon, title);
  actions.append(done);
  footer.append(date, actions);
  form.append(header, text, footer);
  dialog.append(form);
  document.body.append(dialog);

  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    dialog.close();
  });

  return {
    open(question) {
      text.textContent = question.text;
      date.dateTime = question.created_at;
      date.textContent = formatQuestionDate(question.created_at);

      if (!dialog.open) dialog.showModal();

      requestAnimationFrame(() => done.focus());
    },
  };
}
