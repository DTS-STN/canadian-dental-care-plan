package ca.gov.dtsstn.cdcp.api.service.domain.mapper;

import java.util.List;
import java.util.stream.StreamSupport;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.springframework.lang.Nullable;

import ca.gov.dtsstn.cdcp.api.data.entity.SubscriptionEntity;
import ca.gov.dtsstn.cdcp.api.service.domain.Subscription;

@Mapper(componentModel = "spring", uses = { AlertTypeMapper.class })
public interface SubscriptionMapper {

	@Nullable
	public default List<Subscription> fromEntity(@Nullable Iterable<SubscriptionEntity> subscriptions) {
		if (subscriptions == null) { return null; }
		return StreamSupport.stream(subscriptions.spliterator(), false).map(this::fromEntity).toList();
	}

	@Nullable
	Subscription fromEntity(@Nullable SubscriptionEntity subscription);

	@Nullable
	public default List<SubscriptionEntity> toEntity(@Nullable Iterable<Subscription> subscriptions) {
		if (subscriptions == null) { return null; }
		return StreamSupport.stream(subscriptions.spliterator(), false).map(this::toEntity).toList();
	}

	@Nullable
	@Mapping(target = "isNew", ignore = true)
	SubscriptionEntity toEntity(@Nullable Subscription subscription);

}
