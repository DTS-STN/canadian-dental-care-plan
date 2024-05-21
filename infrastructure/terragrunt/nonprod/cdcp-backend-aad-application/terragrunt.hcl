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
  application_display_name    = "Canadian Dental Care Program: Backend API (nonprod)"
  application_identifier_uris = ["api://cdcp-api.nonprod.esdc-edsc.gc.ca"]
  application_owners          = ["amy.wong@hrsdc-rhdcc.gc.ca", "gregory.j.baker@hrsdc-rhdcc.gc.ca"]
  application_passwords       = ["Default secret"]

  application_app_roles = [
    {
      id                   = "0ae18590-25c3-422d-a561-bf7394f6cefb"
      allowed_member_types = ["Application", "User"]
      display_name         = "User administrator"
      description          = "User administrators have the ability to view, modify, and delete users."
      value                = "Users.Administer"
    },
  ]

  application_web_implicit_grants_access_token_issuance_enabled = true
  application_web_redirect_uris                                 = ["http://localhost:8080/swagger-ui/oauth2-redirect.html"]
}
