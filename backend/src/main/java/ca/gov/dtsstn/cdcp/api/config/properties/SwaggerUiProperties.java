package ca.gov.dtsstn.cdcp.api.config.properties;

import org.hibernate.validator.constraints.URL;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Validated
public class SwaggerUiProperties {

	@NotBlank
	private String applicationName;

	@NotBlank
	private String contactName;

	@NotNull @URL
	private String contactUrl;

	@NotBlank
	private String description;

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
