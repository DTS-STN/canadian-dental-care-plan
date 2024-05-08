package ca.gov.dtsstn.cdcp.api.config;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springdoc.core.customizers.OpenApiCustomizer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.info.GitProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

import com.fasterxml.jackson.databind.ObjectMapper;

import ca.gov.dtsstn.cdcp.api.config.properties.SwaggerUiProperties;
import io.swagger.v3.oas.models.info.Contact;

@Configuration
public class SpringDocConfig {

	private static final Logger log = LoggerFactory.getLogger(SpringDocConfig.class);

	@Autowired ObjectMapper objectMapper;

	@Bean OpenApiCustomizer openApiCustomizer(Environment environment, GitProperties gitProperties, SwaggerUiProperties swaggerUiProperties) {
		log.info("Creating 'openApiCustomizer' bean");

		return openApi -> openApi.getInfo()
			.title(swaggerUiProperties.applicationName())
			.contact(new Contact()
				.name(swaggerUiProperties.contactName())
				.url(swaggerUiProperties.contactUrl()))
			.description(swaggerUiProperties.description())
			.termsOfService(swaggerUiProperties.tosUrl())
			.version(getApplicationVersion(gitProperties));
	}

	protected String getApplicationVersion(GitProperties gitProperties) {
		return "v%s+%s".formatted(gitProperties.get("build.version"), gitProperties.getShortCommitId());
	}

}
