import { expect } from '@playwright/test';

import { fillOutAddress } from '../utils/helpers';
import { PlaywrightBasePage } from './PlaywrightBasePage';

interface FillDateOfBirthFormArgs {
  allChildrenUnder18: string;
  day: string;
  month: string;
  year: string;
}

export class PlaywrightApplyAdultChildPage extends PlaywrightBasePage {
  async isLoaded(
    applyAdultChildPage:
      | 'applicant-information'
      | 'apply-children'
      | 'apply-yourself'
      | 'children-cannot-apply-child'
      | 'children-dental-insurance'
      | 'children-confirm-federal-provincial-territorial-benefits'
      | 'children-federal-provincial-territorial-benefits'
      | 'children-information'
      | 'children-parent-or-guardian'
      | 'children'
      | 'confirmation'
      | 'communication-preference'
      | 'contact-apply-child'
      | 'contact-information'
      | 'date-of-birth'
      | 'dental-insurance'
      | 'disability-tax-credit'
      | 'dob-eligibility'
      | 'confirm-federal-provincial-territorial-benefits'
      | 'federal-provincial-territorial-benefits'
      | 'living-independently'
      | 'parent-or-guardian'
      | 'partner-information'
      | 'review-adult-information'
      | 'review-child-information',
    heading?: string | RegExp,
  ) {
    let pageInfo: { url: string | RegExp; heading: string | RegExp } | undefined = undefined;

    switch (applyAdultChildPage) {
      case 'applicant-information':
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/adult-child\/applicant-information/, heading: 'Applicant information' };
        break;

      case 'apply-children':
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/adult-child\/apply-children/, heading: 'Apply for your child(ren)' };
        break;

