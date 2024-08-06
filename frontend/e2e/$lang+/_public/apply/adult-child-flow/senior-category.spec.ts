import { expect, test } from '@playwright/test';

import { PlaywrightApplyAdultChildPage } from '../../../../models/PlaywrightApplyAdultChildPage';
import { PlaywrightApplyAdultPage } from '../../../../models/PlaywrightApplyAdultPage';
import { PlaywrightApplyPage } from '../../../../models/PlaywrightApplyPage';
import { calculateDOB } from '../../../../utils/helpers';

test.describe('Senior category', () => {
  test.beforeEach('Navigate to adult and child application', async ({ page }) => {
    test.setTimeout(60000);
    const applyPage = new PlaywrightApplyPage(page);
    await applyPage.gotoIndexPage();

    await applyPage.isLoaded('terms-and-conditions');
    await page.getByRole('button', { name: 'Agree and continue' }).click();

    await applyPage.isLoaded('type-application');
    await page.getByRole('button', { name: 'Continue' }).click();

    await page.getByRole('radio', { name: 'I am applying for myself and my child(ren)', exact: true }).check();
    await page.getByRole('button', { name: 'Continue' }).click();
  });

  test('Should return to CDCP main page if applicant has not filed taxes', async ({ page }) => {
    const applyAdultChildPage = new PlaywrightApplyAdultChildPage(page);

    await test.step('Should navigate to tax filing page', async () => {
      await applyAdultChildPage.isLoaded('tax-filing');

      await page.getByRole('radio', { name: 'No', exact: true }).check();
      await page.getByRole('button', { name: 'Continue' }).click();
    });

    await test.step('Should navigate to file your tax page', async () => {
      await applyAdultChildPage.isLoaded('file-taxes');
    });

    await test.step('Should return to CDCP main page', async () => {
      await page.getByRole('button', { name: 'Return to main page' }).click();
      await expect(page).toHaveURL('https://www.canada.ca/en/services/benefits/dental/dental-care-plan.html');
    });
  });

  test('Should navigate to adult flow if child is not eligible but applicant wish to apply for themself', async ({ page }) => {
    const applyAdultChildPage = new PlaywrightApplyAdultChildPage(page);

    await test.step('Should navigate to tax filing page', async () => {
      await applyAdultChildPage.isLoaded('tax-filing');

      await page.getByRole('radio', { name: 'Yes', exact: true }).check();
      await page.getByRole('button', { name: 'Continue' }).click();
    });

    await test.step('Should navigate to date of birth page', async () => {
      await applyAdultChildPage.isLoaded('date-of-birth');

      const { year, month, day } = calculateDOB(35);

      await page.getByRole('combobox', { name: 'Month' }).selectOption(month);
      await page.getByRole('textbox', { name: 'Day (DD)' }).fill(day);
      await page.getByRole('textbox', { name: 'Year (YYYY)' }).fill(year);
      await page.getByRole('group', { name: 'Are all the children you are applying for under 18?' }).getByRole('radio', { name: 'No' }).check();

      await page.getByRole('button', { name: 'Continue' }).click();
    });

    await test.step('Should navigate to DTC page', async () => {
      await applyAdultChildPage.isLoaded('disability-tax-credit');

      await page.getByRole('radio', { name: 'Yes' }).check();
      await page.getByRole('button', { name: 'Continue' }).click();
    });

    await test.step('Should navigate to apply self page', async () => {
      await applyAdultChildPage.isLoaded('apply-yourself');
      await page.getByRole('button', { name: 'Proceed to apply for yourself' }).click();
    });

    await test.step('Should navigate to adult flow application', async () => {
      const applyAdultPage = new PlaywrightApplyAdultPage(page);
      await applyAdultPage.isLoaded('applicant-information');
    });
  });
});
