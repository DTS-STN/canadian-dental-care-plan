package ca.gov.dtsstn.cdcp.api.service.domain.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.springframework.lang.Nullable;

import ca.gov.dtsstn.cdcp.api.data.entity.SubscriptionEntity;
import ca.gov.dtsstn.cdcp.api.service.domain.Subscription;

/**
 * MapStruct mapper that maps {@link Subscription} instances to {@link SubscriptionEntity} instances (and vice versa).
 *
 * @author Lei Ye (lei.ye@hrsdc-rhdcc.gc.ca)
 */

@Mapper(componentModel = "spring", uses = { AlertTypeMapper.class })
public interface SubscriptionMapper {
	@Nullable
	@Mapping(target = "isNew", ignore = true)
	@Mapping(target = "alertType", source = "alertTypeId")
	SubscriptionEntity toEntity(@Nullable Subscription subscription);

	@Nullable
	@Mapping(target = "alertTypeId", source = "alertType.id")
	Subscription fromEntity(@Nullable SubscriptionEntity subscriptionEntity);
}
