# ---------------------------------------------------------------------------------------------------------------------
# COMMON TERRAGRUNT VARIABLES
#
# Variables that are common to all environments.
# Usage: common_config = read_terragrunt_config(find_in_parent_folders("common-vars.hcl"))
# ---------------------------------------------------------------------------------------------------------------------

locals {
  tags = {
    "Branch"                    = "Innovation, Information and Technology"
    "Classification"            = "Protected B / Medium integrity / Medium availability"
    "Department"                = "Employment and Social Development Canada"
    "Directorate"               = "Business Solutions and Information Management"
    "Division"                  = "Digital Technology Solutions"
    "IaCToolChain"              = "Terragrunt/Terraform"
    "ProjectName"               = "Canadian Dental Care Plan"
    "ProductOwner"              = "Geoff Anderton <geoff.anderton@servicecanada.gc.ca>"
    # core_it_points_of_contact is required by CloudOps starting Nov. 2023
    "core_it_points_of_contact" = "Amy Wong <amy.wong@hrsdc-rhdcc.gc.ca>; Greg Baker <gregory.j.baker@hrsdc-rhdcc.gc.ca>; Guillaume Liddle <guillaume.liddle@hrsdc-rhdcc.gc.ca>"
  }
}
