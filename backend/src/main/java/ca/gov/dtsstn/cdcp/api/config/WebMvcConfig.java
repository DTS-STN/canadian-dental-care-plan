package ca.gov.dtsstn.cdcp.api.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

	private static final Logger log = LoggerFactory.getLogger(WebMvcConfig.class);

	@Override
	public void addViewControllers(ViewControllerRegistry registry) {
		log.info("Redirecting / to /swagger-ui/index.html");
		registry.addRedirectViewController("/", "/swagger-ui/index.html");
	}

}