import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('homepage', () => {
  test('should navigate to index', async ({ page }) => {
    await page.goto('/personal-information/phone-number/edit');
    page.locator('button', { hasText: /save/i }).click();
    await expect(page.locator('h1')).toHaveText(/confirm phone number/i);
  });

  test('should not have any automatically detectable accessibility issues', async ({ page }) => {
    await page.goto('/personal-information/phone-number/confirm');

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
