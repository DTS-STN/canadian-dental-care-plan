package ca.gov.dtsstn.cdcp.api.data.repository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase.Replace;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.dao.IncorrectResultSizeDataAccessException;
import org.springframework.test.context.ActiveProfiles;

import ca.gov.dtsstn.cdcp.api.config.DataSourceConfig;
import ca.gov.dtsstn.cdcp.api.data.entity.UserAttributeEntityBuilder;
import ca.gov.dtsstn.cdcp.api.data.entity.UserEntityBuilder;

@DataJpaTest
@ActiveProfiles("test")
@Import({ DataSourceConfig.class })
@AutoConfigureTestDatabase(replace = Replace.NONE)
class UserRepositoryIT {

	@Autowired UserRepository userRepository;

	@Test
	@DisplayName("Test userRepository.findByEmail(..)")
	void testFindByEmail() {
		assertThat(userRepository.findByEmail("verified@example.com")).isNotEmpty();
		assertThat(userRepository.findByEmail("unknown@example.com")).isEmpty();
	}

	@Test
	@DisplayName("Test userRepository.findByUserAttributeValue(..)")
	void testFindByUserAttributeValue() {
		assertThat(userRepository.findByUserAttributeValue("RAOIDC_USER_ID", "d827416b-f808-4035-9ccc-7572f3297015")).isNotEmpty();
		assertThat(userRepository.findByUserAttributeValue("RAOIDC_USER_ID", null)).isEmpty();
		assertThat(userRepository.findByUserAttributeValue("RAOIDC_USER_ID", "")).isEmpty();
		assertThat(userRepository.findByUserAttributeValue("NON_EXISTENT", "d827416b-f808-4035-9ccc-7572f3297015")).isEmpty();
	}

	@Test
	@DisplayName("Test userRepository.findByRaoidcUserId(..)")
	void testFindByRaoidcUserId() {
		assertThat(userRepository.findByRaoidcUserId("d827416b-f808-4035-9ccc-7572f3297015")).isNotEmpty();

		// create a new user with the same RAOIDC user id
		userRepository.save(new UserEntityBuilder()
			.userAttributes(List.of(new UserAttributeEntityBuilder()
				.name("RAOIDC_USER_ID")
				.value("d827416b-f808-4035-9ccc-7572f3297015")
				.build()))
			.build());

		assertThrows(IncorrectResultSizeDataAccessException.class, () -> userRepository.findByRaoidcUserId("d827416b-f808-4035-9ccc-7572f3297015"));
	}

}
