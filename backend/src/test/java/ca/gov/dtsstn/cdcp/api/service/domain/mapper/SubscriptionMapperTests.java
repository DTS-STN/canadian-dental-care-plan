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

import ca.gov.dtsstn.cdcp.api.data.entity.SubscriptionEntity;
import ca.gov.dtsstn.cdcp.api.data.entity.SubscriptionEntityBuilder;
import ca.gov.dtsstn.cdcp.api.service.domain.ImmutableSubscription;
import ca.gov.dtsstn.cdcp.api.service.domain.Subscription;

@SuppressWarnings({ "serial" })
@ExtendWith({ MockitoExtension.class })
class SubscriptionMapperTests {

	SubscriptionMapper subscriptionMapper = Mappers.getMapper(SubscriptionMapper.class);

	@Test
	@DisplayName("Test subscriptionMapper.updateEntities(..)")
	void testUpdateEntities() {
		final var subscriptionEntities = new HashSet<SubscriptionEntity>() {{
			add(new SubscriptionEntityBuilder().id("00000000-0000-0000-0000-000000000000").build());
			add(new SubscriptionEntityBuilder().id("11111111-1111-1111-1111-111111111111").build());
		}};

		final var subscriptions = new HashSet<Subscription>() {{
			add(ImmutableSubscription.builder().id("00000000-0000-0000-0000-000000000000").build());
			add(ImmutableSubscription.builder().id("22222222-2222-2222-2222-222222222222").build());
		}};

		subscriptionMapper.updateSubscriptionEntities(subscriptionEntities, subscriptions);

		assertThat(subscriptionEntities).hasSize(2);
		assertThat(hasEntityWithId(subscriptionEntities, "00000000-0000-0000-0000-000000000000")).isTrue();
		assertThat(hasEntityWithId(subscriptionEntities, "11111111-1111-1111-1111-111111111111")).isFalse();
		assertThat(hasEntityWithId(subscriptionEntities, "22222222-2222-2222-2222-222222222222")).isTrue();

		subscriptionMapper.updateSubscriptionEntities(subscriptionEntities, null);
		assertThat(subscriptionEntities).isEmpty();
	}

	@Test
	@DisplayName("Test subscriptionMapper.updateEntities(..) w/ null collection")
	void testUpdateEntities_NullCollection() {
		final var subscriptionEntities = new HashSet<SubscriptionEntity>() {{
			add(new SubscriptionEntityBuilder().id("00000000-0000-0000-0000-000000000000").build());
			add(new SubscriptionEntityBuilder().id("11111111-1111-1111-1111-111111111111").build());
		}};

		subscriptionMapper.updateSubscriptionEntities(subscriptionEntities, null);
		assertThat(subscriptionEntities).isEmpty();
	}

	@Test
	@DisplayName("Test subscriptionMapper.updateEntities(..) w/ empty collection")
	void testUpdateEntities_EmptyCollection() {
		final var subscriptionEntities = new HashSet<SubscriptionEntity>() {{
			add(new SubscriptionEntityBuilder().id("00000000-0000-0000-0000-000000000000").build());
			add(new SubscriptionEntityBuilder().id("11111111-1111-1111-1111-111111111111").build());
		}};

		subscriptionMapper.updateSubscriptionEntities(subscriptionEntities, emptySet());
		assertThat(subscriptionEntities).isEmpty();
	}

	boolean hasEntityWithId(Collection<SubscriptionEntity> subscriptions, String id) {
		return subscriptions.stream().anyMatch(subscription -> subscription.getId().equals(id));
	}

}
