/**
 * A resource for information about the success/failure of a restful operation.
 */
export type InteropOperationOutcomeEntity = {
  ResourceID?: string;
  ResourceLanguage?: {
    CommunicationCategoryCode?: {
      ReferenceDataID?: string;
      ReferenceDataName?: string;
    };
    LanguageCode?: {
      ReferenceDataID?: string;
      ReferenceDataName?: string;
    };
    PreferredIndicator?: boolean;
  };
  ResourceMeta?: {
    LastUpdatedDate?: {
      /** Format: date */
      date?: string;
      /** Format: date-time */
      dateTime?: string;
      DayDate?: string;
      MonthDate?: string;
      YearDate?: string;
    };
    SecurityAttribute?: {
      DataElementReference?: string[];
      SecurityCode?: {
        ReferenceDataID?: string;
        ReferenceDataName?: string;
      }[];
      SecurityLabel?: string[];
    };
    SourceCode?: {
      ReferenceDataID?: string;
      ReferenceDataName?: string;
    };
    VersionID?: string;
  };
  ResourceReference?: string;
  Issue?: {
    IssueAdditionalInformation?: string;
    IssueCode?: {
      ReferenceDataID?: string;
      ReferenceDataName?: string;
    };
    IssueDate?: {
      /** Format: date */
      date?: string;
      /** Format: date-time */
      dateTime?: string;
      DayDate?: string;
      MonthDate?: string;
      YearDate?: string;
    };
    IssueDetails?: string;
    IssueReferenceExpression?: string[];
    IssueSeverityCode?: {
      ReferenceDataID?: string;
      ReferenceDataName?: string;
    };
  }[];
  OperationOutcomeDate?: {
    /** Format: date */
    date?: string;
    /** Format: date-time */
    dateTime?: string;
    DayDate?: string;
    MonthDate?: string;
    YearDate?: string;
  };
  OperationOutcomeStatus?: {
    StatusCode?: {
      ReferenceDataID?: string;
      ReferenceDataName?: string;
    };
  };
};
