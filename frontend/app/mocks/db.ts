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
  letterType: {
    id: primaryKey(faker.string.uuid),
    code: String,
    nameEn: String,
    nameFr: String,
  },
  letter: {
    referenceId: String,
    dateSent: () => faker.date.past({ years: 1 }).toISOString().split('T')[0],
    userId: String,
    letterType: oneOf('letterType'),
    id: primaryKey(faker.string.uuid),
  },
  pdf: {
    referenceId: () => faker.string.alphanumeric(10),
    id: primaryKey(faker.string.uuid),
  },
  country: {
    countryId: primaryKey(String),
    nameEnglish: String,
    nameFrench: String,
  },
  region: {
    provinceTerritoryStateId: primaryKey(String),
    countryId: String,
    nameEnglish: String,
    nameFrench: String,
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

// seed letter type list
const seededLetterTypes = [
  db.letterType.create({
    code: 'ACC',
    nameEn: 'Accepted',
    nameFr: '(FR) Accepted',
  }),
  db.letterType.create({
    code: 'DEN',
    nameEn: 'Denied',
    nameFr: '(FR) DENIED',
  }),
];

// seed available letters
const numberOfLetters = faker.number.int({ min: 10, max: 20 }); // Adjust min and max as needed
for (let i = 0; i < numberOfLetters; i++) {
  const seededPdf = db.pdf.create();

  db.letter.create({
    userId: defaultUser.id,
    referenceId: seededPdf.referenceId,
    letterType: faker.helpers.arrayElement(seededLetterTypes),
  });
}
// seed country list
db.country.create({
  countryId: 'CAN',
  nameEnglish: 'Canada',
  nameFrench: '(FR) Canada',
});

db.country.create({
  countryId: 'USA',
  nameEnglish: 'USA',
  nameFrench: '(FR) USA',
});

db.country.create({
  countryId: 'MEX',
  nameEnglish: 'Mexico',
  nameFrench: '(FR) Mexico',
});

// seed province list
db.region.create({
  provinceTerritoryStateId: 'ON',
  countryId: 'CAN',
  nameEnglish: 'Ontario',
  nameFrench: '(FR) Ontario',
});

db.region.create({
  provinceTerritoryStateId: 'MB',
  countryId: 'CAN',
  nameEnglish: 'Manitoba',
  nameFrench: '(FR) Manitoba',
});

db.region.create({
  provinceTerritoryStateId: 'QC',
  countryId: 'CAN',
  nameEnglish: 'Quebec',
  nameFrench: '(FR) Quebec',
});

db.region.create({
  provinceTerritoryStateId: 'NS',
  countryId: 'CAN',
  nameEnglish: 'Nova Scotia',
  nameFrench: '(FR) Nova Scotia',
});

db.region.create({
  provinceTerritoryStateId: 'PE',
  countryId: 'CAN',
  nameEnglish: 'Prince Edward Island',
  nameFrench: '(FR) Prince Edward Island',
});

db.region.create({
  provinceTerritoryStateId: 'UT',
  countryId: 'USA',
  nameEnglish: 'Utah',
  nameFrench: '(FR) Utah',
});

db.region.create({
  provinceTerritoryStateId: 'NY',
  countryId: 'USA',
  nameEnglish: 'New York',
  nameFrench: '(FR) New York',
});

export { db };