      case 'apply-yourself':
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/adult-child\/apply-yourself/, heading: 'Apply for yourself' };
        break;

      case 'children':
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/adult-child\/children/, heading: "Child(ren)'s application" };
        break;

      case 'children-cannot-apply-child':
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/adult-child\/children\/[a-f0-9-]+\/cannot-apply-child/, heading: 'You cannot apply for your child' };
        break;

      case 'children-dental-insurance':
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/adult-child\/children\/[a-f0-9-]+\/dental-insurance/, heading: /.*: access to other dental insurance/ };
        break;

      case 'children-confirm-federal-provincial-territorial-benefits':
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/adult-child\/children\/[a-f0-9-]+\/confirm-federal-provincial-territorial-benefits/, heading: /.*: access to other government dental benefits/ };
        break;

      case 'children-federal-provincial-territorial-benefits':
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/adult-child\/children\/[a-f0-9-]+\/federal-provincial-territorial-benefits/, heading: /.*: access to other federal, provincial or territorial dental benefits/ };
        break;

      case 'children-information':
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/adult-child\/children\/[a-f0-9-]+\/information/, heading: /.*: information/ };
        break;

      case 'children-parent-or-guardian':
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/adult-child\/children\/[a-f0-9-]+\/parent-or-guardian/, heading: 'You must be a parent or legal guardian' };
        break;

      case 'communication-preference':
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/adult-child\/communication-preference/, heading: 'Communication' };
        break;

      case 'contact-apply-child':
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/adult-child\/contact-apply-child/, heading: 'Contact us to apply for your child' };
        break;

      case 'contact-information':
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/adult-child\/contact-information/, heading: 'Contact information' };
        break;

      case 'confirmation':
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/adult-child\/confirmation/, heading: 'Application successfully submitted' };
        break;

      case 'date-of-birth':
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/adult-child\/date-of-birth/, heading: 'Age' };
        break;

      case 'dental-insurance':
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/adult-child\/dental-insurance/, heading: 'Access to other dental insurance' };
        break;

      case 'disability-tax-credit':
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/adult-child\/disability-tax-credit/, heading: 'Disability tax credit' };
        break;

      case 'dob-eligibility':
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/adult-child\/dob-eligibility/, heading: 'Find out when you can apply' };
        break;

      case 'confirm-federal-provincial-territorial-benefits':
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/adult-child\/confirm-federal-provincial-territorial-benefits/, heading: 'Access to other government dental benefits' };
        break;

      case 'federal-provincial-territorial-benefits':
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/adult-child\/federal-provincial-territorial-benefits/, heading: 'Access to other federal, provincial or territorial dental benefits' };
        break;

      case 'living-independently':
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/adult-child\/living-independently/, heading: 'Living independently' };
        break;

      case 'parent-or-guardian':
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/adult-child\/parent-or-guardian/, heading: 'Parent or legal guardian needs to apply' };
        break;

      case 'partner-information':
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/adult-child\/partner-information/, heading: 'Spouse or common-law partner information' };
        break;

      case 'review-adult-information':
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/adult-child\/review-adult-information/, heading: 'Review your information' };
        break;

      case 'review-child-information':
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/adult-child\/review-child-information/, heading: 'Review child(ren) information' };
        break;

      default:
        pageInfo = undefined;
        break;
    }

    if (!pageInfo) throw Error(`applyAdultChildPage '${applyAdultChildPage}' not implemented.`);
    await super.isLoaded(pageInfo.url, heading ?? pageInfo.heading);
  }

  async fillDateOfBirthForm({ allChildrenUnder18, day, month, year }: FillDateOfBirthFormArgs) {
    await this.isLoaded('date-of-birth');
    await this.page.getByRole('combobox', { name: 'Month' }).selectOption(month);
    await this.page.getByRole('textbox', { name: 'Day (DD)' }).fill(day);
    await this.page.getByRole('textbox', { name: 'Year (YYYY)' }).fill(year);
    await this.page.getByRole('group', { name: 'Are all the children you are applying for under 18?' }).getByRole('radio', { name: allChildrenUnder18 }).check();
  }

  async fillApplicantInformationForm() {
    await this.isLoaded('applicant-information');
    await this.page.getByRole('textbox', { name: 'First name' }).fill('John');
    await this.page.getByRole('textbox', { name: 'Last name' }).fill('Smith');
    await this.page.getByRole('textbox', { name: 'Social Insurance Number (SIN)' }).fill('900000001');
    await this.page.getByRole('radio', { name: 'Married' }).check();
  }

  async fillPartnerInformationForm() {
    await this.isLoaded('partner-information');
    await this.page.getByRole('textbox', { name: 'First name' }).fill('Mary');
    await this.page.getByRole('textbox', { name: 'Last name' }).fill('Smith');
    await this.page.getByRole('combobox', { name: 'Month' }).selectOption('01');
    await this.page.getByRole('textbox', { name: 'Day (DD)' }).fill('01');
    await this.page.getByRole('textbox', { name: 'Year (YYYY)' }).fill('1960');

    //check if sin is unique
    await this.page.getByRole('textbox', { name: 'Social Insurance Number (SIN)' }).fill('900000001');
    await this.page.getByRole('button', { name: 'Continue' }).click();
    await expect(this.page.getByRole('link', { name: 'he Social Insurance Number (SIN) must be unique' })).toBeVisible();

    await this.page.getByRole('textbox', { name: 'Social Insurance Number (SIN)' }).fill('800000002');
    await this.page.getByRole('checkbox', { name: 'I confirm that my spouse or common-law partner is aware and has agreed to share their personal information.' }).check();
  }

  async fillContactInformationForm() {
    await this.isLoaded('contact-information');
    //invalid phone number
    await this.page.getByRole('group', { name: 'Phone number' }).getByRole('textbox', { name: 'Phone number (optional)', exact: true }).fill('111');
    await this.page.getByRole('button', { name: 'Continue' }).click();
    await expect(this.page.getByRole('link', { name: 'Invalid phone number' })).toBeVisible();

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

  async fillDentalInsuranceForm() {
    await this.isLoaded('dental-insurance');
    await this.page.getByRole('radio', { name: 'Yes, I have access to dental insurance or coverage', exact: true }).check();
  }

  async fillConfirmOtherDentalBenefitsForm() {
    await this.isLoaded('confirm-federal-provincial-territorial-benefits');
    await this.page.getByRole('radio', { name: 'Yes, I have federal, provincial or territorial dental benefits', exact: true }).check();
  }

  async fillOtherDentalBenefitsForm() {
    await this.isLoaded('federal-provincial-territorial-benefits');

    await this.page.getByRole('group', { name: 'Federal benefits' }).getByRole('radio', { name: 'Yes, I have federal dental benefits' }).check();
    await this.page.getByRole('group', { name: 'Provincial or territorial benefits' }).getByRole('radio', { name: 'Yes, I have provincial or territorial dental benefits' }).check();

    await this.page.getByRole('group', { name: 'Federal benefits' }).getByRole('radio', { name: 'Correctional Service Canada Health Services' }).check();
    await this.page.getByRole('group', { name: 'Provincial or territorial benefits' }).getByRole('combobox', { name: 'If yes, through which province or territory?' }).selectOption('Alberta');

    await this.page.getByRole('group', { name: 'Provincial or territorial benefits' }).getByRole('radio', { name: 'Alberta Adult Health Benefits' }).check();
  }
}
