package ca.gov.dtsstn.cdcp.api.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrowsExactly;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Answers;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import ca.gov.dtsstn.cdcp.api.config.properties.ApplicationProperties;
import ca.gov.dtsstn.cdcp.api.data.entity.UserEntityBuilder;
import ca.gov.dtsstn.cdcp.api.data.repository.AlertTypeRepository;
import ca.gov.dtsstn.cdcp.api.data.repository.LanguageRepository;
import ca.gov.dtsstn.cdcp.api.data.repository.UserRepository;
import ca.gov.dtsstn.cdcp.api.service.domain.ImmutableUser;

@ExtendWith({ MockitoExtension.class })
class UserServiceTests {

	@Mock(answer = Answers.RETURNS_DEEP_STUBS)
	AlertTypeRepository alertTypeRepository;

	@Mock(answer = Answers.RETURNS_DEEP_STUBS)
	LanguageRepository preferredLanguageRepository;

	@Mock(answer = Answers.RETURNS_DEEP_STUBS)
	ApplicationProperties applicationProperties;

	@Mock(answer = Answers.RETURNS_DEEP_STUBS)
	UserRepository userRepository;

	UserService userService;

	@BeforeEach
	void setUp() {
		this.userService = new UserService(alertTypeRepository, preferredLanguageRepository, applicationProperties, userRepository);
	}

	@Test()
	@DisplayName("Test userService.createUser(..) with null user")
	void testCreateUser_NullUser() {
		assertThrowsExactly(IllegalArgumentException.class, () -> userService.createUser(null), "user is required; it must not be null");
	}

	@Test()
	@DisplayName("Test userService.createUser(..) with non-null user.id")
	void testCreateUser_NonNullUserId() {
		assertThrowsExactly(IllegalArgumentException.class, () -> userService.createUser(ImmutableUser.builder().id("id").build()), "user.id must be null when creating new instance");
	}

	@Test()
	@DisplayName("Test userService.createUser(..)")
	void testCreateUser() {
		when(userRepository.save(any())).thenReturn(new UserEntityBuilder().build());
		assertThat(userService.createUser(ImmutableUser.builder().build())).isNotNull();
	}

	@Test()
	@DisplayName("Test userService.createConfirmationCodeForUser(..) with null userId")
	void testCreateConfirmationCodeForUser_NullUserId() {
		assertThrowsExactly(IllegalArgumentException.class, () -> userService.createConfirmationCodeForUser(""), "user is required; it must not be null");
	}

	@Test
	@DisplayName("Test userService.createConfirmationCodeForUser(..)")
	void testCreateConfirmationCodeForUser() {
		final var mockUser = new UserEntityBuilder().build();

		when(applicationProperties.getEmailNotifications().getConfirmationCodes().getLength()).thenReturn(8);
		when(applicationProperties.getEmailNotifications().getConfirmationCodes().getExpiry().getTimeUnit()).thenReturn(ChronoUnit.HOURS);
		when(applicationProperties.getEmailNotifications().getConfirmationCodes().getExpiry().getValue()).thenReturn(24);
		when(userRepository.findById(any())).thenReturn(Optional.of(mockUser));
		when(userRepository.save(any())).thenReturn(mockUser);

		final var confirmationCode = userService.createConfirmationCodeForUser("00000000-0000-0000-0000-000000000000");

		assertThat(confirmationCode).isNotNull();
		assertThat(confirmationCode.getCode()).hasSize(8);
		assertThat(confirmationCode.getExpiryDate()).isAfter(Instant.now());
	}

}
