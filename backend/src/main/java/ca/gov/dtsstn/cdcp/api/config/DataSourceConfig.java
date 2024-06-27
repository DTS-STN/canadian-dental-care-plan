package ca.gov.dtsstn.cdcp.api.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * This class configures Spring Data and any data sources required by the application.
 */
@Configuration
@EnableJpaAuditing
public class DataSourceConfig {}
