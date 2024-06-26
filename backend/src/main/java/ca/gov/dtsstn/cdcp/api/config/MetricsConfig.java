package ca.gov.dtsstn.cdcp.api.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.micrometer.core.aop.TimedAspect;
import io.micrometer.core.instrument.MeterRegistry;

/**
 * This class configures metric collection for the application.
 */
@Configuration
public class MetricsConfig {

	static final Logger log = LoggerFactory.getLogger(MetricsConfig.class);

	@Bean TimedAspect timedAspect(MeterRegistry meterRegstry) {
		log.info("Creating 'timedAspect' bean");
		return new TimedAspect(meterRegstry);
	}

}
