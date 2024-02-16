# ---------------------------------------------------------------------------------------------------------------------
# ENVIRONMENT-SPECIFIC TERRAGRUNT VARIABLES
#
# Variables that are common to all environments.
# Usage: env_config = read_terragrunt_config(find_in_parent_folders("env-vars.hcl"))
# ---------------------------------------------------------------------------------------------------------------------

locals {
  common_config = read_terragrunt_config(find_in_parent_folders("common-vars.hcl"))

  environment                  = "DTS Nonprod"
  backend_resource_group_name  = "EsDDTSDev_RHP_DATA"
  backend_storage_account_name = "canadadentalcareplandev"
  backend_subscription_id      = "07f55ef5-e27b-42ca-9771-f2705b08acd1" # MTS

  tags = merge(local.common_config.locals.tags, {
    "Environment" = local.environment
  })
}