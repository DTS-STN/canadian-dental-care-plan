import { BasePage } from '../../base-page';

export class AdultChildPage extends BasePage {
  async isLoaded(
    applyAdultChildPage:
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
    let pageInfo: { url: string | RegExp; heading: string | RegExp } | undefined;

    switch (applyAdultChildPage) {
      case 'applicant-information': {
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/adult-child\/applicant-information/, heading: 'Applicant information' };
        break;
      }

      case 'marital-status': {
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/adult-child\/marital-status/, heading: 'Marital Status' };
        break;
      }

      case 'mailing-address': {
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/adult-child\/mailing-address/, heading: 'Mailing Address' };
        break;
      }

      case 'home-address': {
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/adult-child\/home-address/, heading: 'Home Address' };
        break;
      }

      case 'phone-number': {
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/adult-child\/phone-number/, heading: 'Phone Number' };
        break;
      }

      case 'communication-preference': {
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/adult-child\/communication-preference/, heading: 'Communication' };
        break;
      }

      case 'email': {
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/adult-child\/email/, heading: 'Email' };
        break;
      }
      case 'verify-email': {
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/adult-child\/verify-email/, heading: 'Verify your email address' };
        break;
      }

      case 'children': {
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/adult-child\/children/, heading: "Child(ren)'s application" };
        break;
      }

      case 'children-cannot-apply-child': {
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/adult-child\/children\/[a-f0-9-]+\/cannot-apply-child/, heading: 'Your child must apply' };
        break;
      }

      case 'children-dental-insurance': {
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/adult-child\/children\/[a-f0-9-]+\/dental-insurance/, heading: /.*: access to private dental insurance/ };
        break;
      }

      case 'children-confirm-federal-provincial-territorial-benefits': {
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/adult-child\/children\/[a-f0-9-]+\/confirm-federal-provincial-territorial-benefits/, heading: /.*: access to other government dental benefits/ };
        break;
      }

      case 'children-federal-provincial-territorial-benefits': {
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/adult-child\/children\/[a-f0-9-]+\/federal-provincial-territorial-benefits/, heading: /.*: access to other federal, provincial or territorial dental benefits/ };
        break;
      }

      case 'children-information': {
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/adult-child\/children\/[a-f0-9-]+\/information/, heading: /.*: information/ };
        break;
      }

      case 'children-parent-or-guardian': {
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/adult-child\/children\/[a-f0-9-]+\/parent-or-guardian/, heading: 'You must be a parent or legal guardian' };
        break;
      }

      case 'confirmation': {
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/adult-child\/confirmation/, heading: 'Application successfully submitted' };
        break;
      }

      case 'dental-insurance': {
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/adult-child\/dental-insurance/, heading: 'Access to private dental insurance' };
        break;
      }

      case 'confirm-federal-provincial-territorial-benefits': {
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/adult-child\/confirm-federal-provincial-territorial-benefits/, heading: 'Access to other government dental benefits' };
        break;
      }

      case 'federal-provincial-territorial-benefits': {
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/adult-child\/federal-provincial-territorial-benefits/, heading: 'Access to other federal, provincial or territorial dental benefits' };
        break;
      }

      case 'living-independently': {
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/adult-child\/living-independently/, heading: 'Living independently' };
        break;
      }

      case 'parent-or-guardian': {
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/adult-child\/parent-or-guardian/, heading: 'Parent or legal guardian needs to apply' };
        break;
      }

      case 'new-or-existing-member': {
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/adult-child\/new-or-existing-member/, heading: 'New or existing member' };
        break;
      }

      case 'review-adult-information': {
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/adult-child\/review-adult-information/, heading: 'Review your information' };
        break;
      }

      case 'review-child-information': {
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/adult-child\/review-child-information/, heading: 'Review child(ren) information' };
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
}
