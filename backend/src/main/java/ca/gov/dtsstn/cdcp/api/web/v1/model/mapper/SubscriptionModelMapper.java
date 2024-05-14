package ca.gov.dtsstn.cdcp.api.web.v1.model.mapper;

import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.NullValuePropertyMappingStrategy;

import ca.gov.dtsstn.cdcp.api.service.domain.Subscription;
import ca.gov.dtsstn.cdcp.api.web.v1.model.SubscriptionModel;
import jakarta.annotation.Nullable;

@Mapper(componentModel = "spring")
public interface SubscriptionModelMapper {

	@Nullable
	@Mapping(target = "alertType", source = "alertType.code")
	@BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
	SubscriptionModel toModel(@Nullable Subscription subscription);

}
