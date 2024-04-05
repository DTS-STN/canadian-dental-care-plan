import { expect, test } from '@playwright/test';

test.describe('preferred language confirm page', async () => {
  test('should navigate to page and render', async ({ page }) => {
    await page.goto('/en/personal-information/preferred-language/edit');
    await page.getByRole('button', { name: 'change' }).click();
    await expect(page).toHaveURL(/.*personal-information\/preferred-language\/confirm/);
  });
});
