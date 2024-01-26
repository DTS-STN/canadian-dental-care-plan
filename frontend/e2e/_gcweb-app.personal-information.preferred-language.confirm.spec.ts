import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('preferred language confirm page', async () => {
  test('should navigate to page and render', async ({ page }) => {
    await page.goto('/personal-information/preferred-language/confirm');

    await expect(page.locator('h1')).toHaveText(/Confirm preferred language/i);
  });

  test('should not have any automatically detectable accessibility issues', async ({ page }) => {
    await page.goto('/personal-information/preferred-language/confirm');

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
