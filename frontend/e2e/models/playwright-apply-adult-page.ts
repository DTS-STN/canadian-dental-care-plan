import { PlaywrightBasePage } from './playwright-base-page';

export class PlaywrightApplyAdultPage extends PlaywrightBasePage {
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
}
