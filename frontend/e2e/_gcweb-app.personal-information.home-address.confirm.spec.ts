import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// TODO: beef up

test.describe('personal informaiton home address edit page', () => {
  test('should navigate to home address edit page', async ({ page }) => {
    await page.goto('/personal-information/home-address/edit');
    await page.locator('button#change-button').click();
    await expect(page).toHaveURL(/.*personal-information\/home-address\/confirm/);
  });

  test('should not have any automatically detectable accessibility issues', async ({ page }) => {
    await page.goto('/letters');
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
