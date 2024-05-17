package ca.gov.dtsstn.cdcp.api.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Collections;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;

import ca.gov.dtsstn.cdcp.api.data.entity.ConfirmationCodeEntity;
import ca.gov.dtsstn.cdcp.api.data.repository.ConfirmationCodeRepository;
import ca.gov.dtsstn.cdcp.api.service.domain.ConfirmationCode;
import ca.gov.dtsstn.cdcp.api.service.domain.ImmutableConfirmationCode;
import ca.gov.dtsstn.cdcp.api.service.domain.mapper.ConfirmationCodeMapper;

import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ConfirmationCodeServiceTest {

	@Mock private ConfirmationCodeMapper confirmationCodeMapper;
	@Mock private ConfirmationCodeRepository confirmationCodeRepository;
	private ConfirmationCodeService confirmationCodeService;

	@BeforeEach
	void setUp() throws Exception {
		confirmationCodeService = new ConfirmationCodeService(confirmationCodeMapper, confirmationCodeRepository);
	}

	@Test
	void testVerifyConfirmationCode_verified() {
		final Instant creationDate = LocalDateTime.now().minusDays(73).toInstant(ZoneOffset.UTC);
		final Instant expiryDate = LocalDateTime.now().plusDays(288).toInstant(ZoneOffset.UTC);
		final ConfirmationCode confirmationCode = ImmutableConfirmationCode.builder().userId("userId").email("email@address.com").code("code value").createdDate(creationDate).expiryDate(expiryDate).build();
		final ConfirmationCodeEntity confirmationCodeEntity = new ConfirmationCodeEntity();
		when(confirmationCodeRepository.findByUserId(anyString())).thenReturn(Collections.singletonList(confirmationCodeEntity));
		when(confirmationCodeMapper.fromEntity(anyList())).thenReturn(Collections.singletonList(confirmationCode));
		assertEquals(ConfirmationCodeStatus.VALID, confirmationCodeService.verifyConfirmationCode(confirmationCode, "User ID"));
	}

	@Test
	void testVerifyConfirmationCode_expired() {
		final Instant creationDate = LocalDateTime.now().minusDays(73).toInstant(ZoneOffset.UTC);
		final Instant expiryDate = LocalDateTime.now().minusDays(28).toInstant(ZoneOffset.UTC);
		final ConfirmationCode confirmationCode = ImmutableConfirmationCode.builder().userId("userId").email("email@address.com").code("code value").createdDate(creationDate).expiryDate(expiryDate).build();
		final ConfirmationCodeEntity confirmationCodeEntity = new ConfirmationCodeEntity();
		when(confirmationCodeRepository.findByUserId(anyString())).thenReturn(Collections.singletonList(confirmationCodeEntity));
		when(confirmationCodeMapper.fromEntity(anyList())).thenReturn(Collections.singletonList(confirmationCode));
		assertEquals(ConfirmationCodeStatus.EXPIRED, confirmationCodeService.verifyConfirmationCode(confirmationCode, "User ID"));
	}


	@Test
	void testVerifyConfirmationCode_no_code() {
		final Instant creationDate = LocalDateTime.now().minusDays(73).toInstant(ZoneOffset.UTC);
		final Instant expiryDate = LocalDateTime.now().plusDays(288).toInstant(ZoneOffset.UTC);
		ConfirmationCode confirmationCode = ImmutableConfirmationCode.builder().userId("userId").email("email@address.com").code("").createdDate(creationDate).expiryDate(expiryDate).build();
		assertEquals(ConfirmationCodeStatus.NO_CODE, confirmationCodeService.verifyConfirmationCode(confirmationCode, "User ID"));
		assertEquals(ConfirmationCodeStatus.NO_CODE, confirmationCodeService.verifyConfirmationCode(null, "User ID"));
	}

	@Test
	void testVerifyConfirmationCode_mistached() {
		final Instant creationDate = LocalDateTime.now().minusDays(73).toInstant(ZoneOffset.UTC);
		final Instant expiryDate = LocalDateTime.now().plusDays(288).toInstant(ZoneOffset.UTC);
		final ConfirmationCode confirmationCode = ImmutableConfirmationCode.builder().userId("userId").email("email@address.com").code("code value").createdDate(creationDate).expiryDate(expiryDate).build();
		final ConfirmationCode otherConfirmationCode = ImmutableConfirmationCode.builder().userId("userId").email("email@address.com").code("other code value").createdDate(creationDate).expiryDate(expiryDate).build();
		final ConfirmationCodeEntity confirmationCodeEntity = new ConfirmationCodeEntity();
		when(confirmationCodeRepository.findByUserId(anyString())).thenReturn(Collections.singletonList(confirmationCodeEntity));
		when(confirmationCodeMapper.fromEntity(anyList())).thenReturn(Collections.singletonList(otherConfirmationCode));
		assertEquals(ConfirmationCodeStatus.MISMATCH, confirmationCodeService.verifyConfirmationCode(confirmationCode, "User ID"));
	}
}
