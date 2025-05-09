import { PlaywrightBasePage } from '../playwright-base-page';

export class PlaywrightApplyAdultPage extends PlaywrightBasePage {
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
      case 'applicant-information':
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/adult\/applicant-information/, heading: 'Applicant information' };
        break;

      case 'marital-status':
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/adult\/marital-status/, heading: 'Marital Status' };
        break;

      case 'mailing-address':
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/adult\/mailing-address/, heading: 'Mailing Address' };
        break;

      case 'home-address':
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/adult\/home-address/, heading: 'Home Address' };
        break;

      case 'phone-number':
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/adult\/phone-number/, heading: 'Phone Number' };
        break;

      case 'communication-preference':
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/adult\/communication-preference/, heading: 'Communication' };
        break;

      case 'email':
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/adult\/email/, heading: 'Email' };
        break;
      case 'verify-email':
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/adult\/verify-email/, heading: 'Verify your email address' };
        break;

      case 'confirmation':
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/adult\/confirmation/, heading: 'Application successfully submitted' };
        break;

      case 'dental-insurance':
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/adult\/dental-insurance/, heading: 'Access to private dental insurance' };
        break;

      case 'confirm-federal-provincial-territorial-benefits':
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/adult\/confirm-federal-provincial-territorial-benefits/, heading: 'Access to other government dental benefits' };
        break;

      case 'federal-provincial-territorial-benefits':
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/adult\/federal-provincial-territorial-benefits/, heading: 'Access to other federal, provincial or territorial dental benefits' };
        break;

      case 'living-independently':
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/adult\/living-independently/, heading: 'Living independently' };
        break;

      case 'parent-or-guardian':
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/adult\/parent-or-guardian/, heading: 'Parent or legal guardian needs to apply' };
        break;

      case 'new-or-existing-member':
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/adult\/new-or-existing-member/, heading: 'New or existing member' };
        break;

      case 'review-information':
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/adult\/review-information/, heading: 'Review your information' };
        break;

      default:
        pageInfo = undefined;
        break;
    }

    if (!pageInfo) throw new Error(`Protected applyAdultPage '${applyAdultPage}' not implemented.`);
    await super.isLoaded(pageInfo.url, heading ?? pageInfo.heading);
  }
}
