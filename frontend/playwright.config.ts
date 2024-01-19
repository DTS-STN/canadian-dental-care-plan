import { defineConfig, devices } from '@playwright/test';

const port = process.env.PORT || '3000';

export default defineConfig({
  testDir: './e2e',
  timeout: 15 * 1000,
  expect: { timeout: 5 * 1000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: { baseURL: `http://localhost:${port}/`, trace: 'on-first-retry' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npm run-script build && cross-env MOCKS_ENABLED=true npm start`,
    port: Number(port),
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    stderr: 'pipe',
    env: { PORT: port },
  },
});
