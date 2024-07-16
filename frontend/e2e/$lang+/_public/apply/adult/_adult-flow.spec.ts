import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

// Reusable function to fill out date of birth
async function fillOutDOB(page: Page, year: string) {
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByTestId('date-picker-error-month')).toBeVisible();
  await expect(page.getByTestId('date-picker-error-year')).toBeVisible();
  await expect(page.getByTestId('date-picker-error-day')).toBeVisible();
  await page.getByTestId('date-picker-month-select').selectOption('01');
  await page.getByTestId('date-picker-day-input').fill('1');
  await page.getByTestId('date-picker-year-input').fill(year);
  await page.getByRole('button', { name: 'Continue' }).click();
}

test.describe('Adult flow', () => {
  test('applicant age category is adult', async ({ page }) => {
    await page.goto('/en/apply');
    await page.getByRole('button', { name: 'Agree and continue' }).click();
    await page.getByText('myself', { exact: true }).click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByLabel('Yes').check();
    await page.getByRole('button', { name: 'Continue' }).click();
    await fillOutDOB(page, '1990');
    await page.getByLabel('No').check();
    await page.getByRole('button', { name: 'Continue' }).click();

    // should navigate to dob-eligibilty page when applicant's age category is adult and no disability tax credit
    await expect(page).toHaveURL(/\/en\/apply\/[a-f0-9-]+\/adult\/dob-eligibility/);

    await page.getByRole('link', { name: 'Back' }).click();

    await page.getByText('Yes').click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByTestId('input-sanitize-field-first-name').getByTestId('input-sanitize-field').fill('John');
    await page.getByTestId('input-sanitize-field-last-name').getByTestId('input-sanitize-field').fill('Smith');
    await page.getByTestId('input-pattern-field').fill('900000001');
    await page.getByText('Married').click();
    await page.getByRole('button', { name: 'Continue' }).click();

    // should navigate to partner information page
    await expect(page).toHaveURL(/\/en\/apply\/[a-f0-9-]+\/adult\/partner-information/);

    await page.getByTestId('input-sanitize-field-first-name').getByTestId('input-sanitize-field').fill('Karen');
    await page.getByTestId('input-sanitize-field-last-name').getByTestId('input-sanitize-field').fill('Smith');
    await fillOutDOB(page, '1995');
    await page.getByTestId('input-pattern-field').fill('968042036');
    await page.getByTestId('input-checkbox').check();
    await page.getByRole('button', { name: 'Continue' }).click();

    // should navigate to contact info page
    await expect(page).toHaveURL(/\/en\/apply\/[a-f0-9-]+\/adult\/contact-information/);
    await page.getByTestId('input-email').getByTestId('input-field').fill('example@mail.com');
    await page.getByTestId('input-confirm-email').getByTestId('input-field').fill('example@mail.com');
    await page.getByTestId('input-sanitize-field-mailing-address').getByTestId('input-sanitize-field').fill('123 abc st');
    await page.getByTestId('input-mailing-country-test').selectOption('0cf5389e-97ae-eb11-8236-000d3af4bfc3');
    await page.getByTestId('input-mailing-province-test').selectOption('daf4d05b-37b3-eb11-8236-0022486d8d5f');
    await page.getByTestId('input-sanitize-field-mailing-city').getByTestId('input-sanitize-field').fill('Ottawa');
    await page.getByTestId('input-sanitize-field-mailing-postal-code').getByTestId('input-sanitize-field').fill('H0H0H0');
    await page.getByText('My home address is the same').click();
    await page.getByRole('button', { name: 'Continue' }).click();

    // should navigate to communication preference page
    await expect(page).toHaveURL(/\/en\/apply\/[a-f0-9-]+\/adult\/communication-preference/);
    await page.getByLabel('English').check();
    await page.getByLabel('Email').check();
    await page.getByRole('button', { name: 'Continue' }).click();

    // should navigate to dental insurance page
    await expect(page).toHaveURL(/\/en\/apply\/[a-f0-9-]+\/adult\/dental-insurance/);
    await page.getByLabel('Yes, I have access to dental').check();
    await page.getByRole('button', { name: 'Continue' }).click();

    // should navigate to government programs page
    await expect(page).toHaveURL(/\/en\/apply\/[a-f0-9-]+\/adult\/federal-provincial-territorial-benefits/);
    await page.getByLabel('No, I do not have federal dental benefits').check();
    await page.getByLabel('Yes, I have provincial or territorial dental benefits').check();
    await page.getByTestId('input-province-test').selectOption('3b17d494-35b3-eb11-8236-0022486d8d5f');
    await page.getByLabel('Alberta Adult Health Benefits').check();
    await page.getByLabel('Alberta Adult Health Benefits').click();
    await page.getByRole('button', { name: 'Continue' }).click();

    // should navigate to review information page
    await expect(page).toHaveURL(/\/en\/apply\/[a-f0-9-]+\/adult\/review-information/);
    await page.getByRole('button', { name: 'Submit Application' }).click();

    // should navigate to confirmationm page
    await expect(page).toHaveURL(/\/en\/apply\/[a-f0-9-]+\/adult\/confirmation/);
  });
});

test.describe('Youth flow', () => {
  //TODO write test for youth flow
});

test.describe('Senior', () => {
  //TODO write test for senior flow
});
