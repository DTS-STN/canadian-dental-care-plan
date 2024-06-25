package ca.gov.dtsstn.cdcp.api.web.v1.model.mapper;

import static org.assertj.core.api.Assertions.assertThat;
import java.util.HashSet;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mapstruct.factory.Mappers;
import org.mockito.junit.jupiter.MockitoExtension;

import ca.gov.dtsstn.cdcp.api.service.domain.ConfirmationCode;
import ca.gov.dtsstn.cdcp.api.service.domain.ImmutableConfirmationCode;

@SuppressWarnings({ "serial" })
@ExtendWith({ MockitoExtension.class })
class ConfirmationCodeModelMapperTest {

	ConfirmationCodeModelMapper confirmationCodeModelMapper = Mappers.getMapper(ConfirmationCodeModelMapper.class);

	@Test
	final void testToModelStringIterableOfConfirmationCode_NullConfirmationCode() {
		assertThat(confirmationCodeModelMapper.toModel("d827416b-f808-4035-9ccc-7572f3297015", null)).isEmpty();
	}
	@Test
	final void testToModelStringIterableOfConfirmationCode_NonNullConfirmationCode() {
		final var confirmationCodes = new HashSet<ConfirmationCode>() {{
			add(ImmutableConfirmationCode.builder().id("00000000-0000-0000-0000-000000000000").build());
			add(ImmutableConfirmationCode.builder().id("22222222-2222-2222-2222-222222222222").build());
		}};
		assertThat(confirmationCodeModelMapper.toModel("d827416b-f808-4035-9ccc-7572f3297015", confirmationCodes)).isNotEmpty();
	}

}
