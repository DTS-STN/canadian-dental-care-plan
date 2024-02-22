import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('not found page', () => {
  test('should navigate to not found page', async ({ page }) => {
    await page.goto('/page-does-not-exist');
    await expect(page).toHaveURL('/page-does-not-exist');
  });

  test('should not have any automatically detectable accessibility issues', async ({ page }) => {
    await page.goto('/page-does-not-exist');
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
