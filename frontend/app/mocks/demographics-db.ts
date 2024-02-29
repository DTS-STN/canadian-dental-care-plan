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
  nameEn: 'Born in Canada',
  nameFr: '(FR) Born in Canada',
});

demographicDB.bornType.create({
  nameEn: 'Born outside Canada',
  nameFr: '(FR) Born outside Canada',
});
demographicDB.bornType.create({
  nameEn: 'Prefer not to answer',
  nameFr: '(FR) Prefer not to answer',
});

demographicDB.question2.create({
  id: 'question2',
  nameEn: 'English2',
  nameFr: 'Anglais2',
});

export { demographicDB };
