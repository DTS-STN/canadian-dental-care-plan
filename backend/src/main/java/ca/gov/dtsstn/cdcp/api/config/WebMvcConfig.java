package ca.gov.dtsstn.cdcp.api.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Configuration class for Spring MVC.
 * <p>
 * This class configures the following:
 * <li>Redirects the root path ({@code /}) to the Swagger UI index page ({@code /swagger-ui/index.html})
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

	static final Logger log = LoggerFactory.getLogger(WebMvcConfig.class);

	/**
	 * Adds a redirect view controller for the root path ({@code /}).
	 * <p>
	 * This method configures Spring MVC to redirect all requests to the root
	 * path ({@code /}) to the Swagger UI index page ({@code /swagger-ui/index.html}).
	 * This allows users to easily access the Swagger UI documentation for the API.
	 */
	@Override
	public void addViewControllers(ViewControllerRegistry registry) {
		log.info("Redirecting / to /swagger-ui/index.html");
		registry.addRedirectViewController("/", "/swagger-ui/index.html");
	}

}