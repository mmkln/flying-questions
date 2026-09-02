import { hasAnchor } from './anchors.js';
import {
  createAnchorIcon,
  createEditIcon,
  createQuestionIcon,
} from './icons.js';
import {
  DETAIL_STATE,
  DETAIL_VIEW_MODE,
  getQuestionDetailPresentation,
} from './question-detail-presentation.js';
import { formatQuestionDate } from './questions-list.js';

function firstLine(value) {
  return String(value || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean) || '';
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
  const body = document.createElement('div');
  const text = document.createElement('p');
  const workflow = document.createElement('section');
  const workflowState = document.createElement('p');
  const workflowDescription = document.createElement('p');
  const draftPreview = document.createElement('section');
  const draftPreviewTitle = document.createElement('p');
  const draftPreviewText = document.createElement('p');
  const draftReview = document.createElement('section');
  const draftReviewTitle = document.createElement('h3');
  const draftReviewText = document.createElement('p');
  const answerPreview = document.createElement('section');
  const answerPreviewTitle = document.createElement('p');
  const answerPreviewText = document.createElement('p');
  const answerReview = document.createElement('section');
  const answerReviewTitle = document.createElement('h3');
  const answerReviewText = document.createElement('p');
  const status = document.createElement('p');
  const footer = document.createElement('footer');
  const date = document.createElement('time');
  const actions = document.createElement('div');
  const done = document.createElement('button');
  const primaryAction = document.createElement('button');
  let currentQuestion = null;
  let viewMode = DETAIL_VIEW_MODE.OVERVIEW;
  let isUpdatingAnchor = false;
  let isUpdatingWorkflow = false;

  dialog.className = 'question-detail-dialog';
  dialog.setAttribute('aria-labelledby', 'question-detail-title');

  form.className = 'question-detail-form';
  header.className = 'question-detail-header';
  headerActions.className = 'question-detail-header-actions';
  body.className = 'question-detail-body';

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
  workflowDescription.className = 'question-detail-workflow-description';

  draftPreview.className = 'question-detail-draft-preview';
  draftPreviewTitle.className = 'question-detail-section-title';
  draftPreviewTitle.textContent = 'Draft';
  draftPreviewText.className = 'question-detail-draft-preview-text';

  draftReview.className = 'question-detail-draft-review';
  draftReviewTitle.className = 'question-detail-section-title';
  draftReviewTitle.textContent = 'Draft';
  draftReviewText.className = 'question-detail-draft-review-text';

  answerPreview.className = 'question-detail-answer-preview';
  answerPreviewTitle.className = 'question-detail-section-title';
  answerPreviewTitle.textContent = 'Created answer';
  answerPreviewText.className = 'question-detail-answer-preview-text';

  answerReview.className = 'question-detail-answer';
  answerReviewTitle.className = 'question-detail-section-title';
  answerReviewTitle.textContent = 'Answer';
  answerReviewText.className = 'question-detail-answer-text';

  status.className = 'question-detail-status';
  status.setAttribute('role', 'status');
  status.hidden = true;

  footer.className = 'question-detail-footer';
  date.className = 'question-detail-date';
  actions.className = 'question-detail-actions';

  done.className = 'question-detail-quiet';
  done.type = 'button';

  primaryAction.className = 'question-detail-primary';
  primaryAction.type = 'button';
  primaryAction.hidden = true;

  headerActions.append(anchorButton, editButton);
  header.append(icon, title, headerActions);
  workflow.append(workflowState, workflowDescription);
  draftPreview.append(draftPreviewTitle, draftPreviewText);
  draftReview.append(draftReviewTitle, draftReviewText);
  answerPreview.append(answerPreviewTitle, answerPreviewText);
  answerReview.append(answerReviewTitle, answerReviewText);
  body.append(
    text,
    workflow,
    draftPreview,
    draftReview,
    answerPreview,
    answerReview,
    status,
  );
  actions.append(done, primaryAction);
  footer.append(date, actions);
  form.append(header, body, footer);
  dialog.append(form);
  document.body.append(dialog);

  function setPrimaryAction({ action, label } = {}) {
    primaryAction.hidden = !action;
    primaryAction.dataset.action = action || '';
    primaryAction.textContent = label || '';
  }

  function focusPreferredAction() {
    requestAnimationFrame(() => {
      (primaryAction.hidden ? done : primaryAction).focus();
    });
  }

  function renderQuestion(question) {
    currentQuestion = question;
    const presentation = getQuestionDetailPresentation(question, viewMode);
    const isOverview = viewMode === DETAIL_VIEW_MODE.OVERVIEW;

    text.textContent = question.text;
    text.hidden = viewMode === DETAIL_VIEW_MODE.ANSWER;
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
    editButton.hidden = !onEdit || !isOverview;
    anchorButton.hidden = !isOverview;

    workflow.hidden = !isOverview || presentation.state === DETAIL_STATE.DRAFT_PREVIEW
      || presentation.state === DETAIL_STATE.ANSWER_SAVED;
    workflowState.textContent = presentation.title || '';
    workflowDescription.textContent = presentation.description || '';
    workflowDescription.hidden = !presentation.description;

    draftPreview.hidden = presentation.state !== DETAIL_STATE.DRAFT_PREVIEW;
    draftPreviewTitle.textContent = presentation.title || 'Draft';
    draftPreviewText.textContent = presentation.draft || '';

    draftReview.hidden = presentation.state !== DETAIL_STATE.REVIEW_DRAFT;
    draftReviewText.textContent = presentation.draft || '';

    answerPreview.hidden = presentation.state !== DETAIL_STATE.ANSWER_SAVED
      || !presentation.answer;
    answerPreviewTitle.textContent = presentation.title || 'Created answer';
    answerPreviewText.textContent = firstLine(presentation.answer?.text);

    answerReview.hidden = presentation.state !== DETAIL_STATE.ANSWER;
    answerReviewText.textContent = presentation.answer?.text || '';

    done.textContent = isOverview ? 'Done' : 'Back to question';

    switch (presentation.state) {
      case DETAIL_STATE.READY_FOR_RESEARCH:
        setPrimaryAction(onQueue
          ? { action: 'queue', label: 'Research' }
          : undefined);
        break;
      case DETAIL_STATE.DRAFT_PREVIEW:
        setPrimaryAction({ action: 'review-draft', label: 'Review draft' });
        break;
      case DETAIL_STATE.REVIEW_DRAFT:
        setPrimaryAction(onMaterialize
          ? { action: 'create-answer', label: 'Create answer' }
          : undefined);
        break;
      case DETAIL_STATE.ANSWER_SAVED:
        setPrimaryAction(presentation.answer
          ? { action: 'open-answer', label: 'Open answer' }
          : undefined);
        break;
      default:
        setPrimaryAction();
    }
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

  done.addEventListener('click', () => {
    if (!currentQuestion) return;
    if (viewMode === DETAIL_VIEW_MODE.OVERVIEW) {
      dialog.close();
      return;
    }

    viewMode = DETAIL_VIEW_MODE.OVERVIEW;
    renderQuestion(currentQuestion);
    focusPreferredAction();
  });

  primaryAction.addEventListener('click', async () => {
    if (!currentQuestion || isUpdatingWorkflow) return;

    const action = primaryAction.dataset.action;
    if (action === 'review-draft') {
      viewMode = DETAIL_VIEW_MODE.REVIEW_DRAFT;
      renderQuestion(currentQuestion);
      focusPreferredAction();
      return;
    }
    if (action === 'open-answer') {
      viewMode = DETAIL_VIEW_MODE.ANSWER;
      renderQuestion(currentQuestion);
      focusPreferredAction();
      return;
    }

    if (action !== 'queue' && action !== 'create-answer') return;

    isUpdatingWorkflow = true;
    primaryAction.disabled = true;
    status.hidden = true;
    try {
      const updatedQuestion = action === 'queue'
        ? await onQueue?.(currentQuestion)
        : await onMaterialize?.(
          currentQuestion,
          currentQuestion.workflow?.latest_run?.id,
        );

      if (updatedQuestion) {
        viewMode = DETAIL_VIEW_MODE.OVERVIEW;
        renderQuestion(updatedQuestion);
        focusPreferredAction();
      }
    } catch (error) {
      status.textContent = action === 'queue'
        ? error.message || 'Could not queue this question.'
        : error.message || 'Could not create an answer.';
      status.hidden = false;
    } finally {
      isUpdatingWorkflow = false;
      primaryAction.disabled = false;
    }
  });

  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    dialog.close();
  });

  return {
    open(question) {
      viewMode = DETAIL_VIEW_MODE.OVERVIEW;
      renderQuestion(question);
      status.hidden = true;

      if (!dialog.open) dialog.showModal();
      focusPreferredAction();
    },
    close() {
      if (dialog.open) dialog.close();
    },
  };
}
