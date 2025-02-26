import { PlaywrightBasePage } from './PlaywrightBasePage';

export class PlaywrightApplyAdultPage extends PlaywrightBasePage {
  async isLoaded(
    applyAdultPage:
      | 'applicant-information'
      | 'communication-preference'
      | 'confirmation'
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
      | 'review-information',
    heading?: string | RegExp,
  ) {
    let pageInfo: { url: string | RegExp; heading: string | RegExp } | undefined = undefined;

    switch (applyAdultPage) {
      case 'applicant-information':
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/adult\/applicant-information/, heading: 'Applicant information' };
        break;

      case 'communication-preference':
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/adult\/communication-preference/, heading: 'Communication' };
        break;

      case 'confirmation':
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/adult\/confirmation/, heading: 'Application successfully submitted' };
        break;

      case 'contact-information':
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/adult\/contact-information/, heading: 'Contact information' };
        break;

      case 'date-of-birth':
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/adult\/date-of-birth/, heading: 'Date of birth' };
        break;

      case 'dental-insurance':
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/adult\/dental-insurance/, heading: 'Access to other dental insurance' };
        break;

      case 'disability-tax-credit':
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/adult\/disability-tax-credit/, heading: 'Disability tax credit' };
        break;

      case 'dob-eligibility':
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/adult\/dob-eligibility/, heading: 'Find out when you can apply' };
        break;

      case 'confirm-federal-provincial-territorial-benefits':
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/adult\/confirm-federal-provincial-territorial-benefits/, heading: 'Access to other government dental benefits' };
        break;

      case 'federal-provincial-territorial-benefits':
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/adult\/federal-provincial-territorial-benefits/, heading: 'Access to other federal, provincial or territorial dental benefits' };
        break;

      case 'living-independently':
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/adult\/living-independently/, heading: 'Living independently' };
        break;

      case 'parent-or-guardian':
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/adult\/parent-or-guardian/, heading: 'Parent or guardian needs to apply' };
        break;

      case 'partner-information':
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/adult\/partner-information/, heading: 'Spouse or common-law partner information' };
        break;

      case 'review-information':
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/adult\/review-information/, heading: 'Review your information' };
        break;

      default:
        pageInfo = undefined;
        break;
    }

    if (!pageInfo) throw Error(`applyAdultPage '${applyAdultPage}' not implemented.`);
    await super.isLoaded(pageInfo.url, heading ?? pageInfo.heading);
  }
}
