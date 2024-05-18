package ca.gov.dtsstn.cdcp.api.web.validation;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import ca.gov.dtsstn.cdcp.api.service.AlertTypeService;
import ca.gov.dtsstn.cdcp.api.service.domain.ImmutableAlertType;

@ExtendWith({ MockitoExtension.class })
class AlertTypeCodeValidatorTests {

	AlertTypeCodeValidator validator;

	@Mock AlertTypeService alertTypeService;

	@BeforeEach
	void beforeEach() {
		validator = new AlertTypeCodeValidator(alertTypeService);
	}

	@Test
	@DisplayName("Test isValid(..) w/ null value")
	void testIsValid_NullValue() {
		assertThat(validator.isValid(null, null)).isTrue();
	}

	@Test
	@DisplayName("Test isValid(..) w/ unknown code")
	void testIsValid_UnknownCode() {
		when(alertTypeService.readByCode(any())).thenReturn(Optional.empty());
		assertThat(validator.isValid("00000000-0000-0000-0000-000000000000", null)).isFalse();
	}

	@Test
	@DisplayName("Test isValid(..) w/ known code")
	void testIsValid_KnownCode() {
		when(alertTypeService.readByCode(any())).thenReturn(Optional.of(ImmutableAlertType.builder().build()));
		assertThat(validator.isValid("00000000-0000-0000-0000-000000000000", null)).isTrue();
	}

}
