package ca.gov.dtsstn.cdcp.api.config;

import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springdoc.core.customizers.OpenApiCustomizer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.info.GitProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import ca.gov.dtsstn.cdcp.api.config.properties.ApplicationProperties;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.security.OAuthFlow;
import io.swagger.v3.oas.models.security.OAuthFlows;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.security.SecurityScheme.Type;

/**
 * This class configures SpringDoc and customizes the OpenAPI documentation.
 */
@Configuration
public class SpringDocConfig {

	static final Logger log = LoggerFactory.getLogger(SpringDocConfig.class);

	@Autowired ApplicationProperties applicationProperties;

	@Autowired GitProperties gitProperties;

	/**
	 * SpringDoc annotations used to tell Swagger UI that an endpoint is protected by OAuth.
	 */
	@Retention(RetentionPolicy.RUNTIME)
	@SecurityRequirement(name = "Azure AD")
	public static @interface OAuthSecurityRequirement {}

	/**
	 * Creates an {@link OpenApiCustomizer} bean that customizes the OpenAPI base documentation.
	 */
	@Bean OpenApiCustomizer baseOpenApiCustomizer() {
		log.info("Creating 'baseOpenApiCustomizer' bean");
		return openApi -> openApi.getInfo()
			.title(applicationProperties.getSwaggerUi().getApplicationName())
			.contact(new Contact()
				.name(applicationProperties.getSwaggerUi().getContactName())
				.url(applicationProperties.getSwaggerUi().getContactUrl()))
			.description(applicationProperties.getSwaggerUi().getDescription())
			.termsOfService(applicationProperties.getSwaggerUi().getTosUrl())
			.version(getApplicationVersion());
	}

	/**
	 * Creates an {@link OpenApiCustomizer} bean that customizes the OpenAPI security documentation.
	 */
	@ConditionalOnProperty(name = { "application.security.enabled" }, havingValue = "true", matchIfMissing = false)
	@Bean OpenApiCustomizer securityOpenApiCustomizer() {
		log.info("Creating 'securityOpenApiCustomizer' bean");
		return openApi -> openApi.getComponents()
			.addSecuritySchemes("Azure AD", new SecurityScheme()
				.type(Type.OAUTH2)
				.flows(new OAuthFlows()
					.implicit(new OAuthFlow()
						.authorizationUrl(applicationProperties.getSwaggerUi().getAuthentication().getAuthorizationUrl())
						.tokenUrl(applicationProperties.getSwaggerUi().getAuthentication().getTokenUrl())
						.scopes(applicationProperties.getSwaggerUi().getAuthentication().getScopes()))));
	}

	/**
	 * Generates the application version string based on Git properties.
	 */
	protected String getApplicationVersion() {
		return "v%s (%s)".formatted(gitProperties.get("build.version"), gitProperties.getShortCommitId());
	}

}
