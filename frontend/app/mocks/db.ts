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
    referenceId: String,
    issuedOn: Date,
    userId: String,
    nameEn: String,
    nameFr: String,
    id: primaryKey(String),
  },
  pdf: {
    fileStream: String,
    referenceId: String,
    id: primaryKey(String),
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
  preferredLanguage: frenchLanguage.id.toString(),
});

// seed avaliable letters (after user)
const sampleLetter = db.letter.create({
  referenceId: '1',
  issuedOn: '2024-03-03T03:04:05.000Z',
  userId: defaultUser.id.toString(),
  nameEn: 'Letters Type 1',
  nameFr: 'Letters Type 1',
  id: '00000000-0000-0000-0000-000000000011',
});

db.letter.create({
  referenceId: '2',
  issuedOn: '2024-12-25T03:01:01.000Z',
  userId: defaultUser.id.toString(),
  nameEn: 'Letters Type 2',
  nameFr: 'Letters Type 2',
  id: '00000000-0000-0000-0000-000000000012',
});

db.letter.create({
  referenceId: '3',
  issuedOn: '2004-02-29T03:11:21.000Z',
  userId: defaultUser.id.toString(),
  nameEn: 'Letters Type 3',
  nameFr: 'Letters Type 3',
  id: '00000000-0000-0000-0000-00000000013',
});

// seed avaliable pdf (after letter)
db.pdf.create({
  referenceId: sampleLetter.referenceId.toString(),
  fileStream: '/test.pdf',
  id: '00000000-0000-0000-0000-000000000011',
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
