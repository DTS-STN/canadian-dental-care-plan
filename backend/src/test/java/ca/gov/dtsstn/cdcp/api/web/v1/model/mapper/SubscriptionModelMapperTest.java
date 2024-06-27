package ca.gov.dtsstn.cdcp.api.web.v1.model.mapper;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Collection;
import java.util.HashSet;
import java.util.stream.Collectors;
import java.util.stream.Stream;

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
	final void testToModelStringIterableOfSubscriptionNullSubscription() {
		final Collection<Subscription> subscriptions = null;
		assertThat(subscriptionModelMapper.toModel("d827416b-f808-4035-9ccc-7572f3297015", subscriptions)).isEmpty();
	}
	@Test
	final void testToModelStringIterableOfSubscriptionNonNullSubscription() {
		final Collection<Subscription> subscriptions = Stream.of(ImmutableSubscription.builder().id("00000000-0000-0000-0000-000000000000").build(), ImmutableSubscription.builder().id("22222222-2222-2222-2222-222222222222").build()).collect(Collectors.toCollection(HashSet::new));
		assertThat(subscriptionModelMapper.toModel("d827416b-f808-4035-9ccc-7572f3297015", subscriptions)).isNotEmpty();
	}

}