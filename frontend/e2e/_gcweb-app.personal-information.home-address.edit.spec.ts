import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('personal informaiton home address edit page', () => {
  test('should navigate to home address edit page', async ({ page }) => {
    await test.step('navigate', async () => {
      await page.goto('/personal-information/home-address/edit');
      await expect(page).toHaveURL(/.*personal-information\/home-address\/edit/);
    });

    await test.step('detect any accessibility issues', async () => {
      const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
      expect(accessibilityScanResults.violations).toEqual([]);
    });
  });

  test('should catch home address edit page form errors', async ({ page }) => {
    await test.step('navigate', async () => {
      await page.goto('/personal-information/home-address/edit');
      await expect(page).toHaveURL(/.*personal-information\/home-address\/edit/);
    });

    await test.step('submit invalid form data', async () => {
      await page.locator('input#address').evaluate((e) => ((e as HTMLInputElement).required = false));
      await page.locator('input#address').fill('');
      await page.locator('button#change-button').click();
    });

    await test.step('detect errors summary presence', async () => {
      const errorSummary = page.locator('section#error-summary');
      await expect(errorSummary).toBeInViewport();
      await expect(errorSummary).toBeFocused();
    });

    await test.step('detect form errors', async () => {
      const input = page.locator('input#address');
      const errorMessage = await input.evaluate((element) => (element as HTMLInputElement).validationMessage);
      expect(errorMessage).toEqual(expect.anything());
    });

    await test.step('detect any accessibility issues', async () => {
      const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
      expect(accessibilityScanResults.violations).toEqual([]);
    });
  });

  test('should redirect to home address suggested page', async ({ page }) => {
    await test.step('navigate', async () => {
      await page.goto('/personal-information/home-address/edit');
      await expect(page).toHaveURL(/.*personal-information\/home-address\/edit/);
    });

    await test.step('enter and submit form data', async () => {
      await page.locator('input#address').fill('123 New Address Avenue');
      await page.locator('button#change-button').click();
    });

    await test.step('detect home address suggested page', async () => {
      await expect(page).toHaveURL(/.*personal-information\/home-address\/suggested/);
    });
  });

  test('should navigate to personal information page', async ({ page }) => {
    await test.step('navigate', async () => {
      await page.goto('/personal-information/home-address/edit');
      await expect(page).toHaveURL(/.*personal-information\/home-address\/edit/);
    });

    await test.step('click cancel', async () => {
      await page.locator('a#cancel-button').click();
    });

    await test.step('detect personal information page', async () => {
      await expect(page).toHaveURL(/.*personal-information/);
    });
  });
});
