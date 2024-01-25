import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('preferred language page', async () => {
  test('should navigate to page and render', async ({ page }) => {
    await page.goto('/personal-information/preferred-language');

    await expect(page.locator('h1')).toHaveText(/preferred language/i);
  });

  test('should not have any automatically detectable accessibility issues', async ({ page }) => {
    await page.goto('/personal-information/preferred-language');

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
