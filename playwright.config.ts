import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
const BASE_URL = `http://127.0.0.1:${PORT}`;

/**
 * Journeys run against the production build served by `vite preview`, so they
 * test what ships. The mock API runs in the browser (a service worker), the
 * same as in the Docker image.
 */
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env['CI']),
  // On CI, also write an HTML report that the workflow uploads when a test fails.
  reporter: process.env['CI']
    ? [['list'], ['html', { open: 'never' }]]
    : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      testMatch: ['journeys.spec.ts', 'a11y.spec.ts', 'keyboard.spec.ts'],
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile',
      testMatch: ['journeys.spec.ts', 'a11y.spec.ts', 'mobile.spec.ts'],
      use: { ...devices['Pixel 7'] },
    },
  ],
  webServer: {
    command: `npm run build && npm run preview -- --host 127.0.0.1 --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
  },
});
