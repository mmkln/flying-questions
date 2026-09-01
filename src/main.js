import {
  API_URL,
  beginLogin,
  getAccessToken,
  restoreSession,
  signOut,
} from './auth.js';
import { loadQuestions } from './questions-api.js';
import { renderQuestionsList } from './questions-list.js';
import './styles.css';

const app = document.querySelector('#app');

function createShell({ account = null } = {}) {
  const shell = document.createElement('div');
  const header = document.createElement('header');
  const title = document.createElement('h1');
  const actions = document.createElement('div');
  const main = document.createElement('main');

  shell.className = 'app-shell';
  header.className = 'app-header';
  title.textContent = 'Questions';
  actions.className = 'app-actions';
  main.className = 'app-main';

  if (account) {
    const email = document.createElement('span');
    const signOutButton = document.createElement('button');
    email.className = 'account-email';
    email.textContent = account.email;
    signOutButton.className = 'text-button';
    signOutButton.type = 'button';
    signOutButton.textContent = 'Sign out';
    signOutButton.addEventListener('click', async () => {
      await signOut();
      renderSignedOut();
    });
    actions.append(email, signOutButton);
  }

  header.append(title, actions);
  shell.append(header, main);
  app.replaceChildren(shell);
  return main;
}

function renderSignedOut(message = 'Sign in to view your questions.') {
  const main = createShell();
  const card = document.createElement('section');
  const heading = document.createElement('h2');
  const description = document.createElement('p');
  const button = document.createElement('button');

  card.className = 'sign-in-card';
  heading.textContent = 'Your questions, in one place.';
  description.textContent = message;
  button.className = 'primary-button';
  button.type = 'button';
  button.textContent = 'Sign in';
  button.addEventListener('click', beginLogin);

  card.append(heading, description, button);
  main.append(card);
}

function renderLoading(main, label) {
  const status = document.createElement('p');
  status.className = 'status-message';
  status.textContent = label;
  status.setAttribute('role', 'status');
  main.replaceChildren(status);
}

async function renderAuthenticated(account) {
  const main = createShell({ account });
  renderLoading(main, 'Loading questions…');

  try {
    const questions = await loadQuestions(API_URL, getAccessToken());
    renderQuestionsList(main, questions);
  } catch (error) {
    const message = document.createElement('p');
    message.className = 'status-message is-error';
    message.textContent = error.message;
    main.replaceChildren(message);
  }
}

async function bootstrap() {
  const main = createShell();
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
