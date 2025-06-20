import { BasePage } from '../../base-page';

interface FillApplicantInformationFormArgs {
  day: string;
  month: string;
  year: string;
}

export class AdultChildPage extends BasePage {
  async isLoaded(
    applyAdultChildPage:
      | 'applicant-information'
      | 'children-cannot-apply-child'
      | 'children-dental-insurance'
      | 'children-confirm-federal-provincial-territorial-benefits'
      | 'children-federal-provincial-territorial-benefits'
      | 'children-information'
      | 'children-parent-or-guardian'
      | 'children'
      | 'confirmation'
      | 'communication-preference'
      | 'date-of-birth'
      | 'dental-insurance'
      | 'dob-eligibility'
      | 'confirm-federal-provincial-territorial-benefits'
      | 'federal-provincial-territorial-benefits'
      | 'living-independently'
      | 'parent-or-guardian'
      | 'review-adult-information'
      | 'review-child-information'
      | 'new-or-existing-member',
    heading?: string | RegExp,
  ) {
    let pageInfo: { url: string | RegExp; heading: string | RegExp } | undefined;

    switch (applyAdultChildPage) {
      case 'applicant-information': {
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/adult-child\/applicant-information/, heading: 'Applicant information' };
        break;
      }

      case 'children': {
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/adult-child\/children/, heading: "Child(ren)'s application" };
        break;
      }

      case 'children-cannot-apply-child': {
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/adult-child\/children\/[a-f0-9-]+\/cannot-apply-child/, heading: 'Your child must apply' };
        break;
      }

      case 'children-dental-insurance': {
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/adult-child\/children\/[a-f0-9-]+\/dental-insurance/, heading: /.*: access to other dental insurance/ };
        break;
      }

      case 'children-confirm-federal-provincial-territorial-benefits': {
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/adult-child\/children\/[a-f0-9-]+\/confirm-federal-provincial-territorial-benefits/, heading: /.*: access to other government dental benefits/ };
        break;
      }

      case 'children-federal-provincial-territorial-benefits': {
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/adult-child\/children\/[a-f0-9-]+\/federal-provincial-territorial-benefits/, heading: /.*: access to other federal, provincial or territorial dental benefits/ };
        break;
      }

      case 'children-information': {
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/adult-child\/children\/[a-f0-9-]+\/information/, heading: /.*: information/ };
        break;
      }

      case 'children-parent-or-guardian': {
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/adult-child\/children\/[a-f0-9-]+\/parent-or-guardian/, heading: 'You must be a parent or legal guardian' };
        break;
      }

      case 'communication-preference': {
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/adult-child\/communication-preference/, heading: 'Communication' };
        break;
      }

      case 'confirmation': {
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/adult-child\/confirmation/, heading: 'Application successfully submitted' };
        break;
      }

      case 'dental-insurance': {
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/adult-child\/dental-insurance/, heading: 'Access to other dental insurance' };
        break;
      }

      case 'confirm-federal-provincial-territorial-benefits': {
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/adult-child\/confirm-federal-provincial-territorial-benefits/, heading: 'Access to other government dental benefits' };
        break;
      }

      case 'federal-provincial-territorial-benefits': {
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/adult-child\/federal-provincial-territorial-benefits/, heading: 'Access to other federal, provincial or territorial dental benefits' };
        break;
      }

      case 'living-independently': {
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/adult-child\/living-independently/, heading: 'Living independently' };
        break;
      }

      case 'parent-or-guardian': {
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/adult-child\/parent-or-guardian/, heading: 'Parent or legal guardian needs to apply' };
        break;
      }

      case 'new-or-existing-member': {
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/adult-child\/new-or-existing-member/, heading: 'New or existing member' };
        break;
      }

      case 'review-adult-information': {
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/adult-child\/review-adult-information/, heading: 'Review your information' };
        break;
      }

      case 'review-child-information': {
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/adult-child\/review-child-information/, heading: 'Review child(ren) information' };
        break;
      }

      default: {
        pageInfo = undefined;
        break;
      }
    }

    if (!pageInfo) throw new Error(`applyAdultChildPage '${applyAdultChildPage}' not implemented.`);
    await super.isLoaded(pageInfo.url, heading ?? pageInfo.heading);
  }

  async fillApplicantInformationForm({ day, month, year }: FillApplicantInformationFormArgs) {
    await this.isLoaded('applicant-information');
    await this.page.getByRole('textbox', { name: 'First name' }).fill('John');
    await this.page.getByRole('textbox', { name: 'Last name' }).fill('Smith');
    await this.page.getByRole('textbox', { name: 'Social Insurance Number (SIN)' }).fill('900000001');
    await this.page.getByRole('combobox', { name: 'Month' }).selectOption(month);
    await this.page.getByRole('textbox', { name: 'Day (DD)' }).fill(day);
    await this.page.getByRole('textbox', { name: 'Year (YYYY)' }).fill(year);
  }

  async fillCommunicationForm() {
    await this.isLoaded('communication-preference');

    await this.page.getByRole('radiogroup', { name: 'What is your preferred official language of communication?' }).getByRole('radio', { name: 'English' }).check();
    await this.page.getByRole('radiogroup', { name: 'What is your preferred method of communication for Sun Life?' }).getByRole('radio', { name: 'Email' }).check();
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

    await this.page.getByRole('radiogroup', { name: 'Federal benefits' }).getByRole('radio', { name: 'Yes, I have federal dental benefits' }).check();
    await this.page.getByRole('radiogroup', { name: 'Provincial or territorial benefits' }).getByRole('radio', { name: 'Yes, I have provincial or territorial dental benefits' }).check();

    await this.page.getByRole('radiogroup', { name: 'Federal benefits' }).getByRole('radio', { name: 'Correctional Service Canada Health Services' }).check();
    await this.page.getByRole('group', { name: 'Provincial or territorial benefits' }).getByRole('combobox', { name: 'If yes, through which province or territory?' }).selectOption('Alberta');

    await this.page.getByRole('radiogroup', { name: 'Provincial or territorial benefits' }).getByRole('radio', { name: 'Alberta Adult Health Benefit' }).check();
  }
}
