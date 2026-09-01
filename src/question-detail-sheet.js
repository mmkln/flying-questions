import { hasAnchor } from './anchors.js';
import {
  createAnchorIcon,
  createEditIcon,
  createQuestionIcon,
} from './icons.js';
import { formatQuestionDate } from './questions-list.js';

function workflowLabel(workflow) {
  const labels = {
    queued: 'Queued for research',
    in_progress: 'Being researched',
    draft_ready: 'Draft ready for your review',
    closed: 'Answer created',
  };
  return labels[workflow?.status] || null;
}

export function createQuestionDetailSheet(
  { onToggleAnchor, onEdit, onQueue, onMaterialize } = {},
) {
  const dialog = document.createElement('dialog');
  const form = document.createElement('form');
  const header = document.createElement('header');
  const icon = document.createElement('span');
  const title = document.createElement('h2');
  const headerActions = document.createElement('div');
  const anchorButton = document.createElement('button');
  const editButton = document.createElement('button');
  const text = document.createElement('p');
  const workflow = document.createElement('section');
  const workflowState = document.createElement('p');
  const draft = document.createElement('p');
  const footer = document.createElement('footer');
  const date = document.createElement('time');
  const actions = document.createElement('div');
  const queue = document.createElement('button');
  const createAnswer = document.createElement('button');
  const done = document.createElement('button');
  const status = document.createElement('p');
  let currentQuestion = null;
  let isUpdatingAnchor = false;
  let isUpdatingWorkflow = false;

  dialog.className = 'question-detail-dialog';
  dialog.setAttribute('aria-labelledby', 'question-detail-title');

  form.className = 'question-detail-form';
  form.method = 'dialog';
  header.className = 'question-detail-header';
  headerActions.className = 'question-detail-header-actions';

  icon.className = 'question-icon question-detail-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.append(createQuestionIcon());

  title.className = 'sr-only';
  title.id = 'question-detail-title';
  title.textContent = 'Question details';

  anchorButton.className = 'question-detail-anchor';
  anchorButton.type = 'button';
  anchorButton.setAttribute('aria-pressed', 'false');
  anchorButton.append(createAnchorIcon());

  editButton.className = 'question-detail-edit';
  editButton.type = 'button';
  editButton.setAttribute('aria-label', 'Edit question');
  editButton.title = 'Edit question';
  editButton.append(createEditIcon());

  text.className = 'question-detail-text';
  workflow.className = 'question-detail-workflow';
  workflowState.className = 'question-detail-workflow-state';
  draft.className = 'question-detail-draft';
  workflow.hidden = true;
  footer.className = 'question-detail-footer';
  date.className = 'question-detail-date';
  actions.className = 'question-detail-actions';
  status.className = 'question-detail-status';
  status.setAttribute('role', 'status');
  status.hidden = true;

  queue.className = 'question-detail-secondary';
  queue.type = 'button';
  queue.textContent = 'Queue for research';
  queue.hidden = true;

  createAnswer.className = 'question-detail-primary';
  createAnswer.type = 'button';
  createAnswer.textContent = 'Create answer';
  createAnswer.hidden = true;

  done.className = 'question-detail-primary';
  done.type = 'submit';
  done.textContent = 'Done';

  headerActions.append(anchorButton, editButton);
  header.append(icon, title, headerActions);
  workflow.append(workflowState, draft);
  actions.append(queue, createAnswer, done);
  footer.append(date, actions);
  form.append(header, text, workflow, status, footer);
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
    editButton.hidden = !onEdit;

    const questionWorkflow = question.workflow;
    const latestRun = questionWorkflow?.latest_run;
    const label = workflowLabel(questionWorkflow);
    workflow.hidden = !label;
    workflowState.textContent = label || '';
    draft.textContent = latestRun?.draft || '';
    draft.hidden = !latestRun?.draft;
    queue.hidden = Boolean(questionWorkflow) || !onQueue;
    createAnswer.hidden = !(
      onMaterialize
      && questionWorkflow?.status === 'draft_ready'
      && latestRun?.id
      && latestRun?.draft
      && !latestRun.answer_id
    );
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

  editButton.addEventListener('click', () => {
    if (!currentQuestion || !onEdit) return;
    onEdit(currentQuestion);
  });

  queue.addEventListener('click', async () => {
    if (!currentQuestion || isUpdatingWorkflow || !onQueue) return;

    isUpdatingWorkflow = true;
    queue.disabled = true;
    status.hidden = true;
    try {
      const updatedQuestion = await onQueue(currentQuestion);
      if (updatedQuestion) renderQuestion(updatedQuestion);
    } catch (error) {
      status.textContent = error.message || 'Could not queue this question.';
      status.hidden = false;
    } finally {
      isUpdatingWorkflow = false;
      queue.disabled = false;
    }
  });

  createAnswer.addEventListener('click', async () => {
    const runId = currentQuestion?.workflow?.latest_run?.id;
    if (!currentQuestion || !runId || isUpdatingWorkflow || !onMaterialize) return;

    isUpdatingWorkflow = true;
    createAnswer.disabled = true;
    status.hidden = true;
    try {
      const updatedQuestion = await onMaterialize(currentQuestion, runId);
      if (updatedQuestion) renderQuestion(updatedQuestion);
    } catch (error) {
      status.textContent = error.message || 'Could not create an answer.';
      status.hidden = false;
    } finally {
      isUpdatingWorkflow = false;
      createAnswer.disabled = false;
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
    close() {
      if (dialog.open) dialog.close();
    },
  };
}
