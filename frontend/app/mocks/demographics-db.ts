import { fakerEN_CA as faker } from '@faker-js/faker';
import { factory, primaryKey } from '@mswjs/data';

// (Optional) Seed `faker` to ensure reproducible
// random values of model properties.
faker.seed(456);

const demographicDB = factory({
  bornType: {
    id: primaryKey(faker.string.uuid),
    nameEn: String,
    nameFr: String,
  },

  disabilityType: {
    id: primaryKey(faker.string.uuid),
    nameEn: String,
    nameFr: String,
  },

  sexAtBirthType: {
    id: primaryKey(faker.string.uuid),
    nameEn: String,
    nameFr: String,
  },

  mouthPainType: {
    id: primaryKey(faker.string.uuid),
    nameEn: String,
    nameFr: String,
  },

  lastTimeDentistVisitType: {
    id: primaryKey(faker.string.uuid),
    nameEn: String,
    nameFr: String,
  },

  avoidedDentalCostType: {
    id: primaryKey(faker.string.uuid),
    nameEn: String,
    nameFr: String,
  },
});

demographicDB.avoidedDentalCostType.create({
  nameEn: 'Yes',
  nameFr: 'Oui',
});

demographicDB.avoidedDentalCostType.create({
  nameEn: 'No',
  nameFr: 'Non',
});

demographicDB.avoidedDentalCostType.create({
  nameEn: "Don't know",
  nameFr: 'Ne sais pas',
});

demographicDB.avoidedDentalCostType.create({
  nameEn: 'Prefer not to answer',
  nameFr: '(FR) Prefer not to answer',
});

demographicDB.lastTimeDentistVisitType.create({
  nameEn: 'Less than a year ago',
  nameFr: '(FR) Less than a year ago',
});

demographicDB.lastTimeDentistVisitType.create({
  nameEn: '1 year to less than 3 years ago',
  nameFr: '(FR) 1 year to less than 3 years ago',
});

demographicDB.lastTimeDentistVisitType.create({
  nameEn: '3 years ago, or more',
  nameFr: '(FR) 3 years ago, or more',
});

demographicDB.lastTimeDentistVisitType.create({
  nameEn: 'Rarely',
  nameFr: '(FR) Rarely',
});

demographicDB.lastTimeDentistVisitType.create({
  nameEn: 'Never seen an oral health professional',
  nameFr: '(FR) Never seen an oral health professional',
});

demographicDB.lastTimeDentistVisitType.create({
  nameEn: "Don't know",
  nameFr: 'Ne sais pas',
});

demographicDB.lastTimeDentistVisitType.create({
  nameEn: 'Prefer not to answer',
  nameFr: '(FR) Prefer not to answer',
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

demographicDB.disabilityType.create({
  nameEn: 'Yes',
  nameFr: 'Oui',
});
demographicDB.disabilityType.create({
  nameEn: 'No',
  nameFr: 'Non',
});

demographicDB.disabilityType.create({
  nameEn: "Don't know",
  nameFr: 'Ne sais pas',
});

demographicDB.disabilityType.create({
  nameEn: 'Prefer not to answer',
  nameFr: '(FR) Prefer not to answer',
});

demographicDB.sexAtBirthType.create({
  nameEn: 'Male',
  nameFr: 'Mâle',
});

demographicDB.sexAtBirthType.create({
  nameEn: 'Female',
  nameFr: 'Femelle',
});

demographicDB.sexAtBirthType.create({
  nameEn: 'Prefer not to answer',
  nameFr: '(FR) Prefer not to answer',
});

demographicDB.mouthPainType.create({
  nameEn: 'Often',
  nameFr: '(FR) Often',
});

demographicDB.mouthPainType.create({
  nameEn: 'Sometimes',
  nameFr: '(FR) Sometimes',
});

demographicDB.mouthPainType.create({
  nameEn: 'Rarely',
  nameFr: '(FR) Rarely',
});

demographicDB.mouthPainType.create({
  nameEn: 'Never',
  nameFr: '(FR) Never',
});

demographicDB.mouthPainType.create({
  nameEn: "Don't know",
  nameFr: 'Ne sais pas',
});

demographicDB.mouthPainType.create({
  nameEn: 'Prefer not to answer',
  nameFr: '(FR) Prefer not to answer',
});
export { demographicDB };
