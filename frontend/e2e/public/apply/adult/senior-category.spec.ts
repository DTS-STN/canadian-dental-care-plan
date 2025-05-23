import { test } from '@playwright/test';

import { AdultPage } from '../../../pages/public/apply/adult-page';
import { InitialPage } from '../../../pages/public/apply/initial-page';
import { calculateDOB } from '../../../utils/helpers';

test.describe('Senior category', () => {
  test.beforeEach('Navigate to adult application', async ({ page }) => {
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

    await page.getByRole('radio', { name: 'I am applying for myself', exact: true }).check();
    await page.getByRole('button', { name: 'Continue' }).click();
  });

  test('Should complete flow as senior applicant', async ({ page }) => {
    const applyAdultPage = new AdultPage(page);

    await test.step('Should navigate to applicant information page', async () => {
      await applyAdultPage.isLoaded('applicant-information');

      await page.getByRole('textbox', { name: 'First name' }).fill('John');
      await page.getByRole('textbox', { name: 'Last name' }).fill('Smith');
      await page.getByRole('textbox', { name: 'Social Insurance Number (SIN)' }).fill('900000001');

      const { year, month, day } = calculateDOB(70);
      await page.getByRole('combobox', { name: 'Month' }).selectOption(month);
      await page.getByRole('textbox', { name: 'Day (DD)' }).fill(day);
      await page.getByRole('textbox', { name: 'Year (YYYY)' }).fill(year);

      await page.getByRole('button', { name: 'Continue' }).click();
    });

    // TODO This test should navigate to New or existing member page next.
    // The rest of the test should be completed when the rest of the flow is complete/revised.
  });
});
