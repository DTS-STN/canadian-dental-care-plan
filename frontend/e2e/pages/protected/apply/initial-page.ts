import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

import { BasePage } from '../../base-page';

export class InitialPage extends BasePage {
  async gotoIndexPage() {
    await this.page.goto('/en/protected/apply');
  }

  async isLoaded(applyPage: 'index' | 'file-taxes' | 'tax-filing' | 'terms-and-conditions' | 'type-application', heading?: string | RegExp) {
    let pageInfo: { url: string | RegExp; heading: string | RegExp } | undefined;

    switch (applyPage) {
      case 'index': {
        pageInfo = { url: /\/en\/apply/, heading: 'Terms and conditions of use and privacy notice statement' };
        break;
      }

      case 'file-taxes': {
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/file-taxes/, heading: 'File your taxes' };
        break;
      }

      case 'tax-filing': {
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/tax-filing/, heading: 'Tax filing' };
        break;
      }

      case 'terms-and-conditions': {
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/terms-and-conditions/, heading: 'Terms and conditions of use and privacy notice statement' };
        break;
      }

      case 'type-application': {
        pageInfo = { url: /\/en\/protected\/apply\/[a-f0-9-]+\/type-application/, heading: 'Type of application' };
        break;
      }

      default: {
        pageInfo = undefined;
        break;
      }
    }

    if (!pageInfo) throw new Error(`Protected applyPage '${applyPage}' not implemented.`);
    await super.isLoaded(pageInfo.url, heading ?? pageInfo.heading);
  }

  async acceptLegalCheckboxes(page: Page) {
    const checkboxes = ['I have read the Terms and Conditions', 'I have read the Privacy Notice Statement', 'I consent to the sharing of data'];

    for (const label of checkboxes) {
      const checkbox = page.getByRole('checkbox', { name: label });
      await expect(checkbox).toBeVisible();
      await checkbox.check();
    }
  }
}
