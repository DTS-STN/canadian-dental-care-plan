import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

import { PlaywrightApplyAdultChildPage } from '../../../../models/PlaywrightApplyAdultChildPage';
import { PlaywrightApplyAdultPage } from '../../../../models/PlaywrightApplyAdultPage';
import { PlaywrightApplyPage } from '../../../../models/PlaywrightApplyPage';
import { calculateDOB, fillOutAddress } from '../../../../utils/helpers';

// Reusable functions for filling out adult application
async function taxFiling(page: Page, applyAdultChildPage: PlaywrightApplyAdultChildPage) {
  await applyAdultChildPage.isLoaded('tax-filing');

  await page.getByRole('radio', { name: 'Yes', exact: true }).check();
  await page.getByRole('button', { name: 'Continue' }).click();
}

async function dateOfBirth(page: Page, applyAdultChildPage: PlaywrightApplyAdultChildPage) {
  await applyAdultChildPage.isLoaded('date-of-birth');

  const { year, month, day } = calculateDOB(70);

  await page.getByRole('combobox', { name: 'Month' }).selectOption(month);
  await page.getByRole('textbox', { name: 'Day (DD)' }).fill(day);
  await page.getByRole('textbox', { name: 'Year (YYYY)' }).fill(year);
  await page.getByRole('group', { name: 'Are all the children you are applying for under 18?' }).getByRole('radio', { name: 'Yes' }).check();

  await page.getByRole('button', { name: 'Continue' }).click();
}

async function applicantInformation(page: Page, applyAdultChildPage: PlaywrightApplyAdultChildPage) {
  await applyAdultChildPage.isLoaded('applicant-information');

  await page.getByRole('textbox', { name: 'First name' }).fill('John');
  await page.getByRole('textbox', { name: 'Last name' }).fill('Smith');
  await page.getByRole('textbox', { name: 'Social Insurance Number (SIN)' }).fill('900000001');
  await page.getByRole('radio', { name: 'Married' }).check();

  await page.getByRole('button', { name: 'Continue' }).click();
}

async function partnerInformation(page: Page, applyAdultChildPage: PlaywrightApplyAdultChildPage) {
  await applyAdultChildPage.isLoaded('partner-information');

  await page.getByRole('textbox', { name: 'First name' }).fill('Mary');
  await page.getByRole('textbox', { name: 'Last name' }).fill('Smith');

  await page.getByRole('combobox', { name: 'Month' }).selectOption('01');
  await page.getByRole('textbox', { name: 'Day (DD)' }).fill('01');
  await page.getByRole('textbox', { name: 'Year (YYYY)' }).fill('1960');

  //check if sin is unique
  await page.getByRole('textbox', { name: 'Social Insurance Number (SIN)' }).fill('900000001');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('link', { name: 'he Social Insurance Number (SIN) must be unique' })).toBeVisible();

  await page.getByRole('textbox', { name: 'Social Insurance Number (SIN)' }).fill('800000002');
  await page.getByRole('checkbox', { name: 'I confirm that my spouse or common-law partner is aware and has agreed to share their personal information.' }).check();
  await page.getByRole('button', { name: 'Continue' }).click();
}

async function contactInformation(page: Page, applyAdultChildPage: PlaywrightApplyAdultChildPage) {
  await applyAdultChildPage.isLoaded('contact-information');

  //invalid phone number
  await page.getByRole('group', { name: 'Phone number' }).getByRole('textbox', { name: 'Phone number (optional)', exact: true }).fill('111');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('link', { name: "Phone number does not exist. If it's an international phone number, add '+' in front" })).toBeVisible();

  await page.getByRole('group', { name: 'Phone number' }).getByRole('textbox', { name: 'Phone number (optional)', exact: true }).fill('2345678901');
  await page.getByRole('group', { name: 'Phone number' }).getByRole('textbox', { name: 'Alternate phone number (optional)', exact: true }).fill('2345678902');

  //invalid email
  await page.getByRole('group', { name: 'Email' }).getByRole('textbox', { name: 'Email address (optional)', exact: true }).fill('123mail');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('link', { name: 'Enter an email address in the correct format, such as name@example.com' })).toBeVisible();

  //email does not match
  await page.getByRole('group', { name: 'Email' }).getByRole('textbox', { name: 'Email address (optional)', exact: true }).fill('123@mail.com');
  await page.getByRole('group', { name: 'Email' }).getByRole('textbox', { name: 'Confirm email address (optional)', exact: true }).fill('124@mail.com');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('link', { name: 'The email addresses entered do not match' })).toBeVisible();

  await page.getByRole('group', { name: 'Email' }).getByRole('textbox', { name: 'Confirm email address (optional)', exact: true }).fill('123@mail.com');

  //fillout mailing address
  await fillOutAddress({ page, group: 'Mailing address', address: '123 street', unit: '404', country: 'Canada', province: 'Ontario', city: 'Ottawa', postalCode: 'N3B1E6' });

  //fillout home address
  await fillOutAddress({ page, group: 'Home address', address: '555 street', unit: '', country: 'Canada', province: 'Quebec', city: 'Montreal', postalCode: 'J3T2K3' });

  await page.getByRole('button', { name: 'Continue' }).click();
}

