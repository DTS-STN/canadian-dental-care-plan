import { test } from '@playwright/test';

import { ChildPage } from '../../pages/protected/apply/child-page';
import { InitialPage } from '../../pages/protected/apply/initial-page';
import { calculateDOB, clickContinue } from '../../utils/helpers';

test.describe('Child category', () => {
  test.beforeEach('Navigate to child application', async ({ page }) => {
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
    await page.getByRole('radio', { name: 'I am applying for my child(ren)', exact: true }).check();
    await clickContinue(page);
  });

  // TODO: Add test cases for living-independently and new-or-existing-user
  test('Should complete flow as child applicant', async ({ page }) => {
    const applyChildPage = new ChildPage(page);

    await test.step('Should navigate to children page', async () => {
      await applyChildPage.isLoaded('children');
      const addChildButton = page.getByRole('button', { name: 'Add a child' });
      await addChildButton.click();
    });

    await test.step('Should navigate to children-information page', async () => {
      await applyChildPage.isLoaded('children-information');
      const { year, month, day } = calculateDOB(10);
      await applyChildPage.fillChildrenInformationForm({ firstName: 'John Jr.', lastName: 'Smith', sin: '800000002', day: day, month: month, year: year, hasSin: true, isGuardian: true, page });
      await clickContinue(page);
    });

    await test.step('Should navigate to children-dental-insurance page', async () => {
      await applyChildPage.isLoaded('children-dental-insurance');
      await page.getByRole('radio', { name: 'Yes, this child has access to dental insurance or coverage', exact: true }).check();
      await clickContinue(page);
    });

    await test.step('Should navigate to children-confirm-federal-provincial-territorial-benefits page', async () => {
      await applyChildPage.isLoaded('children-confirm-federal-provincial-territorial-benefits');
      await page.getByRole('radio', { name: 'Yes, this child has federal, provincial or territorial dental benefits', exact: true }).check();
      await clickContinue(page);
    });

    await test.step('Should navigate to children-federal-provincial-territorial-benefits page', async () => {
      await applyChildPage.isLoaded('children-federal-provincial-territorial-benefits');

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
      await applyChildPage.isLoaded('children');
      const continueButton = page.getByRole('button', { name: 'Continue with application' });
      await continueButton.click();
    });

    await test.step('Should navigate to applicant information page', async () => {
      await applyChildPage.isLoaded('applicant-information');
      const { year, month, day } = calculateDOB(35);
      await applyChildPage.fillApplicantInformationForm({ firstName: 'John', lastName: 'Smith', sin: '900000001', day: day, month: month, year: year, dtcEligible: undefined, page });

      await clickContinue(page);
    });

    await test.step('Should navigate to applicant information page', async () => {
      await applyChildPage.isLoaded('marital-status');
      await page.getByRole('radio', { name: 'Single', exact: true }).check();
      await clickContinue(page);
    });

    await test.step('Should navigate to mailing address page', async () => {
      await applyChildPage.isLoaded('mailing-address');
      await applyChildPage.fillOutAddress({ address: '123 Fake Street', city: 'Ottawa', country: 'Canada', province: 'Ontario', postalCode: 'K1A 0B1', page });
      await clickContinue(page);
      await page.getByRole('button', { name: 'Use selected address' }).click();
    });

    await test.step('Should navigate to home address page', async () => {
      await applyChildPage.isLoaded('home-address');
      await applyChildPage.fillOutAddress({ address: '123 Maple Street', city: 'Ottawa', country: 'Canada', province: 'Ontario', postalCode: 'K1A 0B1', page });
      await clickContinue(page);
      await page.getByRole('button', { name: 'Use selected address' }).click();
    });

    await test.step('Should navigate to phone number page', async () => {
      await applyChildPage.isLoaded('phone-number');
      await page.getByRole(`textbox`, { name: 'Phone number (optional)', exact: true }).fill('819-888-8888');
      await page.getByRole(`textbox`, { name: 'Alternate phone number (optional)', exact: true }).fill('819-777-7777');
      await clickContinue(page);
    });

    await test.step('Should navigate to communication preference page', async () => {
      await applyChildPage.isLoaded('communication-preference');
      await page.getByRole('radio', { name: 'English', exact: true }).check();
      await page.getByRole('radio', { name: 'By email', exact: true }).check();
      await page.getByRole('radio', { name: 'Digitally through My Service Canada Account (MSCA)' }).check();
      await clickContinue(page);
    });

    await test.step('Should navigate to email page', async () => {
      await applyChildPage.isLoaded('email');
      await page.getByRole('textbox', { name: 'Email address' }).fill('test@example.com');
      await clickContinue(page);
    });

    await test.step('Should navigate to verify email page', async () => {
      await applyChildPage.isLoaded('verify-email');
      await page.getByRole('textbox', { name: 'Verification code' }).fill('12345');
      await clickContinue(page);
    });

    await test.step('Should navigate to review child informaton page', async () => {
      await applyChildPage.isLoaded('review-child-information');
      await clickContinue(page);
    });

    await test.step('Should navigate to review adult informaton page', async () => {
      await applyChildPage.isLoaded('review-adult-information');
      await page.getByRole('button', { name: 'Submit Application' }).click();
    });

    await test.step('Should navigate to confirmation page', async () => {
      await applyChildPage.isLoaded('confirmation');
      await page.getByRole('button', { name: 'Close application' }).click();
      await page.getByRole('button', { name: 'Return to my dashboard' }).click();
    });
  });

  test('Applicant is not parent or legal guardian of child', async ({ page }) => {
    const applyChildPage = new ChildPage(page);

    await test.step('Should navigate to children page', async () => {
      await applyChildPage.isLoaded('children');
      const addChildButton = page.getByRole('button', { name: 'Add a child' });
      await addChildButton.click();
    });

    await test.step('Should navigate to children-information page', async () => {
      await applyChildPage.isLoaded('children-information');
      const { year, month, day } = calculateDOB(10);
      await applyChildPage.fillChildrenInformationForm({ firstName: 'John Jr.', lastName: 'Smith', sin: '800000002', day: day, month: month, year: year, hasSin: true, isGuardian: false, page });
      await clickContinue(page);
    });

    await test.step('Should navigate to parent or guardian page', async () => {
      await applyChildPage.isLoaded('parent-or-guardian');
      await page.getByRole('button', { name: 'Return to my dashboard' }).click();
    });
  });

  test('Child is 18 or older and has no sin', async ({ page }) => {
    const applyChildPage = new ChildPage(page);

    await test.step('Should navigate to children page', async () => {
      await applyChildPage.isLoaded('children');
      const addChildButton = page.getByRole('button', { name: 'Add a child' });
      await addChildButton.click();
    });

    await test.step('Should navigate to children-information page', async () => {
      await applyChildPage.isLoaded('children-information');
      const { year, month, day } = calculateDOB(18);
      await applyChildPage.fillChildrenInformationForm({ firstName: 'John Jr.', lastName: 'Smith', day: day, month: month, year: year, hasSin: false, isGuardian: true, page });
      await clickContinue(page);
    });

    await test.step('Should navigate to children-cannot-apply-page page', async () => {
      await applyChildPage.isLoaded('children-cannot-apply-child');
    });
  });

  test('Child is 17 or younger and has no sin', async ({ page }) => {
    const applyChildPage = new ChildPage(page);

    await test.step('Should navigate to children page', async () => {
      await applyChildPage.isLoaded('children');
      const addChildButton = page.getByRole('button', { name: 'Add a child' });
      await addChildButton.click();
    });

    await test.step('Should navigate to children-information page', async () => {
      await applyChildPage.isLoaded('children-information');
      const { year, month, day } = calculateDOB(17);
      await applyChildPage.fillChildrenInformationForm({ firstName: 'John Jr.', lastName: 'Smith', day: day, month: month, year: year, hasSin: false, isGuardian: true, page });
      await clickContinue(page);
    });

    await test.step('Should navigate to dental-insurance page', async () => {
      await applyChildPage.isLoaded('children-dental-insurance');
    });
  });
});

