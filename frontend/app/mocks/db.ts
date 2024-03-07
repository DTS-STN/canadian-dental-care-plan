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
  letterType: {
    id: primaryKey(faker.string.uuid),
    code: String,
    nameEn: String,
    nameFr: String,
  },
  letter: {
    id: primaryKey(faker.string.uuid),
    issuedOn: () => faker.date.past({ years: 1 }).toISOString().split('T')[0],
    letterType: oneOf('letterType'),
    referenceId: String,
    userId: String,
  },
  pdf: {
    id: primaryKey(faker.string.uuid),
    referenceId: () => faker.string.alphanumeric(10),
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
    nameFr: '(FR) Denied',
  }),
];

// seed available letters
const numberOfLetters = faker.number.int({ min: 10, max: 20 }); // Adjust min and max as needed
for (let i = 0; i < numberOfLetters; i++) {
  // seed avaliable pdf
  const seededPDF = db.pdf.create();

  db.letter.create({
    userId: defaultUser.id,
    letterType: faker.helpers.arrayElement(seededLetterTypes),
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

// seed country list
db.country.create({
  countryId: 'CAN',
  nameEnglish: 'Canada',
  nameFrench: 'Canada',
});

db.country.create({
  countryId: 'USA',
  nameEnglish: 'United States of America',
  nameFrench: "États-Unis d'Amérique",
});

db.country.create({
  countryId: 'MEX',
  nameEnglish: 'Mexico',
  nameFrench: 'Mexique',
});

// seed province list
db.region.create({
  provinceTerritoryStateId: 'ON',
  countryId: 'CAN',
  nameEnglish: 'Ontario',
  nameFrench: 'Ontario',
});

db.region.create({
  provinceTerritoryStateId: 'MB',
  countryId: 'CAN',
  nameEnglish: 'Manitoba',
  nameFrench: 'Manitoba',
});

db.region.create({
  provinceTerritoryStateId: 'QC',
  countryId: 'CAN',
  nameEnglish: 'Quebec',
  nameFrench: 'Québec',
});

db.region.create({
  provinceTerritoryStateId: 'NS',
  countryId: 'CAN',
  nameEnglish: 'Nova Scotia',
  nameFrench: 'Nouvelle-Écosse',
});

db.region.create({
  provinceTerritoryStateId: 'NL',
  countryId: 'CAN',
  nameEnglish: 'Newfoundland and Labrador',
  nameFrench: 'Terre-Neuve-et-Labrador',
});

db.region.create({
  provinceTerritoryStateId: 'PE',
  countryId: 'CAN',
  nameEnglish: 'Prince Edward Island',
  nameFrench: 'Île-du-Prince-Édouard',
});

db.region.create({
  provinceTerritoryStateId: 'UT',
  countryId: 'USA',
  nameEnglish: 'Utah',
  nameFrench: 'Utah',
});

db.region.create({
  provinceTerritoryStateId: 'NY',
  countryId: 'USA',
  nameEnglish: 'New York',
  nameFrench: 'État de New York',
});

export { db };