async function communication(page: Page, applyAdultChildPage: PlaywrightApplyAdultChildPage) {
  await applyAdultChildPage.isLoaded('communication-preference');

  await page.getByRole('group', { name: 'What is your preferred official language of communication?' }).getByRole('radio', { name: 'English' }).check();
  await page.getByRole('group', { name: 'What is your preferred method of communication for Sun Life?' }).getByRole('radio', { name: 'Email' }).check();
  await page.getByRole('button', { name: 'Continue' }).click();
}

async function dentalInsurance(page: Page, applyAdultChildPage: PlaywrightApplyAdultChildPage) {
  await applyAdultChildPage.isLoaded('dental-insurance');

  await page.getByRole('radio', { name: 'Yes, I have access to dental insurance or coverage', exact: true }).check();
  await page.getByRole('button', { name: 'Continue' }).click();
}

async function otherDentalBenefits(page: Page, applyAdultChildPage: PlaywrightApplyAdultChildPage) {
  await applyAdultChildPage.isLoaded('federal-provincial-territorial-benefits');

  await page.getByRole('group', { name: 'Federal benefits' }).getByRole('radio', { name: 'Yes, I have federal dental benefits' }).check();
  await page.getByRole('group', { name: 'Provincial or territorial benefits' }).getByRole('radio', { name: 'Yes, I have provincial or territorial dental benefits' }).check();

  await page.getByRole('group', { name: 'Federal benefits' }).getByRole('radio', { name: 'Correctional Service Canada Health Services' }).check();
  await page.getByRole('group', { name: 'Provincial or territorial benefits' }).getByRole('combobox', { name: 'If yes, through which province or territory?' }).selectOption('Alberta');

  await page.getByRole('group', { name: 'Provincial or territorial benefits' }).getByRole('radio', { name: 'Alberta Adult Health Benefits' }).check();
  await page.getByRole('button', { name: 'Continue' }).click();
}

test.describe('Children application', () => {
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

  test('Child is not eligible, applicant want tp apply for themself', async ({ page }) => {
    const applyAdultChildPage = new PlaywrightApplyAdultChildPage(page);

    await test.step('Should navigate to tax filing page', async () => {
      await taxFiling(page, applyAdultChildPage);
    });

    await test.step('Should navigate to date of birth page', async () => {
      await dateOfBirth(page, applyAdultChildPage);
    });

    await test.step('Should navigate to applicant information page', async () => {
      await applicantInformation(page, applyAdultChildPage);
    });

    await test.step('Should navigate to partner information page', async () => {
      await partnerInformation(page, applyAdultChildPage);
    });

    await test.step('Should navigate to contact information', async () => {
      await contactInformation(page, applyAdultChildPage);
    });

    await test.step('Should naviagte to communication page', async () => {
      await communication(page, applyAdultChildPage);
    });

    await test.step('Should navigate to dental insurance page', async () => {
      await dentalInsurance(page, applyAdultChildPage);
    });

    await test.step('Should navigate to other dental benefits page', async () => {
      await otherDentalBenefits(page, applyAdultChildPage);
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

    await test.step('Should navigate to tax filing page', async () => {
      await taxFiling(page, applyAdultChildPage);
    });

    await test.step('Should navigate to date of birth page', async () => {
      await dateOfBirth(page, applyAdultChildPage);
    });

    await test.step('Should navigate to applicant information page', async () => {
      await applicantInformation(page, applyAdultChildPage);
    });

    await test.step('Should navigate to partner information page', async () => {
      await partnerInformation(page, applyAdultChildPage);
    });

    await test.step('Should navigate to contact information', async () => {
      await contactInformation(page, applyAdultChildPage);
    });

    await test.step('Should naviagte to communication page', async () => {
      await communication(page, applyAdultChildPage);
    });

    await test.step('Should navigate to dental insurance page', async () => {
      await dentalInsurance(page, applyAdultChildPage);
    });

    await test.step('Should navigate to other dental benefits page', async () => {
      await otherDentalBenefits(page, applyAdultChildPage);
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

    await test.step('Should navigate to tax filing page', async () => {
      await taxFiling(page, applyAdultChildPage);
    });

    await test.step('Should navigate to date of birth page', async () => {
      await dateOfBirth(page, applyAdultChildPage);
    });

    await test.step('Should navigate to applicant information page', async () => {
      await applicantInformation(page, applyAdultChildPage);
    });

    await test.step('Should navigate to partner information page', async () => {
      await partnerInformation(page, applyAdultChildPage);
    });

    await test.step('Should navigate to contact information', async () => {
      await contactInformation(page, applyAdultChildPage);
    });

    await test.step('Should naviagte to communication page', async () => {
      await communication(page, applyAdultChildPage);
    });

    await test.step('Should navigate to dental insurance page', async () => {
      await dentalInsurance(page, applyAdultChildPage);
    });

    await test.step('Should navigate to other dental benefits page', async () => {
      await otherDentalBenefits(page, applyAdultChildPage);
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
