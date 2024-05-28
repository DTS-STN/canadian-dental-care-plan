package ca.gov.dtsstn.cdcp.api.web.validation;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import ca.gov.dtsstn.cdcp.api.service.LanguageService;
import ca.gov.dtsstn.cdcp.api.service.domain.ImmutableLanguage;
import ca.gov.dtsstn.cdcp.api.web.validation.LanguageCodeValidator.CodeType;
import jakarta.validation.ConstraintValidatorContext;

@ExtendWith({ MockitoExtension.class })
class LanguageCodeValidatorTests {

	@Mock LanguageCode languageCode;

	@Mock LanguageService languageService;

	LanguageCodeValidator validator;

	@BeforeEach
	void beforeEach() {
		this.validator = new LanguageCodeValidator(languageService);
	}

	@Test
	@DisplayName("Test isValid(..) w/ null value")
	void testIsValid_NullValue() {
		assertThat(validator.isValid(null, mock(ConstraintValidatorContext.class))).isTrue();
	}

	@Test
	@DisplayName("Test isValid(..) w/ unknown INTERNAL code")
	void testIsValid_UnknownInternalCode() {
		when(languageCode.codeType()).thenReturn(CodeType.INTERNAL_CODE);
		when(languageService.readByCode(any())).thenReturn(Optional.empty());

		validator.initialize(languageCode);
		assertThat(validator.isValid("00000000-0000-0000-0000-000000000000", mock(ConstraintValidatorContext.class))).isFalse();
	}

	@Test
	@DisplayName("Test isValid(..) w/ known INTERNAL code")
	void testIsValid_KnownInternalCode() {
		when(languageCode.codeType()).thenReturn(CodeType.INTERNAL_CODE);
		when(languageService.readByCode(any())).thenReturn(Optional.of(ImmutableLanguage.builder().build()));

		validator.initialize(languageCode);
		assertThat(validator.isValid("00000000-0000-0000-0000-000000000000", mock(ConstraintValidatorContext.class))).isTrue();
	}

	@Test
	@DisplayName("Test isValid(..) w/ unknown ISO code")
	void testIsValid_UnknownIsoCode() {
		when(languageCode.codeType()).thenReturn(CodeType.ISO_CODE);
		when(languageService.readByIsoCode(any())).thenReturn(Optional.empty());

		validator.initialize(languageCode);
		assertThat(validator.isValid("00000000-0000-0000-0000-000000000000", mock(ConstraintValidatorContext.class))).isFalse();
	}

	@Test
	@DisplayName("Test isValid(..) w/ known ISO code")
	void testIsValid_KnownIsoCode() {
		when(languageCode.codeType()).thenReturn(CodeType.ISO_CODE);
		when(languageService.readByIsoCode(any())).thenReturn(Optional.of(ImmutableLanguage.builder().build()));

		validator.initialize(languageCode);
		assertThat(validator.isValid("00000000-0000-0000-0000-000000000000", mock(ConstraintValidatorContext.class))).isTrue();
	}

	@Test
	@DisplayName("Test isValid(..) w/ unknown MS_LOCALE code")
	void testIsValid_UnknownMsLocaleCode() {
		when(languageCode.codeType()).thenReturn(CodeType.MS_LOCALE_CODE);
		when(languageService.readByMsLocaleCode(any())).thenReturn(Optional.empty());

		validator.initialize(languageCode);
		assertThat(validator.isValid("00000000-0000-0000-0000-000000000000", mock(ConstraintValidatorContext.class))).isFalse();
	}

	@Test
	@DisplayName("Test isValid(..) w/ known MS_LOCALE code")
	void testIsValid_KnownMsLocaleCode() {
		when(languageCode.codeType()).thenReturn(CodeType.MS_LOCALE_CODE);
		when(languageService.readByMsLocaleCode(any())).thenReturn(Optional.of(ImmutableLanguage.builder().build()));

		validator.initialize(languageCode);
		assertThat(validator.isValid("00000000-0000-0000-0000-000000000000", mock(ConstraintValidatorContext.class))).isTrue();
	}

}
