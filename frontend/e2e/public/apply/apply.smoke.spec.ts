import { test } from '@playwright/test';

import { AdultPage } from '../../pages/public/apply/adult-page';
import { InitialPage } from '../../pages/public/apply/initial-page';
import { clickContinue } from '../../utils/helpers';

test.describe('Public Apply Flow - Minimal Scenario', { tag: '@smoke' }, () => {
  test.describe.configure({ timeout: 60_000 });

  test('Should complete minimal public apply adult flow', async ({ page }) => {
    const applyPage = new InitialPage(page);
    const applyAdultPage = new AdultPage(page);

    await test.step('Should accept terms and conditions and proceed', async () => {
      await applyPage.gotoIndexPage();
      await applyPage.isLoaded('terms-and-conditions');
      await applyPage.acceptLegalCheckboxes(page);
      await clickContinue(page);
    });

    await test.step('Should select tax filing option and proceed', async () => {
      await applyPage.isLoaded('tax-filing');
      await page.getByRole('radio', { name: 'Yes', exact: true }).check(); // TODO all these getByRole should be extracted to a generic function in helpers utility
      await clickContinue(page);
    });

    await test.step('Should select type of application and proceed', async () => {
      await applyPage.isLoaded('type-application');
      await page.getByRole('radio', { name: 'I am applying for myself', exact: true }).check();
      await clickContinue(page);
    });

    await test.step('Should fill out applicant information form and proceed', async () => {
      await applyAdultPage.isLoaded('applicant-information');
      await applyAdultPage.fillApplicantInformationForm({ firstName: 'John', lastName: 'Doe', sin: '900000001', day: '1', month: '01', year: '1970', page });
      await clickContinue(page);
    });

    await test.step('Should select marital status and proceed', async () => {
      await applyAdultPage.isLoaded('marital-status');
      await page.getByRole('radio', { name: 'Single', exact: true }).check();
      await clickContinue(page);
    });

    await test.step('Should fill out mailing address and proceed', async () => {
      await applyAdultPage.isLoaded('mailing-address');
      await applyAdultPage.fillOutAddress({ address: '123 Fake Street', city: 'Ottawa', country: 'Canada', province: 'Ontario', postalCode: 'K1A 0B1', page });
      await page.getByRole('checkbox', { name: 'My mailing address is the same as my home address', exact: true }).check();
      await clickContinue(page);
      await page.getByRole('button', { name: 'Use selected address', exact: true }).click();
    });

    await test.step('Should proceed without phone number', async () => {
      await applyAdultPage.isLoaded('phone-number');
      await clickContinue(page);
    });

    await test.step('Should select communication preferences and proceed', async () => {
      await applyAdultPage.isLoaded('communication-preference');
      await page.getByRole('radio', { name: 'English', exact: true }).check();
      await page.getByRole('radio', { name: 'By mail', exact: true }).check();
      await page.getByRole('radio', { name: 'By mail You can also view your Canadian Dental Care Plan eligibility decision in your My Service Canada Account' }).check();
      await clickContinue(page);
    });

    await test.step('Should confirm dental insurance and proceed', async () => {
      await applyAdultPage.isLoaded('dental-insurance');
      await page.getByRole('radio', { name: 'Yes, I have access to dental insurance or coverage', exact: true }).check();
      await clickContinue(page);
    });

    await test.step('Should confirm federal/provincial/territorial benefits and proceed', async () => {
      await applyAdultPage.isLoaded('confirm-federal-provincial-territorial-benefits');
      await page.getByRole('radio', { name: 'No, I do not have federal, provincial or territorial dental benefits', exact: true }).check();
      await clickContinue(page);
    });

    await test.step('Should submit application after reviewing information', async () => {
      await applyAdultPage.isLoaded('review-information');
      await page.getByRole('button', { name: 'Submit Application', exact: true }).click();
    });

    await test.step('Should close application after submission', async () => {
      await applyAdultPage.isLoaded('confirmation');
      await page.getByRole('button', { name: 'Close application', exact: true }).click();
    });
  });
});
