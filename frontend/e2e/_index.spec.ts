import { expect, test } from '@playwright/test';

test.describe('homepage', () => {
  test('should navigate to index', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/');
  });
});
