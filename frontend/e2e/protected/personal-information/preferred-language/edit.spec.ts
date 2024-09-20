import { expect, test } from '@playwright/test';

test.describe('preferred language edit page', () => {
  test('should navigate to page and render', async ({ page }) => {
    await page.goto('/en/personal-information/preferred-language/edit');
    await expect(page).toHaveURL('/en/personal-information/preferred-language/edit');
  });
});
