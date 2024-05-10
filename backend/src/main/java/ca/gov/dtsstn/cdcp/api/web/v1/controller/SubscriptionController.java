package ca.gov.dtsstn.cdcp.api.web.v1.controller;

import java.util.List;

import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import ca.gov.dtsstn.cdcp.api.service.SubscriptionService;
import ca.gov.dtsstn.cdcp.api.web.v1.model.SubscriptionModel;
import ca.gov.dtsstn.cdcp.api.web.v1.model.mapper.SubscriptionModelMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.NotBlank;

@Validated
@RestController
@RequestMapping({ "/api/v1" })
@Tag(name = "subscriptions", description = "CRUD endpoint for subscriptions.")
public class SubscriptionController {

	private final SubscriptionModelMapper subscriptionModelMapper;

	private final SubscriptionService subscriptionService;

	public SubscriptionController(SubscriptionModelMapper subscriptionModelMapper, SubscriptionService subscriptionService) {
		this.subscriptionService = subscriptionService;
		this.subscriptionModelMapper = subscriptionModelMapper;
	}

	@GetMapping({ "/users/{userId}/subscriptions" })
	@Operation(summary = "Get all subscriptions for a user.", operationId = "get-subscriptions")
	public List<SubscriptionModel> getSubscriptions(
			@NotBlank(message = "userId must not be null or blank")
			@Parameter(description = "The id of the user.", example = "000000000", required = true)
			@PathVariable String userId) {
		return subscriptionModelMapper.toModel(subscriptionService.getSubscriptionsByUserId(userId));
	}

}
