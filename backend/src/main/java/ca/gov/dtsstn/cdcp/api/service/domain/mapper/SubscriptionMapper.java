package ca.gov.dtsstn.cdcp.api.service.domain.mapper;

import static java.util.Collections.emptyList;
import static java.util.function.Predicate.not;

import java.util.Collection;
import java.util.Optional;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.Named;

import ca.gov.dtsstn.cdcp.api.data.entity.SubscriptionEntity;
import ca.gov.dtsstn.cdcp.api.service.domain.Subscription;
import jakarta.annotation.Nullable;

/**
 * Mapper for converting between {@link Subscription} domain objects and {@link SubscriptionEntity} entities.
 */
@Mapper(uses = { AlertTypeMapper.class, LanguageMapper.class })
public abstract class SubscriptionMapper extends AbstractDomainMapper {

	/**
	 * Converts a {@link SubscriptionEntity} entity to a {@link Subscription} domain object.
	 */
	@Nullable
	public abstract Subscription toSubscription(@Nullable SubscriptionEntity subscription);

	/**
	 * Converts a {@link Subscription} domain object to a {@link SubscriptionEntity} entity.
	 */
	@Nullable
	@Mapping(target = "isNew", ignore = true)
	public abstract SubscriptionEntity toSubscriptionEntity(@Nullable Subscription subscription);

	/**
	 * Updates a set of {@link SubscriptionEntity} entities based on a provided collection of {@link Subscription} objects.
	 *
	 * This method iterates through the given `subscriptions` collection (if not null). For each `Subscription`:
	 *  - If it's not already present in the `subscriptionEntities` set (based on ID comparison), it's converted to a
	 *    `SubscriptionEntity` using the `toEntity` method and added to the set.
	 *  - If it's present in the `subscriptionEntities` set but not in the `subscriptions` collection, it's removed from the set.
	 *
	 * Essentially, this method synchronizes the `subscriptionEntities` set with the provided `subscriptions` collection
	 * based on ID equality.
	 */
	@Named("updateSubscriptionEntities")
	protected void updateSubscriptionEntities(@MappingTarget Collection<SubscriptionEntity> subscriptionEntities, @Nullable Collection<Subscription> subscriptions) {
		final var collection = Optional.ofNullable(subscriptions).orElse(emptyList());
		subscriptionEntities.addAll(collection.stream().map(this::toSubscriptionEntity).toList());
		subscriptionEntities.removeIf(not(entityIn(collection)));
	}

}
