package ca.gov.dtsstn.cdcp.api.data.repository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase.Replace;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.AuditorAware;
import org.springframework.test.context.ActiveProfiles;

import ca.gov.dtsstn.cdcp.api.config.DataSourceConfig;
import ca.gov.dtsstn.cdcp.api.data.entity.LanguageEntityBuilder;

@DataJpaTest
@ActiveProfiles("test")
@Import({ DataSourceConfig.class })
@AutoConfigureTestDatabase(replace = Replace.NONE)
class LanguageRepositoryIT {

	@Autowired LanguageRepository languageRepository;

	@MockBean AuditorAware<String> auditorAware;

	@Test
	@DisplayName("Test languageRepository.findByCode(..)")
	void testFindByCode() {
		assertThat(languageRepository.findByCode("CODE")).isEmpty();

		when(auditorAware.getCurrentAuditor()).thenReturn(Optional.of("Canadian Dental Care Plan API"));

		languageRepository.save(new LanguageEntityBuilder()
			.code("CODE")
			.msLocaleCode("MS_LOCALE_CODE")
			.build());

		assertThat(languageRepository.findByCode("CODE")).isNotEmpty();
	}

	@Test
	@DisplayName("Test languageRepository.findByIsoCode(..)")
	void testFindByIsoCode() {
		assertThat(languageRepository.findByIsoCode("ISO_CODE")).isEmpty();

		when(auditorAware.getCurrentAuditor()).thenReturn(Optional.of("Canadian Dental Care Plan API"));

		languageRepository.save(new LanguageEntityBuilder()
			.code("CODE")
			.isoCode("ISO_CODE")
			.build());

		assertThat(languageRepository.findByIsoCode("ISO_CODE")).isNotEmpty();
	}

	@Test
	@DisplayName("Test languageRepository.findByMsLocaleCode(..)")
	void testFindByMsLocaleCode() {
		assertThat(languageRepository.findByMsLocaleCode("MS_LOCALE_CODE")).isEmpty();

		when(auditorAware.getCurrentAuditor()).thenReturn(Optional.of("Canadian Dental Care Plan API"));

		languageRepository.save(new LanguageEntityBuilder()
			.code("CODE")
			.msLocaleCode("MS_LOCALE_CODE")
			.build());

		assertThat(languageRepository.findByMsLocaleCode("MS_LOCALE_CODE")).isNotEmpty();
	}

}
