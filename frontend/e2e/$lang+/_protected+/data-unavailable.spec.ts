import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('data unavailblepage', () => {
  test('should navigate data unavailable page', async ({ page }) => {
    await page.goto('/en/data-unavailable');
    await expect(page).toHaveURL('/en/data-unavailable');
  });

  test('should not have any automatically detectable accessibility issues', async ({ page }) => {
    await page.goto('/en/data-unavailable');
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
