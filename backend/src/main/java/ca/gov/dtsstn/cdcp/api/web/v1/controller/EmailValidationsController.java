package ca.gov.dtsstn.cdcp.api.web.v1.controller;

import org.springframework.http.HttpStatus;
import org.springframework.util.Assert;
import org.springframework.validation.BindException;
import org.springframework.validation.BindingResult;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import ca.gov.dtsstn.cdcp.api.config.SpringDocConfig.OAuthSecurityRequirement;
import ca.gov.dtsstn.cdcp.api.service.UserService;
import ca.gov.dtsstn.cdcp.api.web.exception.ResourceNotFoundException;
import ca.gov.dtsstn.cdcp.api.web.v1.model.EmailVerificationModel;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.NotBlank;

@Validated
@RestController
@OAuthSecurityRequirement
@RequestMapping({ "/api/v1/users" })
@Tag(name = "Email validations", description = "Endpoint for managing user email validations.")
public class EmailValidationsController {

	private final UserService userService;

	public EmailValidationsController(UserService userService) {
		Assert.notNull(userService, "userService is required; it must not be null");
		this.userService = userService;
	}

	@ResponseStatus(HttpStatus.ACCEPTED)
	@PostMapping({ "/{userId}/email-validations"})
	@Operation(summary = "Create a new email validation for a user")
	public void verifyConfirmationCodeStatus(
			@NotBlank(message = "userId must not be null or blank")
			@Parameter(description = "The ID of the user.", required = true)
			@PathVariable String userId,

			@Validated @RequestBody EmailVerificationModel emailVerificationModel,
			BindingResult bindingResult) throws BindException {
		// throw early if any validation errors were discovered
		if (bindingResult.hasErrors()) { throw new BindException(bindingResult); }

		userService.getUserById(userId)
			.orElseThrow(() -> new ResourceNotFoundException("No user with id=[%s] was found".formatted(userId)));

		final var emailVerified = userService.verifyEmail(userId, emailVerificationModel.getConfirmationCode());

		if (emailVerified == false) {
			bindingResult.rejectValue("confirmationCode", "confirmationCode", "Invalid confirmation code");
			throw new BindException(bindingResult);
		}
	}

}
