package ca.gov.dtsstn.cdcp.api.web.v1.model.mapper;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Collection;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mapstruct.factory.Mappers;
import org.mockito.junit.jupiter.MockitoExtension;

import ca.gov.dtsstn.cdcp.api.service.domain.Subscription;
import ca.gov.dtsstn.cdcp.api.service.domain.ImmutableSubscription;

@ExtendWith({ MockitoExtension.class })
class SubscriptionModelMapperTest {

	SubscriptionModelMapper subscriptionModelMapper = Mappers.getMapper(SubscriptionModelMapper.class);

	@Test
	@DisplayName("Test subscriptionModelMapper.toModel() w/ null subscriptions")
	final void testToModelStringIterableOfSubscriptionNullSubscription() {
		final Collection<Subscription> subscriptions = null;
		assertThat(subscriptionModelMapper.toModel("d827416b-f808-4035-9ccc-7572f3297015", subscriptions)).isEmpty();
	}

	@Test
	@DisplayName("Test subscriptionModelMapper.toModel() w/ non-null subscriptions")
	final void testToModelStringIterableOfSubscriptionNonNullSubscription() {
		final Iterable<Subscription> subscriptions = List.of(
				ImmutableSubscription.builder()
					.id("00000000-0000-0000-0000-000000000000")
					.build(),
				ImmutableSubscription.builder()
					.id("22222222-2222-2222-2222-222222222222")
					.build());
		final var subscriptionModels = subscriptionModelMapper.toModel("d827416b-f808-4035-9ccc-7572f3297015", subscriptions);
		assertThat(subscriptionModels)
			.hasSize(2)
			.allMatch(model -> model.getId() != null)
			.anyMatch(model -> model.getId().equals("00000000-0000-0000-0000-000000000000"))
			.anyMatch(model -> model.getId().equals("22222222-2222-2222-2222-222222222222"));
	}

}