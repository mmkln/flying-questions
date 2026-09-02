import { hasAnchor } from './anchors.js';
import { createContextMenu } from './context-menu.js';
import {
  createAnchorIcon,
  createEditIcon,
  createMoreIcon,
  createQuestionIcon,
} from './icons.js';
import {
  DETAIL_CONTEXT_MODE,
  DETAIL_STATE,
  DETAIL_VIEW_MODE,
  getQuestionDetailPresentation,
} from './question-detail-presentation.js';
import { formatQuestionDate } from './questions-list.js';
import { createResearchContextEditor } from './research-context-editor.js';
import { researchContextFromWorkflow } from './research-context.js';
import { createThoughtPicker } from './thought-picker.js';

function firstLine(value) {
  return String(value || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean) || '';
}

function createMenuItem(label, className = '') {
  const item = document.createElement('button');
  item.type = 'button';
  item.className = `question-inspector-menu-item ${className}`.trim();
  item.setAttribute('role', 'menuitem');
  item.textContent = label;
  return item;
}

function createQuestionDetailContent(
  {
    onToggleAnchor,
    onEdit,
    onQueue,
    onMaterialize,
    onLoadRelatedThoughts,
    onSearchThoughts,
    onRequestClose,
  } = {},
) {
  const element = document.createElement('section');
  const header = document.createElement('header');
  const identity = document.createElement('div');
  const icon = document.createElement('span');
  const titleGroup = document.createElement('div');
  const title = document.createElement('h2');
  const date = document.createElement('time');
  const headerActions = document.createElement('div');
  const anchorToggle = document.createElement('button');
  const anchorToggleLabel = document.createElement('span');
  const menuContainer = document.createElement('div');
  const menuTrigger = document.createElement('button');
  const menu = document.createElement('div');
  const editItem = createMenuItem('Edit question');
  const body = document.createElement('div');
  const emptyState = document.createElement('p');
  const activity = document.createElement('section');
  const activityLabel = document.createElement('p');
  const activityTitle = document.createElement('h3');
  const activityDescription = document.createElement('p');
  const preview = document.createElement('p');
  const reader = document.createElement('p');
  const status = document.createElement('p');
  const actionRow = document.createElement('div');
  const backButton = document.createElement('button');
  const closeButton = document.createElement('button');
  const primaryAction = document.createElement('button');
  let currentQuestion = null;
  let viewMode = DETAIL_VIEW_MODE.OVERVIEW;
  let isMobile = false;
  let isUpdatingAnchor = false;
  let isUpdatingWorkflow = false;
  let contextQuestionId = null;
  let contextSignature = '';

  element.className = 'question-inspector-content';
  header.className = 'question-inspector-header';
  identity.className = 'question-inspector-identity';
  icon.className = 'question-icon question-inspector-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.append(createQuestionIcon());
  titleGroup.className = 'question-inspector-title-group';
  title.className = 'question-inspector-title';
  title.id = 'question-inspector-title';
  date.className = 'question-inspector-date';
  titleGroup.append(title, date);
  identity.append(icon, titleGroup);

  headerActions.className = 'question-inspector-header-actions';
  anchorToggle.className = 'question-inspector-anchor';
  anchorToggle.type = 'button';
  anchorToggle.append(createAnchorIcon(), anchorToggleLabel);

  menuContainer.className = 'question-inspector-menu-container';
  menuTrigger.className = 'question-inspector-more';
  menuTrigger.type = 'button';
  menuTrigger.setAttribute('aria-label', 'Question actions');
  menuTrigger.setAttribute('aria-haspopup', 'menu');
  menuTrigger.setAttribute('aria-expanded', 'false');
  menuTrigger.append(createMoreIcon());
  menu.className = 'question-inspector-menu';
  menu.setAttribute('role', 'menu');
  menu.hidden = true;
  menu.append(editItem);
  menuContainer.append(menuTrigger, menu);
  headerActions.append(anchorToggle, menuContainer);
  header.append(identity, headerActions);

  emptyState.className = 'question-inspector-empty';
  emptyState.textContent = 'Select a question to view its details and research.';
  body.className = 'question-inspector-body';

  activity.className = 'question-inspector-activity';
  activityLabel.className = 'question-inspector-section-label';
  activityTitle.className = 'question-inspector-activity-title';
  activityDescription.className = 'question-inspector-activity-description';

  let thoughtPicker = null;
  const researchContext = createResearchContextEditor({
    onAddThoughts({ selectedThoughts }) {
      void thoughtPicker?.open({
        questionId: currentQuestion?.id,
        selectedThoughts,
      });
    },
  });
  thoughtPicker = createThoughtPicker({
    loadSuggestions(questionId) {
      return onLoadRelatedThoughts?.(questionId) || [];
    },
    searchThoughts(query) {
      return onSearchThoughts?.(query) || [];
    },
    onDone(thoughts) {
      researchContext.setThoughts(thoughts);
    },
  });

  preview.className = 'question-inspector-preview';
  reader.className = 'question-inspector-reader';
  status.className = 'question-inspector-status';
  status.setAttribute('role', 'status');
  status.hidden = true;
  actionRow.className = 'question-inspector-action-row';
  backButton.className = 'question-inspector-secondary';
  backButton.type = 'button';
  backButton.textContent = 'Back';
  closeButton.className = 'question-inspector-quiet';
  closeButton.type = 'button';
  closeButton.textContent = 'Done';
  primaryAction.className = 'question-inspector-primary';
  primaryAction.type = 'button';
  activity.append(
    activityLabel,
    activityTitle,
    activityDescription,
    researchContext.element,
    preview,
    reader,
    status,
    actionRow,
  );
  actionRow.append(backButton, closeButton, primaryAction);
  body.append(emptyState, activity);
  element.append(header, body);

  const contextMenu = createContextMenu({
    container: menuContainer,
    trigger: menuTrigger,
    menu,
    onOpen() {
      editItem.focus();
    },
  });

  function setPrimaryAction({ action, label } = {}) {
    primaryAction.hidden = !action;
    primaryAction.dataset.action = action || '';
    primaryAction.textContent = label || '';
  }

  function focusPreferredAction() {
    requestAnimationFrame(() => {
      const target = !primaryAction.hidden
        ? primaryAction
        : !backButton.hidden
          ? backButton
          : closeButton;
      target.focus();
    });
  }

  function renderEmpty() {
    currentQuestion = null;
    viewMode = DETAIL_VIEW_MODE.OVERVIEW;
    contextQuestionId = null;
    contextSignature = '';
    researchContext.setValue({});
    researchContext.setMode(DETAIL_CONTEXT_MODE.HIDDEN);
    element.classList.add('is-empty');
    header.hidden = true;
    activity.hidden = true;
    emptyState.hidden = false;
    status.hidden = true;
    contextMenu.close();
  }

  function renderQuestion(question) {
    if (!question) {
      renderEmpty();
      return;
    }

    currentQuestion = question;
    const presentation = getQuestionDetailPresentation(question, viewMode);
    const isOverview = viewMode === DETAIL_VIEW_MODE.OVERVIEW;
    const isDraftReader = presentation.state === DETAIL_STATE.REVIEW_DRAFT;
    const isAnswerReader = presentation.state === DETAIL_STATE.ANSWER;
    const isReader = isDraftReader || isAnswerReader;
    const anchored = hasAnchor(question);

    element.classList.remove('is-empty');
    element.classList.toggle('is-reader', isReader);
    header.hidden = false;
    activity.hidden = false;
    emptyState.hidden = true;
    title.textContent = question.text;
    date.dateTime = question.created_at;
    date.textContent = formatQuestionDate(question.created_at);
    anchorToggle.hidden = !onToggleAnchor;
    anchorToggle.disabled = isUpdatingAnchor;
    anchorToggle.classList.toggle('is-anchored', anchored);
    anchorToggle.setAttribute('aria-pressed', String(anchored));
    anchorToggle.setAttribute(
      'aria-label',
      anchored ? 'Remove from anchors' : 'Add to anchors',
    );
    anchorToggle.title = anchored ? 'Remove from anchors' : 'Add to anchors';
    anchorToggleLabel.textContent = anchored ? 'Anchored' : 'Anchor';
    editItem.hidden = !onEdit;

    activityLabel.hidden = isReader;
    activityLabel.textContent = presentation.sectionLabel || 'Research';
    activityTitle.textContent = isDraftReader
      ? 'Draft'
      : isAnswerReader
        ? 'Answer'
        : presentation.title || '';
    activityDescription.textContent = presentation.description || '';
    activityDescription.hidden = isReader || !presentation.description;

    const contextMode = isReader
      ? DETAIL_CONTEXT_MODE.HIDDEN
      : presentation.contextMode ?? DETAIL_CONTEXT_MODE.HIDDEN;
    const serverContext = researchContextFromWorkflow(question.workflow);
    const nextContextSignature = JSON.stringify(serverContext);
    if (
      contextQuestionId !== question.id
      || contextSignature !== nextContextSignature
    ) {
      contextQuestionId = question.id;
      contextSignature = nextContextSignature;
      researchContext.setValue(serverContext);
    }
    researchContext.setMode(contextMode);

    const showsDraftPreview = presentation.state === DETAIL_STATE.DRAFT_PREVIEW;
    const showsAnswerPreview = presentation.state === DETAIL_STATE.ANSWER_SAVED
      && Boolean(presentation.answer);
    preview.hidden = !showsDraftPreview && !showsAnswerPreview;
    preview.textContent = showsDraftPreview
      ? presentation.draft || ''
      : firstLine(presentation.answer?.text);

    reader.hidden = !isReader;
    reader.textContent = isDraftReader
      ? presentation.draft || ''
      : presentation.answer?.text || '';

    backButton.hidden = !isReader;
    closeButton.hidden = !isMobile || !isOverview;
    status.hidden = true;

    const action = presentation.primaryAction;
    const canRunAction = action && (
      action.action === 'queue' && onQueue
      || action.action === 'create-answer' && onMaterialize
      || action.action === 'review-draft'
      || action.action === 'open-answer'
    );
    setPrimaryAction(canRunAction ? action : undefined);

    actionRow.hidden = primaryAction.hidden && backButton.hidden && closeButton.hidden;
  }

  function setMobile(nextIsMobile) {
    isMobile = nextIsMobile;
    element.classList.toggle('is-mobile-host', isMobile);
    if (currentQuestion) renderQuestion(currentQuestion);
    else renderEmpty();
  }

  editItem.addEventListener('click', () => {
    if (!currentQuestion || !onEdit) return;

    contextMenu.close();
    onEdit(currentQuestion);
  });

  anchorToggle.addEventListener('click', async () => {
    if (!currentQuestion || isUpdatingAnchor || !onToggleAnchor) return;

    isUpdatingAnchor = true;
    anchorToggle.disabled = true;
    status.hidden = true;

    try {
      const updatedQuestion = await onToggleAnchor(currentQuestion);
      if (updatedQuestion) renderQuestion(updatedQuestion);
    } catch (error) {
      status.textContent = error.message || 'Could not update the anchor.';
      status.hidden = false;
    } finally {
      isUpdatingAnchor = false;
      anchorToggle.disabled = false;
    }
  });

  backButton.addEventListener('click', () => {
    if (!currentQuestion) return;

    viewMode = DETAIL_VIEW_MODE.OVERVIEW;
    renderQuestion(currentQuestion);
    focusPreferredAction();
  });

  closeButton.addEventListener('click', () => {
    onRequestClose?.();
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
        ? await onQueue?.(currentQuestion, researchContext.getValue())
        : await onMaterialize?.(
          currentQuestion,
          currentQuestion.workflow?.latest_run?.id,
        );

      if (updatedQuestion) {
        viewMode = DETAIL_VIEW_MODE.OVERVIEW;
        renderQuestion(updatedQuestion);
        if (isMobile) focusPreferredAction();
      }
    } catch (error) {
      status.textContent = action === 'queue'
        ? error.message || 'Could not queue this question.'
        : error.message || 'Could not save this answer.';
      status.hidden = false;
    } finally {
      isUpdatingWorkflow = false;
      primaryAction.disabled = false;
    }
  });

  return {
    element,
    focusPreferredAction,
    renderEmpty,
    renderQuestion,
    setMobile,
  };
}