test.describe('Child category - parent or legual guardian miscellaneous checks', () => {
  test.beforeEach('Navigate to child application', async ({ page }) => {
    test.setTimeout(60_000);

    const applyPage = new InitialPage(page);
    const applyChildPage = new ChildPage(page);

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
    await page.getByRole('radio', { name: 'I am applying for my child(ren)', exact: true }).check();
    await clickContinue(page);

    await applyChildPage.isLoaded('children');
    const addChildButton = page.getByRole('button', { name: 'Add a child' });
    await addChildButton.click();

    await applyChildPage.isLoaded('children-information');
    const { year, month, day } = calculateDOB(10);
    await applyChildPage.fillChildrenInformationForm({ firstName: 'John Jr.', lastName: 'Smith', sin: '800000002', day: day, month: month, year: year, hasSin: true, isGuardian: true, page });
    await clickContinue(page);

    await applyChildPage.isLoaded('children-dental-insurance');
    await page.getByRole('radio', { name: 'Yes, this child has access to dental insurance or coverage', exact: true }).check();
    await clickContinue(page);

    await applyChildPage.isLoaded('children-confirm-federal-provincial-territorial-benefits');
    await page.getByRole('radio', { name: 'Yes, this child has federal, provincial or territorial dental benefits', exact: true }).check();
    await clickContinue(page);

    await applyChildPage.isLoaded('children-federal-provincial-territorial-benefits');

    const fedGroup = page.getByRole('group', { name: 'Federal benefits' });
    await fedGroup.getByRole('radio', { name: 'Yes' }).check();
    await fedGroup.getByRole('radio', { name: 'Correctional Service' }).check();

    const provGroup = page.getByRole('group', { name: 'Provincial or territorial benefits' });
    await provGroup.getByRole('radio', { name: 'Yes' }).check();
    await provGroup.getByRole('combobox', { name: 'through which province or territory' }).selectOption('Alberta');
    await provGroup.getByRole('radio', { name: 'Alberta Adult' }).check();

    await clickContinue(page);

    await applyChildPage.isLoaded('children');
    const continueButton = page.getByRole('button', { name: 'Continue with application' });
    await continueButton.click();
  });

  test('Parent or guardian is 15 or younger', async ({ page }) => {
    const applyChildPage = new ChildPage(page);
    await test.step('Should navigate to applicant information page', async () => {
      await applyChildPage.isLoaded('applicant-information');
      const { year, month, day } = calculateDOB(15);
      await applyChildPage.fillApplicantInformationForm({ firstName: 'John', lastName: 'Smith', sin: '900000001', day: day, month: month, year: year, dtcEligible: undefined, page });

      await clickContinue(page);
    });

    await test.step('Should navigate to contact-apply-page page', async () => {
      await applyChildPage.isLoaded('contact-apply-child');
    });
  });

  test('Parent or guardian born or 2006', async ({ page }) => {
    const applyChildPage = new ChildPage(page);
    await test.step('Should navigate to applicant information page', async () => {
      await applyChildPage.isLoaded('applicant-information');
      await applyChildPage.fillApplicantInformationForm({ firstName: 'John', lastName: 'Smith', sin: '900000001', day: '10', month: '10', year: '2006', dtcEligible: undefined, page });

      await clickContinue(page);
    });

    await test.step('Should navigate to new-or-existing-member page', async () => {
      await applyChildPage.isLoaded('new-or-existing-member');
      await page.getByRole('radio', { name: 'Yes' }).check();
      await page.getByRole(`textbox`, { name: 'Client Number', exact: true }).fill('12345678912');

      await clickContinue(page);
    });

    await test.step('Should navigate to marital-status page', async () => {
      // Checking if correct page is loaded.
      await applyChildPage.isLoaded('marital-status');
    });
  });
});
