import {
  API_URL,
  beginLogin,
  getAccessToken,
  restoreSession,
  signOut,
} from './auth.js';
import { hasAnchor } from './anchors.js';
import {
  createQuestion,
  loadQuestions,
  materializeQuestionDraft,
  queueQuestion,
  setQuestionAnchor,
  updateQuestionText,
} from './questions-api.js';
import { createContextMenu } from './context-menu.js';
import { createQuestionEditor } from './question-editor.js';
import { createQuestionInspector } from './question-inspector.js';
import { renderQuestionsList } from './questions-list.js';
import {
  ThemeMode,
  nextThemeMode,
  normalizeThemeMode,
  resolveTheme,
} from './theme.js';
import './styles.css';

const THEME_STORAGE_KEY = 'flying-questions:theme:v1';
const systemThemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
const app = document.querySelector('#app');
const themeButton = document.querySelector('#theme-button');
let questionInspector = null;
let selectedQuestionId = null;
const questionEditor = createQuestionEditor({
  onSave: persistQuestion,
  onSaved(question) {
    selectedQuestionId = question.id;
    questionInspector?.open(question);
    renderQuestions();
  },
  onCancel(session) {
    if (session.mode !== 'edit') return;

    selectedQuestionId = session.question.id;
    questionInspector?.open(session.question);
    renderQuestions();
  },
});
questionInspector = createQuestionInspector({
  onToggleAnchor: toggleQuestionAnchor,
  onEdit(question) {
    questionInspector.close();
    questionEditor.openForEdit(question);
  },
  onQueue: queueQuestionForResearch,
  onMaterialize: materializeQuestionAnswer,
  onClose() {
    selectedQuestionId = null;
    renderQuestions();
  },
});
let disposeAccountMenu = () => {};
let questionsMain = null;
let questions = [];
let activeFilter = 'all';
let themeMode = normalizeThemeMode(document.documentElement.dataset.themeMode);

function renderThemeButton() {
  const labels = {
    [ThemeMode.SYSTEM]: 'System',
    [ThemeMode.LIGHT]: 'Light',
    [ThemeMode.DARK]: 'Dark',
  };
  const label = labels[themeMode];

  themeButton.dataset.mode = themeMode;
  themeButton.title = `Appearance: ${label}`;
  themeButton.setAttribute('aria-label', `Appearance: ${label}`);
}

function applyTheme() {
  const resolvedTheme = resolveTheme(themeMode, systemThemeQuery.matches);

  document.documentElement.dataset.theme = resolvedTheme;
  document.documentElement.dataset.themeMode = themeMode;
  document.querySelector('meta[name="theme-color"]')?.setAttribute(
    'content',
    resolvedTheme === ThemeMode.DARK ? '#0e0d14' : '#f7f6fb',
  );
  renderThemeButton();
}

function storeThemeMode() {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, themeMode);
  } catch {
    // The selected theme still applies for this session when storage is disabled.
  }
}

