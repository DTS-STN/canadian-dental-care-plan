package ca.gov.dtsstn.cdcp.api.web.v1.controller;

import java.util.function.Predicate;

import org.mapstruct.factory.Mappers;
import org.springframework.hateoas.CollectionModel;
import org.springframework.http.HttpStatus;
import org.springframework.util.Assert;
import org.springframework.validation.BindException;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import ca.gov.dtsstn.cdcp.api.config.SpringDocConfig.OAuthSecurityRequirement;
import ca.gov.dtsstn.cdcp.api.service.AlertTypeService;
import ca.gov.dtsstn.cdcp.api.service.LanguageService;
import ca.gov.dtsstn.cdcp.api.service.UserService;
import ca.gov.dtsstn.cdcp.api.service.domain.AlertType;
import ca.gov.dtsstn.cdcp.api.service.domain.BaseDomainObject;
import ca.gov.dtsstn.cdcp.api.service.domain.Language;
import ca.gov.dtsstn.cdcp.api.service.domain.Subscription;
import ca.gov.dtsstn.cdcp.api.web.exception.ResourceConflictException;
import ca.gov.dtsstn.cdcp.api.web.exception.ResourceNotFoundException;
import ca.gov.dtsstn.cdcp.api.web.json.JsonPatchProcessor;
import ca.gov.dtsstn.cdcp.api.web.v1.model.SubscriptionCreateModel;
import ca.gov.dtsstn.cdcp.api.web.v1.model.SubscriptionModel;
import ca.gov.dtsstn.cdcp.api.web.v1.model.mapper.SubscriptionModelMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.json.JsonPatch;
import jakarta.validation.constraints.NotBlank;

@Validated
@RestController
@OAuthSecurityRequirement
@RequestMapping({ "/api/v1/users/{userId}/subscriptions" })
@Tag(name = "Subscriptions", description = "Endpoint for managing subscription resources.")
public class SubscriptionsController {

	private final SubscriptionModelMapper subscriptionModelMapper = Mappers.getMapper(SubscriptionModelMapper.class);

	private final AlertTypeService alertTypeService;

	private final JsonPatchProcessor jsonPatchProcessor;

	private final LanguageService languageService;

	private final UserService userService;

	public SubscriptionsController(
			AlertTypeService alertTypeService,
			JsonPatchProcessor jsonPatchProcessor,
			LanguageService languageService,
			UserService userService) {
		Assert.notNull(alertTypeService, "alertTypeService is required; it must not be null");
		Assert.notNull(jsonPatchProcessor, "jsonPatchProcessor is required; it must not be null");
		Assert.notNull(languageService, "languageService is required; it must not be null");
		Assert.notNull(userService, "userService is required; it must not be null");

		this.alertTypeService = alertTypeService;
		this.jsonPatchProcessor = jsonPatchProcessor;
		this.languageService = languageService;
		this.userService = userService;
	}

	@PostMapping
	@ResponseStatus(HttpStatus.NO_CONTENT)
	@Operation(summary = "Create a new subscription for a user")
	public void createSubscriptionForUser(
			@NotBlank(message = "userId must not be null or blank")
			@Parameter(description = "The id of the user.", example = "00000000-0000-0000-0000-000000000000")
			@PathVariable String userId,
			@Validated @RequestBody SubscriptionCreateModel subscription) {
		final var user = userService.getUserById(userId)
			.orElseThrow(() -> new ResourceNotFoundException("No user with id=[%s] was found".formatted(userId)));

		final var alertTypeId = alertTypeService
			.readByCode(subscription.getAlertTypeCode())
			.map(AlertType::getId)
			.orElseThrow(/* pre-validated input */);

		final var languageId = languageService
			.readByMsLocaleCode(subscription.getMsLanguageCode())
			.map(Language::getId)
			.orElseThrow(/* pre-validated input */);

		user.getSubscriptions().stream()
			.map(Subscription::getAlertType)
			.filter(byId(alertTypeId)).findFirst()
			.ifPresent(xxx -> {
				throw new ResourceConflictException("A subscription with code [%s] already exists for user [%s]".formatted(subscription.getAlertTypeCode(), userId));
			});

		userService.createSubscriptionForUser(userId, alertTypeId, languageId);
	}

