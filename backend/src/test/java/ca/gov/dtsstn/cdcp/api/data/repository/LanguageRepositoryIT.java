package ca.gov.dtsstn.cdcp.api.data.repository;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase.Replace;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import ca.gov.dtsstn.cdcp.api.config.DataSourceConfig;
import ca.gov.dtsstn.cdcp.api.data.entity.LanguageEntityBuilder;

@DataJpaTest
@ActiveProfiles("test")
@Import({ DataSourceConfig.class })
@AutoConfigureTestDatabase(replace = Replace.NONE)
class LanguageRepositoryIT {

	@Autowired LanguageRepository languageRepository;

	@Test
	@DisplayName("Test languageRepository.findByCode(..)")
	void testFindByCode() {
		assertThat(languageRepository.findByCode("CODE")).isEmpty();

		languageRepository.save(new LanguageEntityBuilder()
			.code("CODE")
			.msLocaleCode("MS_LOCALE_CODE")
			.build());

		assertThat(languageRepository.findByCode("CODE")).isNotEmpty();
	}

	@Test
	@DisplayName("Test languageRepository.findByMsLocaleCode(..)")
	void testFindByMsLocaleCode() {
		assertThat(languageRepository.findByMsLocaleCode("MS_LOCALE_CODE")).isEmpty();

		languageRepository.save(new LanguageEntityBuilder()
			.code("CODE")
			.msLocaleCode("MS_LOCALE_CODE")
			.build());

		assertThat(languageRepository.findByMsLocaleCode("MS_LOCALE_CODE")).isNotEmpty();
	}

}
