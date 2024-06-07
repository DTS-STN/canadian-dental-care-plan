import { expect, test } from '@playwright/test';

test.describe('personal information home address page with flawed URL', () => {
  test('should produce 404 error', async ({ page }) => {
    await test.step('navigate', async () => {
      await page.goto('/en/personal-information/home-address/aardvark');
      await expect(page).toHaveTitle('Not found - Canadian Dental Care Plan - Canada.ca');
    });
  });
});
