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

import ca.gov.dtsstn.cdcp.api.config.WebSecurityConfig.DisabledSecurityConfig;
import ca.gov.dtsstn.cdcp.api.config.WebSecurityConfig.EnabledSecurityConfig;

@SpringBootTest
@ActiveProfiles("test")
@Import({ WebSecurityConfig.class })
class WebSecurityConfigIT {

	@Nested
	@TestPropertySource(properties = { "application.security.enabled=true" })
	class SecurityConfigEnabledIT {

		@Autowired ApplicationContext applicationContext;

		@Test
		@DisplayName("Test application.security.enabled=true")
		void testCachingEnabled() {
			assertThat(applicationContext.getBean(EnabledSecurityConfig.class)).isNotNull();
			assertThrows(NoSuchBeanDefinitionException.class, () -> applicationContext.getBean(DisabledSecurityConfig.class));
		}

	}

	@Nested
	@TestPropertySource(properties = { "application.security.enabled=false" })
	class SecurityConfigNotEnabledIT {

		@Autowired ApplicationContext applicationContext;

		@Test
		@DisplayName("Test application.securty.enabled=false")
		void testCachingNotEnabled() {
			assertThat(applicationContext.getBean(DisabledSecurityConfig.class)).isNotNull();
			assertThrows(NoSuchBeanDefinitionException.class, () -> applicationContext.getBean(EnabledSecurityConfig.class));
		}

	}

}
