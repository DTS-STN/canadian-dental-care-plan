import { fakerEN_CA as faker } from '@faker-js/faker';
import { factory, primaryKey } from '@mswjs/data';

// (Optional) Seed `faker` to ensure reproducible
// random values of model properties.
faker.seed(123);

const phoneFormat = '([0-9]{3}) [0-9]{3}-[0-9]{4}';
const fullAddressFormat = '{{location.street}} {{location.buildingNumber}} {{location.secondaryAddress}}\n{{location.city}} {{location.state}} {{location.zipCode}}';

const db = factory({
  user: {
    id: primaryKey(faker.string.uuid),
    firstName: faker.person.firstName,
    lastName: faker.person.lastName,
    phoneNumber: () => faker.helpers.fromRegExp(phoneFormat),
    homeAddress: () => faker.helpers.fake(fullAddressFormat),
    mailingAddress: () => faker.helpers.fake(fullAddressFormat),
    preferredLanguage: () => faker.helpers.arrayElement(['en', 'fr']),
  },
});

// seed users
db.user.create({
  id: '00000000-0000-0000-0000-000000000000',
  firstName: 'John',
  lastName: 'Maverick',
  preferredLanguage: 'fr',
});

export { db };
