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
import ca.gov.dtsstn.cdcp.api.data.entity.AlertTypeEntityBuilder;

@DataJpaTest
@ActiveProfiles("test")
@Import({ DataSourceConfig.class })
@AutoConfigureTestDatabase(replace = Replace.NONE)
class AlertTypeRepositoryIT {

	@Autowired AlertTypeRepository alertTypeRepository;

	@MockBean AuditorAware<String> auditorAware;

	@Test
	@DisplayName("Test alertTypeRepository.findByCode(..)")
	void testFindByCode() {
		when(auditorAware.getCurrentAuditor()).thenReturn(Optional.of("Canadian Dental Care Plan API"));

		alertTypeRepository.save(new AlertTypeEntityBuilder().code("CODE").build());

		assertThat(alertTypeRepository.findByCode("CODE")).isNotEmpty();
		assertThat(alertTypeRepository.findByCode("FOO")).isEmpty();
	}

}
