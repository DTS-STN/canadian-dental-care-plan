import { expect, test } from '@playwright/test';
import { sleep } from 'moderndash';

test.describe('personal information phone number edit page', () => {
  test('should navigate to phone number edit page', async ({ page }) => {
    await test.step('navigate', async () => {
      await page.goto('/en/personal-information/phone-number/edit');
      await expect(page).toHaveURL(/.*personal-information\/phone-number\/edit/);
    });
  });

  test('should catch phone number edit page form errors', async ({ page }) => {
    await test.step('navigate', async () => {
      await page.goto('/en/personal-information/phone-number/edit');
      await expect(page).toHaveURL(/.*personal-information\/phone-number\/edit/);
      await sleep(250); // wait 250ms for page to hydrate and onChange handlers to be bound
    });

    await test.step('submit invalid form data', async () => {
      await page.getByRole('textbox', { name: 'primaryTelephoneNumber' }).fill('ASDF');
      await page.getByRole('button', { name: 'change' }).click();
    });

    await test.step('detect errors summary presence', async () => {
      const errorSummary = page.getByRole('alert').first();
      await expect(errorSummary).toBeInViewport();
      await expect(errorSummary).toBeFocused();
    });

    await test.step('detect form errors', async () => {
      const input = page.getByRole('textbox', { name: 'primaryTelephoneNumber' });
      const errorMessage = await input.evaluate((element) => (element as HTMLInputElement).validationMessage);
      expect(errorMessage).toEqual(expect.anything());
    });
  });

  test('should redirect to phone number personal-information page', async ({ page }) => {
    await test.step('navigate', async () => {
      await page.goto('/en/personal-information/phone-number/edit');
      await expect(page).toHaveURL(/.*personal-information\/phone-number\/edit/);
      await sleep(250); // wait 250ms for page to hydrate and onChange handlers to be bound
    });

    await test.step('enter and submit form data', async () => {
      await page.getByRole('textbox', { name: 'phone number' }).fill('(506) 555-5555');
      await page.getByRole('button', { name: 'change' }).click();
    });

    await test.step('detect phone number confirm page', async () => {
      await expect(page).toHaveURL(/.*personal-information/);
    });
  });

  test('should navigate to personal information page', async ({ page }) => {
    await test.step('navigate', async () => {
      await page.goto('/en/personal-information/phone-number/edit');
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
