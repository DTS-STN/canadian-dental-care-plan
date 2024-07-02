package ca.gov.dtsstn.cdcp.api.web.v1.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.Assert;
import org.springframework.validation.BindException;
import org.springframework.validation.BindingResult;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import ca.gov.dtsstn.cdcp.api.config.SpringDocConfig.OAuthSecurityRequirement;
import ca.gov.dtsstn.cdcp.api.service.UserService;
import ca.gov.dtsstn.cdcp.api.web.exception.ResourceNotFoundException;
import ca.gov.dtsstn.cdcp.api.web.v1.model.EmailValidationModel;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.NotBlank;


@Validated
@RestController
@OAuthSecurityRequirement
@RequestMapping({ "/api/v1/users/{userId}/email-validations" })
@Tag(name = "Email validations", description = "Endpoint for managing user email validations.")
public class EmailValidationsController {

	private final UserService userService;

	public EmailValidationsController(UserService userService) {
		Assert.notNull(userService, "userService is required; it must not be null");
		this.userService = userService;
	}

	@GetMapping
	@ResponseStatus(HttpStatus.METHOD_NOT_ALLOWED)
	@Operation(summary = "List all email validations for a user")
	public ResponseEntity<Void> getEmailValidationByUserId(
			@NotBlank(message = "userId must not be null or blank")
			@Parameter(description = "The ID of the user.", example = "00000000-0000-0000-0000-000000000000")
			@PathVariable String userId) {
		return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED).build();
	}

	@PostMapping
	@ResponseStatus(HttpStatus.ACCEPTED)
	@Operation(summary = "Create a new email validation for a user")
	public void verifyConfirmationCodeStatus(
			@NotBlank(message = "userId must not be null or blank")
			@Parameter(description = "The ID of the user.", example = "00000000-0000-0000-0000-000000000000")
			@PathVariable String userId,

			@Validated @RequestBody EmailValidationModel emailValidationModel,
			BindingResult bindingResult) throws BindException {
		// throw early if any validation errors were discovered
		if (bindingResult.hasErrors()) { throw new BindException(bindingResult); }

		userService.getUserById(userId)
			.orElseThrow(() -> new ResourceNotFoundException("No user with id=[%s] was found".formatted(userId)));

		final var emailVerified = userService.verifyEmail(userId, emailValidationModel.getConfirmationCode());

		if (emailVerified == false) {
			bindingResult.rejectValue("confirmationCode", "confirmationCode", "Invalid confirmation code");
			throw new BindException(bindingResult);
		}
	}

}
