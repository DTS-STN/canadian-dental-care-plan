package ca.gov.dtsstn.cdcp.api.service.domain.mapper;

import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

import ca.gov.dtsstn.cdcp.api.data.entity.SubscriptionEntity;
import ca.gov.dtsstn.cdcp.api.service.domain.Subscription;
import jakarta.annotation.Nullable;

@Mapper(uses = { AlertTypeMapper.class })
public interface SubscriptionMapper {

	@Nullable
	Subscription fromEntity(@Nullable SubscriptionEntity subscription);

	@Nullable
	@Mapping(target = "isNew", ignore = true)
	SubscriptionEntity toEntity(@Nullable Subscription subscription);

	@Nullable
	@Mapping(target = "isNew", ignore = true)
	@BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
	SubscriptionEntity update(@Nullable Subscription subscription, @MappingTarget SubscriptionEntity target);
}
