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
    command: 'npm run-script build && npm start',
    port: Number(port),
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    stderr: 'pipe',
    env: {
      AUTH_JWT_PUBLIC_KEY: 'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDT04V6j20+5DQPA7rZCBfabQeyhfNLrKuKSs1yZF/7+y+47Pw80eOmqhgsLQXK9avPMZSvjd++viZ/++jIdej5+J6ifH5KpuVskfgAMY9kPsRLFkJAK8Orph2gibQT/PdfKweSokRmErJxdTWJOqKYTOw607QPh91ubdlgx+VcVwIDAQAB',
      AUTH_JWT_PRIVATE_KEY:
        'MIICdwIBADANBgkqhkiG9w0BAQEFAASCAmEwggJdAgEAAoGBANPThXqPbT7kNA8DutkIF9ptB7KF80usq4pKzXJkX/v7L7js/DzR46aqGCwtBcr1q88xlK+N376+Jn/76Mh16Pn4nqJ8fkqm5WyR+AAxj2Q+xEsWQkArw6umHaCJtBP8918rB5KiRGYSsnF1NYk6ophM7DrTtA+H3W5t2WDH5VxXAgMBAAECgYEAkW80wcUfuIJty7E/5CrOVcVt94BIXriavkRFcjjAPf1j8o+jTw68Qn2eQxZWV9b8szDTaQT7jbZ4MH8AgEGURmroSY2mesHYJtypGkV7ciZj9Z2hnhN0RcOZnl594ZElGljBl83howpwpYhuFDvtCtv9znDYfxeZJnbqWyTenoECQQD/nJ7rOHxk0JG6kHYDqXqZT4hCpnwAtPSppSXa4cHOTTdKM4PBHKBUu5fr003PPpcekbHRQ78HbkhZUdT+NYTxAkEA1CXgk/sLc5AJoFqkbUSnkhPQUBLzCu7kjDAwoQ1DSBerCtbU0/Kg1C1sLixt7g6xgDtMRvfElmqnXZlxzZdVxwJABeWvJO4gsJK/SfabQmpekbrsAd2lbr6+BkvxG6OpvQC7DdMybvoiGNJbJu2xFd7zzZi+6X0OozVAJg9lQpgpgQJBAMBohhHQm6c5GPH9o6mSneSH4ePt+86Lsm9O+Zvn+oC1LqULCUYdhS5K8BXEqANEAkrJ/TlUWFEP9DGZDLUpL1sCQGx9AJNJP6JajA4JWBCUpY2XpRqX7mr3g4TxmFGaXU6CMbz1LVL+2knWZx4wg53BemWEu8KY7v5FISzIyMfBjVs=',
      MOCKS_ENABLED: 'true',
      PORT: port,
      AUTH_RAOIDC_BASE_URL: 'https://auth.example.com/oauth',
      AUTH_RAOIDC_CLIENT_ID: 'CDCP',
    },
  },
});
