package ca.gov.dtsstn.cdcp.api.data;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.env.Environment;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

@ExtendWith({ MockitoExtension.class })
class DefaultAuditorTests {

	@Mock Environment environment;

	DefaultAuditor defaultAuditor;

	@BeforeEach
	void beforeEach() {
		this.defaultAuditor = new DefaultAuditor(environment);
	}

	@Test
	@DisplayName("Test DefaultAuditor.getCurrentAuditor() w/ no authentication")
	void testGetCurrentAuditor_NoAuth() {
		SecurityContextHolder.getContext().setAuthentication(null);
		final var currentAuditor = defaultAuditor.getCurrentAuditor();
		assertThat(currentAuditor).contains("Canadian Dental Care Plan API");
	}

	@Test
	@DisplayName("Test DefaultAuditor.getCurrentAuditor() w/ invalid authentication type")
	void testGetCurrentAuditor_InvalidAuth() {
		SecurityContextHolder.getContext().setAuthentication(mock(TestingAuthenticationToken.class));
		final var currentAuditor = defaultAuditor.getCurrentAuditor();
		assertThat(currentAuditor).contains("Canadian Dental Care Plan API");
	}

	@Test
	@DisplayName("Test DefaultAuditor.getCurrentAuditor() w/ user principal")
	void testGetCurrentAuditor_UserPrincipal() {
		final var authentication = mock(JwtAuthenticationToken.class);
		final var token = mock(Jwt.class);
		SecurityContextHolder.getContext().setAuthentication(authentication);

		when(authentication.getToken()).thenReturn(token);
		when(token.getClaimAsString("name")).thenReturn("Haffaf, Nicholas Sébastien [NC]");
		when(token.getClaimAsString("sub")).thenReturn("00000000-0000-0000-0000-000000000000");

		final var currentAuditor = defaultAuditor.getCurrentAuditor();
		assertThat(currentAuditor).contains("Haffaf, Nicholas Sébastien [NC] (id: 00000000-0000-0000-0000-000000000000)");
	}

	@Test
	@DisplayName("Test DefaultAuditor.getCurrentAuditor() w/ service principal")
	void testGetCurrentAuditor_ServicePrincipal() {
		final var authentication = mock(JwtAuthenticationToken.class);
		final var token = mock(Jwt.class);
		SecurityContextHolder.getContext().setAuthentication(authentication);

		when(authentication.getToken()).thenReturn(token);
		when(token.getClaimAsString("name")).thenReturn(null);
		when(token.getClaimAsString("sub")).thenReturn("00000000-0000-0000-0000-000000000000");

		final var currentAuditor = defaultAuditor.getCurrentAuditor();
		assertThat(currentAuditor).contains("Service Principal (id: 00000000-0000-0000-0000-000000000000)");
	}

}
