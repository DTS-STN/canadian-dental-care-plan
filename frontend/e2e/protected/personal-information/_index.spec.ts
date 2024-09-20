import { expect, test } from '@playwright/test';

test.describe('personal information view page', () => {
  test('should navigate to personal information view page', async ({ page }) => {
    await page.goto('/en/personal-information');
    await expect(page).toHaveURL('/en/personal-information');
  });
});
