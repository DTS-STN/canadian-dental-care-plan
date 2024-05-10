package ca.gov.dtsstn.cdcp.api.web.v1.controller;

import java.util.Optional;

import org.springframework.util.Assert;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import ca.gov.dtsstn.cdcp.api.service.SubscriptionService;
import ca.gov.dtsstn.cdcp.api.web.v1.model.SubscriptionModel;
import ca.gov.dtsstn.cdcp.api.web.v1.model.mapper.SubscriptionModelAssembler;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.NotBlank;

@Validated
@RestController
@RequestMapping({ "/api/v1/subscriptions" })
@Tag(name = "Subscriptions", description = "CRUD endpoint for subscriptions.")
public class SubscriptionsController {

	private final SubscriptionModelAssembler subscriptionModelAssembler;

	private final SubscriptionService subscriptionService;

	public SubscriptionsController(SubscriptionModelAssembler subscriptionModelAssembler, SubscriptionService subscriptionService) {
		Assert.notNull(subscriptionModelAssembler, "subscriptionModelAssembler is required; it must not be null");
		Assert.notNull(subscriptionService, "subscriptionService is required; it must not be null");
		this.subscriptionModelAssembler = subscriptionModelAssembler;
		this.subscriptionService = subscriptionService;
	}

	@GetMapping({ "/{id}" })
	public Optional<SubscriptionModel> getSubscriptionById(
			@NotBlank(message = "id must not be null or blank")
			@Parameter(description = "The id of the subscription.", example = "00000000-0000-0000-0000-000000000000", required = true)
			@PathVariable String id) {
		return subscriptionService.getSubscriptionById(id).map(subscriptionModelAssembler::toModel);
	}

}
