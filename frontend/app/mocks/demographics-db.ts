import { fakerEN_CA as faker } from '@faker-js/faker';
import { factory, oneOf, primaryKey } from '@mswjs/data';

import { db } from './db';

// (Optional) Seed `faker` to ensure reproducible
// random values of model properties.
faker.seed(456);

const demographicDB = factory({
  bornType: {
    id: primaryKey(faker.string.uuid),
    nameEn: String,
    nameFr: String,
  },

  question2: {
    id: primaryKey(faker.string.uuid),
    nameEn: String,
    nameFr: String,
  },
});

demographicDB.bornType.create({
  nameEn: 'English1',
  nameFr: 'Anglais1',
});

demographicDB.bornType.create({
  nameEn: 'English2',
  nameFr: 'Anglais2',
});
demographicDB.bornType.create({
  nameEn: 'English3',
  nameFr: 'Anglais3',
});

demographicDB.question2.create({
  id: 'question2',
  nameEn: 'English2',
  nameFr: 'Anglais2',
});

export { demographicDB };
