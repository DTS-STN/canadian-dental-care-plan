import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('homepage', () => {
  test('should navigate to index', async ({ page }) => {
    await page.goto('/personal-information/phone-number/edit');

    await expect(page.locator('h1')).toHaveText(/update phone number/i);
  });

  test('should not have any automatically detectable accessibility issues', async ({ page }) => {
    await page.goto('/personal-information/phone-number/edit');

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
