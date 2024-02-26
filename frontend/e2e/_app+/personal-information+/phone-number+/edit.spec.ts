import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('personal information phone number edit page', () => {
  test('should navigate to phone number edit page', async ({ page }) => {
    await test.step('navigate', async () => {
      await page.goto('/personal-information/phone-number/edit');
      await expect(page).toHaveURL(/.*personal-information\/phone-number\/edit/);
    });

    await test.step('detect any accessibility issues', async () => {
      const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
      expect(accessibilityScanResults.violations).toEqual([]);
    });
  });

  test('should catch phone number edit page form errors', async ({ page }) => {
    await test.step('navigate', async () => {
      await page.goto('/personal-information/phone-number/edit');
      await expect(page).toHaveURL(/.*personal-information\/phone-number\/edit/);
    });

    await test.step('submit invalid form data', async () => {
      await page.getByRole('textbox', { name: 'phone number' }).fill('ASDF');
      await page.getByRole('button', { name: 'change' }).click();
    });

    await test.step('detect errors summary presence', async () => {
      const errorSummary = page.getByRole('alert').first();
      await expect(errorSummary).toBeInViewport();
      await expect(errorSummary).toBeFocused();
    });

    await test.step('detect form errors', async () => {
      const input = page.getByRole('textbox', { name: 'phone number' });
      const errorMessage = await input.evaluate((element) => (element as HTMLInputElement).validationMessage);
      expect(errorMessage).toEqual(expect.anything());
    });

    await test.step('detect any accessibility issues', async () => {
      const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
      expect(accessibilityScanResults.violations).toEqual([]);
    });
  });

  test('should redirect to phone number confirm page', async ({ page }) => {
    await test.step('navigate', async () => {
      await page.goto('/personal-information/phone-number/edit');
      await expect(page).toHaveURL(/.*personal-information\/phone-number\/edit/);
    });

    await test.step('enter and submit form data', async () => {
      await page.getByRole('textbox', { name: 'phone number' }).fill('(506) 555-5555');
      await page.getByRole('button', { name: 'change' }).click();
    });

    await test.step('detect phone number confirm page', async () => {
      await expect(page).toHaveURL(/.*personal-information\/phone-number\/confirm/);
    });
  });

  test('should navigate to personal information page', async ({ page }) => {
    await test.step('navigate', async () => {
      await page.goto('/personal-information/phone-number/edit');
      await expect(page).toHaveURL(/.*personal-information\/phone-number\/edit/);
    });

    await test.step('click cancel', async () => {
      await page.getByRole('link', { name: 'cancel' }).click();
    });

    await test.step('detect personal information page', async () => {
      await expect(page).toHaveURL(/.*personal-information/);
    });
  });
});
