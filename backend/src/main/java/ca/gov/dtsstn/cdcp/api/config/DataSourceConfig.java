package ca.gov.dtsstn.cdcp.api.config;

import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@Configuration
@EnableJpaAuditing
public class DataSourceConfig {

	static final Logger log = LoggerFactory.getLogger(DataSourceConfig.class);

	@Bean AuditorAware<String> auditor() {
		log.info("Creating 'auditor' bean");
		return () -> Optional.of("Canadian Dental Care Plan API");
	}

}
