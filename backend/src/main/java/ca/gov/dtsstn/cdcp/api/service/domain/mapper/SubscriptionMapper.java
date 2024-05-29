package ca.gov.dtsstn.cdcp.api.service.domain.mapper;

import static org.mapstruct.NullValueMappingStrategy.RETURN_DEFAULT;
import static org.mapstruct.NullValuePropertyMappingStrategy.IGNORE;

import java.util.Collections;
import java.util.List;
import java.util.stream.StreamSupport;

import org.mapstruct.BeanMapping;
import org.mapstruct.IterableMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import ca.gov.dtsstn.cdcp.api.data.entity.SubscriptionEntity;
import ca.gov.dtsstn.cdcp.api.service.domain.Subscription;
import jakarta.annotation.Nullable;

@Mapper(uses = { AlertTypeMapper.class, LanguageMapper.class })
public interface SubscriptionMapper {

	@Nullable
	public default List<Subscription> toDomainObjects(@Nullable Iterable<SubscriptionEntity> subscriptions) {
		if (subscriptions == null) { return Collections.emptyList(); }
		return StreamSupport.stream(subscriptions.spliterator(), false).map(this::toDomainObject).toList();
	}

	@Nullable
	@IterableMapping(nullValueMappingStrategy = RETURN_DEFAULT)
	Subscription toDomainObject(@Nullable SubscriptionEntity subscription);

	@Nullable
	public default List<SubscriptionEntity> toEntities(@Nullable Iterable<Subscription> subscriptions) {
		if (subscriptions == null) { return null; }
		return StreamSupport.stream(subscriptions.spliterator(), false).map(this::toEntity).toList();
	}

	@Nullable
	@Mapping(target = "isNew", ignore = true)
	SubscriptionEntity toEntity(@Nullable Subscription subscription);

	@Nullable
	@Mapping(target = "isNew", ignore = true)
	@BeanMapping(nullValuePropertyMappingStrategy = IGNORE)
	SubscriptionEntity updateEntity(@MappingTarget SubscriptionEntity target, @Nullable Subscription subscription);

}
