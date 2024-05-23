package ca.gov.dtsstn.cdcp.api.web.v1.controller;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import ca.gov.dtsstn.cdcp.api.service.ConfirmationCodeStatus;
import ca.gov.dtsstn.cdcp.api.service.UserService;
import ca.gov.dtsstn.cdcp.api.service.domain.ConfirmationCode;
import ca.gov.dtsstn.cdcp.api.service.domain.ImmutableConfirmationCode;
import ca.gov.dtsstn.cdcp.api.service.domain.ImmutableUser;
import ca.gov.dtsstn.cdcp.api.web.v1.model.mapper.UserModelAssembler;

@ExtendWith(MockitoExtension.class)
class UserControllerTest {

	@Mock private UserService userService;
	@Mock private UserModelAssembler userModelAssembler;
	private UsersController confirmationCodeController;

	@BeforeEach
	void setUp() throws Exception {
		confirmationCodeController = new UsersController(userModelAssembler, userService); 
	}

	@Test
	final void testGetConfirmationCodeStatus_NOCODE() {
		ConfirmationCodeStatus status = ConfirmationCodeStatus.NO_CODE;
		final Instant creationDate = LocalDateTime.now().minusDays(73).toInstant(ZoneOffset.UTC);
		final Instant expiryDate = LocalDateTime.now().plusDays(288).toInstant(ZoneOffset.UTC);
		final ConfirmationCode confirmationCode = ImmutableConfirmationCode.builder().code("code value").createdDate(creationDate).expiryDate(expiryDate).build();
		final var user = ImmutableUser.builder().build();
		when(this.userService.getUserById(anyString())).thenReturn(Optional.of(user));
		when(this.userService.verifyConfirmationCode(any(ConfirmationCode.class), eq(user))).thenReturn(status);
		assertEquals(confirmationCodeController.getConfirmationCodeStatus(confirmationCode, "userId"),status);
	}

	@Test
	final void testGetConfirmationCodeStatus_VALID() {
		ConfirmationCodeStatus status = ConfirmationCodeStatus.VALID;
		final Instant creationDate = LocalDateTime.now().minusDays(73).toInstant(ZoneOffset.UTC);
		final Instant expiryDate = LocalDateTime.now().plusDays(288).toInstant(ZoneOffset.UTC);
		final ConfirmationCode confirmationCode = ImmutableConfirmationCode.builder().code("code value").createdDate(creationDate).expiryDate(expiryDate).build();
		final var user = ImmutableUser.builder().build();
		when(this.userService.getUserById(anyString())).thenReturn(Optional.of(user));
		when(this.userService.verifyConfirmationCode(any(ConfirmationCode.class), eq(user))).thenReturn(status);
		assertEquals(confirmationCodeController.getConfirmationCodeStatus(confirmationCode, "userId"),status);
	}

	@Test
	final void testGetConfirmationCodeStatus_MISMATCH() {
		ConfirmationCodeStatus status = ConfirmationCodeStatus.MISMATCH;
		final Instant creationDate = LocalDateTime.now().minusDays(73).toInstant(ZoneOffset.UTC);
		final Instant expiryDate = LocalDateTime.now().plusDays(288).toInstant(ZoneOffset.UTC);
		final ConfirmationCode confirmationCode = ImmutableConfirmationCode.builder().code("code value").createdDate(creationDate).expiryDate(expiryDate).build();
		final ConfirmationCode otherConfirmationCode = ImmutableConfirmationCode.builder().code("other code value").createdDate(creationDate).expiryDate(expiryDate).build();
		final var user = ImmutableUser.builder().addConfirmationCodes(otherConfirmationCode).build();
		when(this.userService.getUserById(anyString())).thenReturn(Optional.of(user));
		when(this.userService.verifyConfirmationCode(any(ConfirmationCode.class), eq(user))).thenReturn(status);
		assertEquals(confirmationCodeController.getConfirmationCodeStatus(confirmationCode, "userId"),status);
	}

	@Test
	final void testGetConfirmationCodeStatus_EXPIRED() {
		ConfirmationCodeStatus status = ConfirmationCodeStatus.EXPIRED;
		final Instant creationDate = LocalDateTime.now().minusDays(73).toInstant(ZoneOffset.UTC);
		final Instant expiryDate = LocalDateTime.now().minusDays(28).toInstant(ZoneOffset.UTC);
		final ConfirmationCode confirmationCode = ImmutableConfirmationCode.builder().code("code value").createdDate(creationDate).expiryDate(expiryDate).build();
		final var user = ImmutableUser.builder().build();
		when(this.userService.getUserById(anyString())).thenReturn(Optional.of(user));
		when(this.userService.verifyConfirmationCode(any(ConfirmationCode.class), eq(user))).thenReturn(status);
		assertEquals(confirmationCodeController.getConfirmationCodeStatus(confirmationCode, "userId"),status);
	}

	@Test
	final void testGetConfirmationCodeStatus() {
		ConfirmationCodeStatus status = ConfirmationCodeStatus.NO_CODE;
		final Instant creationDate = LocalDateTime.now().minusDays(73).toInstant(ZoneOffset.UTC);
		final Instant expiryDate = LocalDateTime.now().plusDays(288).toInstant(ZoneOffset.UTC);
		final ConfirmationCode confirmationCode = ImmutableConfirmationCode.builder().code("code value").createdDate(creationDate).expiryDate(expiryDate).build();
		final var user = ImmutableUser.builder().build();
		when(this.userService.getUserById(anyString())).thenReturn(Optional.of(user));
		when(this.userService.verifyConfirmationCode(any(ConfirmationCode.class), eq(user))).thenReturn(status);
		assertEquals(confirmationCodeController.getConfirmationCodeStatus(confirmationCode, "userId"),status);
	}

}
