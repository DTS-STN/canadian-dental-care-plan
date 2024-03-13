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

  genderType: {
    id: primaryKey(faker.string.uuid),
    nameEn: String,
    nameFr: String,
  },

  equityType: {
    id: primaryKey(faker.string.uuid),
    nameEn: String,
    nameFr: String,
  },

  indigenousType: {
    id: primaryKey(faker.string.uuid),
    nameEn: String,
    nameFr: String,
  },

  indigenousGroup: {
    id: primaryKey(faker.string.uuid),
    nameEn: String,
    nameFr: String,
  },
});

demographicDB.indigenousGroup.create({
  id: 'firstNations',
  nameEn: 'First Nations (North American Indian)',
  nameFr: '(FR) First Nations (North American Indian)',
});

demographicDB.indigenousGroup.create({
  id: 'metis',
  nameEn: 'Métis',
  nameFr: '(FR) Métis',
});

demographicDB.indigenousGroup.create({
  id: 'inuk',
  nameEn: 'Inuk (Inuit)',
  nameFr: '(FR) Inuk (Inuit)',
});

demographicDB.indigenousType.create({
  id: 'first-nations-no',
  nameEn: 'No',
  nameFr: 'Non',
});

demographicDB.indigenousType.create({
  id: 'first-nations-yes',
  nameEn: 'Yes',
  nameFr: 'Oui',
});

demographicDB.indigenousType.create({
  id: 'first-nations-prefer',
  nameEn: 'Prefer not to answer',
  nameFr: 'Je préfère ne pas répondre',
});
demographicDB.genderType.create({
  id: 'gender-male',
  nameEn: 'Male',
  nameFr: '(FR) Male',
});

demographicDB.genderType.create({
  id: 'gender-female',
  nameEn: 'Female',
  nameFr: '(FR) Female',
});

demographicDB.genderType.create({
  id: 'gender-other',
  nameEn: 'Other',
  nameFr: '(FR) Other',
});

demographicDB.genderType.create({
  id: 'gender-prefer-not-to-say',
  nameEn: 'Prefer not to answer',
  nameFr: '(FR) Prefer not to answer',
});

demographicDB.avoidedDentalCostType.create({
  id: 'yes',
  nameEn: 'Yes',
  nameFr: 'Oui',
});

demographicDB.avoidedDentalCostType.create({
  id: 'no',
  nameEn: 'No',
  nameFr: 'Non',
});

demographicDB.avoidedDentalCostType.create({
  id: 'dontKnow',
  nameEn: "Don't know",
  nameFr: 'Ne sais pas',
});

demographicDB.avoidedDentalCostType.create({
  id: 'noAnswer',
  nameEn: 'Prefer not to answer',
  nameFr: '(FR) Prefer not to answer',
});

demographicDB.lastTimeDentistVisitType.create({
  id: 'lessThanAYear',
  nameEn: 'Less than a year ago',
  nameFr: '(FR) Less than a year ago',
});

demographicDB.lastTimeDentistVisitType.create({
  id: 'oneToThreeYears',
  nameEn: '1 year to less than 3 years ago',
  nameFr: '(FR) 1 year to less than 3 years ago',
});

demographicDB.lastTimeDentistVisitType.create({
  id: 'threeYearsOrMore',
  nameEn: '3 years ago, or more',
  nameFr: '(FR) 3 years ago, or more',
});

demographicDB.lastTimeDentistVisitType.create({
  id: 'rarely',
  nameEn: 'Rarely',
  nameFr: '(FR) Rarely',
});

demographicDB.lastTimeDentistVisitType.create({
  id: 'never',
  nameEn: 'Never seen an oral health professional',
  nameFr: '(FR) Never seen an oral health professional',
});

demographicDB.lastTimeDentistVisitType.create({
  id: 'dontKnow',
  nameEn: "Don't know",
  nameFr: 'Ne sais pas',
});

demographicDB.lastTimeDentistVisitType.create({
  id: 'noAnswer',
  nameEn: 'Prefer not to answer',
  nameFr: '(FR) Prefer not to answer',
});

demographicDB.bornType.create({
  id: 'bornInCanada',
  nameEn: 'Born in Canada',
  nameFr: '(FR) Born in Canada',
});

demographicDB.bornType.create({
  id: 'bornOutsideCanada',
  nameEn: 'Born outside Canada',
  nameFr: '(FR) Born outside Canada',
});
demographicDB.bornType.create({
  id: 'noAnswer',
  nameEn: 'Prefer not to answer',
  nameFr: '(FR) Prefer not to answer',
});

