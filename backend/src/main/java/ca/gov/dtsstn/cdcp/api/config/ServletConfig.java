package ca.gov.dtsstn.cdcp.api.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.web.filter.ShallowEtagHeaderFilter;

/**
 * This class configures the servlet container by handling filter bean creation and registration.
 */
@Configuration
public class ServletConfig {

	static final Logger log = LoggerFactory.getLogger(ServletConfig.class);

	@ConfigurationProperties("application.shallow-etag-header-filter")
	@Bean ShallowEtagHeaderFilter shallowEtagHeaderFilter() {
		log.info("Creating 'shallowEtagHeaderFilter' bean");
		return new ShallowEtagHeaderFilter();
	}

	@Bean FilterRegistrationBean<ShallowEtagHeaderFilter> shallowEtagHeaderFilterRegistration() {
		log.info("Creating 'shallowEtagHeaderFilterRegistration' bean");

		final var shallowEtagHeaderFilter = shallowEtagHeaderFilter();
		final var filterRegistrationBean = new FilterRegistrationBean<>(shallowEtagHeaderFilter);
		filterRegistrationBean.setOrder(Ordered.HIGHEST_PRECEDENCE);

		return filterRegistrationBean;
	}

}
