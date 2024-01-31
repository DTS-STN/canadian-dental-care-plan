import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('not found page', () => {
  test('should navigate to not found page', async ({ page }) => {
    await page.goto('/personal-info');

    await expect(page.locator('h1')).toHaveText("We couldn't find that web page (Error 404)");
  });

  test('should not have any automatically detectable accessibility issues', async ({ page }) => {
    await page.goto('/personal-info');

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
