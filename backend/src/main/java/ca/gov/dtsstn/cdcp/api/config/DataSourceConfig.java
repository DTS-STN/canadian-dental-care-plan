package ca.gov.dtsstn.cdcp.api.config;

import java.util.Optional;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@Configuration
@EnableJpaAuditing
public class DataSourceConfig {

	@Bean AuditorAware<String> auditor() {
		return () -> Optional.of("Canadian Dental Care Plan API");
	}

}
