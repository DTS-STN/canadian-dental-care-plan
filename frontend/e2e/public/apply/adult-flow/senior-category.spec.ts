import { expect, test } from '@playwright/test';

import { PlaywrightApplyAdultPage } from '../../../models/PlaywrightApplyAdultPage';
import { PlaywrightApplyPage } from '../../../models/PlaywrightApplyPage';
import { calculateDOB, fillOutAddress } from '../../../utils/helpers';

test.describe('Senior category', () => {
  test.beforeEach('Navigate to adult application', async ({ page }) => {
    test.setTimeout(60000);
    const applyPage = new PlaywrightApplyPage(page);
    await applyPage.gotoIndexPage();

    await applyPage.isLoaded('terms-and-conditions');
    await page.getByRole('checkbox', {name: "I acknowledge that I've read the Terms and Conditions"}).check();
    await page.getByRole('checkbox', {name: "I acknowledge that I have read the Privacy Notice Statement"}).check();
    await page.getByRole('checkbox', {name: "I consent to the sharing of data"}).check();
    await page.getByRole('button', { name: 'Agree and continue' }).click();

    await applyPage.isLoaded('tax-filing');
    await page.getByRole('radio', { name: 'Yes', exact: true }).check();
    await page.getByRole('button', { name: 'Continue' }).click();

    await applyPage.isLoaded('type-application');
    await page.getByRole('button', { name: 'Continue' }).click();

    await page.getByRole('radio', { name: 'I am applying for myself', exact: true }).check();
    await page.getByRole('button', { name: 'Continue' }).click();
  });

  test('Should complete flow as senior applicant', async ({ page }) => {
    const applyAdultPage = new PlaywrightApplyAdultPage(page);

    await test.step('Should navigate to date of birth page', async () => {
      await applyAdultPage.isLoaded('date-of-birth');

      const { year, month, day } = calculateDOB(70);

      await page.getByRole('combobox', { name: 'Month' }).selectOption(month);
      await page.getByRole('textbox', { name: 'Day (DD)' }).fill(day);
      await page.getByRole('textbox', { name: 'Year (YYYY)' }).fill(year);

      await page.getByRole('button', { name: 'Continue' }).click();
    });

    await test.step('Should navigate to applicant information page', async () => {
      await applyAdultPage.isLoaded('applicant-information');

      await page.getByRole('textbox', { name: 'First name' }).fill('John');
      await page.getByRole('textbox', { name: 'Last name' }).fill('Smith');
      await page.getByRole('textbox', { name: 'Social Insurance Number (SIN)' }).fill('900000001');
      await page.getByRole('radio', { name: 'Married' }).check();

      await page.getByRole('button', { name: 'Continue' }).click();
    });

    await test.step('Should navigate to partner information page', async () => {
      await applyAdultPage.isLoaded('partner-information');

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
    });

    await test.step('Should navigate to contact information', async () => {
      await applyAdultPage.isLoaded('contact-information');

      //invalid phone number
      await page.getByRole('group', { name: 'Phone number' }).getByRole('textbox', { name: 'Phone number (optional)', exact: true }).fill('111');
      await page.getByRole('button', { name: 'Continue' }).click();
      await expect(page.getByRole('link', { name: 'Invalid phone number' })).toBeVisible();

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
    });

    await test.step('Should naviagte to communication page', async () => {
      await applyAdultPage.isLoaded('communication-preference');

      await page.getByRole('group', { name: 'What is your preferred official language of communication?' }).getByRole('radio', { name: 'English' }).check();
      await page.getByRole('group', { name: 'What is your preferred method of communication for Sun Life?' }).getByRole('radio', { name: 'Email' }).check();
      await page.getByRole('button', { name: 'Continue' }).click();
    });

    await test.step('Should navigate to dental insurance page', async () => {
      await applyAdultPage.isLoaded('dental-insurance');

      await page.getByRole('radio', { name: 'Yes, I have access to dental insurance or coverage', exact: true }).check();
      await page.getByRole('button', { name: 'Continue' }).click();
    });

    await test.step('Should navigate to other dental benefits page', async () => {
      await applyAdultPage.isLoaded('federal-provincial-territorial-benefits');

      await page.getByRole('group', { name: 'Federal benefits' }).getByRole('radio', { name: 'Yes, I have federal dental benefits' }).check();
      await page.getByRole('group', { name: 'Provincial or territorial benefits' }).getByRole('radio', { name: 'Yes, I have provincial or territorial dental benefits' }).check();

      await page.getByRole('group', { name: 'Federal benefits' }).getByRole('radio', { name: 'Correctional Service Canada Health Services' }).check();
      await page.getByRole('group', { name: 'Provincial or territorial benefits' }).getByRole('combobox', { name: 'If yes, through which province or territory?' }).selectOption('Alberta');

      await page.getByRole('group', { name: 'Provincial or territorial benefits' }).getByRole('radio', { name: 'Alberta Adult Health Benefits' }).check();
      await page.getByRole('button', { name: 'Continue' }).click();
    });

    await test.step('Should successfully submit application and navigate to confirmation page', async () => {
      await applyAdultPage.isLoaded('review-information');
      await page.getByRole('button', { name: 'Submit Application' }).click();

      await applyAdultPage.isLoaded('confirmation');
    });
  });
});
