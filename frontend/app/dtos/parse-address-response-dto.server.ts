export interface ParseWSAddressResponseDTOProps {
  responseType?: string;
  addressLine?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  streetNumberSuffix?: string;
  streetDirection?: string;
  unitType?: string;
  unitNumber?: string;
  serviceAreaName?: string;
  serviceAreaType?: string;
  serviceAreaQualifier?: string;
  cityLong?: string;
  cityShort?: string;
  deliveryInformation?: string;
  extraInformation?: string;
  statusCode?: string;
  canadaPostInformation?: string;
  message?: string;
  addressType?: string;
  streetNumber?: string;
  streetName?: string;
  streetType?: string;
  serviceType?: string;
  serviceNumber?: string;
  country?: string;
  warnings?: string;
  functionalMessages?: {action: string, message: string}[];
}

export class ParseWSAddressResponseDTO implements ParseWSAddressResponseDTOProps {
  responseType?: string;
  addressLine?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  streetNumberSuffix?: string;
  streetDirection?: string;
  unitType?: string;
  unitNumber?: string;
  serviceAreaName?: string;
  serviceAreaType?: string;
  serviceAreaQualifier?: string;
  cityLong?: string;
  cityShort?: string;
  deliveryInformation?: string;
  extraInformation?: string;
  statusCode?: string;
  canadaPostInformation?: string;
  message?: string;
  addressType?: string;
  streetNumber?: string;
  streetName?: string;
  streetType?: string;
  serviceType?: string;
  serviceNumber?: string;
  country?: string;
  warnings?: string;
  functionalMessages?: {action: string, message: string}[];

  constructor(responseType?: string,
    addressLine?: string,
    city?: string,
    province?: string,
    postalCode?: string,
    streetNumberSuffix?: string,
    streetDirection?: string,
    unitType?: string,
    unitNumber?: string,
    serviceAreaName?: string,
    serviceAreaType?: string,
    serviceAreaQualifier?: string,
    cityLong?: string,
    cityShort?: string,
    deliveryInformation?: string,
    extraInformation?: string,
    statusCode?: string,
    canadaPostInformation?: string,
    message?: string,
    addressType?: string,
    streetNumber?: string,
    streetName?: string,
    streetType?: string,
    serviceType?: string,
    serviceNumber?: string,
    country?: string,
    warnings?: string,
    functionalMessages?: {action: string, message: string}[]) {

    this.responseType = responseType;
    this.addressLine = addressLine;
    this.city = city;
    this.province = province;
    this.postalCode = postalCode;
    this.streetNumberSuffix = streetNumberSuffix;
    this.streetDirection = streetDirection;
    this.unitType = unitType;
    this.unitNumber = unitNumber;
    this.serviceAreaName = serviceAreaName;
    this.serviceAreaType = serviceAreaType;
    this.serviceAreaQualifier = serviceAreaQualifier;
    this.cityLong = cityLong;
    this.cityShort = cityShort;
    this.deliveryInformation = deliveryInformation;
    this.extraInformation = extraInformation;
    this.statusCode = statusCode;
    this.canadaPostInformation = canadaPostInformation;
    this.message = message;
    this.addressType = addressType;
    this.streetNumber = streetNumber;
    this.streetName = streetName;
    this.streetType = streetType;
    this.serviceType = serviceType;
    this.serviceNumber = serviceNumber;
    this.country = country;
    this.warnings = warnings;
    this.functionalMessages = functionalMessages;
  }
}