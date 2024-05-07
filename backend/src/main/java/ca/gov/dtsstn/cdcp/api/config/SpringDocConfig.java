package ca.gov.dtsstn.cdcp.api.config;
import org.springdoc.core.customizers.OpenApiCustomizer;
import org.springframework.boot.info.GitProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;


import io.swagger.v3.oas.models.info.Contact;


import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.core.env.Environment;

import com.fasterxml.jackson.databind.ObjectMapper;
import ca.gov.dtsstn.cdcp.api.config.properties.SwaggerUiProperties;

@Configuration
public class SpringDocConfig {
    private static final Logger log = LoggerFactory.getLogger(SpringDocConfig.class);
	
    public final class ExampleRefs {

    private ExampleRefs() { /* constants class */ }

    public static final String ACCESS_DENIED_ERROR = "AccessDeniedError";
    public static final String AUTHENTICATION_ERROR = "AuthenticationError";
    public static final String BAD_REQUEST_ERROR = "BadRequestError";
    public static final String INTERNAL_SERVER_ERROR = "InternalServerError";
    public static final String RESOURCE_NOT_FOUND_ERROR = "ResourceNotFoundError";
    public static final String UNPROCESSABLE_ENTITY_ERROR = "UnprocessableEntityError";
}
    
    
    @Autowired ObjectMapper objectMapper;
    @Bean OpenApiCustomizer openApiCustomizer(Environment environment, GitProperties gitProperties, SwaggerUiProperties swaggerUiProperties) {
		log.info("Creating 'openApiCustomizer' bean");

		return openApi -> {
			openApi.getInfo()
				.title(swaggerUiProperties.applicationName())
				.contact(new Contact()
					.name(swaggerUiProperties.contactName())
					.url(swaggerUiProperties.contactUrl()))
				.description(swaggerUiProperties.description())
				.termsOfService(swaggerUiProperties.tosUrl()) 
				.version(getApplicationVersion(gitProperties));
            };
	}

    protected String getApplicationVersion(GitProperties gitProperties) {
		return "v%s+%s".formatted(gitProperties.get("build.version"), gitProperties.getShortCommitId());
	}

}
