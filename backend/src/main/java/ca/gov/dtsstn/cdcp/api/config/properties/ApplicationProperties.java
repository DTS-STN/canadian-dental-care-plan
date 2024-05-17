package ca.gov.dtsstn.cdcp.api.config.properties;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.NestedConfigurationProperty;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties("application")
public class ApplicationProperties {

	@NestedConfigurationProperty
	private final CachingProperties caching = new CachingProperties();

	@NestedConfigurationProperty
	private final EmailNotificationProperties emailNotifications = new EmailNotificationProperties();

	@NestedConfigurationProperty
	private final SwaggerUiProperties swaggerUi = new SwaggerUiProperties();

	public CachingProperties getCaching() {
		return caching;
	}

	public EmailNotificationProperties getEmailNotifications() {
		return emailNotifications;
	}

	public SwaggerUiProperties getSwaggerUi() {
		return swaggerUi;
	}

}
