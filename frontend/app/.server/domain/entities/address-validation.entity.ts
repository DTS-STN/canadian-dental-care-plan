export type AddressCorrectionRequestEntity = Readonly<{
  address: string;
  city: string;
  postalCode: string;
  provinceCode: string;
}>;

export type AddressCorrectionResultEntity = Readonly<{
  'wsaddr:CorrectionResults': Readonly<{
    'nc:AddressFullText': string;
    'nc:AddressCityName': string;
    'can:ProvinceCode': string;
    'nc:AddressPostalCode': string;
    'wsaddr:Information': Readonly<{
      'wsaddr:StatusCode': string;
    }>;
  }>;
}>;
