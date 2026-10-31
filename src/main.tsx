import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { AppProviders } from './app/providers';
import { enableMocks } from './mocks/enableMocks';
import './index.css';

async function bootstrap(): Promise<void> {
  await enableMocks();

  const rootElement = document.getElementById('root');

  if (!rootElement) {
    throw new Error('Root element #root was not found');
  }

  createRoot(rootElement).render(
    <StrictMode>
      <AppProviders>
        <App />
      </AppProviders>
    </StrictMode>,
  );
}

void bootstrap();
