import { expect, test } from '@playwright/test';

test('should navigate to index', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('a[href="/en"]')).toBeVisible();
});

test('should navigate from index to home', async ({ page }) => {
  await page.goto('/');
  await page.getByText(/english/i).click();
  await expect(page).toHaveURL('/en');
});