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
      | 'communication-preference'
      | 'confirmation'
      | 'dental-insurance'
      | 'confirm-federal-provincial-territorial-benefits'
      | 'federal-provincial-territorial-benefits'
      | 'living-independently'
      | 'mailing-address'
      | 'marital-status'
      | 'parent-or-guardian'
      | 'phone-number'
      | 'review-information',
    heading?: string | RegExp,
  ) {
    let pageInfo: { url: string | RegExp; heading: string | RegExp } | undefined;

    switch (applyAdultPage) {
      case 'applicant-information': {
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/adult\/applicant-information/, heading: 'Applicant information' };
        break;
      }

      case 'communication-preference': {
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/adult\/communication-preference/, heading: 'Communication' };
        break;
      }

      case 'confirmation': {
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/adult\/confirmation/, heading: 'Application successfully submitted' };
        break;
      }

      case 'dental-insurance': {
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/adult\/dental-insurance/, heading: 'Access to private dental insurance' };
        break;
      }

      case 'confirm-federal-provincial-territorial-benefits': {
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/adult\/confirm-federal-provincial-territorial-benefits/, heading: 'Access to other government dental benefits' };
        break;
      }

      case 'federal-provincial-territorial-benefits': {
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/adult\/federal-provincial-territorial-benefits/, heading: 'Access to other federal, provincial or territorial dental benefits' };
        break;
      }

      case 'living-independently': {
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/adult\/living-independently/, heading: 'Living independently' };
        break;
      }

      case 'mailing-address': {
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/adult\/mailing-address/, heading: 'Mailing address' };
        break;
      }

      case 'marital-status': {
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/adult\/marital-status/, heading: 'Marital status' };
        break;
      }

      case 'parent-or-guardian': {
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/adult\/parent-or-guardian/, heading: 'Parent or guardian needs to apply' };
        break;
      }

      case 'phone-number': {
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/adult\/phone-number/, heading: 'Phone number' };
        break;
      }

      case 'review-information': {
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/adult\/review-information/, heading: 'Review your information' };
        break;
      }

      default: {
        pageInfo = undefined;
        break;
      }
    }

    if (!pageInfo) throw new Error(`applyAdultPage '${applyAdultPage}' not implemented.`);
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
