package ca.gov.dtsstn.cdcp.api.web.v1.model.mapper;

import java.util.List;
import java.util.stream.StreamSupport;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import ca.gov.dtsstn.cdcp.api.service.domain.Subscription;
import ca.gov.dtsstn.cdcp.api.web.v1.model.SubscriptionModel;
import jakarta.annotation.Nullable;

@Mapper(componentModel = "spring")
public interface SubscriptionModelMapper {

	@Nullable
	default List<SubscriptionModel> toModel(@Nullable Iterable<Subscription> subscriptions) {
		if (subscriptions == null) { return null; }
		return StreamSupport.stream(subscriptions.spliterator(), false).map(this::toModel).toList();
	}

	@Nullable
	@Mapping(target = "alertType", source = "alertType.code")
	SubscriptionModel toModel(@Nullable Subscription subscription);

}
