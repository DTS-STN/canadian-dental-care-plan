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
  application_display_name = "Canadian Dental Care Program: Service Principal"
  application_app_roles = [{
    id                   = "42a55bc0-5c40-4502-a729-791e1fe9d4e0"
    display_name         = "HealthCheck Monitor"
    value                = "HealthCheck.ViewDetails"
    description          = "HealthCheck monitors can view detailed output of a health check."
    allowed_member_types = ["Application", "User"]
    members = [
      "gregory.j.baker@hrsdc-rhdcc.gc.ca",
      "nicholas.ly@hrsdc-rhdcc.gc.ca",
    ]
  }]
  application_identifier_uris = [
    "api://cdcp.esdc-edsc.gc.ca/frontend",
  ]
  application_owners = [
    "amy.wong@hrsdc-rhdcc.gc.ca",
    "gregory.j.baker@hrsdc-rhdcc.gc.ca",
    "nicholas.ly@hrsdc-rhdcc.gc.ca",
  ]
  application_passwords = [
    "Default secret",
  ]
  application_web_redirect_uris = [
    "https://srv024.service.canada.ca/auth/callback",
  ]
}
