import { test } from '@playwright/test';

import { PlaywrightApplyAdultChildPage } from '../../../models/PlaywrightApplyAdultChildPage';
import { PlaywrightApplyAdultPage } from '../../../models/PlaywrightApplyAdultPage';
import { PlaywrightApplyPage } from '../../../models/PlaywrightApplyPage';
import { calculateDOB } from '../../../utils/helpers';

test.describe('Children application', () => {
  test.beforeEach('Navigate to adult and child application', async ({ page }) => {
    test.setTimeout(60000);
    const applyPage = new PlaywrightApplyPage(page);
    await applyPage.gotoIndexPage();

    await applyPage.isLoaded('terms-and-conditions');
    await page.getByRole('button', { name: 'Agree and continue' }).click();

    await applyPage.isLoaded('tax-filing');
    await page.getByRole('radio', { name: 'Yes', exact: true }).check();
    await page.getByRole('button', { name: 'Continue' }).click();

    await applyPage.isLoaded('type-application');
    await page.getByRole('button', { name: 'Continue' }).click();

    await page.getByRole('radio', { name: 'I am applying for myself and my child(ren)', exact: true }).check();
    await page.getByRole('button', { name: 'Continue' }).click();
  });

  test('Child is not eligible, applicant want tp apply for themself', async ({ page }) => {
    const applyAdultChildPage = new PlaywrightApplyAdultChildPage(page);

    await test.step('Should navigate to date of birth page', async () => {
      const { year, month, day } = calculateDOB(70);
      await applyAdultChildPage.fillDateOfBirthForm({ allChildrenUnder18: 'Yes', day: day, month: month, year: year });
      await page.getByRole('button', { name: 'Continue' }).click();
    });

    await test.step('Should navigate to applicant information page', async () => {
      await applyAdultChildPage.fillApplicantInformationForm();
      await page.getByRole('button', { name: 'Continue' }).click();
    });

    await test.step('Should navigate to partner information page', async () => {
      await applyAdultChildPage.fillPartnerInformationForm();
      await page.getByRole('button', { name: 'Continue' }).click();
    });

    await test.step('Should navigate to contact information', async () => {
      await applyAdultChildPage.fillContactInformationForm();
      await page.getByRole('button', { name: 'Continue' }).click();
    });

    await test.step('Should naviagte to communication page', async () => {
      await applyAdultChildPage.fillCommunicationForm();
      await page.getByRole('button', { name: 'Continue' }).click();
    });

    await test.step('Should navigate to dental insurance page', async () => {
      await applyAdultChildPage.fillDentalInsuranceForm();
      await page.getByRole('button', { name: 'Continue' }).click();
    });

    await test.step('Should navigate to other dental benefits page', async () => {
      await applyAdultChildPage.fillOtherDentalBenefitsForm();
      await page.getByRole('button', { name: 'Continue' }).click();
    });

    await test.step('Should navigate to children application page', async () => {
      await applyAdultChildPage.isLoaded('children');
      await page.getByRole('button', { name: 'Add a child' }).click();
    });

    await test.step('Should navigate to child information page', async () => {
      await applyAdultChildPage.isLoaded('children-information');

      await page.getByRole('textbox', { name: 'First name' }).fill('Josh');
      await page.getByRole('textbox', { name: 'Last name' }).fill('Smith');

      const { year, month, day } = calculateDOB(20);

      await page.getByRole('combobox', { name: 'Month' }).selectOption(month);
      await page.getByRole('textbox', { name: 'Day (DD)' }).fill(day);
      await page.getByRole('textbox', { name: 'Year (YYYY)' }).fill(year);

      await page.getByRole('group', { name: 'Does this child have a Social Insurance Number (SIN)?' }).getByRole('radio', { name: 'Yes, this child has a SIN' }).check();
      await page.getByRole('textbox', { name: 'Enter the 9-digit SIN' }).fill('700000003');

      await page.getByRole('group', { name: 'Are you the parent or legal guardian of this child?' }).getByRole('radio', { name: 'Yes' }).check();
      await page.getByRole('button', { name: 'Continue' }).click();
    });

    await test.step('Should navigate to cannot apply child page', async () => {
      await applyAdultChildPage.isLoaded('children-cannot-apply-child');
      await page.getByRole('button', { name: 'Proceed to apply for yourself' }).click();
    });

    await test.step('Should navigate to adult flow review-information page', async () => {
      const applyAdultPage = new PlaywrightApplyAdultPage(page);
      await applyAdultPage.isLoaded('review-information');
    });
  });

  test('applicant is not eligible to apply for children, but want to apply for themself', async ({ page }) => {
    const applyAdultChildPage = new PlaywrightApplyAdultChildPage(page);

    await test.step('Should navigate to date of birth page', async () => {
      const { year, month, day } = calculateDOB(70);
      await applyAdultChildPage.fillDateOfBirthForm({ allChildrenUnder18: 'Yes', day: day, month: month, year: year });
      await page.getByRole('button', { name: 'Continue' }).click();
    });

    await test.step('Should navigate to applicant information page', async () => {
      await applyAdultChildPage.fillApplicantInformationForm();
      await page.getByRole('button', { name: 'Continue' }).click();
    });

    await test.step('Should navigate to partner information page', async () => {
      await applyAdultChildPage.fillPartnerInformationForm();
      await page.getByRole('button', { name: 'Continue' }).click();
    });

    await test.step('Should navigate to contact information', async () => {
      await applyAdultChildPage.fillContactInformationForm();
      await page.getByRole('button', { name: 'Continue' }).click();
    });

    await test.step('Should naviagte to communication page', async () => {
      await applyAdultChildPage.fillCommunicationForm();
      await page.getByRole('button', { name: 'Continue' }).click();
    });

    await test.step('Should navigate to dental insurance page', async () => {
      await applyAdultChildPage.fillDentalInsuranceForm();
      await page.getByRole('button', { name: 'Continue' }).click();
    });

    await test.step('Should navigate to other dental benefits page', async () => {
      await applyAdultChildPage.fillOtherDentalBenefitsForm();
      await page.getByRole('button', { name: 'Continue' }).click();
    });

    await test.step('Should navigate to children application page', async () => {
      await applyAdultChildPage.isLoaded('children');
      await page.getByRole('button', { name: 'Add a child' }).click();
    });

    await test.step('Should navigate to child information page', async () => {
      await applyAdultChildPage.isLoaded('children-information');

      await page.getByRole('textbox', { name: 'First name' }).fill('Josh');
      await page.getByRole('textbox', { name: 'Last name' }).fill('Smith');

      const { year, month, day } = calculateDOB(15);

      await page.getByRole('combobox', { name: 'Month' }).selectOption(month);
      await page.getByRole('textbox', { name: 'Day (DD)' }).fill(day);
      await page.getByRole('textbox', { name: 'Year (YYYY)' }).fill(year);

      await page.getByRole('group', { name: 'Does this child have a Social Insurance Number (SIN)?' }).getByRole('radio', { name: 'Yes, this child has a SIN' }).check();
      await page.getByRole('textbox', { name: 'Enter the 9-digit SIN' }).fill('700000003');

      await page.getByRole('group', { name: 'Are you the parent or legal guardian of this child?' }).getByRole('radio', { name: 'No' }).check();
      await page.getByRole('button', { name: 'Continue' }).click();
    });

    await test.step('Should navigate to parent or guardian page', async () => {
      await applyAdultChildPage.isLoaded('children-parent-or-guardian');
      await page.getByRole('button', { name: 'Proceed to apply for yourself' }).click();
    });

    await test.step('Should navigate to adult flow review-information page', async () => {
      const applyAdultPage = new PlaywrightApplyAdultPage(page);
      await applyAdultPage.isLoaded('review-information');
    });
  });

  test('Should complete application if applicant is senior and child is under 18', async ({ page }) => {
    const applyAdultChildPage = new PlaywrightApplyAdultChildPage(page);

    await test.step('Should navigate to date of birth page', async () => {
      const { year, month, day } = calculateDOB(70);
      await applyAdultChildPage.fillDateOfBirthForm({ allChildrenUnder18: 'Yes', day: day, month: month, year: year });
      await page.getByRole('button', { name: 'Continue' }).click();
    });

    await test.step('Should navigate to applicant information page', async () => {
      await applyAdultChildPage.fillApplicantInformationForm();
      await page.getByRole('button', { name: 'Continue' }).click();
    });

    await test.step('Should navigate to partner information page', async () => {
      await applyAdultChildPage.fillPartnerInformationForm();
      await page.getByRole('button', { name: 'Continue' }).click();
    });

    await test.step('Should navigate to contact information', async () => {
      await applyAdultChildPage.fillContactInformationForm();
      await page.getByRole('button', { name: 'Continue' }).click();
    });

    await test.step('Should naviagte to communication page', async () => {
      await applyAdultChildPage.fillCommunicationForm();
      await page.getByRole('button', { name: 'Continue' }).click();
    });

    await test.step('Should navigate to dental insurance page', async () => {
      await applyAdultChildPage.fillDentalInsuranceForm();
      await page.getByRole('button', { name: 'Continue' }).click();
    });

    await test.step('Should navigate to other dental benefits page', async () => {
      await applyAdultChildPage.fillOtherDentalBenefitsForm();
      await page.getByRole('button', { name: 'Continue' }).click();
    });

    await test.step('Should navigate to children application page', async () => {
      await applyAdultChildPage.isLoaded('children');
      await page.getByRole('button', { name: 'Add a child' }).click();
    });

    await test.step('Should navigate to child information page', async () => {
      await applyAdultChildPage.isLoaded('children-information');

      await page.getByRole('textbox', { name: 'First name' }).fill('Josh');
      await page.getByRole('textbox', { name: 'Last name' }).fill('Smith');

      const { year, month, day } = calculateDOB(15);

      await page.getByRole('combobox', { name: 'Month' }).selectOption(month);
      await page.getByRole('textbox', { name: 'Day (DD)' }).fill(day);
      await page.getByRole('textbox', { name: 'Year (YYYY)' }).fill(year);

      await page.getByRole('group', { name: 'Does this child have a Social Insurance Number (SIN)?' }).getByRole('radio', { name: 'Yes, this child has a SIN' }).check();
      await page.getByRole('textbox', { name: 'Enter the 9-digit SIN' }).fill('700000003');

      await page.getByRole('group', { name: 'Are you the parent or legal guardian of this child?' }).getByRole('radio', { name: 'Yes' }).check();
      await page.getByRole('button', { name: 'Continue' }).click();
    });

    await test.step('Should navigate to children dental insurance page', async () => {
      await applyAdultChildPage.isLoaded('children-dental-insurance');

      await page.getByRole('radio', { name: 'Yes, this child has access to dental insurance or coverage', exact: true }).check();
      await page.getByRole('button', { name: 'Continue' }).click();
    });

    await test.step('Should navigate to children other dental benefits page', async () => {
      await applyAdultChildPage.isLoaded('children-federal-provincial-territorial-benefits');

      await page.getByRole('group', { name: 'Federal benefits' }).getByRole('radio', { name: 'Yes, this child has federal dental benefits' }).check();
      await page.getByRole('group', { name: 'Provincial or territorial benefits' }).getByRole('radio', { name: 'Yes, this child has provincial or territorial dental benefits' }).check();

      await page.getByRole('group', { name: 'Federal benefits' }).getByRole('radio', { name: 'Correctional Service Canada Health Services' }).check();
      await page.getByRole('group', { name: 'Provincial or territorial benefits' }).getByRole('combobox', { name: 'If yes, through which province or territory?' }).selectOption('Alberta');

      await page.getByRole('group', { name: 'Provincial or territorial benefits' }).getByRole('radio', { name: 'Alberta Adult Health Benefits' }).check();
      await page.getByRole('button', { name: 'Continue' }).click();
    });

    await test.step('Should navigate to children page', async () => {
      await applyAdultChildPage.isLoaded('children');
      await page.getByRole('button', { name: 'Continue with application' }).click();
    });

    await test.step('Should navigate to review adult information page', async () => {
      await applyAdultChildPage.isLoaded('review-adult-information');
      await page.getByRole('button', { name: 'Continue' }).click();
    });

    await test.step('Should navigate to review children information page', async () => {
      await applyAdultChildPage.isLoaded('review-child-information');
      await page.getByRole('button', { name: 'Submit Application' }).click();
    });

    await test.step('Should successfully submit application and navigate to confirmation page, async', async () => {
      await applyAdultChildPage.isLoaded('confirmation');
    });
  });
});
