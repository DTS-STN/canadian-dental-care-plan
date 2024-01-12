import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('homepage', () => {

  test('should navigate to index', async ({ page }) => {
    await page.goto('/');
  
    const screenId = await page.locator('span[property="identifier"]').textContent();
    expect(screenId).toBe('CDCP-0001');
  });

  test('should not have any automatically detectable accessibility issues', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
