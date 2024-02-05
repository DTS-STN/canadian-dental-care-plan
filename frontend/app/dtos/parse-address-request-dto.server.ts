export interface ParseWSAddressRequestDTOProps {
  addressLine: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  language: string;
}

export class ParseWSAddressRequestDTO implements ParseWSAddressRequestDTOProps {

  addressLine: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  language: string;

  constructor(addressLine: string, 
    city: string,
    province: string,
    postalCode: string,
    country: string,
    language: string) {

    this.addressLine = addressLine;
    this.city = city;
    this.province = province;
    this.postalCode = postalCode;
    this.country = country;
    this.language = language;
  }
}