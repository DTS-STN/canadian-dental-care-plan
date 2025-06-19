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

interface FillChildrenInformationFormArgs {
  firstName: string;
  lastName: string;
  sin?: string;
  day: string;
  month: string;
  year: string;
  hasSin: boolean;
  isGuardian: boolean;
  page: Page;
}

export class ChildPage extends BasePage {
  async isLoaded(
    applyChildPage:
      | 'applicant-information'
      | 'parent-or-guardian'
      | 'contact-apply-child'
      | 'children-cannot-apply-child'
      | 'new-or-existing-member'
      | 'marital-status'
      | 'mailing-address'
      | 'home-address'
      | 'phone-number'
      | 'children-dental-insurance'
      | 'children-confirm-federal-provincial-territorial-benefits'
      | 'children-federal-provincial-territorial-benefits'
      | 'children-information'
      | 'children'
      | 'confirmation'
      | 'communication-preference'
      | 'email'
      | 'verify-email'
      | 'review-adult-information'
      | 'review-child-information',
    heading?: string | RegExp,
  ) {
    let pageInfo: { url: string | RegExp; heading: string | RegExp } | undefined;

    switch (applyChildPage) {
      case 'children': {
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/child\/children/, heading: "Child(ren)'s application" };
        break;
      }

      case 'children-information': {
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/child\/children\/[a-f0-9-]+\/information/, heading: /.*: information/ };
        break;
      }

      case 'parent-or-guardian': {
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/child\/children\/[a-f0-9-]+\/parent-or-guardian/, heading: 'You must be a parent or legal guardian' };
        break;
      }

      case 'children-cannot-apply-child': {
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/child\/children\/[a-f0-9-]+\/cannot-apply-child/, heading: 'Your child must apply' };
        break;
      }

      case 'contact-apply-child': {
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/child\/contact-apply-child/, heading: 'Contact us to apply for your child' };
        break;
      }

      case 'new-or-existing-member': {
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/child\/new-or-existing-member/, heading: 'New or existing member' };
        break;
      }

      case 'children-dental-insurance': {
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/child\/children\/[a-f0-9-]+\/dental-insurance/, heading: /.*: access to private dental insurance/ };
        break;
      }

      case 'children-confirm-federal-provincial-territorial-benefits': {
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/child\/children\/[a-f0-9-]+\/confirm-federal-provincial-territorial-benefits/, heading: /.*: access to other government dental benefits/ };
        break;
      }

      case 'children-federal-provincial-territorial-benefits': {
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/child\/children\/[a-f0-9-]+\/federal-provincial-territorial-benefits/, heading: /.*: access to other federal, provincial or territorial dental benefits/ };
        break;
      }

      case 'applicant-information': {
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/child\/applicant-information/, heading: 'Parent or legal guardian personal information' };
        break;
      }

      case 'marital-status': {
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/child\/marital-status/, heading: 'Marital Status' };
        break;
      }

      case 'mailing-address': {
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/child\/mailing-address/, heading: 'Mailing Address' };
        break;
      }

      case 'home-address': {
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/child\/home-address/, heading: 'Home Address' };
        break;
      }

      case 'phone-number': {
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/child\/phone-number/, heading: 'Phone Number' };
        break;
      }

      case 'communication-preference': {
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/child\/communication-preference/, heading: 'Communication' };
        break;
      }

      case 'email': {
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/child\/email/, heading: 'Email' };
        break;
      }

      case 'verify-email': {
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/child\/verify-email/, heading: 'Verify your email address' };
        break;
      }

      case 'review-child-information': {
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/child\/review-child-information/, heading: 'Review child(ren) information' };
        break;
      }

      case 'review-adult-information': {
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/child\/review-adult-information/, heading: 'Review your information' };
        break;
      }

      case 'confirmation': {
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/child\/confirmation/, heading: 'Application successfully submitted' };
        break;
      }

      default: {
        pageInfo = undefined;
        break;
      }
    }

    if (!pageInfo) throw new Error(`applyChildPage '${applyChildPage}' not implemented.`);
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

  async fillChildrenInformationForm({ firstName, lastName, sin, day, month, year, hasSin, isGuardian, page }: FillChildrenInformationFormArgs) {
    await page.getByRole('textbox', { name: 'First name' }).fill(firstName);
    await page.getByRole('textbox', { name: 'Last name' }).fill(lastName);
    await page.getByRole('combobox', { name: 'Month' }).selectOption(month);
    await page.getByRole('textbox', { name: 'Day (DD)' }).fill(day);
    await page.getByRole('textbox', { name: 'Year (YYYY)' }).fill(year);
    if (hasSin && sin) {
      await page.getByRole('radio', { name: "Yes, enter the child's 9-digit SIN", exact: true }).check();
      await page.getByRole('textbox', { name: 'Enter the 9-digit SIN' }).fill(sin);
    } else {
      await page.getByRole('radio', { name: 'No, this child does not have a SIN', exact: true }).check();
    }
    await (isGuardian ? page.getByRole('radio', { name: 'Yes', exact: true }).check() : page.getByRole('radio', { name: 'No', exact: true }).check());
  }
}
