import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('phone number change confirmation page', () => {
  test('should navigate to phone number change confirmation page', async ({ page }) => {
    await page.goto('/personal-information/phone-number/edit');
    await page.locator('button', { hasText: /change/i }).click();
    await expect(page.locator('h1')).toHaveText(/confirm phone number/i);
  });

  test('should not have any automatically detectable accessibility issues', async ({ page }) => {
    await page.goto('/personal-information/phone-number/confirm');

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
