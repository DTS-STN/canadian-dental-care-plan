export interface ValidateWSAddressRequestDTOProps {
  addressLine: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  geographicScope: string;
  parseType: string;
  language: string;
}

export class ValidateWSAddressRequestDTO implements ValidateWSAddressRequestDTOProps {

  addressLine: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  geographicScope: string;
  parseType: string;
  language: string;

  constructor(addressLine: string, 
    city: string,
    province: string,
    postalCode: string,
    country: string,
    geographicScope: string,
    parseType: string,
    language: string) {

    this.addressLine = addressLine;
    this.city = city;
    this.province = province;
    this.postalCode = postalCode;
    this.country = country;
    this.geographicScope = geographicScope;
    this.parseType = parseType;
    this.language = language;
  }
}