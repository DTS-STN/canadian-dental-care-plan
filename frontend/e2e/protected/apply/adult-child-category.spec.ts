import { test } from '@playwright/test';

import { AdultChildPage } from '../../pages/protected/apply/adult-child-page';
import { InitialPage } from '../../pages/protected/apply/initial-page';
import { calculateDOB, clickContinue } from '../../utils/helpers';

test.describe('Adult-Child category', () => {
  test.beforeEach('Navigate to adult-child application', async ({ page }) => {
    test.setTimeout(60_000);

    const applyPage = new InitialPage(page);
    await applyPage.gotoIndexPage();

    // Accept Terms
    await applyPage.isLoaded('terms-and-conditions');
    await applyPage.acceptLegalCheckboxes(page);
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

  // TODO: Add test cases for living-independently and new-or-existing-member
  test('Should complete flow as adult-child applicant', async ({ page }) => {
    const applyAdultChildPage = new AdultChildPage(page);

    await test.step('Should navigate to applicant information page', async () => {
      await applyAdultChildPage.isLoaded('applicant-information');
      const { year, month, day } = calculateDOB(35);
      await applyAdultChildPage.fillApplicantInformationForm({ firstName: 'John', lastName: 'Smith', sin: '900000001', day: day, month: month, year: year, dtcEligible: true, page });

      await clickContinue(page);
    });

    await test.step('Should navigate to applicant information page', async () => {
      await applyAdultChildPage.isLoaded('marital-status');
      await page.getByRole('radio', { name: 'Single', exact: true }).check();
      await clickContinue(page);
    });

    await test.step('Should navigate to marital status page', async () => {
      await applyAdultChildPage.isLoaded('marital-status');
      await page.getByRole('radio', { name: 'Single', exact: true }).check();
      await clickContinue(page);
    });

    await test.step('Should navigate to mailing address page', async () => {
      await applyAdultChildPage.isLoaded('mailing-address');
      await applyAdultChildPage.fillOutAddress({ address: '123 Fake Street', city: 'Ottawa', country: 'Canada', province: 'Ontario', postalCode: 'K1A 0B1', page });
      await clickContinue(page);
      await page.getByRole('button', { name: 'Use selected address' }).click();
    });

    await test.step('Should navigate to home address page', async () => {
      await applyAdultChildPage.isLoaded('home-address');
      await applyAdultChildPage.fillOutAddress({ address: '123 Maple Street', city: 'Ottawa', country: 'Canada', province: 'Ontario', postalCode: 'K1A 0B1', page });
      await clickContinue(page);
      await page.getByRole('button', { name: 'Use selected address' }).click();
    });

    await test.step('Should navigate to phone number page', async () => {
      await applyAdultChildPage.isLoaded('phone-number');
      await page.getByRole(`textbox`, { name: 'Phone number (optional)', exact: true }).fill('819-888-8888');
      await page.getByRole(`textbox`, { name: 'Alternate phone number (optional)', exact: true }).fill('819-777-7777');
      await clickContinue(page);
    });

    await test.step('Should navigate to communication preference page', async () => {
      await applyAdultChildPage.isLoaded('communication-preference');
      await page.getByRole('radio', { name: 'English', exact: true }).check();

      await page.getByRole('radio', { name: 'By email', exact: true }).check();
      await page.getByRole('radio', { name: 'Digitally through My Service Canada Account (MSCA)' }).check();

      await clickContinue(page);
    });

    await test.step('Should navigate to email page', async () => {
      await applyAdultChildPage.isLoaded('email');
      await page.getByRole('textbox', { name: 'Email address' }).fill('test@example.com');
      await clickContinue(page);
    });

    await test.step('Should navigate to verify email page', async () => {
      await applyAdultChildPage.isLoaded('verify-email');
      await page.getByRole('textbox', { name: 'Verification code' }).fill('12345');
      await clickContinue(page);
    });

    await test.step('Should navigate to dental insurance page', async () => {
      await applyAdultChildPage.isLoaded('dental-insurance');
      await page.getByRole('radio', { name: 'Yes' }).check();
      await clickContinue(page);
    });

    await test.step('Should navigate to confirm FPT insurance page', async () => {
      await applyAdultChildPage.isLoaded('confirm-federal-provincial-territorial-benefits');
      await page.getByRole('radio', { name: 'Yes' }).check();
      await clickContinue(page);
    });

    await test.step('Should navigate to FPT benefits page', async () => {
      await applyAdultChildPage.isLoaded('federal-provincial-territorial-benefits');

      const fedGroup = page.getByRole('group', { name: 'Federal benefits' });
      await fedGroup.getByRole('radio', { name: 'Yes' }).check();
      await fedGroup.getByRole('radio', { name: 'Correctional Service' }).check();

      const provGroup = page.getByRole('group', { name: 'Provincial or territorial benefits' });
      await provGroup.getByRole('radio', { name: 'Yes' }).check();
      await provGroup.getByRole('combobox', { name: 'through which province or territory' }).selectOption('Alberta');
      await provGroup.getByRole('radio', { name: 'Alberta Adult' }).check();

      await clickContinue(page);
    });

    await test.step('Should navigate to children page', async () => {
      await applyAdultChildPage.isLoaded('children');
      const addChildButton = page.getByRole('button', { name: 'Add a child' });
      await addChildButton.click();
    });

    await test.step('Should navigate to children-information page', async () => {
      await applyAdultChildPage.isLoaded('children-information');
      const { year, month, day } = calculateDOB(10);
      await applyAdultChildPage.fillChildrenInformationForm({ firstName: 'John Jr.', lastName: 'Smith', sin: '800000002', day: day, month: month, year: year, hasSin: true, isGuardian: true, page });
      await clickContinue(page);
    });

    await test.step('Should navigate to children-dental-insurance page', async () => {
      await applyAdultChildPage.isLoaded('children-dental-insurance');
      await page.getByRole('radio', { name: 'Yes, this child has access to dental insurance or coverage', exact: true }).check();
      await clickContinue(page);
    });

    await test.step('Should navigate to children-confirm-federal-provincial-territorial-benefits page', async () => {
      await applyAdultChildPage.isLoaded('children-confirm-federal-provincial-territorial-benefits');
      await page.getByRole('radio', { name: 'Yes, this child has federal, provincial or territorial dental benefits', exact: true }).check();
      await clickContinue(page);
    });

    await test.step('Should navigate to children-federal-provincial-territorial-benefits page', async () => {
      await applyAdultChildPage.isLoaded('children-federal-provincial-territorial-benefits');

      const fedGroup = page.getByRole('group', { name: 'Federal benefits' });
      await fedGroup.getByRole('radio', { name: 'Yes' }).check();
      await fedGroup.getByRole('radio', { name: 'Correctional Service' }).check();

      const provGroup = page.getByRole('group', { name: 'Provincial or territorial benefits' });
      await provGroup.getByRole('radio', { name: 'Yes' }).check();
      await provGroup.getByRole('combobox', { name: 'through which province or territory' }).selectOption('Alberta');
      await provGroup.getByRole('radio', { name: 'Alberta Adult' }).check();

      await clickContinue(page);
    });

    await test.step('Should navigate to children page', async () => {
      await applyAdultChildPage.isLoaded('children');
      const continueButton = page.getByRole('button', { name: 'Continue with application' });
      await continueButton.click();
    });

    await test.step('Should navigate to review adult informaton page', async () => {
      await applyAdultChildPage.isLoaded('review-adult-information');
      await clickContinue(page);
    });

    await test.step('Should navigate to review child informaton page', async () => {
      await applyAdultChildPage.isLoaded('review-child-information');
      await page.getByRole('button', { name: 'Submit Application' }).click();
    });

    await test.step('Should navigate to confirmation page', async () => {
      await applyAdultChildPage.isLoaded('confirmation');
      await page.getByRole('button', { name: 'Close application' }).click();
      await page.getByRole('button', { name: 'Return to my dashboard' }).click();
    });
  });

  test('Applicant is under 16 years old', async ({ page }) => {
    const applyAdultChildPage = new AdultChildPage(page);

    await test.step('Should navigate to applicant information page', async () => {
      await applyAdultChildPage.isLoaded('applicant-information');
      const { year, month, day } = calculateDOB(15);
      await applyAdultChildPage.fillApplicantInformationForm({ firstName: 'John', lastName: 'Smith', sin: '900000001', day: day, month: month, year: year, dtcEligible: true, page });

      await clickContinue(page);
    });

    await test.step('Should navigate to parent or guardian page', async () => {
      await applyAdultChildPage.isLoaded('parent-or-guardian');
      await page.getByRole('button', { name: 'Return to my dashboard' }).click();
    });
  });

  test('Applicant is 16 or 17 years old and lives with parents', async ({ page }) => {
    const applyAdultChildPage = new AdultChildPage(page);

    await test.step('Should navigate to applicant information page', async () => {
      await applyAdultChildPage.isLoaded('applicant-information');
      const { year, month, day } = calculateDOB(17);
      await applyAdultChildPage.fillApplicantInformationForm({ firstName: 'John', lastName: 'Smith', sin: '900000001', day: day, month: month, year: year, dtcEligible: true, page });

      await clickContinue(page);
    });

    await test.step('Should navigate to living independently page', async () => {
      await applyAdultChildPage.isLoaded('living-independently');
      await page.getByRole('radio', { name: 'No' }).check();

      await clickContinue(page);
    });

    await test.step('Should navigate to parent or guardian page', async () => {
      await applyAdultChildPage.isLoaded('parent-or-guardian');
      await page.getByRole('button', { name: 'Return to my dashboard' }).click();
    });
  });

  test('Applicant is 16 or 17 years old and does not lives with parents', async ({ page }) => {
    const applyAdultChildPage = new AdultChildPage(page);

    await test.step('Should navigate to applicant information page', async () => {
      await applyAdultChildPage.isLoaded('applicant-information');
      const { year, month, day } = calculateDOB(17);
      await applyAdultChildPage.fillApplicantInformationForm({ firstName: 'John', lastName: 'Smith', sin: '900000001', day: day, month: month, year: year, dtcEligible: true, page });

      await clickContinue(page);
    });

    await test.step('Should navigate to living independently page', async () => {
      await applyAdultChildPage.isLoaded('living-independently');
      await page.getByRole('radio', { name: 'Yes' }).check();

      await clickContinue(page);
    });

    await test.step('Should navigate to new-or-existing-member page', async () => {
      await applyAdultChildPage.isLoaded('new-or-existing-member');
      await page.getByRole('radio', { name: 'Yes' }).check();
      await page.getByRole(`textbox`, { name: 'Client Number', exact: true }).fill('12345678912');

      await clickContinue(page);
    });

    await test.step('Should navigate to marital-status page', async () => {
      // Checking if correct page is loaded.
      await applyAdultChildPage.isLoaded('marital-status');
    });
  });

  test('Applicantis born on 2006', async ({ page }) => {
    const applyAdultChildPage = new AdultChildPage(page);

    await test.step('Should navigate to applicant information page', async () => {
      await applyAdultChildPage.isLoaded('applicant-information');
      await applyAdultChildPage.fillApplicantInformationForm({ firstName: 'John', lastName: 'Smith', sin: '900000001', day: '10', month: '10', year: '2006', dtcEligible: true, page });

      await clickContinue(page);
    });

    await test.step('Should navigate to new-or-existing-member page', async () => {
      await applyAdultChildPage.isLoaded('new-or-existing-member');
      await page.getByRole('radio', { name: 'Yes' }).check();
      await page.getByRole(`textbox`, { name: 'Client Number', exact: true }).fill('12345678912');

      await clickContinue(page);
    });

    await test.step('Should navigate to marital-status page', async () => {
      // Checking if correct page is loaded.
      await applyAdultChildPage.isLoaded('marital-status');
    });
  });
});
