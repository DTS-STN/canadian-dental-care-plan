import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('address editing page', () => {
  test('should navigate to address editing page', async ({ page }) => {
    await page.goto('/personal-information/address/edit');

    await expect(page.locator('h1')).toHaveText(/change address/i);
  });

  test('should not have any automatically detectable accessibility issues', async ({ page }) => {
    await page.goto('/personal-information/address/edit');

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
