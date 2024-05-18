package ca.gov.dtsstn.cdcp.api.config.properties;

import org.hibernate.validator.constraints.URL;
import org.springframework.validation.annotation.Validated;

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

}
