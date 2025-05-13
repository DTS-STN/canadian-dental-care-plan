import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

// Calculate date based on the given age
export function calculateDOB(age: number, date: Date = new Date()): { year: string; month: string; day: string } {
  const year = date.getFullYear() - age;
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');

  return { year: year.toString(), month, day };
}

export async function clickContinue(page: Page) {
  const continueButton = page.getByRole('button', { name: 'Continue' });
  await expect(continueButton).toBeEnabled();
  await continueButton.click();
}
