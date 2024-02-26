import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('personal information home address suggested page', () => {
  test('should navigate to home address suggested page', async ({ page }) => {
    await page.goto('/personal-information/home-address/edit');
    await page.locator('button#change-button').click();
    await expect(page).toHaveURL(/.*personal-information\/home-address\/suggested/);
  });

  test('should navigate back to the personal information page after clicking the cancel button', async ({ page }) => {
    await test.step('navigate to confirm page', async () => {
      await page.goto('/personal-information/home-address/edit');
      await page.locator('button#change-button').click();
      await expect(page).toHaveURL(/.*personal-information\/home-address\/suggested/);
    });
    await test.step('click cancel', async () => {
      await page.locator('a#cancel-button').click();
    });
    await test.step('return to personal information page', async () => {
      await expect(page).toHaveURL(/.*personal-information/);
    });
  });

  test('should not have any automatically detectable accessibility issues', async ({ page }) => {
    await page.goto('/personal-information/home-address/suggested');
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
