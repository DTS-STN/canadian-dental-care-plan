import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('preferred language edit page', async () => {
  test('should navigate to page and render', async ({ page }) => {
    await page.goto('/personal-information/preferred-language/edit');

    await expect(page.locator('h1')).toHaveText(/preferred language edit/i);
  });

  test('should not have any automatically detectable accessibility issues', async ({ page }) => {
    await page.goto('/personal-information/preferred-language/edit');

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
