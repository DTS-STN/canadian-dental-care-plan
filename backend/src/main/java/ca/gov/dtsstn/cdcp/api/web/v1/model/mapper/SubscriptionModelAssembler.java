package ca.gov.dtsstn.cdcp.api.web.v1.model.mapper;

import org.springframework.data.web.PagedResourcesAssembler;
import org.springframework.stereotype.Component;
import org.springframework.util.Assert;

import ca.gov.dtsstn.cdcp.api.service.domain.Subscription;
import ca.gov.dtsstn.cdcp.api.web.model.AbstractModelAssembler;
import ca.gov.dtsstn.cdcp.api.web.v1.controller.SubscriptionsController;
import ca.gov.dtsstn.cdcp.api.web.v1.model.SubscriptionModel;

@Component
public class SubscriptionModelAssembler extends AbstractModelAssembler<Subscription, SubscriptionModel> {

	private final SubscriptionModelMapper subscriptionModelMapper;

	protected SubscriptionModelAssembler(PagedResourcesAssembler<Subscription> pagedResourcesAssembler, SubscriptionModelMapper subscriptionModelMapper) {
		super(SubscriptionsController.class, SubscriptionModel.class, pagedResourcesAssembler);
		Assert.notNull(subscriptionModelMapper, "subscriptionModelMapper is required; it must not be null");
		this.subscriptionModelMapper = subscriptionModelMapper;
	}

	@Override
	protected SubscriptionModel instantiateModel(Subscription subscription) {
		Assert.notNull(subscription, "subscription is required; it must not be null");
		return subscriptionModelMapper.toModel(subscription);
	}

}
