import { expect, test } from '@playwright/test';

import { PlaywrightApplyChildPage } from '../../../models/PlaywrightApplyChildPage';
import { PlaywrightApplyPage } from '../../../models/PlaywrightApplyPage';

test.describe('Children application', () => {
  test.beforeEach('Navigate to child application', async ({ page }) => {
    test.setTimeout(60000);
    const applyPage = new PlaywrightApplyPage(page);
    await applyPage.gotoIndexPage();

    await applyPage.isLoaded('terms-and-conditions');
    await page.getByRole('checkbox', { name: 'I have read the Terms and Conditions' }).check();
    await page.getByRole('checkbox', { name: 'I have read the Privacy Notice Statement' }).check();
    await page.getByRole('checkbox', { name: 'I consent to the sharing of data' }).check();
    await page.getByRole('button', { name: 'Agree and continue' }).click();

    await applyPage.isLoaded('tax-filing');
    await page.getByRole('radio', { name: 'Yes', exact: true }).check();
    await page.getByRole('button', { name: 'Continue' }).click();

    await applyPage.isLoaded('type-application');
    await page.getByRole('radio', { name: 'I am applying for my child(ren)', exact: true }).check();
    await page.getByRole('button', { name: 'Continue' }).click();
  });

  test('Should return to CDCP main page if child is over 18', async ({ page }) => {
    const applyChildPage = new PlaywrightApplyChildPage(page);

    await test.step('Should navigate to children application page', async () => {
      await applyChildPage.isLoaded('children');
      await page.getByRole('button', { name: 'Add a child' }).click();
    });

    await test.step('Should navigate to child information page', async () => {
      await applyChildPage.fillChildInformationForm(25, 'Yes');
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

    await test.step('Should navigate to children application page', async () => {
      await applyChildPage.isLoaded('children');
      await page.getByRole('button', { name: 'Add a child' }).click();
    });

    await test.step('Should navigate to child information page', async () => {
      await applyChildPage.fillChildInformationForm(12, 'No');
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

    await test.step('Should navigate to children application page', async () => {
      await applyChildPage.isLoaded('children');
      await page.getByRole('button', { name: 'Add a child' }).click();
    });

    await test.step('Should navigate to child information page', async () => {
      await applyChildPage.fillChildInformationForm(12, 'Yes');
      await page.getByRole('button', { name: 'Continue' }).click();
    });

    await test.step('Should navigate to children dental insurance page', async () => {
      await applyChildPage.isLoaded('children-dental-insurance');

      await page.getByRole('radio', { name: 'Yes, this child has access to dental insurance or coverage', exact: true }).check();
      await page.getByRole('button', { name: 'Continue' }).click();
    });

    await test.step('Should navigate to confirm other dental benefits page', async () => {
      await applyChildPage.isLoaded('children-confirm-federal-provincial-territorial-benefits');

      await page.getByRole('radio', { name: 'Yes, this child has federal, provincial or territorial dental benefits', exact: true }).check();
      await page.getByRole('button', { name: 'Continue' }).click();
    });

    await test.step('Should navigate to children other dental benefits page', async () => {
      await applyChildPage.isLoaded('children-federal-provincial-territorial-benefits');

      await page.getByRole('group', { name: 'Federal benefits' }).getByRole('radio', { name: 'Yes, this child has federal dental benefits' }).check();
      await page.getByRole('group', { name: 'Provincial or territorial benefits' }).getByRole('radio', { name: 'Yes, this child has provincial or territorial dental benefits' }).check();

      await page.getByRole('group', { name: 'Federal benefits' }).getByRole('radio', { name: 'Correctional Service Canada Health Services' }).check();
      await page.getByRole('group', { name: 'Provincial or territorial benefits' }).getByRole('combobox', { name: 'If yes, through which province or territory?' }).selectOption('Alberta');

      await page.getByRole('group', { name: 'Provincial or territorial benefits' }).getByRole('radio', { name: 'Alberta Adult Health Benefit' }).check();
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