function createAccountMenu(account, { sessionChecking = false } = {}) {
  const menu = document.createElement('div');
  const trigger = document.createElement('button');
  const avatar = document.createElement('span');
  const label = document.createElement('span');
  const chevron = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const chevronPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  const popover = document.createElement('div');
  let menuController = null;

  menu.className = 'account-menu';
  trigger.className = 'account-trigger';
  trigger.type = 'button';
  trigger.setAttribute('aria-haspopup', 'menu');
  trigger.setAttribute('aria-expanded', 'false');

  avatar.className = 'account-avatar';
  avatar.setAttribute('aria-hidden', 'true');
  label.className = 'account-trigger-label';

  chevron.classList.add('account-chevron');
  chevron.setAttribute('viewBox', '0 0 16 16');
  chevron.setAttribute('fill', 'none');
  chevron.setAttribute('stroke', 'currentColor');
  chevron.setAttribute('stroke-width', '1.7');
  chevron.setAttribute('aria-hidden', 'true');
  chevronPath.setAttribute('d', 'm4 6 4 4 4-4');
  chevron.append(chevronPath);

  popover.className = 'account-popover';
  popover.setAttribute('role', 'menu');
  popover.hidden = true;

  if (sessionChecking) {
    label.textContent = 'Checking…';
    trigger.title = 'Checking your sign-in session';
    trigger.disabled = true;
    trigger.setAttribute('aria-busy', 'true');
    avatar.hidden = true;
    chevron.hidden = true;
  } else if (!account) {
    label.textContent = 'Sign in';
    trigger.title = 'Sign in';
    avatar.hidden = true;
    chevron.hidden = true;
    trigger.addEventListener('click', beginLogin);
  } else {
    const initial = account.email.trim().charAt(0).toUpperCase() || 'M';
    const identity = document.createElement('div');
    const menuAvatar = document.createElement('span');
    const copy = document.createElement('span');
    const email = document.createElement('strong');
    const provider = document.createElement('small');
    const firstDivider = document.createElement('div');
    const switchAccountButton = document.createElement('button');
    const secondDivider = document.createElement('div');
    const signOutButton = document.createElement('button');

    trigger.classList.add('is-authenticated');
    trigger.title = `Account: ${account.email}`;
    avatar.textContent = initial;
    label.hidden = true;

    identity.className = 'account-popover-identity';
    menuAvatar.className = 'account-avatar account-menu-avatar';
    menuAvatar.textContent = initial;
    menuAvatar.setAttribute('aria-hidden', 'true');
    copy.className = 'account-popover-copy';
    email.textContent = account.email;
    provider.textContent = 'Majom ID';
    copy.append(email, provider);
    identity.append(menuAvatar, copy);

    firstDivider.className = 'account-menu-divider';
    firstDivider.setAttribute('role', 'separator');
    switchAccountButton.type = 'button';
    switchAccountButton.setAttribute('role', 'menuitem');
    switchAccountButton.textContent = 'Switch Account…';
    secondDivider.className = 'account-menu-divider';
    secondDivider.setAttribute('role', 'separator');
    signOutButton.type = 'button';
    signOutButton.className = 'account-destructive';
    signOutButton.setAttribute('role', 'menuitem');
    signOutButton.textContent = 'Sign Out';
    popover.append(
      identity,
      firstDivider,
      switchAccountButton,
      secondDivider,
      signOutButton,
    );

    menuController = createContextMenu({
      container: menu,
      trigger,
      menu: popover,
      onOpen() {
        switchAccountButton.focus();
      },
    });
    switchAccountButton.addEventListener('click', () => {
      menuController.close();
      beginLogin({ switchAccount: true });
    });
    signOutButton.addEventListener('click', async () => {
      menuController.close();
      await signOut();
      renderSignedOut();
    });
  }

  trigger.append(avatar, label, chevron);
  menu.append(trigger, popover);

  return {
    menu,
    dispose() {
      menuController?.dispose();
    },
  };
}

function createShell({ account = null, sessionChecking = false } = {}) {
  disposeAccountMenu();
  const shell = document.createElement('div');
  const title = document.createElement('h1');
  const main = document.createElement('main');
  const accountMenu = createAccountMenu(account, { sessionChecking });

  shell.className = 'app-shell';
  title.className = 'sr-only';
  title.textContent = 'Questions';
  main.className = 'app-main';

  if (account) {
    const workspace = document.createElement('div');
    const listPane = document.createElement('section');

    workspace.className = 'questions-workspace';
    listPane.className = 'questions-list-pane';
    workspace.append(listPane, questionInspector.element);
    main.append(workspace);
    shell.append(title, main);
    const elements = [shell, accountMenu.menu, createNewQuestionButton()];
    app.replaceChildren(...elements);
    disposeAccountMenu = accountMenu.dispose;
    return listPane;
  }

  shell.append(title, main);
  const elements = [shell, accountMenu.menu];
  app.replaceChildren(...elements);
  disposeAccountMenu = accountMenu.dispose;
  return main;
}

function createNewQuestionButton() {
  const button = document.createElement('button');
  const plus = document.createElement('span');
  const label = document.createElement('span');

  button.className = 'new-question-button';
  button.type = 'button';
  button.setAttribute('aria-label', 'New question');
  plus.className = 'new-question-plus';
  plus.textContent = '+';
  plus.setAttribute('aria-hidden', 'true');
  label.className = 'new-question-label';
  label.textContent = 'New question';
  button.append(plus, label);
  button.addEventListener('click', () => questionEditor.openForCreate());

  return button;
}

