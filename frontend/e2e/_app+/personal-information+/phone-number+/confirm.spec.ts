import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('phone number change confirmation page', () => {
  test('should navigate to phone number change confirmation page', async ({ page }) => {
    await page.goto('/personal-information/phone-number/edit');
    await expect(page).toHaveURL('/personal-information/phone-number/edit');

    await page.getByRole('textbox', { name: 'phone number' }).fill('(506) 555-5555');
    await page.getByRole('button', { name: 'change' }).click();
    await expect(page).toHaveURL(/.*personal-information\/phone-number\/confirm/);
  });

  test('should not have any automatically detectable accessibility issues', async ({ page }) => {
    await page.goto('/personal-information/phone-number/edit');
    await page.getByRole('textbox', { name: 'phone number' }).fill('(506) 555-5555');
    await page.getByRole('button', { name: 'change' }).click();
    await expect(page).toHaveURL(/.*personal-information\/phone-number\/confirm/);

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
