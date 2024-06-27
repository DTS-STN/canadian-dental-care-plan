package ca.gov.dtsstn.cdcp.api.data;

import java.util.Optional;
import java.util.function.Function;

import org.springframework.core.env.Environment;
import org.springframework.data.domain.AuditorAware;
import org.springframework.lang.NonNull;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.util.Assert;

@Component
public class DefaultAuditor implements AuditorAware<String> {

	private final String applicationName;

	public DefaultAuditor(Environment environment) {
		Assert.notNull(environment, "environment is required; it must not be null");
		this.applicationName = Optional.ofNullable(environment.getProperty("spring.application.name")).orElse("Canadian Dental Care Plan API");
	}

	@NonNull
	@Override
	public Optional<String> getCurrentAuditor() {
		final var securityContext = SecurityContextHolder.getContext();

		final var user = Optional.ofNullable(securityContext.getAuthentication())
			.filter(JwtAuthenticationToken.class::isInstance)
			.map(JwtAuthenticationToken.class::cast)
			.map(JwtAuthenticationToken::getToken)
			.map(toUserString())
			.orElse(applicationName);

		return Optional.of(user);
	}

	private Function<Jwt, String> toUserString() {
		return jwt -> {
			final var userName = Optional.ofNullable(jwt.getClaimAsString("name")).orElse("Service Principal");
			final var userId = Optional.ofNullable(jwt.getClaimAsString("sub")).orElse("00000000-0000-0000-0000-000000000000");
			return "%s (id: %s)".formatted(userName, userId);
		};
	}

}
