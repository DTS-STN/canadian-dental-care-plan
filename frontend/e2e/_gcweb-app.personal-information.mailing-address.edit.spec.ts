import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// TODO: beef up

test.describe('personal informaiton mailing address edit page', () => {
  test('should navigate to mailing address edit page', async ({ page }) => {
    await page.goto('/personal-information/mailing-address/edit');
    await expect(page).toHaveURL(/.*personal-information\/mailing-address\/edit/);
  });

  test('should not have any automatically detectable accessibility issues', async ({ page }) => {
    await page.goto('/letters');
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
