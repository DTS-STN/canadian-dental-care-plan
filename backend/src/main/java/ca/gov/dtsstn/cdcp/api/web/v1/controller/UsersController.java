package ca.gov.dtsstn.cdcp.api.web.v1.controller;

import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.linkTo;
import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.methodOn;

import org.springframework.hateoas.CollectionModel;
import org.springframework.util.Assert;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import ca.gov.dtsstn.cdcp.api.service.SubscriptionService;
import ca.gov.dtsstn.cdcp.api.web.v1.model.SubscriptionModel;
import ca.gov.dtsstn.cdcp.api.web.v1.model.mapper.SubscriptionModelAssembler;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.NotBlank;

@Validated
@RestController
@RequestMapping({ "/api/v1/users" })
@Tag(name = "Users", description = "CRUD endpoint for users.")
public class UsersController {

	private final SubscriptionModelAssembler subscriptionModelAssembler;

	private final SubscriptionService subscriptionService;

	public UsersController(SubscriptionModelAssembler subscriptionModelAssembler, SubscriptionService subscriptionService) {
		Assert.notNull(subscriptionModelAssembler, "subscriptionModelAssembler is required; it must not be null");
		Assert.notNull(subscriptionService, "subscriptionService is required; it must not be null");
		this.subscriptionModelAssembler = subscriptionModelAssembler;
		this.subscriptionService = subscriptionService;
	}

	@GetMapping({ "/{id}/subscriptions" })
	@Operation(summary = "Get all subscriptions for a user.", operationId = "get-user-subscriptions")
	public CollectionModel<SubscriptionModel> getSubscriptionsByUserId(
			@NotBlank(message = "id must not be null or blank")
			@Parameter(description = "The id of the user.", example = "000000000", required = true)
			@PathVariable String id) {
		final var subscriptions = subscriptionModelAssembler.toCollectionModel(subscriptionService.getSubscriptionsByUserId(id));
		final var selfLink = linkTo(methodOn(getClass()).getSubscriptionsByUserId(id)).withSelfRel();
		return subscriptionModelAssembler.wrapCollection(subscriptions, SubscriptionModel.class).add(selfLink);
	}

}
