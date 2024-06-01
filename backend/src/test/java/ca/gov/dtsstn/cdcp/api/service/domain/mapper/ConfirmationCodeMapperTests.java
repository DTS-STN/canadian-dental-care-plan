package ca.gov.dtsstn.cdcp.api.service.domain.mapper;

import static java.util.Collections.emptySet;
import static org.assertj.core.api.Assertions.assertThat;

import java.util.Collection;
import java.util.HashSet;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mapstruct.factory.Mappers;
import org.mockito.junit.jupiter.MockitoExtension;

import ca.gov.dtsstn.cdcp.api.data.entity.ConfirmationCodeEntity;
import ca.gov.dtsstn.cdcp.api.data.entity.ConfirmationCodeEntityBuilder;
import ca.gov.dtsstn.cdcp.api.service.domain.ConfirmationCode;
import ca.gov.dtsstn.cdcp.api.service.domain.ImmutableConfirmationCode;

@SuppressWarnings({ "serial" })
@ExtendWith({ MockitoExtension.class })
class ConfirmationCodeMapperTests {

	ConfirmationCodeMapper confirmationCodeMapper = Mappers.getMapper(ConfirmationCodeMapper.class);

	@Test
	@DisplayName("Test confirmationCodeMapper.updateEntities(..)")
	void testUpdateEntities() {
		final var confirmationCodeEntities = new HashSet<ConfirmationCodeEntity>() {{
			add(new ConfirmationCodeEntityBuilder().id("00000000-0000-0000-0000-000000000000").build());
			add(new ConfirmationCodeEntityBuilder().id("11111111-1111-1111-1111-111111111111").build());
		}};

		final var confirmationCodes = new HashSet<ConfirmationCode>() {{
			add(ImmutableConfirmationCode.builder().id("00000000-0000-0000-0000-000000000000").build());
			add(ImmutableConfirmationCode.builder().id("22222222-2222-2222-2222-222222222222").build());
		}};

		confirmationCodeMapper.updateConfirmationCodeEntities(confirmationCodeEntities, confirmationCodes);

		assertThat(confirmationCodeEntities).hasSize(2);
		assertThat(hasEntityWithId(confirmationCodeEntities, "00000000-0000-0000-0000-000000000000")).isTrue();
		assertThat(hasEntityWithId(confirmationCodeEntities, "11111111-1111-1111-1111-111111111111")).isFalse();
		assertThat(hasEntityWithId(confirmationCodeEntities, "22222222-2222-2222-2222-222222222222")).isTrue();

		confirmationCodeMapper.updateConfirmationCodeEntities(confirmationCodeEntities, null);
		assertThat(confirmationCodeEntities).isEmpty();
	}

	@Test
	@DisplayName("Test confirmationCodeMapper.updateEntities(..) w/ null collection")
	void testUpdateEntities_NullCollection() {
		final var confirmationCodeEntities = new HashSet<ConfirmationCodeEntity>() {{
			add(new ConfirmationCodeEntityBuilder().id("00000000-0000-0000-0000-000000000000").build());
			add(new ConfirmationCodeEntityBuilder().id("11111111-1111-1111-1111-111111111111").build());
		}};

		confirmationCodeMapper.updateConfirmationCodeEntities(confirmationCodeEntities, null);
		assertThat(confirmationCodeEntities).isEmpty();
	}

	@Test
	@DisplayName("Test confirmationCodeMapper.updateEntities(..) w/ empty collection")
	void testUpdateEntities_EmptyCollection() {
		final var confirmationCodeEntities = new HashSet<ConfirmationCodeEntity>() {{
			add(new ConfirmationCodeEntityBuilder().id("00000000-0000-0000-0000-000000000000").build());
			add(new ConfirmationCodeEntityBuilder().id("11111111-1111-1111-1111-111111111111").build());
		}};

		confirmationCodeMapper.updateConfirmationCodeEntities(confirmationCodeEntities, emptySet());
		assertThat(confirmationCodeEntities).isEmpty();
	}

	boolean hasEntityWithId(Collection<ConfirmationCodeEntity> confirmationCodes, String id) {
		return confirmationCodes.stream().anyMatch(confirmationCode -> confirmationCode.getId().equals(id));
	}

}
