import { fakerEN_CA as faker } from '@faker-js/faker';
import { factory, primaryKey } from '@mswjs/data';

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
  personalInformation: {
    homeAddressStreet: String,
    homeAddressSecondaryUnitText: String,
    homeAddressCityName: faker.location.city,
    homeAddressProvince: () => faker.location.state({ abbreviated: true }),
    homeAddressCountryReferenceId: String,
    homeAddressPostalCode: faker.location.zipCode,
    mailingAddressStreet: String,
    mailingAddressSecondaryUnitText: String,
    mailingAddressCityName: faker.location.city,
    mailingAddressProvince: () => faker.location.state({ abbreviated: true }),
    mailingAddressCountryReferenceId: String,
    mailingAddressPostalCode: faker.location.zipCode,
    sameHomeAndMailingAddress: Boolean,
    applicantCategoryCode: String, // id for Primary, Secondary, Spouse, etc
    applicantId: String,
    clientId: String,
    clientNumber: String,
    birthdate: () => faker.date.past({ years: 20 }),
    lastName: faker.person.lastName,
    firstName: faker.person.firstName,
    emailAddressId: faker.internet.email,
    primaryTelephoneNumber: String,
    alternateTelephoneNumber: String,
    maritialStatus: String,
    dentalApplicationID: String,
    preferredMethodCommunicationCode: String,
    sinIdentification: primaryKey(String),
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

db.personalInformation.create({
  mailingAddressStreet: '2219 Waste Lane',
  mailingAddressSecondaryUnitText: 'Apt. No. 21',
  mailingAddressCityName: 'HALIFAX',
  mailingAddressProvince: 'fc2243c9-36b3-eb11-8236-0022486d8d5f',
  mailingAddressCountryReferenceId: '0cf5389e-97ae-eb11-8236-000d3af4bfc3N',
  mailingAddressPostalCode: 'B0C 0A1',
  homeAddressStreet: '1191 Windy Street',
  homeAddressSecondaryUnitText: 'Apt. No. 50',
  homeAddressCityName: 'OTTAWA',
  homeAddressProvince: '9c440baa-35b3-eb11-8236-0022486d8d5f',
  homeAddressCountryReferenceId: '0cf5389e-97ae-eb11-8236-000d3af4bfc3',
  homeAddressPostalCode: 'L9B 1A2',
  sameHomeAndMailingAddress: false,
  clientNumber: '81657965177',
  clientId: '17cdea07-2f83-ee11-8179-000d3a09d7c5',
  applicantId: '4635f70b-2f83-ee11-8179-000d3a09d136',
  applicantCategoryCode: '775170000',
  birthdate: new Date('1997-09-01'),
  lastName: 'Eliot',
  firstName: 'Thomas Stearns',
  emailAddressId: 'rhapsody@domain.ca',
  primaryTelephoneNumber: '222-555-5555',
  alternateTelephoneNumber: '416-555-6666',
  preferredMethodCommunicationCode: '775170002',
  sinIdentification: '800011819',
});

db.personalInformation.create({
  mailingAddressStreet: '1915 Verwandlung Street',
  mailingAddressSecondaryUnitText: 'Apt. No. 21',
  mailingAddressCityName: 'Victoria',
  mailingAddressProvince: '9c440baa-35b3-eb11-8236-0022486d8d5f',
  mailingAddressCountryReferenceId: '0cf5389e-97ae-eb11-8236-000d3af4bfc3N',
  mailingAddressPostalCode: 'V1M 1M1',
  homeAddressStreet: '1915 Verwandlung Lane',
  homeAddressSecondaryUnitText: 'Apt. No. 21',
  homeAddressCityName: 'Victoria',
  homeAddressProvince: '9c440baa-35b3-eb11-8236-0022486d8d5f',
  homeAddressCountryReferenceId: '0cf5389e-97ae-eb11-8236-000d3af4bfc3N',
  homeAddressPostalCode: 'V1M 1M1',
  sameHomeAndMailingAddress: true,
  clientNumber: '81400774242',
  clientId: '17cdea07-2f83-ee11-8179-000d3a09d7c4',
  applicantId: '4635f70b-2f83-ee11-8179-000d3a09d131',
  applicantCategoryCode: '775170000',
  birthdate: new Date('1924-07-03'),
  lastName: 'Kafka',
  firstName: 'Franz',
  emailAddressId: 'metamorphosis0@domain.ca',
  primaryTelephoneNumber: '555-555-5555',
  alternateTelephoneNumber: '789-555-6666',
  preferredMethodCommunicationCode: '775170002',
  sinIdentification: '800000002',
});

// seed avaliable languages (before user)
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
db.user.create({
  id: '00000000-0000-0000-0000-000000000000',
  firstName: 'John',
  lastName: 'Maverick',
  preferredLanguage: '1033', // "English", @see ~/resources/power-platform/preferred-language.json
});

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
