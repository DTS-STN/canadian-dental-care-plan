package ca.gov.dtsstn.cdcp.api.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import ca.gov.dtsstn.cdcp.api.cache.CaffeineCacheFactory;

@Configuration
@EnableCaching
@ConditionalOnProperty(name = { "application.caching.enabled" }, matchIfMissing = true)
public class CacheConfig {

	static final Logger log = LoggerFactory.getLogger(CacheConfig.class);

	@ConfigurationProperties("application.caching.caches.alert-types")
	@Bean CaffeineCacheFactory alertTypesCache() {
		log.info("Creating 'alertTypesCache' bean");
		return new CaffeineCacheFactory("alert-types");
	}

}
