import { expect, test } from '@playwright/test';

test.describe('personal information mailing confirm page', () => {
  test('should navigate to mailing confirm page', async ({ page }) => {
    await page.goto('/en/personal-information/mailing-address/confirm');
    await expect(page).toHaveURL(/.*personal-information\/mailing-address\/confirm/);
  });
});
