import { fakerEN_CA as faker } from '@faker-js/faker';
import { factory, primaryKey } from '@mswjs/data';

import letterTypesJson from './power-platform-data/letter-types.json';

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
    addressProvince: String,
    addressPostalZipCode: faker.location.zipCode,
    addressCountry: String,
  },
  preferredLanguage: {
    id: primaryKey(String),
    nameEn: String,
    nameFr: String,
  },
  preferredCommunicationMethod: {
    id: primaryKey(String),
    nameEn: String,
    nameFr: String,
  },
  accessToDentalInsurance: {
    id: primaryKey(String),
    nameEn: String,
    nameFr: String,
  },
  federalDentalBenefit: {
    id: primaryKey(faker.string.uuid),
    code: String,
    nameEn: String,
    nameFr: String,
  },
  provincialTerritorialDentalBenefit: {
    id: primaryKey(faker.string.uuid),
    code: String,
    nameEn: String,
    nameFr: String,
  },

  federalSocialProgram: {
    id: primaryKey(faker.string.uuid),
    code: String,
    nameEn: String,
    nameFr: String,
  },

  provincialTerritorialSocialProgram: {
    id: primaryKey(faker.string.uuid),
    provinceTerritoryStateId: String,
    code: String,
    nameEn: String,
    nameFr: String,
  },

  taxFilingIndications: {
    id: primaryKey(faker.string.uuid),
    code: String,
    nameEn: String,
    nameFr: String,
  },
  applicationTypes: {
    id: primaryKey(faker.string.uuid),
    code: String,
    nameEn: String,
    nameFr: String,
  },
  letter: {
    id: primaryKey(faker.string.uuid),
    issuedOn: () => faker.date.past({ years: 1 }).toISOString().split('T')[0],
    letterType: String,
    referenceId: String,
    userId: String,
  },
  pdf: {
    id: primaryKey(faker.string.uuid),
    referenceId: () => faker.string.alphanumeric(10),
  },
  country: {
    countryId: primaryKey(faker.string.uuid),
    countryCode: String,
    nameEn: String,
    nameFr: String,
  },
  region: {
    provinceTerritoryStateId: primaryKey(String),
    countryId: String,
    nameEn: String,
    nameFr: String,
  },
  maritalStatus: {
    id: primaryKey(faker.string.uuid),
    code: String,
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

// seed avaliable communication methods
db.preferredCommunicationMethod.create({
  id: 'email',
  nameEn: 'Email',
  nameFr: 'Adresse courriel',
});

db.preferredCommunicationMethod.create({
  id: 'mail',
  nameEn: 'Postal mail',
  nameFr: 'Courrier postal',
});

db.accessToDentalInsurance.create({
  id: 'yes',
  nameEn: 'Yes',
  nameFr: '(Fr) Yes',
});

db.accessToDentalInsurance.create({
  id: 'no',
  nameEn: 'No',
  nameFr: '(Fr) No',
});

db.federalDentalBenefit.create({
  code: 'no',
  nameEn: 'No',
  nameFr: '(Fr) No',
});

db.federalDentalBenefit.create({
  code: 'yes',
  nameEn: 'Yes',
  nameFr: '(Fr) Yes',
});

db.provincialTerritorialDentalBenefit.create({
  code: 'no',
  nameEn: 'No',
  nameFr: '(Fr) No',
});

db.provincialTerritorialDentalBenefit.create({
  code: 'yes',
  nameEn: 'Yes',
  nameFr: '(Fr) Yes',
});

db.taxFilingIndications.create({
  code: 'yes',
  nameEn: 'Yes',
  nameFr: '(Fr) Yes',
});

db.taxFilingIndications.create({
  code: 'no',
  nameEn: 'No',
  nameFr: '(Fr) No',
});

db.applicationTypes.create({
  code: 'self',
  nameEn: 'I am applying for myself',
  nameFr: '(FR) I am applying for myself',
});

db.applicationTypes.create({
  code: 'other',
  nameEn: 'I am applying on behalf of someone else',
  nameFr: '(FR) I am applying on behalf of someone else',
});

// seed avaliable addresses (before user)
db.address.create({
  id: 'home-address-id',
  addressProvince: 'daf4d05b-37b3-eb11-8236-0022486d8d5f', // "Ontario", @see /power-platform-data/regions.json
  addressCountry: '0cf5389e-97ae-eb11-8236-000d3af4bfc3', // "Canada", @see /power-platform-data/countries.json
});

db.address.create({
  id: 'mailing-address-id',
  addressProvince: '5abc28c9-38b3-eb11-8236-0022486d8d5f', // "Newfoundland and Labrador", @see /power-platform-data/regions.json
  addressCountry: '0cf5389e-97ae-eb11-8236-000d3af4bfc3', // "Canada", @see /power-platform-data/countries.json
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
  // seed avaliable pdf
  const seededPDF = db.pdf.create();

  db.letter.create({
    userId: defaultUser.id,
    letterType: faker.helpers.arrayElement(letterTypesJson.value[0].OptionSet.Options).Value.toString(),
    referenceId: seededPDF.referenceId,
  });
}

// seed marirtal statuses
db.maritalStatus.create({
  code: 'MARRIED',
  nameEn: 'Married',
  nameFr: '(FR) Married',
});
db.maritalStatus.create({
  code: 'COMMONLAW',
  nameEn: 'Common Law',
  nameFr: '(FR) Common Law',
});
db.maritalStatus.create({
  code: 'SINGLE',
  nameEn: 'Single',
  nameFr: '(FR) Single',
});
db.maritalStatus.create({
  code: 'WIDOWED',
  nameEn: 'Widowed',
  nameFr: '(FR) Widowed',
});
db.maritalStatus.create({
  code: 'DIVORCED',
  nameEn: 'Divorced',
  nameFr: '(FR) Divorced',
});
db.maritalStatus.create({
  code: 'SEPARATED',
  nameEn: 'Separated',
  nameFr: '(FR) Separated',
});

export { db };
