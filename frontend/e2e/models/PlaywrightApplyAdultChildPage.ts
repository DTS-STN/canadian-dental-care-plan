import { PlaywrightBasePage } from './PlaywrightBasePage';

export class PlaywrightApplyAdultChildPage extends PlaywrightBasePage {
  async isLoaded(
    applyAdultChildPage:
      | 'applicant-information'
      | 'apply-children'
      | 'apply-yourself'
      | 'children-cannot-apply-child'
      | 'children-dental-insurance'
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
      | 'federal-provincial-territorial-benefits'
      | 'file-taxes'
      | 'living-independently'
      | 'parent-or-guardian'
      | 'partner-information'
      | 'review-adult-information'
      | 'review-child-information'
      | 'tax-filing',
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

      case 'federal-provincial-territorial-benefits':
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/adult-child\/federal-provincial-territorial-benefits/, heading: 'Access to other federal, provincial or territorial dental benefits' };
        break;

      case 'file-taxes':
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/adult-child\/file-taxes/, heading: 'File your taxes' };
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

      case 'tax-filing':
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/adult-child\/tax-filing/, heading: 'Tax filing' };
        break;

      default:
        pageInfo = undefined;
        break;
    }

    if (!pageInfo) throw Error(`applyAdultChildPage '${applyAdultChildPage}' not implemented.`);
    await super.isLoaded(pageInfo.url, heading ?? pageInfo.heading);
  }
}
