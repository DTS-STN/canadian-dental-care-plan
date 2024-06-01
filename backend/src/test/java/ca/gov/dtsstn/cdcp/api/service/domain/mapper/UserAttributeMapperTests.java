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

import ca.gov.dtsstn.cdcp.api.data.entity.UserAttributeEntity;
import ca.gov.dtsstn.cdcp.api.data.entity.UserAttributeEntityBuilder;
import ca.gov.dtsstn.cdcp.api.service.domain.ImmutableUserAttribute;
import ca.gov.dtsstn.cdcp.api.service.domain.UserAttribute;

@SuppressWarnings({ "serial" })
@ExtendWith({ MockitoExtension.class })
class UserAttributeMapperTests {

	UserAttributeMapper userAttributeMapper = Mappers.getMapper(UserAttributeMapper.class);

	@Test
	@DisplayName("Test userAttributeMapper.updateEntities(..)")
	void testUpdateEntities() {
		final var userAttributeEntities = new HashSet<UserAttributeEntity>() {{
			add(new UserAttributeEntityBuilder().id("00000000-0000-0000-0000-000000000000").build());
			add(new UserAttributeEntityBuilder().id("11111111-1111-1111-1111-111111111111").build());
		}};

		final var userAttributes = new HashSet<UserAttribute>() {{
			add(ImmutableUserAttribute.builder().id("00000000-0000-0000-0000-000000000000").build());
			add(ImmutableUserAttribute.builder().id("22222222-2222-2222-2222-222222222222").build());
		}};

		userAttributeMapper.updateUserAttributeEntities(userAttributeEntities, userAttributes);

		assertThat(userAttributeEntities).hasSize(2);
		assertThat(hasEntityWithId(userAttributeEntities, "00000000-0000-0000-0000-000000000000")).isTrue();
		assertThat(hasEntityWithId(userAttributeEntities, "11111111-1111-1111-1111-111111111111")).isFalse();
		assertThat(hasEntityWithId(userAttributeEntities, "22222222-2222-2222-2222-222222222222")).isTrue();

		userAttributeMapper.updateUserAttributeEntities(userAttributeEntities, null);
		assertThat(userAttributeEntities).isEmpty();
	}

	@Test
	@DisplayName("Test userAttributeMapper.updateEntities(..) w/ null collection")
	void testUpdateEntities_NullCollection() {
		final var userAttributeEntities = new HashSet<UserAttributeEntity>() {{
			add(new UserAttributeEntityBuilder().id("00000000-0000-0000-0000-000000000000").build());
			add(new UserAttributeEntityBuilder().id("11111111-1111-1111-1111-111111111111").build());
		}};

		userAttributeMapper.updateUserAttributeEntities(userAttributeEntities, null);
		assertThat(userAttributeEntities).isEmpty();
	}

	@Test
	@DisplayName("Test userAttributeMapper.updateEntities(..) w/ empty collection")
	void testUpdateEntities_EmptyCollection() {
		final var userAttributeEntities = new HashSet<UserAttributeEntity>() {{
			add(new UserAttributeEntityBuilder().id("00000000-0000-0000-0000-000000000000").build());
			add(new UserAttributeEntityBuilder().id("11111111-1111-1111-1111-111111111111").build());
		}};

		userAttributeMapper.updateUserAttributeEntities(userAttributeEntities, emptySet());
		assertThat(userAttributeEntities).isEmpty();
	}

	boolean hasEntityWithId(Collection<UserAttributeEntity> userAttributes, String id) {
		return userAttributes.stream().anyMatch(userAttribute -> userAttribute.getId().equals(id));
	}

}
