package ca.gov.dtsstn.cdcp.api.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityCustomizer;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;

/**
 * This class configures Spring Security for the application.
 */
@Configuration
@EnableMethodSecurity
public class WebSecurityConfig {

	static final Logger log = LoggerFactory.getLogger(WebSecurityConfig.class);

	@Configuration
	@ConditionalOnProperty(name = { "application.security.enabled" }, havingValue = "false", matchIfMissing = true)
	static class DisabledSecurityConfig {

		@Bean WebSecurityCustomizer webSecurityCustomizer() {
			log.info("Creating 'webSecurityCustomizer' bean");
			log.warn("⚠️ All security checks are DISABLED -- set application.security.enabled=true to enable");
			return (web) -> web.ignoring().anyRequest();
		}

	}

	@Configuration
	@ConditionalOnProperty(name = { "application.security.enabled" }, havingValue = "true", matchIfMissing = false)
	static class EnabledSecurityConfig {

		@Autowired HttpSecurity httpSecurity;

		/**
		 * Converts incoming JWT claims to Spring Security roles.
		 */
		@Bean JwtAuthenticationConverter jwtAuthenticationConverter() {
			final var jwtGrantedAuthoritiesConverter = new JwtGrantedAuthoritiesConverter();
			jwtGrantedAuthoritiesConverter.setAuthoritiesClaimName("roles");
			jwtGrantedAuthoritiesConverter.setAuthorityPrefix("ROLE_");

			final var jwtAuthenticationConverter = new JwtAuthenticationConverter();
			jwtAuthenticationConverter.setJwtGrantedAuthoritiesConverter(jwtGrantedAuthoritiesConverter);

			return jwtAuthenticationConverter;
		}

		@Bean SecurityFilterChain securityFilterChain() throws Exception {
			log.info("Disabling CSRF protection (reason: stateless api)");
			httpSecurity.csrf(csrf -> csrf.disable());

			log.info("Configuring OAuth resource server settings");
			httpSecurity.oauth2ResourceServer(oauth2 -> oauth2
				.jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter())));

			log.info("Securing API endpoints");
			httpSecurity.authorizeHttpRequests(requests -> requests
				.requestMatchers("/api/v1/users/**").hasRole("Users.Administer"));

			return httpSecurity.build();
		}

		@Bean WebSecurityCustomizer webSecurityCustomizer() {
			log.info("Creating 'webSecurityCustomizer' bean");
			return (web) -> web.ignoring()
				// ignore root resource (required to forward to /swagger-ui)
				.requestMatchers(new AntPathRequestMatcher("/"))
				// ignore H2 console
				.requestMatchers(new AntPathRequestMatcher("/h2-console/**"))
				// ignore OpenAPI and Swagger UI resources
				.requestMatchers(new AntPathRequestMatcher("/swagger-ui/**"))
				.requestMatchers(new AntPathRequestMatcher("/v3/api-docs/**"));
		}

	}

}
