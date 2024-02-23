import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('personal information mailing edit page', () => {
  test('should navigate to mailing edit page', async ({ page }) => {
    await page.goto('/personal-information/mailing-address/edit');
    await page.locator('button#change-button').click();
    await expect(page).toHaveURL(/.*personal-information\/mailing-address\/confirm/);
  });

  test('should navigate back to the edit page after clicking the cancel button', async ({ page }) => {
    await test.step('navigate to confirm page', async () => {
      await page.goto('/personal-information/mailing-address/edit');
      await page.locator('button#change-button').click();
      await expect(page).toHaveURL(/.*personal-information\/mailing-address\/confirm/);
    });
    await test.step('click cancel', async () => {
      await page.locator('a#cancel-button').click();
    });
    await test.step('return to edit page', async () => {
      await expect(page).toHaveURL(/.*personal-information\/mailing-address\/edit/);
    });
  });

  test('should not have any automatically detectable accessibility issues', async ({ page }) => {
    await page.goto('/letters');
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
