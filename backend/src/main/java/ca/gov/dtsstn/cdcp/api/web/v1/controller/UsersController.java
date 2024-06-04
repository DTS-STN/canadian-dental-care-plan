package ca.gov.dtsstn.cdcp.api.web.v1.controller;

import org.mapstruct.factory.Mappers;
import org.springframework.http.HttpStatus;
import org.springframework.util.Assert;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import ca.gov.dtsstn.cdcp.api.config.SpringDocConfig.OAuthSecurityRequirement;
import ca.gov.dtsstn.cdcp.api.service.UserService;
import ca.gov.dtsstn.cdcp.api.web.exception.ResourceNotFoundException;
import ca.gov.dtsstn.cdcp.api.web.v1.model.UserModel;
import ca.gov.dtsstn.cdcp.api.web.v1.model.UserUpdateModel;
import ca.gov.dtsstn.cdcp.api.web.v1.model.mapper.UserModelMapper;
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

	private final UserModelMapper userModelMapper = Mappers.getMapper(UserModelMapper.class);

	private final UserService userService;

	public UsersController(UserService userService) {
		Assert.notNull(userService, "userService is required; it must not be null");
		this.userService = userService;
	}

	@GetMapping({ "/{id}" })
	@Operation(summary = "Get a user by ID")
	public UserModel getUserById(
			@NotBlank(message = "id must not be null or blank")
			@Parameter(description = "The id of the user.", example = "00000000-0000-0000-0000-000000000000")
			@PathVariable String id) {
		return userService.getUserById(id)
			.map(userModelMapper::toModel)
			.orElseThrow(() -> new ResourceNotFoundException("No user with id=[%s] was found".formatted(id)));
	}

	//TODO: will use JSON PATCH in later PR
	@PatchMapping({ "/{id}" })
	@Operation(summary = "Update a user by ID")
	@ApiResponse(responseCode = "204", description = "The request has been successfully processed.")
	public void updateUserById(
			@NotBlank(message = "id must not be null or blank")
			@Parameter(description = "The id of the user.", example = "00000000-0000-0000-0000-000000000000")
			@PathVariable String id,
			@Validated @RequestBody UserUpdateModel userUpdateModel) {

		final var user = userService.getUserById(id)
				.orElseThrow(() -> new ResourceNotFoundException("No user with id=[%s] was found".formatted(id)));

		userService.updateUser(user.getId(), userUpdateModel.getEmail());
	}	


    @PostMapping({ "/{userId}/email-validations"})
    @Operation(summary = "Validate a user's email via a confirmation code.", operationId="verify-confirmation-code")
	@ResponseStatus(code = HttpStatus.ACCEPTED)
    public void verifyConfirmationCodeStatus(
            @NotBlank(message = "userId must not be null or blank")
            @Parameter(description = "The ID of the user.", required = true)
            @PathVariable String userId,
            @NotBlank(message = "code must not be null or blank")
            @Parameter(description = "The confirmation code.", required = true)
            @RequestBody String code
        ){
			if (userService.verifyEmail(code, userId)==false) {
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid confirmation code");
			}
    }
}
