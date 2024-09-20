import { expect, test } from '@playwright/test';
import { sleep } from 'moderndash';

test.describe('letters page', () => {
  test('should navigate to letters page', async ({ page }) => {
    await page.goto('/en/letters');
    await expect(page).toHaveURL('/en/letters');
  });

  test('it should sort letters oldest to newest', async ({ page }) => {
    await page.goto('/en/letters');
    await sleep(250); // wait 250ms for page to hydrate and onChange handlers to be bound

    const selectLocator = page.getByRole('combobox', { name: 'filter by' });
    await expect(selectLocator).toHaveValue('desc');
    await selectLocator.selectOption('asc');
    await expect(page).toHaveURL(/\/letters\?.*sort=asc/);
    await expect(selectLocator).toHaveValue('asc');
  });

  test('it should click on a pdf and successfully download', async ({ page }) => {
    // note: the default behaviour in the browser is to open the pdf in the tab
    // in chromium, however, this isn't the case. Instead, the pdf will fire a download event
    await page.goto('/en/letters');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('main').getByRole('listitem').first().getByRole('link').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
  });
});
