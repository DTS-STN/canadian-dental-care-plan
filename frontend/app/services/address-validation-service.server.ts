import { z } from 'zod';

import { getLogger } from '~/utils/logging.server';

const addressValidationSchema = z.object({
  isCorrect: z.boolean().optional(),
});

function createAddressValidationService() {
  const logger = getLogger('address-validation-service.server');

  async function isValidAddress(addressString: string) {
    const url = `https://api.example.com/address/correct/${addressString}`;
    const response = await fetch(url);

    if (response.ok) {
      const validationData = addressValidationSchema.parse(await response.json());

      return validationData.isCorrect ?? false;
    }

    logger.error('%j', {
      message: 'Failed to validate the address',
      status: response.status,
      statusText: response.statusText,
      url: url,
      responseBody: await response.text(),
    });

    throw new Error(`Failed to validate the address. Status: ${response.status}, Status Text: ${response.statusText}`);
  }

  return { isValidAddress };
}

export const addressValidationService = createAddressValidationService();
