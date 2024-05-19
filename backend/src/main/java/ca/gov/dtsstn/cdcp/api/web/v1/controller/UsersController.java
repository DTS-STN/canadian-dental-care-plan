package ca.gov.dtsstn.cdcp.api.web.v1.controller;

import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.linkTo;
import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.methodOn;

import org.mapstruct.factory.Mappers;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.hateoas.CollectionModel;
import org.springframework.util.Assert;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import ca.gov.dtsstn.cdcp.api.config.SpringDocConfig.OAuthSecurityRequirement;
import ca.gov.dtsstn.cdcp.api.service.AlertTypeService;
import ca.gov.dtsstn.cdcp.api.service.SubscriptionService;
import ca.gov.dtsstn.cdcp.api.service.UserService;
import ca.gov.dtsstn.cdcp.api.service.domain.AlertType;
import ca.gov.dtsstn.cdcp.api.web.exception.ResourceNotFoundException;
import ca.gov.dtsstn.cdcp.api.web.v1.model.SubscriptionModel;
import ca.gov.dtsstn.cdcp.api.web.v1.model.UserModel;
import ca.gov.dtsstn.cdcp.api.web.v1.model.mapper.SubscriptionModelAssembler;
import ca.gov.dtsstn.cdcp.api.web.v1.model.mapper.SubscriptionModelMapper;
import ca.gov.dtsstn.cdcp.api.web.v1.model.mapper.UserModelAssembler;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.NotBlank;

@Validated
@RestController
@OAuthSecurityRequirement
@RequestMapping({ "/api/v1/users" })
@Tag(name = "Users", description = "Endpoint for managing user resources.")
public class UsersController {

	private static final Logger log = LoggerFactory.getLogger(UsersController.class);

	private final AlertTypeService alertTypeService;

	private final SubscriptionModelAssembler subscriptionModelAssembler;

	private final SubscriptionModelMapper subscriptionModelMapper = Mappers.getMapper(SubscriptionModelMapper.class);

	private final SubscriptionService subscriptionService;

	private final UserModelAssembler userModelAssembler;

	private final UserService userService;

	public UsersController(
			AlertTypeService alertTypeService,
			SubscriptionModelAssembler subscriptionModelAssembler,
			SubscriptionService subscriptionService,
			UserModelAssembler userModelAssembler,
			UserService userService) {
		Assert.notNull(alertTypeService, "alertTypeService is required; it must not be null");
		Assert.notNull(subscriptionModelAssembler, "subscriptionModelAssembler is required; it must not be null");
		Assert.notNull(subscriptionService, "subscriptionService is required; it must not be null");
		Assert.notNull(userModelAssembler, "userModelAssembler is required; it must not be null");
		Assert.notNull(userService, "userService is required; it must not be null");

		this.alertTypeService = alertTypeService;
		this.subscriptionModelAssembler = subscriptionModelAssembler;
		this.subscriptionService = subscriptionService;
		this.userModelAssembler = userModelAssembler;
		this.userService = userService;
	}

	@GetMapping({ "/{id}" })
	@Operation(summary = "Get a user by ID")
	public UserModel getUserById(
			@NotBlank(message = "id must not be null or blank")
			@Parameter(description = "The id of the user.", example = "00000000-0000-0000-0000-000000000000")
			@PathVariable String id) {
		final var user = userService.getUserById(id).orElseThrow(() -> new ResourceNotFoundException("No user with id=[%s] was found".formatted(id)));
		return userModelAssembler.toModel(user);
	}

	@GetMapping({ "/{id}/subscriptions" })
	@Operation(summary = "List all subscriptions for a user")
	public CollectionModel<SubscriptionModel> getSubscriptionsByUserId(
			@NotBlank(message = "id must not be null or blank")
			@Parameter(description = "The id of the user.", example = "00000000-0000-0000-0000-000000000000")
			@PathVariable String id) {
		final var subscriptions = subscriptionModelAssembler.toCollectionModel(subscriptionService.getSubscriptionsByUserId(id));
		final var selfLink = linkTo(methodOn(getClass()).getSubscriptionsByUserId(id)).withSelfRel();
		return subscriptionModelAssembler.wrapCollection(subscriptions, SubscriptionModel.class).add(selfLink);
	}


	@PostMapping({ "/{id}/subscriptions" })
	@Operation(summary = "Create a subscription for a user")
	public void createSubscriptionForUser(
			@NotBlank(message = "id must not be null or blank")
			@Parameter(description = "The id of the user.", example = "0000000-0000-0000-0000-000000000000")
			@PathVariable String id,

			@Validated @RequestBody SubscriptionModel subscription) {
		final var alertTypeId = alertTypeService.readByCode(subscription.getAlertType()).map(AlertType::getId).orElseThrow();
		subscriptionService.create(subscriptionModelMapper.toDomain(subscription, alertTypeId));
	}

	@PutMapping({ "/{id}/subscriptions/{subscriptionId}" })
	@Operation(summary = "Update a subscription for a user.")
	@ApiResponse(responseCode = "204", description = "The request has been successfully processed.")
	public void updateSubscriptionForUser(
			@NotBlank(message = "id must not be null or blank")
			@Parameter(description = "The user id of the user.", example = "0000000-0000-0000-0000-000000000000")
			@PathVariable String id,

			@NotBlank(message = "subscriptionId must not be null or blank")
			@Parameter(description = "The id of the subscription to update.")
			@PathVariable String subscriptionId,

			@Validated @RequestBody SubscriptionModel subscription) {
		final var alertTypeId = alertTypeService.readByCode(subscription.getAlertType()).map(AlertType::getId).orElseThrow();
		subscriptionService.update(subscriptionModelMapper.toDomain(subscription, alertTypeId));
	}

}
