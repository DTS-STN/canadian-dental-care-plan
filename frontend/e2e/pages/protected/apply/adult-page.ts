import type { Page } from '@playwright/test';

import { BasePage } from '../../base-page';

interface FillOutAddressArgs {
  address: string;
  city: string;
  country: string;
  page: Page;
  postalCode: string;
  province: string;
}

interface FillApplicantInformationFormArgs {
  firstName: string;
  lastName: string;
  sin: string;
  day: string;
  month: string;
  year: string;
  page: Page;
}

export class AdultPage extends BasePage {
  async isLoaded(
    applyAdultPage:
      | 'applicant-information'
      | 'marital-status'
      | 'mailing-address'
      | 'home-address'
      | 'phone-number'
      | 'communication-preference'
      | 'email'
      | 'verify-email'
      | 'confirmation'
      | 'dental-insurance'
      | 'confirm-federal-provincial-territorial-benefits'
      | 'federal-provincial-territorial-benefits'
      | 'living-independently'
      | 'parent-or-guardian'
      | 'new-or-existing-member'
      | 'review-information',
    heading?: string | RegExp,
  ) {
    let pageInfo: { url: string | RegExp; heading: string | RegExp } | undefined;

    switch (applyAdultPage) {
      case 'applicant-information': {
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/adult\/applicant-information/, heading: 'Applicant information' };
        break;
      }

      case 'marital-status': {
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/adult\/marital-status/, heading: 'Marital Status' };
        break;
      }

      case 'mailing-address': {
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/adult\/mailing-address/, heading: 'Mailing Address' };
        break;
      }

      case 'home-address': {
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/adult\/home-address/, heading: 'Home Address' };
        break;
      }

      case 'phone-number': {
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/adult\/phone-number/, heading: 'Phone Number' };
        break;
      }

      case 'communication-preference': {
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/adult\/communication-preference/, heading: 'Communication' };
        break;
      }

      case 'email': {
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/adult\/email/, heading: 'Email' };
        break;
      }
      case 'verify-email': {
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/adult\/verify-email/, heading: 'Verify your email address' };
        break;
      }

      case 'confirmation': {
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/adult\/confirmation/, heading: 'Application successfully submitted' };
        break;
      }

      case 'dental-insurance': {
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/adult\/dental-insurance/, heading: 'Access to private dental insurance' };
        break;
      }

      case 'confirm-federal-provincial-territorial-benefits': {
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/adult\/confirm-federal-provincial-territorial-benefits/, heading: 'Access to other government dental benefits' };
        break;
      }

      case 'federal-provincial-territorial-benefits': {
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/adult\/federal-provincial-territorial-benefits/, heading: 'Access to other federal, provincial or territorial dental benefits' };
        break;
      }

      case 'living-independently': {
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/adult\/living-independently/, heading: 'Living independently' };
        break;
      }

      case 'parent-or-guardian': {
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/adult\/parent-or-guardian/, heading: 'Parent or legal guardian needs to apply' };
        break;
      }

      case 'new-or-existing-member': {
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/adult\/new-or-existing-member/, heading: 'New or existing member' };
        break;
      }

      case 'review-information': {
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/adult\/review-information/, heading: 'Review your information' };
        break;
      }

      default: {
        pageInfo = undefined;
        break;
      }
    }

    if (!pageInfo) throw new Error(`Protected applyAdultPage '${applyAdultPage}' not implemented.`);
    await super.isLoaded(pageInfo.url, heading ?? pageInfo.heading);
  }

  // Reusable function to fill out address
  async fillOutAddress({ address, city, country, page, postalCode, province }: FillOutAddressArgs) {
    await page.getByRole('textbox', { name: 'Address', exact: true }).fill(address);
    await page.getByRole('combobox', { name: 'Country', exact: true }).selectOption(country);
    await page.getByRole('combobox', { name: 'Province, territory, state, or region', exact: true }).selectOption(province);
    await page.getByRole('textbox', { name: 'City or town', exact: true }).fill(city);
    await page.getByRole('textbox', { name: 'Postal code or ZIP code', exact: true }).fill(postalCode);
  }

  async fillApplicantInformationForm({ firstName, lastName, sin, day, month, year, page }: FillApplicantInformationFormArgs) {
    await page.getByRole('textbox', { name: 'First name' }).fill(firstName);
    await page.getByRole('textbox', { name: 'Last name' }).fill(lastName);
    await page.getByRole('textbox', { name: 'Social Insurance Number (SIN)' }).fill(sin);
    await page.getByRole('combobox', { name: 'Month' }).selectOption(month);
    await page.getByRole('textbox', { name: 'Day (DD)' }).fill(day);
    await page.getByRole('textbox', { name: 'Year (YYYY)' }).fill(year);
  }
}
