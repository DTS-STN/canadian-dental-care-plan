package ca.gov.dtsstn.cdcp.api.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import ca.gov.dtsstn.cdcp.api.data.entity.LanguageEntity;
import ca.gov.dtsstn.cdcp.api.data.repository.LanguageRepository;

@ExtendWith({ MockitoExtension.class })
class LanguageServiceTests {

	@Mock LanguageRepository languageRepository;

	LanguageService languageService;

	@BeforeEach
	void beforeEach() {
		this.languageService = new LanguageService(languageRepository);
	}

	@Test
	@DisplayName("Test languageService.readById(..)")
	void testReadById() {
		assertThrows(IllegalArgumentException.class, () -> languageService.readById(null));

		when(languageRepository.findById(any())).thenReturn(Optional.empty());
		assertThat(languageService.readById("00000000-0000-0000-0000-000000000000")).isEmpty();

		when(languageRepository.findById(any())).thenReturn(Optional.of(new LanguageEntity()));
		assertThat(languageService.readById("00000000-0000-0000-0000-000000000000")).isNotEmpty();
	}

	@Test
	@DisplayName("Test languageService.readByCode(..)")
	void testReadByCode() {
		assertThrows(IllegalArgumentException.class, () -> languageService.readByCode(null));

		when(languageRepository.findByCode(any())).thenReturn(Optional.empty());
		assertThat(languageService.readByCode("CODE")).isEmpty();

		when(languageRepository.findByCode(any())).thenReturn(Optional.of(new LanguageEntity()));
		assertThat(languageService.readByCode("CODE")).isNotEmpty();
	}

	@Test
	@DisplayName("Test languageService.readByIsoCode(..)")
	void testReadByIsoCode() {
		assertThrows(IllegalArgumentException.class, () -> languageService.readByIsoCode(null));

		when(languageRepository.findByIsoCode(any())).thenReturn(Optional.empty());
		assertThat(languageService.readByIsoCode("CODE")).isEmpty();

		when(languageRepository.findByIsoCode(any())).thenReturn(Optional.of(new LanguageEntity()));
		assertThat(languageService.readByIsoCode("CODE")).isNotEmpty();
	}

	@Test
	@DisplayName("Test languageService.readByMsLocaleCode(..)")
	void testReadByMsLocaleCode() {
		assertThrows(IllegalArgumentException.class, () -> languageService.readByMsLocaleCode(null));

		when(languageRepository.findByMsLocaleCode(any())).thenReturn(Optional.empty());
		assertThat(languageService.readByMsLocaleCode("CODE")).isEmpty();

		when(languageRepository.findByMsLocaleCode(any())).thenReturn(Optional.of(new LanguageEntity()));
		assertThat(languageService.readByMsLocaleCode("CODE")).isNotEmpty();
	}

}
