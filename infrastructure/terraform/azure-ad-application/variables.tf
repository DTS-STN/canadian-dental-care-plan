variable "application_owners" {
  description = "Active Directory user principal names (ie: email addresses) of users who own this AAD application."
  type        = set(string)
  default     = []
}

variable "application_display_name" {
  description = "The display name to use for this AAD application."
  type        = string
}

variable "application_identifier_uris" {
  description = "A set of user-defined URIs that uniquely identify this AAD application within the AAD tenant."
  type        = set(string)
}

variable "application_oauth2_permission_scopes" {
  description = "Zero or more oauth2_permission_scopes used to describe delegated permissions exposed by the web API represented by this application."
  type        = set(object({
    id                         = string # The unique identifier of the delegated permission. Must be a valid UUID.
    admin_consent_display_name = string # Display name for the delegated permission, intended to be read by an administrator granting the permission on behalf of all users.
    admin_consent_description  = string # Delegated permission description that appears in all tenant-wide admin consent experiences, intended to be read by an administrator granting the permission on behalf of all users.
    user_consent_display_name  = string # Display name for the delegated permission that appears in the end user consent experience.
    user_consent_description   = string # Delegated permission description that appears in the end user consent experience, intended to be read by a user consenting on their own behalf.
    value                      = string # The value that is used for the scp claim in OAuth 2.0 access tokens.
  }))
  default = []
}

variable "application_passwords" {
  description = "The set of password credentials (ie: client secrets) associated with this AAD application."
  type        = set(string)
  default     = []
}

variable "application_web_redirect_uris" {
  description = "The set of redirect URIs where OAuth 2.0 authorization codes and access tokens are sent when authenticating this AAD application."
  type        = set(string)
  default     = []
}
