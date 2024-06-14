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
import ca.gov.dtsstn.cdcp.api.web.v1.model.SubscriptionPatchModel;
import jakarta.annotation.Nullable;

@Mapper
public abstract class SubscriptionModelMapper extends AbstractModelMapper {

	@Nullable
	public CollectionModel<SubscriptionModel> toModel(String userId, @Nullable Iterable<Subscription> subscriptions) {
		final var subscriptionModels = StreamSupport.stream(subscriptions.spliterator(), false)
			.map(subscription -> toModel(userId, subscription)).toList();

		final var collection = CollectionModel.of(subscriptionModels)
			.add(linkTo(methodOn(SubscriptionsController.class).getSubscriptionsByUserId(userId)).withSelfRel());

		return wrapCollection(collection, SubscriptionModel.class);
	}

	@Nullable
	@Mapping(target = "alertTypeCode", source = "subscription.alertType.code")
	@Mapping(target = "msLanguageCode", source = "subscription.language.msLocaleCode")
	@BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
	public abstract SubscriptionModel toModel(String userId, @Nullable Subscription subscription);

	@AfterMapping
	public SubscriptionModel afterMappingToModel(String userId, @MappingTarget SubscriptionModel subscription) {
		return subscription.add(linkTo(methodOn(SubscriptionsController.class).getSubscriptionById(userId, subscription.getId())).withSelfRel());
	}

	@Mapping(target = "id", ignore = true)
	@Mapping(target = "createdBy", ignore = true)
	@Mapping(target = "createdDate", ignore = true)
	@Mapping(target = "lastModifiedBy", ignore = true)
	@Mapping(target = "lastModifiedDate", ignore = true)
	@Mapping(target = "alertType.code", source = "alertTypeCode")
	@Mapping(target = "language.msLocaleCode", source = "msLanguageCode")
	public abstract Subscription toDomainObject(@Nullable SubscriptionCreateModel subscriptionModel);

	@Mapping(target = "createdBy", ignore = true)
	@Mapping(target = "createdDate", ignore = true)
	@Mapping(target = "lastModifiedBy", ignore = true)
	@Mapping(target = "lastModifiedDate", ignore = true)
	@Mapping(target = "alertType.code", source = "alertTypeCode")
	@Mapping(target = "language.msLocaleCode", source = "msLanguageCode")
	public abstract Subscription toDomain(@Nullable SubscriptionModel subscriptionModel);

	@Nullable
	@Mapping(target = "msLanguageCode", source = "language.msLocaleCode")
	public abstract SubscriptionPatchModel toPatchModel(@Nullable Subscription subscription);

}
