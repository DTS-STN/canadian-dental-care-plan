import { expect, test } from '@playwright/test';

import { PlaywrightApplyAdultChildPage } from '../../../models/PlaywrightApplyAdultChildPage';
import { PlaywrightApplyPage } from '../../../models/PlaywrightApplyPage';
import { calculateDOB } from '../../../utils/helpers';

test.describe('Youth category', () => {
  test.beforeEach('Navigate to adult and child application', async ({ page }) => {
    test.setTimeout(60000);
    const applyPage = new PlaywrightApplyPage(page);
    await applyPage.gotoIndexPage();

    await applyPage.isLoaded('terms-and-conditions');
    await page.getByRole('checkbox', { name: 'I have read the Terms and Conditions' }).check();
    await page.getByRole('checkbox', { name: 'I have read the Privacy Notice Statement' }).check();
    await page.getByRole('checkbox', { name: 'I consent to the sharing of data' }).check();
    await page.getByRole('button', { name: 'Agree and continue' }).click();

    await applyPage.isLoaded('tax-filing');
    await page.getByRole('radio', { name: 'Yes', exact: true }).check();
    await page.getByRole('button', { name: 'Continue' }).click();

    await applyPage.isLoaded('type-application');
    await page.getByRole('button', { name: 'Continue' }).click();

    await page.getByRole('radio', { name: 'I am applying for myself and my child(ren)', exact: true }).check();
    await page.getByRole('button', { name: 'Continue' }).click();
  });

  test('Should navigate to New or existing member page if applicant is 16 or 17, child is not under 18', async ({ page }) => {
    const applyAdultChildPage = new PlaywrightApplyAdultChildPage(page);

    await test.step('Should navigate to applicant information page', async () => {
      const { year, month, day } = calculateDOB(16);
      await applyAdultChildPage.fillApplicantInformationForm({ day: day, month: month, year: year });
      await page.getByRole('button', { name: 'Continue' }).click();
    });

    await test.step('Should navigate to living independently page', async () => {
      await applyAdultChildPage.isLoaded('living-independently');

      await page.getByRole('radio', { name: 'No' }).click();
      await page.getByRole('button', { name: 'Continue' }).click();
    });

    // TODO: Add remaining test cases once workflow is clear.
  });

  test('Should return to CDCP main page if applicant is 16, child is under 18', async ({ page }) => {
    const applyAdultChildPage = new PlaywrightApplyAdultChildPage(page);

    await test.step('Should navigate to date of birth page', async () => {
      const { year, month, day } = calculateDOB(15);
      await applyAdultChildPage.fillApplicantInformationForm({ day: day, month: month, year: year });
      await page.getByRole('button', { name: 'Continue' }).click();
    });

    await test.step('Should navigate to Parent or guardian page', async () => {
      await applyAdultChildPage.isLoaded('parent-or-guardian');
    });

    await test.step('Should return to CDCP main page', async () => {
      await page.getByRole('button', { name: 'Return to main page' }).click();
      await expect(page).toHaveURL('https://www.canada.ca/en/services/benefits/dental/dental-care-plan.html');
    });
  });
});
