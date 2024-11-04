output "client_id" {
  description = "The client ID (also called application registration ID)."
  value       = azuread_application.main.client_id
}

output "client_secrets" {
  # Note: fetch secrets using `terragrunt output client_secrets`
  description = "The application client secrets."
  value       = [for secret in azuread_application_password.main : { (secret.display_name) = "${secret.value} (expires: ${secret.end_date})" }]
  sensitive   = true
}

output "identifier_uris" {
  description = "A set of user-defined URI(s) that uniquely identify an application within its Azure AD tenant."
  value       = flatten(azuread_application.main.identifier_uris)
}
