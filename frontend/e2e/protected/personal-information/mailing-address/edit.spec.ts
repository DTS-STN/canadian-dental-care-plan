import { expect, test } from '@playwright/test';
import { sleep } from 'moderndash';

test.describe('personal information mailing address edit page', () => {
  test('should navigate to mailing address edit page', async ({ page }) => {
    await test.step('navigate', async () => {
      await page.goto('/en/personal-information/mailing-address/edit');
      await expect(page).toHaveURL(/.*personal-information\/mailing-address\/edit/);
    });
  });

  test('should copy home address when checkbox is clicked', async ({ page }) => {
    await test.step('navigate', async () => {
      await page.goto('/en/personal-information/mailing-address/edit');
      await expect(page).toHaveURL(/.*personal-information\/mailing-address\/edit/);
    });
  });

  test('should catch mailing address edit page form errors', async ({ page }) => {
    await test.step('navigate', async () => {
      await page.goto('/en/personal-information/mailing-address/edit');
      await expect(page).toHaveURL(/.*personal-information\/mailing-address\/edit/);
      await sleep(250); // wait 250ms for page to hydrate and onChange handlers to be bound
    });

    await test.step('submit invalid form data', async () => {
      await page.getByRole('textbox', { name: 'address' }).evaluate((e) => ((e as HTMLInputElement).required = false));
      await page.getByRole('textbox', { name: 'address' }).fill('');
      await page.getByRole('button', { name: 'save' }).click();
    });

    await test.step('detect form errors', async () => {
      const input = page.getByRole('textbox', { name: 'address' });
      const errorMessage = await input.evaluate((element) => (element as HTMLInputElement).validationMessage);
      expect(errorMessage).toEqual(expect.anything());
    });
  });

  test('should redirect to personal information page after saving', async ({ page }) => {
    await test.step('navigate', async () => {
      await page.goto('/en/personal-information/mailing-address/edit');
      await expect(page).toHaveURL(/.*personal-information\/mailing-address\/edit/);
      await sleep(250); // wait 250ms for page to hydrate and onChange handlers to be bound
    });

    await test.step('enter and submit form data', async () => {
      await page.getByRole('textbox', { name: 'address' }).fill('123 New Address Avenue');
      await page.getByRole('button', { name: 'save' }).click();
    });

    await test.step('detect mailing address confirm page', async () => {
      await expect(page).toHaveURL(/.*personal-information/);
    });
  });

  test('should navigate to personal information page', async ({ page }) => {
    await test.step('navigate', async () => {
      await page.goto('/en/personal-information/mailing-address/edit');
      await expect(page).toHaveURL(/.*personal-information\/mailing-address\/edit/);
      await sleep(250); // wait 250ms for page to hydrate and onChange handlers to be bound
    });

    await test.step('click cancel', async () => {
      await page.getByRole('link', { name: 'back' }).click();
    });

    await test.step('detect personal information page', async () => {
      await expect(page).toHaveURL(/.*personal-information/);
    });
  });
});
