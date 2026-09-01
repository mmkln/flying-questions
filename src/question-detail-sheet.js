import { formatQuestionDate } from './questions-list.js';

export function createQuestionDetailSheet() {
  const dialog = document.createElement('dialog');
  const content = document.createElement('article');
  const title = document.createElement('h2');
  const header = document.createElement('header');
  const date = document.createElement('time');
  const close = document.createElement('button');
  const text = document.createElement('p');

  dialog.className = 'question-detail-sheet';
  dialog.setAttribute('aria-labelledby', 'question-detail-title');

  content.className = 'question-detail-content';
  title.className = 'sr-only';
  title.id = 'question-detail-title';
  title.textContent = 'Question details';
  header.className = 'question-detail-header';
  date.className = 'question-detail-date';

  close.className = 'question-detail-close';
  close.type = 'button';
  close.textContent = '×';
  close.setAttribute('aria-label', 'Close question details');
  close.addEventListener('click', () => dialog.close());

  text.className = 'question-detail-text';

  header.append(date, close);
  content.append(title, header, text);
  dialog.append(content);
  document.body.append(dialog);

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });

  return {
    open(question) {
      date.dateTime = question.created_at;
      date.textContent = formatQuestionDate(question.created_at);
      text.textContent = question.text;

      if (dialog.open) dialog.close();
      dialog.showModal();
      close.focus();
    },
  };
}
