import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('letters page', () => {
  test('should navigate to letters page', async ({ page }) => {
    await page.goto('/letters');
    await expect(page).toHaveURL('/letters');
  });

  test('it should sort list in ascending order by date', async ({ page }) => {
    await page.goto('/letters');
    await page.locator('select').selectOption('asc');
    await expect(page).toHaveURL('/letters?sort=asc');
  });

  test('it should sort list in descending order by date', async ({ page }) => {
    await page.goto('/letters');
    await page.locator('select').selectOption('desc');
    await expect(page).toHaveURL('/letters?sort=desc');
  });

  test('it should click on a pdf and successfully download', async ({ page }) => {
    // note: the default behaviour in the browser is to open the pdf in the tab
    // in chromium, however, this isn't the case. Instead, the pdf will fire a download event
    await page.goto('/letters');
    const downloadPromise = page.waitForEvent('download');
    await page.locator('a[href$="/download"]').first().click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/.pdf/);
  });

  test('should not have any automatically detectable accessibility issues', async ({ page }) => {
    await page.goto('/letters');
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