export function createQuestionInspector(
  {
    onToggleAnchor,
    onEdit,
    onQueue,
    onMaterialize,
    onLoadRelatedThoughts,
    onSearchThoughts,
    onClose,
  } = {},
) {
  const desktopPanel = document.createElement('aside');
  const mobileDialog = document.createElement('dialog');
  const mobileQuery = window.matchMedia('(max-width: 900px)');
  let currentQuestion = null;

  desktopPanel.className = 'question-inspector';
  desktopPanel.setAttribute('aria-label', 'Question details');
  mobileDialog.className = 'question-detail-dialog';
  mobileDialog.setAttribute('aria-label', 'Question details');
  document.body.append(mobileDialog);

  const content = createQuestionDetailContent({
    onToggleAnchor,
    onEdit,
    onQueue,
    onMaterialize,
    onLoadRelatedThoughts,
    onSearchThoughts,
    onRequestClose: close,
  });

  function mountForViewport() {
    const isMobile = mobileQuery.matches;
    content.setMobile(isMobile);

    if (isMobile) {
      mobileDialog.append(content.element);
    } else {
      desktopPanel.append(content.element);
    }
  }

  function open(question) {
    currentQuestion = question;
    const isMobile = mobileQuery.matches;

    if (!isMobile && mobileDialog.open) mobileDialog.close();
    mountForViewport();
    content.renderQuestion(question);

    if (isMobile) {
      if (!mobileDialog.open) mobileDialog.showModal();
      content.focusPreferredAction();
    }
  }

  function update(question) {
    if (!question) {
      close();
      return;
    }

    currentQuestion = question;
    mountForViewport();
    content.renderQuestion(question);
  }

  function close() {
    if (mobileDialog.open) mobileDialog.close();

    currentQuestion = null;
    content.setMobile(false);
    desktopPanel.append(content.element);
    content.renderEmpty();
    onClose?.();
  }

  function handleViewportChange() {
    if (!currentQuestion) {
      if (mobileDialog.open) mobileDialog.close();
      content.setMobile(false);
      desktopPanel.append(content.element);
      content.renderEmpty();
      return;
    }

    const isMobile = mobileQuery.matches;
    if (!isMobile && mobileDialog.open) mobileDialog.close();
    mountForViewport();
    content.renderQuestion(currentQuestion);
    if (isMobile && !mobileDialog.open) mobileDialog.showModal();
  }

  mobileDialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    close();
  });
  mobileQuery.addEventListener('change', handleViewportChange);

  content.setMobile(false);
  desktopPanel.append(content.element);
  content.renderEmpty();

  return {
    element: desktopPanel,
    close,
    open,
    update,
  };
}
