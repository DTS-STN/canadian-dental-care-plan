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

import ca.gov.dtsstn.cdcp.api.config.properties.ApplicationProperties;
import io.swagger.v3.oas.models.info.Contact;

@Configuration
public class SpringDocConfig {

	private static final Logger log = LoggerFactory.getLogger(SpringDocConfig.class);

	@Autowired ApplicationProperties applicationProperties;

	@Autowired Environment environment;

	@Autowired GitProperties gitProperties;

	@Autowired ObjectMapper objectMapper;

	@Bean OpenApiCustomizer openApiCustomizer() {
		log.info("Creating 'openApiCustomizer' bean");

		return openApi -> openApi.getInfo()
			.title(applicationProperties.getSwaggerUi().getApplicationName())
			.contact(new Contact()
				.name(applicationProperties.getSwaggerUi().getContactName())
				.url(applicationProperties.getSwaggerUi().getContactUrl()))
			.description(applicationProperties.getSwaggerUi().getDescription())
			.termsOfService(applicationProperties.getSwaggerUi().getTosUrl())
			.version(getApplicationVersion(gitProperties));
	}

	protected String getApplicationVersion(GitProperties gitProperties) {
		return "v%s (%s)".formatted(gitProperties.get("build.version"), gitProperties.getShortCommitId());
	}

}
