package ca.gov.dtsstn.cdcp.api.config.properties;

import java.util.List;
import java.util.Optional;

import org.hibernate.validator.constraints.URL;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.NestedConfigurationProperty;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * @author Greg Baker (gregory.j.baker@hrsdc-rhdcc.gc.ca)
 */
@Validated
@ConfigurationProperties("application.swagger-ui")
public record SwaggerUiProperties(
	@NotBlank String applicationName,
	@NestedConfigurationProperty SwaggerUiProperties.AuthenticationProperties authentication,
	@NotBlank String contactName,
	@NotNull @URL String contactUrl,
	@NotBlank String description,
	@NestedConfigurationProperty List<SwaggerUiProperties.Server> servers,
	@NotNull @URL String tosUrl
) {

	public List<SwaggerUiProperties.Server> servers() {
		return Optional.ofNullable(this.servers).orElse(List.of());
	}

	public record AuthenticationProperties(
		@NestedConfigurationProperty AuthenticationProperties.HttpProperties http,
		@NestedConfigurationProperty AuthenticationProperties.OAuthProperties oauth
	) {

		public record HttpProperties(
			@NotBlank String description
		) {}

		public record OAuthProperties(
			@NotNull @URL String authorizationUrl,
			@NotBlank String clientId,
			@NotBlank String description,
			@NotNull @URL String tokenUrl
		) {}
	}

	public record Server(
		String description,
		@NotNull @URL String url
	) {}
}