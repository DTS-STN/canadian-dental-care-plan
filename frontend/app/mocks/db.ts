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
    addressCountry: () => 'Canada',
  },
  preferredLanguage: {
    id: primaryKey(String),
    nameEn: String,
    nameFr: String,
  },
  letter: {
    referenceId: primaryKey(faker.string.uuid),
    dateSent: Date,
    letterTypeCd: String,
    userId: String,
    subject: String,
  },
  pdf: {
    fileStream: String,
    referenceId: oneOf('letter'),
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

db.preferredLanguage.create({
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
  preferredLanguage: 'fr',
});

// seed avaliable letters (after user)
const sampleLetter = db.letter.create({
  referenceId: '00000000-0000-0000-0000-000000000011',
  dateSent: '2024-01-02',
  letterTypeCd: 'Letter Type',
  userId: defaultUser.id,
});

// seed avaliable pdf (after letter)
db.pdf.create({
  referenceId: sampleLetter,
  fileStream: '',
  id: '00000000-0000-0000-0000-000000000011',
});

// seed country list
const countryCanada = db.country.create({
  code: 'CDN',
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
  nameFr: '(FR) COntario',
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
