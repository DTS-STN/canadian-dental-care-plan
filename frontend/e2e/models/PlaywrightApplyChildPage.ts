import { calculateDOB } from '../utils/helpers';
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
      | 'children-dental-insurance'
      | 'children-confirm-federal-provincial-territorial-benefits'
      | 'children-federal-provincial-territorial-benefits'
      | 'parent-or-guardian'
      | 'review-adult-information'
      | 'review-child-information',
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

      case 'children-dental-insurance':
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/child\/children\/[a-f0-9-]+\/dental-insurance/, heading: /.*: access to private dental insurance/ };
        break;

      case 'children-confirm-federal-provincial-territorial-benefits':
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/child\/children\/[a-f0-9-]+\/confirm-federal-provincial-territorial-benefits/, heading: /.*: access to other government dental benefits/ };
        break;

      case 'children-federal-provincial-territorial-benefits':
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/child\/children\/[a-f0-9-]+\/federal-provincial-territorial-benefits/, heading: 'Access to other federal, provincial or territorial dental benefits' };
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

      default:
        pageInfo = undefined;
        break;
    }

    if (!pageInfo) throw Error(`applyChildPage '${applyChildPage}' not implemented.`);
    await super.isLoaded(pageInfo.url, heading ?? pageInfo.heading);
  }

  async fillChildInformationForm(age: number, isParentOrGuardian: string) {
    await this.isLoaded('children-information');

    await this.page.getByRole('textbox', { name: 'First name' }).fill('Josh');
    await this.page.getByRole('textbox', { name: 'Last name' }).fill('Smith');

    const { year, month, day } = calculateDOB(age);

    await this.page.getByRole('combobox', { name: 'Month' }).selectOption(month);
    await this.page.getByRole('textbox', { name: 'Day (DD)' }).fill(day);
    await this.page.getByRole('textbox', { name: 'Year (YYYY)' }).fill(year);

    await this.page.getByRole('group', { name: 'Does this child have a Social Insurance Number (SIN)?' }).getByRole('radio', { name: "Yes, enter the child's 9-digit SIN" }).check();
    await this.page.getByRole('textbox', { name: 'Enter the 9-digit SIN' }).fill('700000003');

    await this.page.getByRole('group', { name: 'Are you the parent or legal guardian of this child?' }).getByRole('radio', { name: isParentOrGuardian }).check();
  }

  async fillApplicantInformationForm() {
    await this.isLoaded('applicant-information');
    await this.page.getByRole('textbox', { name: 'First name' }).fill('John');
    await this.page.getByRole('textbox', { name: 'Last name' }).fill('Smith');
    await this.page.getByRole('combobox', { name: 'Month' }).selectOption('01');
    await this.page.getByRole('textbox', { name: 'Day (DD)' }).fill('01');
    await this.page.getByRole('textbox', { name: 'Year (YYYY)' }).fill('1985');
    await this.page.getByRole('textbox', { name: 'Social Insurance Number (SIN)' }).fill('900000001');
  }

  async fillCommunicationForm() {
    await this.isLoaded('communication-preference');

    await this.page.getByRole('group', { name: 'What is your preferred official language of communication?' }).getByRole('radio', { name: 'English' }).check();
    await this.page.getByRole('group', { name: 'What is your preferred method of communication for Sun Life?' }).getByRole('radio', { name: 'Email' }).check();
  }
}
