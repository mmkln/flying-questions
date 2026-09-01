import {
  API_URL,
  beginLogin,
  getAccessToken,
  restoreSession,
  signOut,
} from './auth.js';
import { hasAnchor } from './anchors.js';
import { loadQuestions, setQuestionAnchor } from './questions-api.js';
import { createQuestionDetailSheet } from './question-detail-sheet.js';
import { renderQuestionsList } from './questions-list.js';
import './styles.css';

const app = document.querySelector('#app');
const questionDetailSheet = createQuestionDetailSheet({
  onToggleAnchor: toggleQuestionAnchor,
});
let disposeAccountMenu = () => {};
let questionsMain = null;
let questions = [];
let activeFilter = 'all';

function createAccountMenu(account, { sessionChecking = false } = {}) {
  const menu = document.createElement('div');
  const trigger = document.createElement('button');
  const avatar = document.createElement('span');
  const label = document.createElement('span');
  const chevron = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const chevronPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  const popover = document.createElement('div');
  let isOpen = false;

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

  function closeMenu({ restoreFocus = false } = {}) {
    if (!isOpen) return;
    isOpen = false;
    popover.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    if (restoreFocus) trigger.focus();
  }

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

    trigger.addEventListener('click', () => {
      isOpen = !isOpen;
      popover.hidden = !isOpen;
      trigger.setAttribute('aria-expanded', String(isOpen));
      if (isOpen) switchAccountButton.focus();
    });
    switchAccountButton.addEventListener('click', () => {
      closeMenu();
      beginLogin({ switchAccount: true });
    });
    signOutButton.addEventListener('click', async () => {
      closeMenu();
      await signOut();
      renderSignedOut();
    });
  }

  const handlePointerDown = (event) => {
    if (isOpen && !menu.contains(event.target)) closeMenu();
  };
  const handleKeyDown = (event) => {
    if (event.key !== 'Escape' || !isOpen) return;
    event.preventDefault();
    closeMenu({ restoreFocus: true });
  };

  document.addEventListener('pointerdown', handlePointerDown);
  document.addEventListener('keydown', handleKeyDown);
  trigger.append(avatar, label, chevron);
  menu.append(trigger, popover);

  return {
    menu,
    dispose() {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
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

  shell.append(title, main);
  app.replaceChildren(shell, accountMenu.menu);
  disposeAccountMenu = accountMenu.dispose;
  return main;
}

function renderSignedOut(message = 'Sign in to view your questions.') {
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
  questions = questions.map((question) => (
    question.id === updatedQuestion.id ? updatedQuestion : question
  ));
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
    onFilterChange(nextFilter) {
      activeFilter = nextFilter;
      renderQuestions();
    },
    onSelect(question) {
      questionDetailSheet.open(question);
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
  replaceQuestion(updatedQuestion);
  renderQuestions();
  return updatedQuestion;
}

async function renderAuthenticated(account) {
  const main = createShell({ account });
  questionsMain = main;
  renderLoading(main, 'Loading questions…');

  try {
    questions = await loadQuestions(API_URL, getAccessToken());
    renderQuestions();
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

void bootstrap();
