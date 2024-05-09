package ca.gov.dtsstn.cdcp.api.web.v1.model;

import java.util.List;
import java.util.Optional;
import java.util.stream.StreamSupport;

import org.mapstruct.Mapping;
import org.mapstruct.Named;
import org.mapstruct.Mapper;
import org.springframework.beans.factory.annotation.Autowired;

import ca.gov.dtsstn.cdcp.api.service.AlertTypeService;
import ca.gov.dtsstn.cdcp.api.service.domain.AlertType;
import ca.gov.dtsstn.cdcp.api.service.domain.Subscription;
import jakarta.annotation.Nullable;

@Mapper(componentModel = "spring")
public abstract class SubscriptionModelMapper {

	@Autowired
	protected AlertTypeService alertTypeService;
	
	@Nullable
	public List<SubscriptionModel> toModel(@Nullable Iterable<Subscription> subscriptions) {
		if (subscriptions == null) { return null; }
		return StreamSupport.stream(subscriptions.spliterator(), false).map(this::toModel).toList();
	}

	@Nullable
	@Mapping(target = "alertType", source = "alertTypeId", qualifiedByName = { "toAlertType" })	
	public abstract SubscriptionModel toModel(@Nullable Subscription subscription);

	/**
	 * Map a {@link Subscription#getAlertTypeId()} to a {@link id}.
	 */
	@Nullable
	@Named("toAlertType")
	protected String toAlertType(@Nullable String alertTypeId) {
		return Optional.ofNullable(alertTypeId)
			.flatMap(alertTypeService::read)
			.map(AlertType::getCode)
			.orElse(null);
	}
}
