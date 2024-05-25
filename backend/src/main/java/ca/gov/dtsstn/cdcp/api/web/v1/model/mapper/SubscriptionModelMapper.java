package ca.gov.dtsstn.cdcp.api.web.v1.model.mapper;

import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.linkTo;
import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.methodOn;

import java.util.stream.StreamSupport;

import org.mapstruct.AfterMapping;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.springframework.hateoas.CollectionModel;

import ca.gov.dtsstn.cdcp.api.service.domain.Subscription;
import ca.gov.dtsstn.cdcp.api.web.v1.controller.SubscriptionsController;
import ca.gov.dtsstn.cdcp.api.web.v1.model.SubscriptionCreateModel;
import ca.gov.dtsstn.cdcp.api.web.v1.model.SubscriptionModel;
import jakarta.annotation.Nullable;

@Mapper
public interface SubscriptionModelMapper {

	@Nullable
	default CollectionModel<SubscriptionModel> toModel(String userId, @Nullable Iterable<Subscription> subscriptions) {
		final var subscriptionModels = StreamSupport.stream(subscriptions.spliterator(), false)
			.map(subscription -> toModel(userId, subscription)).toList();

		return CollectionModel.of(subscriptionModels)
			.add(linkTo(methodOn(SubscriptionsController.class).getSubscriptionsByUserId(userId)).withSelfRel());
	}

	@Nullable
	@Mapping(target = "alertTypeCode", source = "subscription.alertType.code")
	@Mapping(target = "msLanguageCode", source = "subscription.language.msLocaleCode")
	@BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
	SubscriptionModel toModel(String userId, @Nullable Subscription subscription);

	@AfterMapping
	default SubscriptionModel afterMappingToModel(String userId, @MappingTarget SubscriptionModel subscription) {
		return subscription.add(linkTo(methodOn(SubscriptionsController.class).getSubscriptionById(userId, subscription.getId())).withSelfRel());
	}

	@Mapping(target= "id", ignore = true)
	@Mapping(target= "createdBy", ignore = true)
	@Mapping(target= "createdDate", ignore = true)
	@Mapping(target= "lastModifiedBy", ignore = true)
	@Mapping(target= "lastModifiedDate", ignore = true)
	@Mapping(target= "alertType.code", source = "alertTypeCode")
	@Mapping(target= "language.msLocaleCode", source = "msLanguageCode")
	Subscription toDomainObject(@Nullable SubscriptionCreateModel subscriptionModel);

}