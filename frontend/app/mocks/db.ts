import { fakerEN_CA as faker } from '@faker-js/faker';
import { factory, primaryKey } from '@mswjs/data';

// (Optional) Seed `faker` to ensure reproducible
// random values of model properties.
faker.seed(123);

const db = factory({
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
    federalDentalPlanId: String,
    provincialTerritorialDentalPlanId: String,
    privateDentalPlanId: String,
    sinIdentification: primaryKey(String),
  },
  subscription: {
    id: primaryKey(faker.string.uuid),
    userId: String,
    msLanguageCode: String,
    alertTypeCode: String,
  },

  subscriptionConfirmationCode: {
    id: primaryKey(faker.string.uuid),
    email: String,
    confirmationCode: String,
    createdDate: () => faker.date.future({ years: 1 }),
    expiryDate: () => faker.date.future({ years: 1 }),
  },
});

db.personalInformation.create({
  mailingAddressStreet: '2219 Waste Lane',
  mailingAddressSecondaryUnitText: 'Apt. No. 21',
  mailingAddressCityName: 'HALIFAX',
  mailingAddressProvince: 'fc2243c9-36b3-eb11-8236-0022486d8d5f',
  mailingAddressCountryReferenceId: '0cf5389e-97ae-eb11-8236-000d3af4bfc3',
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
  primaryTelephoneNumber: '807-555-5555',
  alternateTelephoneNumber: '416-555-6666',
  preferredMethodCommunicationCode: '1033',
  federalDentalPlanId: 'e174250d-26c5-ee11-9079-000d3a09d640',
  provincialTerritorialDentalPlanId: 'b5f25fea-a7a9-ee11-a569-000d3af4f898',
  privateDentalPlanId: '333333',
  sinIdentification: '800011819',
});

db.personalInformation.create({
  mailingAddressStreet: '1915 Verwandlung Street',
  mailingAddressSecondaryUnitText: 'Apt. No. 21',
  mailingAddressCityName: 'Victoria',
  mailingAddressProvince: '9c440baa-35b3-eb11-8236-0022486d8d5f',
  mailingAddressCountryReferenceId: '0cf5389e-97ae-eb11-8236-000d3af4bfc3',
  mailingAddressPostalCode: 'V1M 1M1',
  homeAddressStreet: '1915 Verwandlung Lane',
  homeAddressSecondaryUnitText: 'Apt. No. 21',
  homeAddressCityName: 'Victoria',
  homeAddressProvince: '9c440baa-35b3-eb11-8236-0022486d8d5f',
  homeAddressCountryReferenceId: '0cf5389e-97ae-eb11-8236-000d3af4bfc3',
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
  federalDentalPlanId: '5a5c5294-26c5-ee11-9079-000d3a09d640',
  provincialTerritorialDentalPlanId: '39449f70-37b3-eb11-8236-0022486d8d5f',
  privateDentalPlanId: '1111111',
  sinIdentification: '800000002',
});

// seed the email alerts subscription
db.subscription.create({
  id: '10001',
  userId: '76c48130-e1d4-4c2f-8dd0-1c17f9bbb4f6',
  msLanguageCode: '1033', // "English", @see ~/resources/power-platform/preferred-language.json
  alertTypeCode: 'cdcp',
});

db.subscription.create({
  id: '10003',
  userId: 'f9f33652-0ebd-46bc-8d93-04cef538a689',
  msLanguageCode: '1033', // "English", @see ~/resources/power-platform/preferred-language.json
  alertTypeCode: 'cdcp',
});
db.subscriptionConfirmationCode.create({
  id: '0000001',
  email: 'user@example.com',
  confirmationCode: '0001',
  createdDate: new Date(new Date().getTime() - 12 * 24 * 60 * 60 * 1000), // current date  date - 12 days
  expiryDate: new Date(new Date().getTime() - 10 * 24 * 60 * 60 * 1000), // current date  date - 10 days
});
db.subscriptionConfirmationCode.create({
  id: '0000002',
  email: 'user@example.com',
  confirmationCode: '1234',
  createdDate: new Date(new Date().getTime() - 4 * 24 * 60 * 60 * 1000),
  expiryDate: new Date(new Date().getTime() - 2 * 24 * 60 * 60 * 1000), // current date date + 2 days
});
db.subscriptionConfirmationCode.create({
  id: '0000003',
  email: 'user@example.com',
  confirmationCode: '1001',
  createdDate: new Date(new Date().getTime() - 8 * 24 * 60 * 60 * 1000), // current date date - 8 days
  expiryDate: new Date(new Date().getTime() - 6 * 24 * 60 * 60 * 1000), // current date date - 6 days
});

db.subscriptionConfirmationCode.create({
  id: '0000007',
  email: 'tester@example.com',
  confirmationCode: '2002',
  createdDate: new Date(new Date().getTime() - 4 * 24 * 60 * 60 * 1000), // current date date - 4 days
  expiryDate: new Date(new Date().getTime() - 2 * 24 * 60 * 60 * 1000), // current date date - 2 days
});

export { db };
