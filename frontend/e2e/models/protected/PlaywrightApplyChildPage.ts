import { PlaywrightBasePage } from '../PlaywrightBasePage';

export class PlaywrightApplyChildPage extends PlaywrightBasePage {
  async isLoaded(
    applyChildPage:
      | 'applicant-information'
      | 'marital-status'
      | 'mailing-address'
      | 'home-address'
      | 'phone-number'
      | 'children-cannot-apply-child'
      | 'children-dental-insurance'
      | 'children-confirm-federal-provincial-territorial-benefits'
      | 'children-federal-provincial-territorial-benefits'
      | 'children-information'
      | 'children-parent-or-guardian'
      | 'children'
      | 'confirmation'
      | 'communication-preference'
      | 'email'
      | 'verify-email'
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
    let pageInfo: { url: string | RegExp; heading: string | RegExp } | undefined = undefined;

    switch (applyChildPage) {
      case 'children':
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/child\/children/, heading: "Child(ren)'s application" };
        break;

      case 'children-information':
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/child\/children\/[a-f0-9-]+\/information/, heading: /.*: information/ };
        break;

      case 'children-dental-insurance':
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/child\/children\/[a-f0-9-]+\/dental-insurance/, heading: /.*: access to private dental insurance/ };
        break;

      case 'children-confirm-federal-provincial-territorial-benefits':
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/child\/children\/[a-f0-9-]+\/confirm-federal-provincial-territorial-benefits/, heading: /.*: access to other government dental benefits/ };
        break;

      case 'children-federal-provincial-territorial-benefits':
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/child\/children\/[a-f0-9-]+\/federal-provincial-territorial-benefits/, heading: /.*: access to other federal, provincial or territorial dental benefits/ };
        break;

      case 'applicant-information':
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/child\/applicant-information/, heading: 'Parent or legal guardian personal information' };
        break;

      case 'marital-status':
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/child\/marital-status/, heading: 'Marital Status' };
        break;

      case 'mailing-address':
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/child\/mailing-address/, heading: 'Mailing Address' };
        break;

      case 'home-address':
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/child\/home-address/, heading: 'Home Address' };
        break;

      case 'phone-number':
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/child\/phone-number/, heading: 'Phone Number' };
        break;

      case 'communication-preference':
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/child\/communication-preference/, heading: 'Communication' };
        break;

      case 'email':
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/child\/email/, heading: 'Email' };
        break;
      case 'verify-email':
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/child\/verify-email/, heading: 'Verify your email address' };
        break;

      case 'review-child-information':
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/child\/review-child-information/, heading: 'Review child(ren) information' };
        break;
      case 'review-adult-information':
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/child\/review-adult-information/, heading: 'Review your information' };
        break;

      case 'confirmation':
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/child\/confirmation/, heading: 'Application successfully submitted' };
        break;
      default:
        pageInfo = undefined;
        break;
    }

    if (!pageInfo) throw Error(`applyChildPage '${applyChildPage}' not implemented.`);
    await super.isLoaded(pageInfo.url, heading ?? pageInfo.heading);
  }
}
