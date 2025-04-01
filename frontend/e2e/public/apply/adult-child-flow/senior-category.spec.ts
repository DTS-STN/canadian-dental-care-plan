import { test } from '@playwright/test';

import { PlaywrightApplyAdultChildPage } from '../../../models/PlaywrightApplyAdultChildPage';
import { PlaywrightApplyPage } from '../../../models/PlaywrightApplyPage';
import { calculateDOB } from '../../../utils/helpers';

test.describe('Senior category', () => {
  test.beforeEach('Navigate to adult and child application', async ({ page }) => {
    test.setTimeout(60000);
    const applyPage = new PlaywrightApplyPage(page);
    await applyPage.gotoIndexPage();

    await applyPage.isLoaded('terms-and-conditions');
    await page.getByRole('checkbox', { name: 'I have read the Terms and Conditions' }).check();
    await page.getByRole('checkbox', { name: 'I have read the Privacy Notice Statement' }).check();
    await page.getByRole('checkbox', { name: 'I consent to the sharing of data' }).check();
    await page.getByRole('button', { name: 'Continue' }).click();

    await applyPage.isLoaded('tax-filing');
    await page.getByRole('radio', { name: 'Yes', exact: true }).check();
    await page.getByRole('button', { name: 'Continue' }).click();

    await applyPage.isLoaded('type-application');
    await page.getByRole('button', { name: 'Continue' }).click();

    await page.getByRole('radio', { name: 'I am applying for myself and my child(ren)', exact: true }).check();
    await page.getByRole('button', { name: 'Continue' }).click();
  });

  test('Should navigate to adult flow if child is not eligible but applicant wish to apply for themself', async ({ page }) => {
    const applyAdultChildPage = new PlaywrightApplyAdultChildPage(page);

    await test.step('Should navigate to applicant information page', async () => {
      const { year, month, day } = calculateDOB(70);
      await applyAdultChildPage.fillApplicantInformationForm({ day: day, month: month, year: year });
      await page.getByRole('button', { name: 'Continue' }).click();
    });

    // TODO: tests to add when the apply-adult-child flow is complete.
  });
});