	@GetMapping
	@Operation(summary = "List all subscriptions for a user")
	public CollectionModel<SubscriptionModel> getSubscriptionsByUserId(
			@NotBlank(message = "userId must not be null or blank")
			@Parameter(description = "The id of the user.", example = "00000000-0000-0000-0000-000000000000")
			@PathVariable String userId) {
		final var user = userService.getUserById(userId)
			.orElseThrow(() -> new ResourceNotFoundException("No user with id=[%s] was found".formatted(userId)));

		return subscriptionModelMapper.toModel(userId, user.getSubscriptions());
	}

	@GetMapping({ "/{subscriptionId}" })
	@Operation(summary = "Get a subscriptions by ID")
	public SubscriptionModel getSubscriptionById(
			@NotBlank(message = "userId must not be null or blank")
			@Parameter(description = "The id of the user.", example = "00000000-0000-0000-0000-000000000000")
			@PathVariable String userId,

			@NotBlank(message = "subscriptionId must not be null or blank")
			@Parameter(description = "The id of the subscription.", example = "00000000-0000-0000-0000-000000000000")
			@PathVariable String subscriptionId) {
		final var user = userService.getUserById(userId)
			.orElseThrow(() -> new ResourceNotFoundException("No user with id=[%s] was found".formatted(userId)));

		final var subscription = user.getSubscriptions().stream()
			.filter(byId(subscriptionId)).findFirst()
			.orElseThrow(() -> new ResourceNotFoundException("No subscription with id=[%s] was found".formatted(subscriptionId)));

		return subscriptionModelMapper.toModel(userId, subscription);
	}

	@PatchMapping({ "/{subscriptionId}" })
	@Operation(summary = "Update a subscription by ID")
	@ApiResponse(responseCode = "204", description = "The request has been successfully processed.")
	public void updateSubscriptionById(
			@NotBlank(message = "userId must not be null or blank")
			@Parameter(description = "The id of the user.", example = "00000000-0000-0000-0000-000000000000")
			@PathVariable String userId,
			@NotBlank(message = "subscriptionId must not be null or blank")
			@Parameter(description = "The id of the subscription.", example = "00000000-0000-0000-0000-000000000000")
			@PathVariable String subscriptionId,
			@Validated @RequestBody JsonPatch patch) throws BindException {
		final var user = userService.getUserById(userId)
			.orElseThrow(() -> new ResourceNotFoundException("No user with id=[%s] was found".formatted(userId)));

		final var subscription = user.getSubscriptions().stream()
			.filter(byId(subscriptionId)).findFirst()
			.orElseThrow(() -> new ResourceNotFoundException("No subscription with id=[%s] was found".formatted(subscriptionId)));

		final var subscriptionModel = subscriptionModelMapper.toPatchModel(subscription);
		final var subscriptionPatched = jsonPatchProcessor.patch(subscriptionModel, patch);

		final var languageId = languageService
			.readByMsLocaleCode(subscriptionPatched.getMsLanguageCode())
			.map(Language::getId)
			.orElseThrow(/* pre-validated input */);

		userService.updateSubscriptionForUser(userId, subscriptionId, languageId);
	}

	@DeleteMapping({ "/{subscriptionId}" })
	@Operation(summary = "Delete a subscription by ID")
	@ApiResponse(responseCode = "204", description = "The request has been successfully processed.")
	public void deleteSubscriptionById(
			@NotBlank(message = "userId must not be null or blank")
			@Parameter(description = "The id of the user.", example = "00000000-0000-0000-0000-000000000000")
			@PathVariable String userId,

			@NotBlank(message = "subscriptionId must not be null or blank")
			@Parameter(description = "The id of the subscription.", example = "00000000-0000-0000-0000-000000000000")
			@PathVariable String subscriptionId) {
		final var user = userService.getUserById(userId)
			.orElseThrow(() -> new ResourceNotFoundException("No user with id=[%s] was found".formatted(userId)));

		final var subscription = user.getSubscriptions().stream()
			.filter(byId(subscriptionId)).findFirst()
			.orElseThrow(() -> new ResourceNotFoundException("No subscription with id=[%s] was found".formatted(subscriptionId)));

		userService.deleteSubscriptionForUser(userId, subscription.getId());
	}

	private Predicate<? super BaseDomainObject> byId(String id) {
		return domainObject -> id.equals(domainObject.getId());
	}

}
