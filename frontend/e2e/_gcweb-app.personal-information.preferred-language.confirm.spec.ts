import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('preferred language confirm page', async () => {
  test('should navigate to page and render', async ({ page }) => {
    await page.goto('/personal-information/preferred-language/edit');
    await page.locator('button', { hasText: /change/i }).click();
    await expect(page).toHaveURL(/.*personal-information\/preferred-language\/confirm/);
  });

  test('should not have any automatically detectable accessibility issues', async ({ page }) => {
    await page.goto('/personal-information/preferred-language/edit');
    await page.locator('button', { hasText: /change/i }).click();
    await expect(page).toHaveURL(/.*personal-information\/preferred-language\/confirm/);

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
