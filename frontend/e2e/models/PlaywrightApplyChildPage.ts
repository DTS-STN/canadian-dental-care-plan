import { expect } from '@playwright/test';

import { fillOutAddress } from '../utils/helpers';
import { PlaywrightBasePage } from './PlaywrightBasePage';

export class PlaywrightApplyChildPage extends PlaywrightBasePage {
  async isLoaded(
    applyChildPage:
      | 'applicant-information'
      | 'communication-preference'
      | 'children'
      | 'children-cannot-apply-child'
      | 'children-information'
      | 'confirmation'
      | 'contact-information'
      | 'children-dental-insurance'
      | 'children-federal-provincial-territorial-benefits'
      | 'file-taxes'
      | 'parent-or-guardian'
      | 'review-adult-information'
      | 'review-child-information'
      | 'tax-filing',
    heading?: string | RegExp,
  ) {
    let pageInfo: { url: string | RegExp; heading: string | RegExp } | undefined = undefined;

    switch (applyChildPage) {
      case 'applicant-information':
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/child\/applicant-information/, heading: 'Parent or legal guardian personal information' };
        break;

      case 'communication-preference':
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/child\/communication-preference/, heading: 'Communication' };
        break;

      case 'children':
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/child\/children/, heading: "Child(ren)'s application" };
        break;

      case 'children-cannot-apply-child':
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/child\/children\/[a-f0-9-]+\/cannot-apply-child/, heading: 'Find out when you can apply' };
        break;

      case 'children-information':
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/child\/children\/[a-f0-9-]+\/information/, heading: /.*: information/ };
        break;

      case 'confirmation':
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/child\/confirmation/, heading: 'Application successfully submitted' };
        break;

      case 'contact-information':
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/child\/contact-information/, heading: 'Contact information' };
        break;

      case 'children-dental-insurance':
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/child\/children\/[a-f0-9-]+\/dental-insurance/, heading: /.*: access to other dental insurance/ };
        break;

      case 'children-federal-provincial-territorial-benefits':
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/child\/children\/[a-f0-9-]+\/federal-provincial-territorial-benefits/, heading: 'Access to other federal, provincial or territorial dental benefits' };
        break;

      case 'file-taxes':
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/child\/file-taxes/, heading: 'File your taxes' };
        break;

      case 'parent-or-guardian':
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/child\/children\/[a-f0-9-]+\/parent-or-guardian/, heading: 'You must be a parent or legal guardian' };
        break;

      case 'review-adult-information':
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/child\/review-adult-information/, heading: 'Review your information' };
        break;

      case 'review-child-information':
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/child\/review-child-information/, heading: 'Review child(ren) information' };
        break;

      case 'tax-filing':
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/child\/tax-filing/, heading: 'Tax filing' };
        break;

      default:
        pageInfo = undefined;
        break;
    }

    if (!pageInfo) throw Error(`applyChildPage '${applyChildPage}' not implemented.`);
    await super.isLoaded(pageInfo.url, heading ?? pageInfo.heading);
  }

  async fillTaxFilingForm(fileTaxes: string) {
    await this.isLoaded('tax-filing');
    await this.page.getByRole('radio', { name: fileTaxes, exact: true }).check();
  }

  async fillApplicantInformationForm() {
    await this.isLoaded('applicant-information');
    await this.page.getByRole('textbox', { name: 'First name' }).fill('John');
    await this.page.getByRole('textbox', { name: 'Last name' }).fill('Smith');
    await this.page.getByRole('combobox', { name: 'Month' }).selectOption('01');
    await this.page.getByRole('textbox', { name: 'Day (DD)' }).fill('01');
    await this.page.getByRole('textbox', { name: 'Year (YYYY)' }).fill('1985');
    await this.page.getByRole('textbox', { name: 'Social Insurance Number (SIN)' }).fill('900000001');
    await this.page.getByRole('radio', { name: 'Single' }).check();
  }

  async fillContactInformationForm() {
    await this.isLoaded('contact-information');
    //invalid phone number
    await this.page.getByRole('group', { name: 'Phone number' }).getByRole('textbox', { name: 'Phone number (optional)', exact: true }).fill('111');
    await this.page.getByRole('button', { name: 'Continue' }).click();
    await expect(this.page.getByRole('link', { name: "Phone number does not exist. If it's an international phone number, add '+' in front" })).toBeVisible();

    await this.page.getByRole('group', { name: 'Phone number' }).getByRole('textbox', { name: 'Phone number (optional)', exact: true }).fill('2345678901');
    await this.page.getByRole('group', { name: 'Phone number' }).getByRole('textbox', { name: 'Alternate phone number (optional)', exact: true }).fill('2345678902');

    //invalid email
    await this.page.getByRole('group', { name: 'Email' }).getByRole('textbox', { name: 'Email address (optional)', exact: true }).fill('123mail');
    await this.page.getByRole('button', { name: 'Continue' }).click();
    await expect(this.page.getByRole('link', { name: 'Enter an email address in the correct format, such as name@example.com' })).toBeVisible();

    //email does not match
    await this.page.getByRole('group', { name: 'Email' }).getByRole('textbox', { name: 'Email address (optional)', exact: true }).fill('123@mail.com');
    await this.page.getByRole('group', { name: 'Email' }).getByRole('textbox', { name: 'Confirm email address (optional)', exact: true }).fill('124@mail.com');
    await this.page.getByRole('button', { name: 'Continue' }).click();
    await expect(this.page.getByRole('link', { name: 'The email addresses entered do not match' })).toBeVisible();

    await this.page.getByRole('group', { name: 'Email' }).getByRole('textbox', { name: 'Confirm email address (optional)', exact: true }).fill('123@mail.com');

    //fillout mailing address
    await fillOutAddress({ page: this.page, group: 'Mailing address', address: '123 street', unit: '404', country: 'Canada', province: 'Ontario', city: 'Ottawa', postalCode: 'N3B1E6' });
    //fillout home address
    await fillOutAddress({ page: this.page, group: 'Home address', address: '555 street', unit: '', country: 'Canada', province: 'Quebec', city: 'Montreal', postalCode: 'J3T2K3' });
  }

  async fillCommunicationForm() {
    await this.isLoaded('communication-preference');

    await this.page.getByRole('group', { name: 'What is your preferred official language of communication?' }).getByRole('radio', { name: 'English' }).check();
    await this.page.getByRole('group', { name: 'What is your preferred method of communication for Sun Life?' }).getByRole('radio', { name: 'Email' }).check();
  }
}
