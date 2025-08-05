# Canadian Dental Care Plan Releases

## v5.5.0

- Redirect Renewals to Intake
- Add CDCP Online Application Feedback Questionnaire Link

## v5.4.0

- Add digital communications to renewal
- Leverage Interop for code tables
- Incompatible browser mitigation
- Fixes communications preference and missing spouse info

## v5.3.0

- Updating client-friendly statuses to direct users to MSCA
- Fixing issue related to the email verification flag being sent incorrectly to downstream API
- Fixing issue where primary applicant is not appearing when renewing dependent applications in the protected space

## v5.2.0

- Fix issue where the email verified flag is incorrectly set to false
  despite email sent to the downstream API
- Correct back button on the Terms and Conditions page in the
  protected Apply section to redirect to MSCA-D
- Resolve issue where the email verification code was sent in the wrong
  language
- Reload client-friendly statuses to reflect updated pending processing
  status

## v5.1.0

- Add additional validation for the spouse/partner's year of birth for intakes and renewals
- Truncate address city to 30 characters before verification
- Preserve properties when logging errors

## v5.0.0

- Expand eligibility to allow adults aged 18 to 64 to apply for the CDCP
- Introduce the online application accessible through MSCA

## v4.3.0

- Updating text on renewal application's personal information page
- Fixing translation and text issues on French renewal confirmation page

## v4.2.0

- Adding SIN validation for submitting renewal application
- Redirecting to ITA renewal flow when marital status does not exist for applicant

## v4.1.0

- Change French renewal paths to /renouveler

## v4.0.0

- Intoduce renewals in public and protected areas

## v3.6.0

- Add validation to first name fields to reject digits

## v3.5.0

- Content changes to "You have not applied for CDCP" page
- Changes to protected space footer

## v3.4.0

- New feature flag for registering for MSCA
- Last name validation updated to be letters only
- Modifying cache-control header to no-cache
- Changing default status checker redirect when state is loaded

## v3.3.0

- Status checker has its own results route so statuses display in both languages
- Various status checker text changes
- Minor bug fixes for online application

## v3.2.0

- Fix session API issue with redirectTo and refactoring app locales

## v3.1.0

- Add postal code validation based on provinces/territories for online application
- Refactoring session timeout
- New feature flag to enable/disable "Back" and "Exit" buttons in status checker
- Fixing typos

## v3.0.0

- Enabling the Status Checker feature
- Cosmetic changes to the online application including changes to birth date pickers

## v2.4.0

- Fix document title for Adobe Analytics

## v2.3.0

- Set inputmode to "numeric" with DatePickerField
- Set inputmode to "text" with InputSanitizeField

## v2.2.0

- prevent SIN with only zeros

## v2.1.0

- FormData constructor's second argument, 'submitter', is not supported by older browsers.
- JS error when hitting backspace in an empty sanitized input field

## v2.0.0

- allow people under 65 years of age with a disability tax credit to
  apply for CDCP
- allow people to apply on behalf of children
- allow 16/17 year olds living independently to apply

## v1.2.0

- Fix RAOIDC token verification
- Accessibility fixes

## v1.1.0

- Fix application submission event name
- Fix [object Object] logging issue
- Minor a11y fix

## v1.0.0
