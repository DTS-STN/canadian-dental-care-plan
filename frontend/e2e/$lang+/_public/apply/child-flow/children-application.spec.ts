import { expect, test } from '@playwright/test';

import { PlaywrightApplyChildPage } from '../../../../models/PlaywrightApplyChildPage';
import { PlaywrightApplyPage } from '../../../../models/PlaywrightApplyPage';
import { calculateDOB } from '../../../../utils/helpers';

test.describe('Children application', () => {
  test.beforeEach('Navigate to child application', async ({ page }) => {
    test.setTimeout(60000);
    const applyPage = new PlaywrightApplyPage(page);
    await applyPage.gotoIndexPage();

    await applyPage.isLoaded('terms-and-conditions');
    await page.getByRole('button', { name: 'Agree and continue' }).click();

    await applyPage.isLoaded('type-application');
    await page.getByRole('radio', { name: 'I am applying for my child(ren)', exact: true }).check();
    await page.getByRole('button', { name: 'Continue' }).click();
  });

  test('Should return to CDCP main page if applicant has not filed taxes', async ({ page }) => {
    const applyChildPage = new PlaywrightApplyChildPage(page);

    await test.step('Should navigate to tax filing page', async () => {
      await applyChildPage.fillTaxFilingForm('No');
      await page.getByRole('button', { name: 'Continue' }).click();
    });

    await test.step('Should navigate to file your tax page', async () => {
      await applyChildPage.isLoaded('file-taxes');
    });

    await test.step('Should return to CDCP main page', async () => {
      await page.getByRole('button', { name: 'Return to main page' }).click();
      await expect(page).toHaveURL('https://www.canada.ca/en/services/benefits/dental/dental-care-plan.html');
    });
  });

  test('Should return to CDCP main page if child is over 18', async ({ page }) => {
    const applyChildPage = new PlaywrightApplyChildPage(page);

    await test.step('Should navigate to tax filing page', async () => {
      await applyChildPage.fillTaxFilingForm('Yes');
      await page.getByRole('button', { name: 'Continue' }).click();
    });

    await test.step('Should navigate to children application page', async () => {
      await applyChildPage.isLoaded('children');
      await page.getByRole('button', { name: 'Add a child' }).click();
    });

    await test.step('Should navigate to child information page', async () => {
      await applyChildPage.isLoaded('children-information');

      await page.getByRole('textbox', { name: 'First name' }).fill('Josh');
      await page.getByRole('textbox', { name: 'Last name' }).fill('Smith');

      const { year, month, day } = calculateDOB(25);

      await page.getByRole('combobox', { name: 'Month' }).selectOption(month);
      await page.getByRole('textbox', { name: 'Day (DD)' }).fill(day);
      await page.getByRole('textbox', { name: 'Year (YYYY)' }).fill(year);

      await page.getByRole('group', { name: 'Does this child have a Social Insurance Number (SIN)?' }).getByRole('radio', { name: 'Yes, this child has a SIN' }).check();
      await page.getByRole('textbox', { name: 'Enter the 9-digit SIN' }).fill('700000003');

      await page.getByRole('group', { name: 'Are you the parent or legal guardian of this child?' }).getByRole('radio', { name: 'Yes' }).check();
      await page.getByRole('button', { name: 'Continue' }).click();
    });

    await test.step('Should navigate to child cannot apply page', async () => {
      await applyChildPage.isLoaded('children-cannot-apply-child');
    });

    await test.step('Should return to CDCP main page', async () => {
      await page.getByRole('button', { name: 'Return to main page' }).click();
      await expect(page).toHaveURL('https://www.canada.ca/en/services/benefits/dental/dental-care-plan.html');
    });
  });

  test('Should return to CDCP main page if applicant is not legal guardian', async ({ page }) => {
    const applyChildPage = new PlaywrightApplyChildPage(page);

    await test.step('Should navigate to tax filing page', async () => {
      await applyChildPage.fillTaxFilingForm('Yes');
      await page.getByRole('button', { name: 'Continue' }).click();
    });

    await test.step('Should navigate to children application page', async () => {
      await applyChildPage.isLoaded('children');
      await page.getByRole('button', { name: 'Add a child' }).click();
    });

    await test.step('Should navigate to child information page', async () => {
      await applyChildPage.isLoaded('children-information');

      await page.getByRole('textbox', { name: 'First name' }).fill('Josh');
      await page.getByRole('textbox', { name: 'Last name' }).fill('Smith');

      const { year, month, day } = calculateDOB(12);

      await page.getByRole('combobox', { name: 'Month' }).selectOption(month);
      await page.getByRole('textbox', { name: 'Day (DD)' }).fill(day);
      await page.getByRole('textbox', { name: 'Year (YYYY)' }).fill(year);

      await page.getByRole('group', { name: 'Does this child have a Social Insurance Number (SIN)?' }).getByRole('radio', { name: 'Yes, this child has a SIN' }).check();
      await page.getByRole('textbox', { name: 'Enter the 9-digit SIN' }).fill('700000003');

      await page.getByRole('group', { name: 'Are you the parent or legal guardian of this child?' }).getByRole('radio', { name: 'No' }).check();
      await page.getByRole('button', { name: 'Continue' }).click();
    });

    await test.step('Should navigate to parent or guardian page', async () => {
      await applyChildPage.isLoaded('parent-or-guardian');
    });

    await test.step('Should return to CDCP main page', async () => {
      await page.getByRole('button', { name: 'Return to main page' }).click();
      await expect(page).toHaveURL('https://www.canada.ca/en/services/benefits/dental/dental-care-plan.html');
    });
  });

  test('Should complete application for children', async ({ page }) => {
    const applyChildPage = new PlaywrightApplyChildPage(page);

    await test.step('Should navigate to tax filing page', async () => {
      await applyChildPage.fillTaxFilingForm('Yes');
      await page.getByRole('button', { name: 'Continue' }).click();
    });

    await test.step('Should navigate to children application page', async () => {
      await applyChildPage.isLoaded('children');
      await page.getByRole('button', { name: 'Add a child' }).click();
    });

    await test.step('Should navigate to child information page', async () => {
      await applyChildPage.isLoaded('children-information');

      await page.getByRole('textbox', { name: 'First name' }).fill('Josh');
      await page.getByRole('textbox', { name: 'Last name' }).fill('Smith');

      const { year, month, day } = calculateDOB(12);

      await page.getByRole('combobox', { name: 'Month' }).selectOption(month);
      await page.getByRole('textbox', { name: 'Day (DD)' }).fill(day);
      await page.getByRole('textbox', { name: 'Year (YYYY)' }).fill(year);

      await page.getByRole('group', { name: 'Does this child have a Social Insurance Number (SIN)?' }).getByRole('radio', { name: 'Yes, this child has a SIN' }).check();
      await page.getByRole('textbox', { name: 'Enter the 9-digit SIN' }).fill('700000003');

      await page.getByRole('group', { name: 'Are you the parent or legal guardian of this child?' }).getByRole('radio', { name: 'Yes' }).check();
      await page.getByRole('button', { name: 'Continue' }).click();
    });

    await test.step('Should navigate to children dental insurance page', async () => {
      await applyChildPage.isLoaded('children-dental-insurance');

      await page.getByRole('radio', { name: 'Yes, this child has access to dental insurance or coverage', exact: true }).check();
      await page.getByRole('button', { name: 'Continue' }).click();
    });

    await test.step('Should navigate to children other dental benefits page', async () => {
      await applyChildPage.isLoaded('children-federal-provincial-territorial-benefits');

      await page.getByRole('group', { name: 'Federal benefits' }).getByRole('radio', { name: 'Yes, this child has federal dental benefits' }).check();
      await page.getByRole('group', { name: 'Provincial or territorial benefits' }).getByRole('radio', { name: 'Yes, this child has provincial or territorial dental benefits' }).check();

      await page.getByRole('group', { name: 'Federal benefits' }).getByRole('radio', { name: 'Correctional Service Canada Health Services' }).check();
      await page.getByRole('group', { name: 'Provincial or territorial benefits' }).getByRole('combobox', { name: 'If yes, through which province or territory?' }).selectOption('Alberta');

      await page.getByRole('group', { name: 'Provincial or territorial benefits' }).getByRole('radio', { name: 'Alberta Adult Health Benefits' }).check();
      await page.getByRole('button', { name: 'Continue' }).click();
    });

    await test.step('Should navigate to children page', async () => {
      await applyChildPage.isLoaded('children');
      await page.getByRole('button', { name: 'Continue with application' }).click();
    });

    await test.step('Should navigate parent/legal-guardian information page', async () => {
      await applyChildPage.fillApplicantInformationForm();
      await page.getByRole('button', { name: 'Continue' }).click();
    });

    await test.step('Should navigate to parent/legal-guardian contact information page', async () => {
      await applyChildPage.fillContactInformationForm();
      await page.getByRole('button', { name: 'Continue' }).click();
    });

    await test.step('Should navigate to communication preference page', async () => {
      await applyChildPage.fillCommunicationForm();
      await page.getByRole('button', { name: 'Continue' }).click();
    });

    await test.step('Should navigate to review child information page', async () => {
      await applyChildPage.isLoaded('review-child-information');
      await page.getByRole('button', { name: 'Continue' }).click();
    });

    await test.step('Should navigate to review adult information page', async () => {
      await applyChildPage.isLoaded('review-adult-information');
      await page.getByRole('button', { name: 'Submit Application' }).click();
    });

    await test.step('Should successfully submit application and navigate to confirmation page, async', async () => {
      await applyChildPage.isLoaded('confirmation');
    });
  });
});
