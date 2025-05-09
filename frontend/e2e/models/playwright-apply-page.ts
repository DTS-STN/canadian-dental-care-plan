import { PlaywrightBasePage } from './playwright-base-page';

export class PlaywrightApplyPage extends PlaywrightBasePage {
  async gotoIndexPage() {
    await this.page.goto('/en/apply');
  }

  async isLoaded(applyPage: 'index' | 'file-taxes' | 'tax-filing' | 'terms-and-conditions' | 'type-application', heading?: string | RegExp) {
    let pageInfo: { url: string | RegExp; heading: string | RegExp } | undefined;

    switch (applyPage) {
      case 'index':
        pageInfo = { url: /\/en\/apply/, heading: 'Terms and conditions of use and privacy notice statement' };
        break;

      case 'file-taxes':
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/file-taxes/, heading: 'File your taxes' };
        break;

      case 'tax-filing':
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/tax-filing/, heading: 'Tax filing' };
        break;

      case 'terms-and-conditions':
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/terms-and-conditions/, heading: 'Terms and conditions of use and privacy notice statement' };
        break;

      case 'type-application':
        pageInfo = { url: /\/en\/apply\/[a-f0-9-]+\/type-application/, heading: 'Type of application' };
        break;

      default:
        pageInfo = undefined;
        break;
    }

    if (!pageInfo) throw new Error(`applyPage '${applyPage}' not implemented.`);
    await super.isLoaded(pageInfo.url, heading ?? pageInfo.heading);
  }
}
