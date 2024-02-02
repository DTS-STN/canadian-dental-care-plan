import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('address change confirmation page', () => {
  test('should navigate to address change confirmation page', async ({ page }) => {
    await page.goto('/personal-information/address/confirm');

    await expect(page.locator('h1')).toHaveText(/confirm/i);
  });

  test('should not have any automatically detectable accessibility issues', async ({ page }) => {
    await page.goto('/personal-information/address/confirm');

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
