import { test } from '@playwright/test';

import { AdultChildPage } from '../../../pages/public/apply/adult-child-page';
import { InitialPage } from '../../../pages/public/apply/initial-page';
import { calculateDOB } from '../../../utils/helpers';

test.describe('Adult category', () => {
  test.beforeEach('Navigate to adult and child application', async ({ page }) => {
    test.setTimeout(60_000);
    const applyPage = new InitialPage(page);
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

  test('Should return to CDCP main page if applicant and child are not eligible', async ({ page }) => {
    const applyAdultChildPage = new AdultChildPage(page);

    await test.step('Should navigate to applicant information page', async () => {
      const { year, month, day } = calculateDOB(35);
      await applyAdultChildPage.fillApplicantInformationForm({ day: day, month: month, year: year, dtcEligible: true });
      await page.getByRole('button', { name: 'Continue' }).click();
    });

    // TODO: Add remaining tests when pages are added/reworked.
  });

  test('Should navigate to child flow if applicant is not eligible but wish to apply for children', async ({ page }) => {
    const applyAdultChildPage = new AdultChildPage(page);

    await test.step('Should navigate to applicant information page', async () => {
      const { year, month, day } = calculateDOB(35);
      await applyAdultChildPage.fillApplicantInformationForm({ day: day, month: month, year: year, dtcEligible: true });
      await page.getByRole('button', { name: 'Continue' }).click();
    });

    // TODO: Add remaining tests when pages are added/reworked.
  });

  test('Should navigate to adult flow if child is not eligible but applicant wish to apply for themself', async ({ page }) => {
    const applyAdultChildPage = new AdultChildPage(page);

    await test.step('Should navigate to applicant information page', async () => {
      const { year, month, day } = calculateDOB(35);
      await applyAdultChildPage.fillApplicantInformationForm({ day: day, month: month, year: year, dtcEligible: true });
      await page.getByRole('button', { name: 'Continue' }).click();
    });

    // TODO: Add remaining tests when pages are added/reworked.
  });
});
