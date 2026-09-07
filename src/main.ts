import { bootstrapApplication } from '@angular/platform-browser';
import { createAppConfig } from './app/app.config';
import { App } from './app/app';
import { loadAppConfig } from './app/core/config/app-config.loader';

async function startApplication(): Promise<void> {
  const config = await loadAppConfig();
  await bootstrapApplication(App, createAppConfig(config));
}

function renderStartupFailure(): void {
  const appRoot = document.querySelector('app-root');

  if (!appRoot) {
    return;
  }

  const message = document.createElement('main');
  message.setAttribute('role', 'alert');
  message.setAttribute('aria-live', 'assertive');
  message.className =
    'flex min-h-screen items-center justify-center bg-background p-page-mobile text-center text-text-primary';

  const content = document.createElement('div');
  content.className = 'max-w-lg rounded-surface border border-border bg-surface p-card';

  const title = document.createElement('h1');
  title.className = 'text-section-title';
  title.textContent = 'CareComply could not start';

  const guidance = document.createElement('p');
  guidance.className = 'mt-2 text-body text-text-secondary';
  guidance.textContent = 'Please reload the page or contact your administrators.';

  content.append(title, guidance);
  message.append(content);
  appRoot.replaceChildren(message);
}

void startApplication().catch((error: unknown) => {
  console.error('CareComply startup failed.', error);
  renderStartupFailure();
});