function renderSignedOut(message = 'Sign in to view your questions.') {
  selectedQuestionId = null;
  questionInspector?.close();
  const main = createShell();
  renderLoading(main, message);
}

function renderLoading(main, label) {
  const status = document.createElement('p');
  status.className = 'status-message';
  status.textContent = label;
  status.setAttribute('role', 'status');
  main.replaceChildren(status);
}

function replaceQuestion(updatedQuestion) {
  let replacement = updatedQuestion;
  questions = questions.map((question) => {
    if (question.id !== updatedQuestion.id) return question;

    replacement = {
      ...question,
      ...updatedQuestion,
      workflow: updatedQuestion.workflow ?? question.workflow,
    };
    return replacement;
  });
  return replacement;
}

function renderQuestions() {
  if (!questionsMain) return;

  const anchoredCount = questions.filter(hasAnchor).length;
  const visibleQuestions = activeFilter === 'anchored'
    ? questions.filter(hasAnchor)
    : questions;

  renderQuestionsList(questionsMain, visibleQuestions, {
    activeFilter,
    allCount: questions.length,
    anchoredCount,
    selectedQuestionId,
    onFilterChange(nextFilter) {
      activeFilter = nextFilter;
      renderQuestions();
    },
    onSelect(question) {
      selectedQuestionId = question.id;
      questionInspector.open(question);
      renderQuestions();
    },
  });
}

async function updateQuestionAnchor(question, shouldAnchor, retriesRemaining = 1) {
  try {
    return await setQuestionAnchor(
      API_URL,
      getAccessToken(),
      question,
      shouldAnchor,
    );
  } catch (error) {
    if (error.status === 409 && error.current && retriesRemaining > 0) {
      return updateQuestionAnchor(error.current, shouldAnchor, retriesRemaining - 1);
    }
    throw error;
  }
}

async function toggleQuestionAnchor(question) {
  const updatedQuestion = await updateQuestionAnchor(question, !hasAnchor(question));
  const mergedQuestion = replaceQuestion(updatedQuestion);
  renderQuestions();
  return mergedQuestion;
}

async function persistQuestion(draft) {
  const savedQuestion = draft.mode === 'create'
    ? await createQuestion(API_URL, getAccessToken(), draft)
    : await updateQuestionText(
      API_URL,
      getAccessToken(),
      draft.question,
      draft.text,
    );

  if (draft.mode === 'create') {
    questions = [savedQuestion, ...questions];
    renderQuestions();
    return savedQuestion;
  }

  const mergedQuestion = replaceQuestion(savedQuestion);
  renderQuestions();
  return mergedQuestion;
}

async function queueQuestionForResearch(question, researchNote) {
  const updatedQuestion = await queueQuestion(
    API_URL,
    getAccessToken(),
    question.id,
    undefined,
    researchNote,
  );
  const mergedQuestion = replaceQuestion(updatedQuestion);
  renderQuestions();
  return mergedQuestion;
}

async function refreshQuestions() {
  questions = await loadQuestions(API_URL, getAccessToken());
  renderQuestions();
}

async function materializeQuestionAnswer(_question, runId) {
  await materializeQuestionDraft(API_URL, getAccessToken(), runId);
  await refreshQuestions();
  return questions.find((question) => question.workflow?.latest_run?.id === runId) || null;
}

async function renderAuthenticated(account) {
  const main = createShell({ account });
  questionsMain = main;
  renderLoading(main, 'Loading questions…');

  try {
    await refreshQuestions();
  } catch (error) {
    const message = document.createElement('p');
    message.className = 'status-message is-error';
    message.textContent = error.message;
    main.replaceChildren(message);
  }
}

async function bootstrap() {
  const main = createShell({ sessionChecking: true });
  renderLoading(main, 'Checking your session…');

  try {
    const account = await restoreSession();
    if (!account) {
      renderSignedOut();
      return;
    }

    await renderAuthenticated(account);
  } catch (error) {
    renderSignedOut(error.message);
  }
}

themeButton.addEventListener('click', () => {
  themeMode = nextThemeMode(themeMode);
  storeThemeMode();
  applyTheme();
});

systemThemeQuery.addEventListener('change', () => {
  if (themeMode === ThemeMode.SYSTEM) applyTheme();
});

applyTheme();
void bootstrap();
