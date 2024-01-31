import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('phone number editing page', () => {
  test('should navigate to phone number editing page', async ({ page }) => {
    await page.goto('/personal-information/phone-number/edit');

    await expect(page.locator('h1')).toHaveText(/update phone number/i);
  });

  test('should not have any automatically detectable accessibility issues', async ({ page }) => {
    await page.goto('/personal-information/phone-number/edit');

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
