import { test } from '@playwright/test';

import { PlaywrightApplyAdultChildPage } from '../../models/protected/PlaywrightApplyAdultChildPage';
import { PlaywrightApplyPage } from '../../models/protected/PlaywrightApplyPage';
import { acceptLegalCheckboxes, calculateDOB, clickContinue, fillApplicantInformationForm, fillChildrenInformationForm, fillOutAddress } from '../../utils/helpers';

test.describe('Adult-Child category', () => {
  test.beforeEach('Navigate to adult-child application', async ({ page }) => {
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
    await page.getByRole('radio', { name: 'I am applying for myself and my child(ren)', exact: true }).check();
    await clickContinue(page);
  });

  // TODO: Add test cases for living-independently and new-or-existing-user
  test('Should complete flow as adult-child applicant', async ({ page }) => {
    const applyAdultPage = new PlaywrightApplyAdultChildPage(page);

    await test.step('Should navigate to applicant information page', async () => {
      await applyAdultPage.isLoaded('applicant-information');
      const { year, month, day } = calculateDOB(35);
      await fillApplicantInformationForm({ firstName: 'John', lastName: 'Smith', sin: '900000001', day: day, month: month, year: year, dtcEligible: true, page });

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
      await fillOutAddress({ address: '123 Fake Street', city: 'Ottawa', country: 'Canada', province: 'Ontario', postalCode: 'K1A 0B1', page });
      await clickContinue(page);
      await page.getByRole('button', { name: 'Use selected address' }).click();
    });

    await test.step('Should navigate to home address page', async () => {
      await applyAdultPage.isLoaded('home-address');
      await fillOutAddress({ address: '123 Maple Street', city: 'Ottawa', country: 'Canada', province: 'Ontario', postalCode: 'K1A 0B1', page });
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

    await test.step('Should navigate to verify email page', async () => {
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

    await test.step('Should navigate to children page', async () => {
      await applyAdultPage.isLoaded('children');
      const addChildButton = page.getByRole('button', { name: 'Add a child' });
      await addChildButton.click();
    });

    await test.step('Should navigate to children-information page', async () => {
      await applyAdultPage.isLoaded('children-information');
      const { year, month, day } = calculateDOB(10);
      await fillChildrenInformationForm({ firstName: 'John Jr.', lastName: 'Smith', sin: '800000002', day: day, month: month, year: year, hasSin: true, isGuardian: true, page });
      await clickContinue(page);
    });

    await test.step('Should navigate to children-dental-insurance page', async () => {
      await applyAdultPage.isLoaded('children-dental-insurance');
      await page.getByRole('radio', { name: 'Yes, this child has access to dental insurance or coverage', exact: true }).check();
      await clickContinue(page);
    });

    await test.step('Should navigate to children-confirm-federal-provincial-territorial-benefits page', async () => {
      await applyAdultPage.isLoaded('children-confirm-federal-provincial-territorial-benefits');
      await page.getByRole('radio', { name: 'Yes, this child has federal, provincial or territorial dental benefits', exact: true }).check();
      await clickContinue(page);
    });

    await test.step('Should navigate to children-federal-provincial-territorial-benefits page', async () => {
      await applyAdultPage.isLoaded('children-federal-provincial-territorial-benefits');
      await page.getByTestId('input-radio-has-federal-benefits-option-0').check();
      await page.getByTestId('input-radio-federal-social-programs-option-0').check();
      await page.getByTestId('input-radio-has-provincial-territorial-benefits-option-0').check();
      await page.getByTestId('input-province-test').selectOption('Alberta');
      await page.getByTestId('input-radio-provincial-territorial-social-programs-option-0').check();
      await clickContinue(page);
    });

    await test.step('Should navigate to children page', async () => {
      await applyAdultPage.isLoaded('children');
      const continueButton = page.getByRole('button', { name: 'Continue with application' });
      await continueButton.click();
    });

    await test.step('Should navigate to review adult informaton page', async () => {
      await applyAdultPage.isLoaded('review-adult-information');
      await clickContinue(page);
    });

    await test.step('Should navigate to review child informaton page', async () => {
      await applyAdultPage.isLoaded('review-child-information');
      await page.getByRole('button', { name: 'Submit Application' }).click();
    });

    await test.step('Should navigate to confirmation page', async () => {
      await applyAdultPage.isLoaded('confirmation');
      await page.getByRole('button', { name: 'Close application' }).click();
      await page.getByRole('button', { name: 'Return to my dashboard' }).click();
    });
  });
});
