export const pageIds = {
  protected: {
    letters: {
      index: 'CDCP-PROT-0015',
    },
    renew: {
      index: 'CDCP-PROT-RENW-0001',
      termsAndConditions: 'CDCP-PROT-RENW-0002',
      taxFiling: 'CDCP-PROT-RENW-0003',
      fileYourTaxes: 'CDCP-PROT-RENW-0004',
      memberSelection: 'CDCP-PROT-RENW-0005',
      dentalInsurance: 'CDCP-PROT-RENW-0006',
      demographicSurvey: 'CDCP-PROT-RENW-0007',
      parentOrGuardian: 'CDCP-PROT-RENW-0008',
      parentOrGuardianRequired: 'CDCP-PROT-RENW-0009',
      confirmMaritalStatus: 'CDCP-PROT-RENW-0010',
      confirmPhone: 'CDCP-PROT-RENW-0011',
      confirmEmail: 'CDCP-PROT-RENW-0012',
      confirmHomeAddress: 'CDCP-PROT-RENW-0013',
      confirmMailingAddress: 'CDCP-PROT-RENW-0014',
      confirmCommunicationPreference: 'CDCP-PROT-RENW-0015',
      confirmFederalProvincialTerritorialBenefits: 'CDCP-PROT-RENW-0016',
      reviewAdultInformation: 'CDCP-PROT-RENW-0017',
      reviewChildInformation: 'CDCP-RENW-ADCH-0018',
      reviewSubmit: 'CDCP-PROT-RENW-0019',
      confirmation: 'CDCP-PROT-RENW-0020',
      confirmAddress: 'CDCP-PROT-RENW-0021',
    },
    dataUnavailable: 'CDCP-PROT-0099',
    unableToProcessRequest: 'CDCP-PROT-0999',
  },
  public: {
    apply: {
      index: 'CDCP-APPL-0001',
      termsAndConditions: 'CDCP-APPL-0002',
      taxFiling: 'CDCP-APPL-0003',
      fileYourTaxes: 'CDCP-APPL-0004',
      typeOfApplication: 'CDCP-APPL-0005',
      applicationDelegate: 'CDCP-APPL-0006',
      adult: {
        dateOfBirthEligibility: 'CDCP-APPL-AD-0005',
        applicantInformation: 'CDCP-APPL-AD-0006',
        partnerInformation: 'CDCP-APPL-AD-0007',
        maritalStatus: 'CDCP-APPL-AD-0007', // TODO: Check the correct page ID.
        mailingAddress: 'CDCP-APPL-AD-0008', // TODO: Check the correct page ID.
        homeAddress: 'CDCP-APPL-AD-0008', // TODO: Check the correct page ID.
        communicationPreference: 'CDCP-APPL-AD-0009',
        dentalInsurance: 'CDCP-APPL-AD-0010',
        confirmFederalProvincialTerritorialBenefits: 'CDCP-APPL-AD-0011',
        federalProvincialTerritorialBenefits: 'CDCP-APPL-AD-0012',
        reviewInformation: 'CDCP-APPL-AD-0013',
        exitApplication: 'CDCP-APPL-AD-0014',
        confirmation: 'CDCP-APPL-AD-0015',
        parentOrGuardian: 'CDCP-APPL-AD-0017',
        livingIndependently: 'CDCP-APPL-AD-0018',
        newOrExistingMember: 'CDCP-APPL-AD-0019',
        phoneNumber: 'CDCP-APPL-AD-0020',
        email: 'CDCP-APPL-AD-0021',
        verifyEmail: 'CDCP-APPL-AD-0022',
      },
      adultChild: {
        applicantInformation: 'CDCP-APPL-ADCH-0006',
        partnerInformation: 'CDCP-APPL-ADCH-0007',
        maritalStatus: 'CDCP-APPL-ADCH-0007', // TODO: Check the correct page ID.
        mailingAddress: 'CDCP-APPL-ADCH-0008', // TODO: Check the correct page ID.
        homeAddress: 'CDCP-APPL-ADCH-0008', // TODO: Check the correct page ID.
        communicationPreference: 'CDCP-APPL-ADCH-0009',
        dentalInsurance: 'CDCP-APPL-ADCH-0010',
        confirmFederalProvincialTerritorialBenefits: 'CDCP-APPL-ADCH-0011',
        federalProvincialTerritorialBenefits: 'CDCP-APPL-ADCH-0012',
        reviewChildInformation: 'CDCP-APPL-ADCH-0013',
        reviewAdultInformation: 'CDCP-APPL-ADCH-0014',
        exitApplication: 'CDCP-APPL-ADCH-0015',
        confirmation: 'CDCP-APPL-ADCH-0016',
        childInformation: 'CDCP-APPL-ADCH-0017',
        applyChildren: 'CDCP-APPL-ADCH-0018',
        applySelf: 'CDCP-APPL-ADCH-0019',
        parentOrGuardian: 'CDCP-APPL-ADCH-0021',
        livingIndependently: 'CDCP-APPL-ADCH-0022',
        childSummary: 'CDCP-APPL-ADCH-0023',
        contactApplyChild: 'CDCP-APPL-ADCH-0024',
        newOrExistingMember: 'CDCP-APPL-ADCH-0025',
        phoneNumber: 'CDCP-APPL-ADCH-0026',
        email: 'CDCP-APPL-ADCH-0027',
      },
      child: {
        dateOfBirthEligibility: 'CDCP-APPL-CH-0004',
        applicantInformation: 'CDCP-APPL-CH-0005',
        mailingAddress: 'CDCP-APPL-CH-0008', // TODO: Check the correct page ID.
        homeAddress: 'CDCP-APPL-CH-0008', // TODO: Check the correct page ID.
        partnerInformation: 'CDCP-APPL-CH-0006',
        communicationPreference: 'CDCP-APPL-CH-0008',
        dentalInsurance: 'CDCP-APPL-CH-0009',
        federalProvincialTerritorialBenefits: 'CDCP-APPL-CH-0010',
        reviewAdultInformation: 'CDCP-APPL-CH-0011',
        reviewChildInformation: 'CDCP-APPL-CH-0012',
        exitApplication: 'CDCP-APPL-CH-0013',
        confirmation: 'CDCP-APPL-CH-0014',
        parentOrGuardian: 'CDCP-APPL-CH-0015',
        childInformation: 'CDCP-APPL-CH-0016',
        cannotApplyChild: 'CDCP-APPL-CH-0017',
        contactApplyChild: 'CDCP-APPL-CH-0018',
        newOrExistingMember: 'CDCP-APPL-CH-0019',
        phoneNumber: 'CDCP-APPL-CH-0020',
        maritalStatus: 'CDCP-APPL-CH-0021', // TODO: Check the correct page ID.
        email: 'CDCP-APPL-CH-0022',
      },
    },
    status: { index: 'CDCP-STAT-0001', myself: 'CDCP-STAT-0002', child: 'CDCP-STAT-0003', result: 'CDCP-STAT-0004' },
    renew: {
      index: 'CDCP-RENW-0001',
      termsAndConditions: 'CDCP-RENW-0002',
      applicantInformation: 'CDCP-RNEW-0003',
      taxFiling: 'CDCP-RENW-0004',
      fileYourTaxes: 'CDCP-RENW-0005',
      typeOfRenewal: 'CDCP-RENW-0006',
      renewalDelegate: 'CDCP-RENW-0007',
      adult: {
        confirmMaritalStatus: 'CDCP-RENW-AD-0001',
        maritalStatus: 'CDCP-RENW-AD-0002',
        confirmPhone: 'CDCP-RENW-AD-0003',
        confirmEmail: 'CDCP-RENW-AD-0004',
        confirmAddress: 'CDCP-RENW-AD-0005',
        updateMailingAddress: 'CDCP-RENW-AD-0006',
        updateHomeAddress: 'CDCP-RENW-AD-0007',
        dentalInsurance: 'CDCP-RENW-AD-0008',
        confirmFederalProvincialTerritorialBenefits: 'CDCP-RENW-AD-0009',
        updateFederalProvincialTerritorialBenefits: 'CDCP-RENW-AD-0010',
        demographicSurvey: 'CDCP-RENW-AD-0011',
        reviewAdultInformation: 'CDCP-RENW-AD-0012',
        confirmation: 'CDCP-RENW-AD-0013',
        exitApplication: 'CDCP-RENW-AD-0014',
      },
      ita: {
        maritalStatus: 'CDCP-RENW-ITA-0001',
        confirmPhone: 'CDCP-RENW-ITA-0002',
        confirmEmail: 'CDCP-ITA-0003',
        confirmAddress: 'CDCP-RENW-ITA-0004',
        updateMailingAddress: 'CDCP-RENW-ITA-0005',
        updateHomeAddress: 'CDCP-RENW-ITA-0006',
        dentalInsurance: 'CDCP-RENW-ITA-0007',
        federalProvincialTerritorialBenefits: 'CDCP-RENW-ITA-0008',
        reviewInformation: 'CDCP-RENW-ITA-0009',
        confirmation: 'CDCP-RENW-ITA-0010',
        exitApplication: 'CDCP-RENW-ITA-0011',
        demographicSurvey: 'CDCP-RENW-ITA-0012',
      },
      adultChild: {
        confirmMaritalStatus: 'CDCP-RENW-ADCH-001',
        maritalStatus: 'CDCP-RENW-ADCH-0002',
        confirmPhone: 'CDCP-RENW-ADCH-0003',
        confirmEmail: 'CDCP-RENW-ADCH-0004',
        confirmAddress: 'CDCP-RENW-ADCH-0005',
        updateMailingAddress: 'CDCP-RENW-ADCH-0006',
        updateHomeAddress: 'CDCP-RENW-ADCH-0007',
        dentalInsurance: 'CDCP-RENW-ADCH-0008',
        confirmFederalProvincialTerritorialBenefits: 'CDCP-RENW-ADCH-0009',
        updateFederalProvincialTerritorialBenefits: 'CDCP-RENW-ADCH-0010',
        childInformation: 'CDCP-RENW-ADCH-0011',
        parentOrGuardian: 'CDCP-RENW-ADCH-0012',
        reviewChildInformation: 'CDCP-RENW-ADCH-0013',
        exitApplication: 'CDCP-RENW-ADCH-0014',
        confirmation: 'CDCP-RENW-ADCH-0015',
        reviewAdultInformation: 'CDCP-RENW-ADCH-0016',
        demographicSurvey: 'CDCP-RENW-ADCH-0017',
      },
      child: {
        childInformation: 'CDCP-RENW-CHLD-0001',
        parentOrGuardian: 'CDCP-RENW-CHLD-0002',
        parentIntro: 'CDCP-RENW-CHLD-0003',
        dentalInsurance: 'CDCP-RENW-CHLD-0004',
        confirmFederalProvincialTerritorialBenefits: 'CDCP-RENW-CHLD-0005',
        updateFederalProvincialTerritorialBenefits: 'CDCP-RENW-CHLD-0006',
        confirmPhone: 'CDCP-RENW-CHLD-0007',
        confirmEmail: 'CDCP-RENW-CHLD-0008',
        confirmMaritalStatus: 'CDCP-RENW-CHLD-0009',
        maritalStatus: 'CDCP-RENW-CHLD-00010',
        confirmAddress: 'CDCP-RENW-CHLD-0011',
        updateMailingAddress: 'CDCP-RENW-CHLD-0012',
        updateHomeAddress: 'CDCP-RENW-CHLD-0013',
        reviewChildInformation: 'CDCP-RENW-CHLD-0014',
        reviewAdultInformation: 'CDCP-RENW-CHLD-0015',
        exitApplication: 'CDCP-RENW-CHLD-0016',
        demographicSurvey: 'CDCP-RENW-CHLD-0017',
        confirmation: 'CDCP-RENW-CHLD-0018',
      },
    },
    unableToProcessRequest: 'CDCP-UNAB-0001',
    notFound: 'CDCP-ERR-0404',
  },
} as const;
