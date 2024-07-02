package ca.gov.dtsstn.cdcp.api.data.repository;
import static org.assertj.core.api.Assertions.assertThat;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase.Replace;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import ca.gov.dtsstn.cdcp.api.config.DataSourceConfig;
import ca.gov.dtsstn.cdcp.api.data.entity.ConfirmationCodeEntity;
import ca.gov.dtsstn.cdcp.api.data.entity.ConfirmationCodeEntityBuilder;
import ca.gov.dtsstn.cdcp.api.data.entity.UserAttributeEntityBuilder;
import ca.gov.dtsstn.cdcp.api.data.entity.UserEntity;
import ca.gov.dtsstn.cdcp.api.data.entity.UserEntityBuilder;

@DataJpaTest
@ActiveProfiles("test")
@Import({ DataSourceConfig.class })
@AutoConfigureTestDatabase(replace = Replace.NONE)
public class ConfirmationCodeRepositoryIT {

	@Autowired ConfirmationCodeRepository confirmationCodeRepository;
	@Autowired UserRepository userRepository;

	@Test
	@DisplayName("Test confirmationCodeRepository.deleteByExpiryDateLessThan(..)")
	void testDeleteByExpiryDateLessThan() {

		ConfirmationCodeEntity confirmationCode = new ConfirmationCodeEntityBuilder()
		.expiryDate(LocalDate.of(2024, 5, 15).atStartOfDay(ZoneId.systemDefault()).toInstant())
		.code("98765")
		.build();

		Collection<ConfirmationCodeEntity> confirmationCodes = new ArrayList<ConfirmationCodeEntity>();
		confirmationCodes.add(confirmationCode);

		UserEntity newUser = userRepository.save(new UserEntityBuilder()
		.userAttributes(List.of(new UserAttributeEntityBuilder()
			.name("RAOIDC_USER_ID")
			.value("1234-5678-90")
			.build()))
			.confirmationCodes(confirmationCodes)
		.build());

		assertThat(userRepository.findById(newUser.getId())).isNotEmpty();
		assertThat(userRepository.findById(newUser.getId()).get().getConfirmationCodes()).isNotEmpty();
		int deletedRows = confirmationCodeRepository.deleteByExpiryDateLessThan(Instant.now());
		confirmationCodeRepository.flush();
		assertThat(deletedRows).isEqualTo(1);
		assertThat(userRepository.findById(newUser.getId()).get().getConfirmationCodes()).isEmpty();
	}
}
