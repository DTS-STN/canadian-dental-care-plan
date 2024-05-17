package ca.gov.dtsstn.cdcp.api.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.NoSuchBeanDefinitionException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest
@ActiveProfiles("test")
@Import({ CacheConfig.class })
class CacheConfigIT {

	@Nested
	@TestPropertySource(properties = { "application.caching.enabled=true" })
	class CacheConfigEnabledIT {

		@Autowired ApplicationContext applicationContext;

		@Test
		@DisplayName("Test application.caching.enabled=true")
		void testCachingEnabled() {
			assertThat(applicationContext.getBean(CacheConfig.class)).isNotNull();
		}

	}

	@Nested
	@TestPropertySource(properties = { "application.caching.enabled=false" })
	class CacheConfigNotEnabledIT {

		@Autowired ApplicationContext applicationContext;

		@Test
		@DisplayName("Test application.caching.enabled=false")
		void testCachingNotEnabled() {
			assertThrows(NoSuchBeanDefinitionException.class, () -> applicationContext.getBean(CacheConfig.class));
		}

	}

}
