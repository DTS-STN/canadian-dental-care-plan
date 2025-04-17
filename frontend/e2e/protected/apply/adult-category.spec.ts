import { test } from '@playwright/test';

import { PlaywrightApplyAdultPage } from '../../models/protected/PlaywrightApplyAdultPage';
import { PlaywrightApplyPage } from '../../models/protected/PlaywrightApplyPage';
import { acceptLegalCheckboxes, calculateDOB, clickContinue, fillOutAddress } from '../../utils/helpers';

test.describe('Adult category', () => {
  test.beforeEach('Navigate to adult application', async ({ page }) => {
    test.setTimeout(60000);

    const applyPage = new PlaywrightApplyPage(page);
    await applyPage.gotoIndexPage();

    // Accept Terms
    await applyPage.isLoaded('terms-and-conditions');
    await acceptLegalCheckboxes(page);
    await clickContinue(page);

    // Tax Filing Section
    await applyPage.isLoaded('tax-filing');
    await page.getByRole('radio', { name: 'Yes', exact: true }).check();
    await clickContinue(page);

    // Type of Application
    await applyPage.isLoaded('type-application');
    await page.getByRole('radio', { name: 'I am applying for myself', exact: true }).check();
    await clickContinue(page);
  });

  // TODO: Add test cases for living-independently and new-or-existing-user
  test('Should complete flow as adult applicant', async ({ page }) => {
    const applyAdultPage = new PlaywrightApplyAdultPage(page);

    await test.step('Should navigate to applicant information page', async () => {
      await applyAdultPage.isLoaded('applicant-information');
      await page.getByRole('textbox', { name: 'First name' }).fill('John');
      await page.getByRole('textbox', { name: 'Last name' }).fill('Smith');
      const { year, month, day } = calculateDOB(35);
      await page.getByRole('combobox', { name: 'Month' }).selectOption(month);
      await page.getByRole('textbox', { name: 'Day (DD)' }).fill(day);
      await page.getByRole('textbox', { name: 'Year (YYYY)' }).fill(year);
      await page.getByRole('textbox', { name: 'Social Insurance Number (SIN)' }).fill('900000001');

      // DTC question
      await page.getByRole('radio', { name: 'Yes', exact: true }).check();
      await clickContinue(page);
    });

    await test.step('Should navigate to applicant information page', async () => {
      await applyAdultPage.isLoaded('marital-status');
      await page.getByRole('radio', { name: 'Single', exact: true }).check();
      await clickContinue(page);
    });

    await test.step('Should navigate to marital status page', async () => {
      await applyAdultPage.isLoaded('marital-status');
      await page.getByRole('radio', { name: 'Single', exact: true }).check();
      await clickContinue(page);
    });

    await test.step('Should navigate to mailing address page', async () => {
      await applyAdultPage.isLoaded('mailing-address');
      await fillOutAddress({ address: '123 Fake Street', city: 'Ottawa', country: 'Canada', province: 'Ontario', postalCode: 'K1A 0B1', page, group: '[data-testid="mailing-address-fieldset"]' });
      await clickContinue(page);
      await page.getByRole('button', { name: 'Use selected address' }).click();
    });

    await test.step('Should navigate to home address page', async () => {
      await applyAdultPage.isLoaded('home-address');
      await fillOutAddress({ address: '123 Maple Street', city: 'Ottawa', country: 'Canada', province: 'Ontario', postalCode: 'K1A 0B1', page, group: '[data-testid="home-address-fieldset"]' });
      await clickContinue(page);
      await page.getByRole('button', { name: 'Use selected address' }).click();
    });

    await test.step('Should navigate to phone number page', async () => {
      await applyAdultPage.isLoaded('phone-number');
      await page.getByTestId('test-phone-number').fill('819-888-8888');
      await page.getByTestId('test-phone-number-alt').fill('819-777-7777');
      await clickContinue(page);
    });

    await test.step('Should navigate to communication preference page', async () => {
      await applyAdultPage.isLoaded('communication-preference');
      await page.getByRole('radio', { name: 'English', exact: true }).check();

      // Using getByTestId since there are two radio buttons with the same label.
      // Gets "By email"
      await page.getByTestId('input-radio-preferred-methods-option-0').check();
      // Gets "Digitally through My Service Canada Account (MSCA)"
      await page.getByTestId('input-radio-preferred-notification-method-option-0').check();

      await clickContinue(page);
    });

    await test.step('Should navigate to email page', async () => {
      await applyAdultPage.isLoaded('email');
      await page.getByRole('textbox', { name: 'Email address' }).fill('test@example.com');
      await clickContinue(page);
    });

    await test.step('Should navigate to email page', async () => {
      await applyAdultPage.isLoaded('verify-email');
      await page.getByRole('textbox', { name: 'Verification code' }).fill('12345');
      await clickContinue(page);
    });

    await test.step('Should navigate to dental insurance page', async () => {
      await applyAdultPage.isLoaded('dental-insurance');
      await page.getByTestId('input-radio-dental-insurance-option-0').check();
      await clickContinue(page);
    });

    await test.step('Should navigate to confirm FPT insurance page', async () => {
      await applyAdultPage.isLoaded('confirm-federal-provincial-territorial-benefits');
      await page.getByTestId('input-radio-federal-provincial-territorial-benefits-changed-option-0').check();
      await clickContinue(page);
    });

    await test.step('Should navigate to FPT benefits page', async () => {
      await applyAdultPage.isLoaded('federal-provincial-territorial-benefits');
      await page.getByTestId('input-radio-has-federal-benefits-option-0').check();
      await page.getByTestId('input-radio-federal-social-programs-option-0').check();
      await page.getByTestId('input-radio-has-provincial-territorial-benefits-option-0').check();
      await page.getByTestId('input-province-test').selectOption('Alberta');
      await page.getByTestId('input-radio-provincial-territorial-social-programs-option-0').check();
      await clickContinue(page);
    });

    await test.step('Should navigate to review informaton page', async () => {
      await applyAdultPage.isLoaded('review-information');
      await page.getByRole('button', { name: 'Submit Application' }).click();
    });

    await test.step('Should navigate to confirmation page', async () => {
      await applyAdultPage.isLoaded('confirmation');
      await page.getByRole('button', { name: 'Close application' }).click();
      await page.getByRole('button', { name: 'Return to my dashboard' }).click();
    });
  });
});
