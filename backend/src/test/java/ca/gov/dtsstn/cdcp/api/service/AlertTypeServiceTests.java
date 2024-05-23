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

import ca.gov.dtsstn.cdcp.api.data.entity.AlertTypeEntity;
import ca.gov.dtsstn.cdcp.api.data.repository.AlertTypeRepository;

@ExtendWith({ MockitoExtension.class })
class AlertTypeServiceTests {

	@Mock AlertTypeRepository alertTypeRepository;

	AlertTypeService alertTypeService;

	@BeforeEach
	void beforeEach() {
		this.alertTypeService = new AlertTypeService(alertTypeRepository);
	}

	@Test
	@DisplayName("Test readById(..)")
	void testReadById() {
		assertThrows(IllegalArgumentException.class, () -> alertTypeService.readById(null));

		when(alertTypeRepository.findById(any())).thenReturn(Optional.empty());
		assertThat(alertTypeService.readById("00000000-0000-0000-0000-000000000000")).isEmpty();

		when(alertTypeRepository.findById(any())).thenReturn(Optional.of(new AlertTypeEntity()));
		assertThat(alertTypeService.readById("00000000-0000-0000-0000-000000000000")).isNotEmpty();
	}

	@Test
	@DisplayName("Test readByCode(..)")
	void testReadByCode() {
		assertThrows(IllegalArgumentException.class, () -> alertTypeService.readByCode(null));

		when(alertTypeRepository.findByCode(any())).thenReturn(Optional.empty());
		assertThat(alertTypeService.readByCode("CODE")).isEmpty();

		when(alertTypeRepository.findByCode(any())).thenReturn(Optional.of(new AlertTypeEntity()));
		assertThat(alertTypeService.readByCode("CODE")).isNotEmpty();
	}

}
