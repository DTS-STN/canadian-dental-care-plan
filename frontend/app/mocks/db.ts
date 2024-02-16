import { fakerEN_CA as faker } from '@faker-js/faker';
import { factory, oneOf, primaryKey } from '@mswjs/data';

// (Optional) Seed `faker` to ensure reproducible
// random values of model properties.
faker.seed(123);

const phoneFormat = '([0-9]{3}) [0-9]{3}-[0-9]{4}';

const db = factory({
  user: {
    id: primaryKey(faker.string.uuid),
    firstName: faker.person.firstName,
    lastName: faker.person.lastName,
    phoneNumber: () => faker.helpers.fromRegExp(phoneFormat),
    homeAddress: () => 'home-address-id',
    mailingAddress: () => 'mailing-address-id',
    preferredLanguage: () => faker.helpers.arrayElement(['en', 'fr']),
  },
  // address field names are based off of Power Platform API elements
  address: {
    id: primaryKey(String),
    addressApartmentUnitNumber: faker.location.buildingNumber,
    addressStreet: faker.location.street,
    addressCity: faker.location.city,
    addressProvince: () => faker.location.state({ abbreviated: true }),
    addressPostalZipCode: faker.location.zipCode,
    addressCountry: () => 'CAN',
  },
  preferredLanguage: {
    id: primaryKey(String),
    nameEn: String,
    nameFr: String,
  },
  letter: {
    referenceId: () => faker.string.alphanumeric(10),
    dateSent: () => faker.date.past({ years: 1 }),
    userId: String,
    nameEn: String,
    nameFr: String,
    id: primaryKey(faker.string.uuid),
  },
  letterType: {
    id: primaryKey(faker.string.uuid),
    code: String,
    nameEn: String,
    nameFr: String,
  },
  pdf: {
    referenceId: String,
    id: primaryKey(faker.string.uuid),
  },
  country: {
    code: primaryKey(String),
    nameEn: String,
    nameFr: String,
  },
  region: {
    code: primaryKey(String),
    country: oneOf('country'),
    nameEn: String,
    nameFr: String,
  },
});

// seed avaliable languages (before user)
db.preferredLanguage.create({
  id: 'en',
  nameEn: 'English',
  nameFr: 'Anglais',
});

const frenchLanguage = db.preferredLanguage.create({
  id: 'fr',
  nameEn: 'French',
  nameFr: 'Français',
});

// seed avaliable addresses (before user)
db.address.create({
  id: 'home-address-id',
});

db.address.create({
  id: 'mailing-address-id',
});

// seed users
const defaultUser = db.user.create({
  id: '00000000-0000-0000-0000-000000000000',
  firstName: 'John',
  lastName: 'Maverick',
  preferredLanguage: frenchLanguage.id,
});

// seed available letters
const numberOfLetters = faker.number.int({ min: 10, max: 20 }); // Adjust min and max as needed
for (let i = 0; i < numberOfLetters; i++) {
  const name = faker.lorem.words({ min: 5, max: 7 });

  const sampleLetter = db.letter.create({
    userId: defaultUser.id,
    nameEn: name,
    nameFr: `(FR) ${name}`,
  });

  // seed avaliable pdf (after letter)
  db.pdf.create({
    referenceId: sampleLetter.referenceId,
  });
}

// seed letter type list
db.letterType.create({
  code: 'ACC',
  nameEn: 'Accepted',
  nameFr: '(FR) Accepted',
});

db.letterType.create({
  code: 'DEN',
  nameEn: 'DENIED',
  nameFr: '(FR) DENIED',
});

// seed country list
const countryCanada = db.country.create({
  code: 'CAN',
  nameEn: 'Canada',
  nameFr: '(FR) Canada',
});

const countryUsa = db.country.create({
  code: 'USA',
  nameEn: 'USA',
  nameFr: '(FR) USA',
});

db.country.create({
  code: 'MEX',
  nameEn: 'Mexico',
  nameFr: '(FR) Mexico',
});

// seed province list
db.region.create({
  code: 'ON',
  country: countryCanada,
  nameEn: 'Ontario',
  nameFr: '(FR) Ontario',
});

db.region.create({
  code: 'MB',
  country: countryCanada,
  nameEn: 'Manitoba',
  nameFr: '(FR) Manitoba',
});

db.region.create({
  code: 'QC',
  country: countryCanada,
  nameEn: 'Quebec',
  nameFr: '(FR) Quebec',
});

db.region.create({
  code: 'NS',
  country: countryCanada,
  nameEn: 'Nova Scotia',
  nameFr: '(FR) Nova Scotia',
});

db.region.create({
  code: 'PE',
  country: countryCanada,
  nameEn: 'Prince Edward Island',
  nameFr: '(FR) Prince Edward Island',
});

db.region.create({
  code: 'UT',
  country: countryUsa,
  nameEn: 'Utah',
  nameFr: '(FR) Utah',
});

db.region.create({
  code: 'NY',
  country: countryUsa,
  nameEn: 'New York',
  nameFr: '(FR) New York',
});

export { db };
