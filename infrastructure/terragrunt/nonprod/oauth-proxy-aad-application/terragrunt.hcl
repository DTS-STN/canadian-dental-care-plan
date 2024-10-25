# ---------------------------------------------------------------------------------------------------------------------
# TERRAGRUNT NONPROD CONFIGURATION
# ---------------------------------------------------------------------------------------------------------------------

terraform {
  source = "../../../terraform//azure-ad-application"
}

include "root" {
  path = find_in_parent_folders("terragrunt-root.hcl")
}

inputs = {
  application_display_name = "Canadian Dental Care Program: OAuth proxy (nonprod)"
  application_identifier_uris = [
    "api://canadian-dental-care-program-nonprod.esdc-edsc.gc.ca"
  ]
  application_oauth2_permission_scopes = [
    {
      id                         = "0f20440a-1834-4fc2-a71f-68cf413bcdd0"
      admin_consent_description  = "Allows access to protected applications."
      admin_consent_display_name = "Access protected applications"
      user_consent_description   = "Allows access to protected applications."
      user_consent_display_name  = "Access protected applications"
      value                      = "Application.Access"
    }
  ]
  application_owners = [
    "amy.wong@hrsdc-rhdcc.gc.ca",
    "gregory.j.baker@hrsdc-rhdcc.gc.ca",
  ]
  application_passwords = [
    "Default secret"
  ]
  application_web_redirect_uris = [
    "https://cdcp-dev.dev-dp.dts-stn.com/oauth/callback",
    "https://cdcp-dev.dev-dp-internal.dts-stn.com/oauth/callback",

    "https://cdcp-int1.dev-dp.dts-stn.com/oauth/callback",
    "https://cdcp-int1.dev-dp-internal.dts-stn.com/oauth/callback",
    "https://cdcp-int2.dev-dp.dts-stn.com/oauth/callback",
    "https://cdcp-int2.dev-dp-internal.dts-stn.com/oauth/callback",

    "https://cdcp-perf.dev-dp.dts-stn.com/oauth/callback",
    "https://cdcp-perf.dev-dp-internal.dts-stn.com/oauth/callback",

    "https://cdcp-staging.dev-dp.dts-stn.com/oauth/callback",
    "https://cdcp-staging.dev-dp-internal.dts-stn.com/oauth/callback",

    "https://cdcp-training.dev-dp.dts-stn.com/oauth/callback",
    "https://cdcp-training.dev-dp-internal.dts-stn.com/oauth/callback",

    "https://cdcp-uat1.dev-dp.dts-stn.com/oauth/callback",
    "https://cdcp-uat1.dev-dp-internal.dts-stn.com/oauth/callback",
    "https://cdcp-uat2.dev-dp.dts-stn.com/oauth/callback",
    "https://cdcp-uat2.dev-dp-internal.dts-stn.com/oauth/callback",
  ]
}
