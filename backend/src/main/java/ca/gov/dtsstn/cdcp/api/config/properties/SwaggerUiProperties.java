package ca.gov.dtsstn.cdcp.api.config.properties;

import org.hibernate.validator.constraints.URL;
import org.springframework.boot.context.properties.NestedConfigurationProperty;
import org.springframework.validation.annotation.Validated;

import io.swagger.v3.oas.models.security.Scopes;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Swagger UI properties for the application.
 */
@Validated
public class SwaggerUiProperties {

	/**
	 * The name of the application.
	 * This name will be displayed in the Swagger UI title bar.
	 * Must not be blank.
	 */
	@NotBlank
	private String applicationName;

	/**
	 * Authentication configuration for Swagger UI.
	 */
	@NestedConfigurationProperty
	private final AuthenticationProperties authentication = new AuthenticationProperties();

	/**
	 * The name of the contact person or team for the application.
	 * This name will be displayed in the Swagger UI contact information.
	 * Must not be blank.
	 */
	@NotBlank
	private String contactName;

	/**
	 * The URL of the contact person or team for the application.
	 * This URL will be displayed in the Swagger UI contact information.
	 * Must be a valid URL.
	 * Must not be null.
	 */
	@NotNull @URL
	private String contactUrl;

	/**
	 * A description of the application.
	 * This description will be displayed in the Swagger UI overview section.
	 * Must not be blank.
	 */
	@NotBlank
	private String description;

	/**
	 * The URL of the terms of service for the application.
	 * This URL will be displayed in the Swagger UI terms of service section.
	 * Must be a valid URL.
	 * Must not be null.
	 */
	@NotNull @URL
	private String tosUrl;

	public String getApplicationName() {
		return applicationName;
	}

	public void setApplicationName(String applicationName) {
		this.applicationName = applicationName;
	}

	public AuthenticationProperties getAuthentication() {
		return authentication;
	}

	public String getContactName() {
		return contactName;
	}

	public void setContactName(String contactName) {
		this.contactName = contactName;
	}

	public String getContactUrl() {
		return contactUrl;
	}

	public void setContactUrl(String contactUrl) {
		this.contactUrl = contactUrl;
	}

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	public String getTosUrl() {
		return tosUrl;
	}

	public void setTosUrl(String tosUrl) {
		this.tosUrl = tosUrl;
	}

	@Validated
	public static class AuthenticationProperties {

		@NotBlank @URL
		private String authorizationUrl;

		@NotBlank
		private String clientId;

		private final Scopes scopes = new Scopes();

		@NotBlank @URL
		private String tokenUrl;

		public String getAuthorizationUrl() {
			return authorizationUrl;
		}

		public void setAuthorizationUrl(String authorizationUrl) {
			this.authorizationUrl = authorizationUrl;
		}

		public String getClientId() {
			return clientId;
		}

		public void setClientId(String clientId) {
			this.clientId = clientId;
		}

		public Scopes getScopes() {
			return scopes;
		}

		public String getTokenUrl() {
			return tokenUrl;
		}

		public void setTokenUrl(String tokenUrl) {
			this.tokenUrl = tokenUrl;
		}

	}

}
