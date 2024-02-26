import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('personal information view page', () => {
  test('should navigate to personal information view page', async ({ page }) => {
    await page.goto('/personal-information');
    await expect(page).toHaveURL('/personal-information');
  });

  test('should not have any automatically detectable accessibility issues', async ({ page }) => {
    await page.goto('/personal-information');
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
