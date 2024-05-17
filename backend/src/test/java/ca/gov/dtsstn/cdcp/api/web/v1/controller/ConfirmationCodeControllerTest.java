package ca.gov.dtsstn.cdcp.api.web.v1.controller;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import ca.gov.dtsstn.cdcp.api.service.ConfirmationCodeService;
import ca.gov.dtsstn.cdcp.api.service.ConfirmationCodeStatus;
import ca.gov.dtsstn.cdcp.api.service.domain.ConfirmationCode;
import ca.gov.dtsstn.cdcp.api.service.domain.ImmutableConfirmationCode;

@ExtendWith(MockitoExtension.class)
class ConfirmationCodeControllerTest {

	@Mock private ConfirmationCodeService confirmationCodeService;
	private ConfirmationCodeController confirmationCodeController;

	@BeforeEach
	void setUp() throws Exception {
		confirmationCodeController = new ConfirmationCodeController(confirmationCodeService); 
	}

	@ParameterizedTest
	@EnumSource(ConfirmationCodeStatus.class)
	final void testGetConfirmationCodeStatus(ConfirmationCodeStatus status) {
		final Instant creationDate = LocalDateTime.now().minusDays(73).toInstant(ZoneOffset.UTC);
		final Instant expiryDate = LocalDateTime.now().plusDays(288).toInstant(ZoneOffset.UTC);
		final ConfirmationCode confirmationCode = ImmutableConfirmationCode.builder().userId("userId").email("email@address.com").code("code value").createdDate(creationDate).expiryDate(expiryDate).build();
		when(this.confirmationCodeService.verifyConfirmationCode(any(ConfirmationCode.class),anyString())).thenReturn(status);
		assertEquals(confirmationCodeController.getConfirmationCodeStatus(confirmationCode, "userId"),status);
	}

}