demographicDB.disabilityType.create({
  id: 'yes',
  nameEn: 'Yes',
  nameFr: 'Oui',
});
demographicDB.disabilityType.create({
  id: 'no',
  nameEn: 'No',
  nameFr: 'Non',
});

demographicDB.disabilityType.create({
  id: 'dontKnow',
  nameEn: "Don't know",
  nameFr: 'Ne sais pas',
});

demographicDB.disabilityType.create({
  id: 'noAnswer',
  nameEn: 'Prefer not to answer',
  nameFr: '(FR) Prefer not to answer',
});

demographicDB.sexAtBirthType.create({
  id: 'male',
  nameEn: 'Male',
  nameFr: 'Mâle',
});

demographicDB.sexAtBirthType.create({
  id: 'female',
  nameEn: 'Female',
  nameFr: 'Femelle',
});

demographicDB.sexAtBirthType.create({
  id: 'noAnswer',
  nameEn: 'Prefer not to answer',
  nameFr: '(FR) Prefer not to answer',
});

demographicDB.mouthPainType.create({
  id: 'often',
  nameEn: 'Often',
  nameFr: '(FR) Often',
});

demographicDB.mouthPainType.create({
  id: 'sometimes',
  nameEn: 'Sometimes',
  nameFr: '(FR) Sometimes',
});

demographicDB.mouthPainType.create({
  id: 'rarely',
  nameEn: 'Rarely',
  nameFr: '(FR) Rarely',
});

demographicDB.mouthPainType.create({
  id: 'never',
  nameEn: 'Never',
  nameFr: '(FR) Never',
});

demographicDB.mouthPainType.create({
  id: 'dontKnow',
  nameEn: "Don't know",
  nameFr: 'Ne sais pas',
});

demographicDB.mouthPainType.create({
  id: 'noAnswer',
  nameEn: 'Prefer not to answer',
  nameFr: '(FR) Prefer not to answer',
});
demographicDB.equityType.create({
  id: 'equity-black',
  nameEn: 'Black (African, African Canadian, Afro-Caribbean descent)',
  nameFr: '(FR) Black (African, African Canadian, Afro-Caribbean descent)',
});
demographicDB.equityType.create({
  id: 'equity-easian',
  nameEn: 'East Asian (Chinese, Japanese, Korean, Taiwanese descent)',
  nameFr: '(FR) East Asian (Chinese, Japanese, Korean, Taiwanese descent)',
});
demographicDB.equityType.create({
  id: 'equity-indigenous',
  nameEn: 'Indigenous (First Nations, Inuk/Inuit, Métis descent)',
  nameFr: '(FR) Indigenous (First Nations, Inuk/Inuit, Métis descent)',
});
demographicDB.equityType.create({
  id: 'equity-lamerican',
  nameEn: 'Latin Amercian (Hispanic or Latin American descent)',
  nameFr: '(FR) Latin Amercian (Hispanic or Latin American descent)',
});
demographicDB.equityType.create({
  id: 'equity-meastern',
  nameEn: 'Middle Eastern (Arab, Persian, West Asian descent (e.g., Afghan, Egyptian, Iranian, Kurdish, Lebanese, Turkish))',
  nameFr: '(FR) Middle Eastern (Arab, Persian, West Asian descent (e.g., Afghan, Egyptian, Iranian, Kurdish, Lebanese, Turkish))',
});
demographicDB.equityType.create({
  id: 'equity-sasian',
  nameEn: 'South Asian (South Asian descent (e.g., Bangladeshi, Indian, Indo-Caribean, Pakistani, Sri Lankan))',
  nameFr: '(FR) South Asian (South Asian descent (e.g., Bangladeshi, Indian, Indo-Caribean, Pakistani, Sri Lankan))',
});
demographicDB.equityType.create({
  id: 'equity-seasian',
  nameEn: 'Southeast Asian (Cambodian, Filipino, Indonesian, Thai, Vietnamese or other Southeast Asian descent)',
  nameFr: '(FR) Southeast Asian Southeast Asian (Cambodian, Filipino, Indonesian, Thai, Vietnamese or other Southeast Asian descent)',
});
demographicDB.equityType.create({
  id: 'equity-white',
  nameEn: 'White (European Descent)',
  nameFr: '(FR) White (European Descent)',
});
demographicDB.equityType.create({
  id: 'equity-other',
  nameEn: 'Another race category',
  nameFr: '(FR) Another race category',
});
demographicDB.equityType.create({
  id: 'equity-unknown',
  nameEn: "Don't know",
  nameFr: "(FR) Don't know",
});
demographicDB.equityType.create({
  id: 'equity-unanswered',
  nameEn: 'Prefer not to answer',
  nameFr: '(FR) Prefer not to answer',
});

export { demographicDB };
