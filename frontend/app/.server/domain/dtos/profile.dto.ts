export type CommunicationPreferenceRequestDto = Readonly<{
  preferredLanguage: string;
  preferredMethod: string;
  preferredMethodGovernmentOfCanada: string;
}>;

export type PhoneNumberRequestDto = Readonly<{
  phoneNumber?: string;
  phoneNumberAlt?: string;
}>;
