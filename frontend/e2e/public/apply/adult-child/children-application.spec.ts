import { test } from '@playwright/test';

import { AdultChildPage } from '../../../pages/public/apply/adult-child-page';
import { InitialPage } from '../../../pages/public/apply/initial-page';
import { calculateDOB } from '../../../utils/helpers';

test.describe('Children application', () => {
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

  test('Child is not eligible, applicant want tp apply for themself', async ({ page }) => {
    const applyAdultChildPage = new AdultChildPage(page);

    await test.step('Should navigate to applicant information page', async () => {
      const { year, month, day } = calculateDOB(70);
      await applyAdultChildPage.fillApplicantInformationForm({ day: day, month: month, year: year, dtcEligible: true });
      await page.getByRole('button', { name: 'Continue' }).click();
    });
    // TODO: Add the rest of the children flow tests.
  });

  test('applicant is not eligible to apply for children, but want to apply for themself', async ({ page }) => {
    const applyAdultChildPage = new AdultChildPage(page);

    await test.step('Should navigate to applicant information page', async () => {
      const { year, month, day } = calculateDOB(70);
      await applyAdultChildPage.fillApplicantInformationForm({ day: day, month: month, year: year, dtcEligible: true });
      await page.getByRole('button', { name: 'Continue' }).click();
    });
    // TODO: Add the rest of the children flow tests.
  });

  test('Should complete application if applicant is senior and child is under 18', async ({ page }) => {
    const applyAdultChildPage = new AdultChildPage(page);

    await test.step('Should navigate to applicant information page', async () => {
      const { year, month, day } = calculateDOB(70);
      await applyAdultChildPage.fillApplicantInformationForm({ day: day, month: month, year: year, dtcEligible: true });
      await page.getByRole('button', { name: 'Continue' }).click();
    });
    // TODO: Add the rest of the children flow tests.
  });
});
