import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('letters page', () => {
  test('should navigate to letters page', async ({ page }) => {
    await page.goto('/letters');

    await expect(page.locator('h1')).toHaveText('Letters');
  });

  test('should not have any automatically detectable accessibility issues', async ({ page }) => {
    await page.goto('/letters');

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
