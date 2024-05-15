package ca.gov.dtsstn.cdcp.api.web.v1.controller;

import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.linkTo;
import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.methodOn;

import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.hateoas.CollectionModel;
import org.springframework.util.Assert;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import ca.gov.dtsstn.cdcp.api.service.AlertTypeService;
import ca.gov.dtsstn.cdcp.api.service.SubscriptionService;
import ca.gov.dtsstn.cdcp.api.service.domain.AlertType;
import ca.gov.dtsstn.cdcp.api.web.v1.model.SubscriptionModel;
import ca.gov.dtsstn.cdcp.api.web.v1.model.mapper.SubscriptionModelAssembler;
import ca.gov.dtsstn.cdcp.api.web.v1.model.mapper.SubscriptionModelMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.NotBlank;

@Validated
@RestController
@RequestMapping({ "/api/v1/users" })
@Tag(name = "Users", description = "CRUD endpoint for users.")
public class UsersController {

	private static final Logger log = LoggerFactory.getLogger(UsersController.class);

	private final SubscriptionModelAssembler subscriptionModelAssembler;

	private final SubscriptionService subscriptionService;

	private final SubscriptionModelMapper mapper;

	private final AlertTypeService alertTypeService;

	public UsersController(
				SubscriptionModelAssembler subscriptionModelAssembler, 
				SubscriptionService subscriptionService, 
				SubscriptionModelMapper mapper, 
				AlertTypeService alertTypeService) {
		Assert.notNull(subscriptionModelAssembler, "subscriptionModelAssembler is required; it must not be null");
		Assert.notNull(subscriptionService, "subscriptionService is required; it must not be null");
		Assert.notNull(mapper, "mapper is required; it must not be null");
		Assert.notNull(alertTypeService, "alertTypeService is required; it must not be null");
		this.subscriptionModelAssembler = subscriptionModelAssembler;
		this.subscriptionService = subscriptionService;
		this.mapper = mapper;
		this.alertTypeService = alertTypeService;
	}

	@GetMapping({ "/{userId}/subscriptions" })
	@Operation(summary = "Get all subscriptions for a user.", operationId = "get-user-subscriptions")
	public CollectionModel<SubscriptionModel> getSubscriptionsByUserId(
			@NotBlank(message = "userId must not be null or blank")
			@Parameter(description = "The user id of the user.", example = "000000000", required = true)
			@PathVariable String userId) {
		final var subscriptions = subscriptionModelAssembler.toCollectionModel(subscriptionService.getSubscriptionsByUserId(userId));
		final var selfLink = linkTo(methodOn(getClass()).getSubscriptionsByUserId(userId)).withSelfRel();
		return subscriptionModelAssembler.wrapCollection(subscriptions, SubscriptionModel.class).add(selfLink);
	}	


	@PostMapping({ "/{userId}/subscriptions" })
	@Operation(summary = "Create a subscription for a user.", operationId = "user-subscriptions-create")
	@ApiResponse(responseCode = "204", description = "The request has been successfully processed.")
	public void create(
			@RequestBody(required = true)
			SubscriptionModel createSubscriptionRequest,
			@NotBlank(message = "userId must not be null or blank")
			@Parameter(description = "The user id of the user.", example = "000000000", required = true)
			@PathVariable String userId) throws Exception {
		final Optional<AlertType> convertedAlertType = Optional.ofNullable(alertTypeService.readByCode(createSubscriptionRequest.getAlertType())).orElseThrow(() -> new Exception("alertType not found"));
		createSubscriptionRequest.setAlertType(convertedAlertType.get().getId());
		final var subscription = mapper.toDomain(createSubscriptionRequest);
		log.debug("Creating subscription: {}", subscription);
		subscriptionService.create(subscription);
	}

	@PostMapping({ "/{userId}/subscriptions/{subscriptionId}" })
	@Operation(summary = "Update a subscription for a user.", operationId = "user-subscriptions-update")
	@ApiResponse(responseCode = "204", description = "The request has been successfully processed.")
	public void update(
			@RequestBody(required = true)
			SubscriptionModel updateSubscriptionRequest,
			@NotBlank(message = "userId must not be null or blank")
			@Parameter(description = "The user id of the user.", example = "000000000", required = true)
			@PathVariable String userId,
			@NotBlank(message = "subscriptionId must not be null or blank")
			@Parameter(description = "The individaul subscription id. ", required = true)
			@PathVariable String subscriptionId) throws Exception {
		final Optional<AlertType> convertedAlertType = Optional.ofNullable(alertTypeService.readByCode(updateSubscriptionRequest.getAlertType())).orElseThrow(() -> new Exception("alertType not found"));
		updateSubscriptionRequest.setAlertType(convertedAlertType.get().getId());
		final var subscription = mapper.toDomain(updateSubscriptionRequest);
		log.debug("Updating subscription: {}", subscription);
		subscriptionService.update(subscription);
	}	
}
