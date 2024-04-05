import { expect, test } from '@playwright/test';

test.describe('data unavailblepage', () => {
  test('should navigate data unavailable page', async ({ page }) => {
    await page.goto('/en/data-unavailable');
    await expect(page).toHaveURL('/en/data-unavailable');
  });
});
