package ca.gov.dtsstn.cdcp.api.web.v1.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.Assert;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import ca.gov.dtsstn.cdcp.api.config.SpringDocConfig.OAuthSecurityRequirement;
import ca.gov.dtsstn.cdcp.api.service.UserService;
import ca.gov.dtsstn.cdcp.api.web.exception.ResourceNotFoundException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.NotBlank;


@Validated
@RestController
@OAuthSecurityRequirement
@RequestMapping({ "/api/v1/users/{userId}/confirmation-codes" })
@Tag(name = "Confirmation codes", description = "Endpoint for managing user confirmation code resources.")
public class ConfirmationCodesController {

	private final UserService userService;

	public ConfirmationCodesController(UserService userService) {
		Assert.notNull(userService, "userService is required; it must not be null");
		this.userService = userService;
	}

	@PostMapping
	@ResponseStatus(HttpStatus.NO_CONTENT)
	@Operation(summary = "Create a new confirmation code for a user")
	public ResponseEntity<Void> createConfirmationCodeForUser(
			@NotBlank(message = "userId must not be null or blank")
			@Parameter(description = "The id of the user.", example = "00000000-0000-0000-0000-000000000000")
			@PathVariable String userId) {

		userService.getUserById(userId)
			.orElseThrow(() -> new ResourceNotFoundException("No user with id=[%s] was found".formatted(userId)));

		userService.createConfirmationCodeForUser(userId);

		return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
	}

}
