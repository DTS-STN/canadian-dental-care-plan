package ca.gov.dtsstn.cdcp.api.web.v1.controller;

import org.mapstruct.factory.Mappers;
import org.springframework.http.HttpStatus;
import org.springframework.util.Assert;
import org.springframework.validation.BindException;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import ca.gov.dtsstn.cdcp.api.config.SpringDocConfig.OAuthSecurityRequirement;
import ca.gov.dtsstn.cdcp.api.service.UserService;
import ca.gov.dtsstn.cdcp.api.web.exception.ResourceNotFoundException;
import ca.gov.dtsstn.cdcp.api.web.json.JsonPatchProcessor;
import ca.gov.dtsstn.cdcp.api.web.v1.model.UserCreateModel;
import ca.gov.dtsstn.cdcp.api.web.v1.model.UserModel;
import ca.gov.dtsstn.cdcp.api.web.v1.model.mapper.UserModelMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.json.JsonPatch;
import jakarta.validation.ConstraintViolationException;
import jakarta.validation.constraints.NotBlank;


@Validated
@RestController
@OAuthSecurityRequirement
@RequestMapping({ "/api/v1/users" })
@Tag(name = "Users", description = "Endpoint for managing user resources.")
public class UsersController {

	private final UserModelMapper userModelMapper = Mappers.getMapper(UserModelMapper.class);
	private final UserService userService;

	private final JsonPatchProcessor jsonPatchProcessor;

	public UsersController(UserService userService, JsonPatchProcessor jsonPatchProcessor) {
		Assert.notNull(userService, "userService is required; it must not be null");
		Assert.notNull(jsonPatchProcessor, "jsonPatchProcessor is required; it must not be null");
		this.userService = userService;
		this.jsonPatchProcessor = jsonPatchProcessor;
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

	@PatchMapping(path = "/{id}", consumes = "application/json-patch+json")
	@Operation(summary = "Update a user by ID")
	@ApiResponse(responseCode = "204", description = "The request has been successfully processed.")
	public void updateUserById(
			@NotBlank(message = "id must not be null or blank")
			@Parameter(description = "The id of the user.", example = "00000000-0000-0000-0000-000000000000")
			@PathVariable String id,
			@Validated @RequestBody JsonPatch patch) throws BindException {
		final var user = userService.getUserById(id)
				.orElseThrow(() -> new ResourceNotFoundException("No user with id=[%s] was found".formatted(id)));

		final var userPatchModel = userModelMapper.toPatchModel(user);

		try {
			final var userPatched = jsonPatchProcessor.patch(userPatchModel, patch);
			userService.updateUser(id, userModelMapper.toDomain(userPatched));
		}
		catch (final ConstraintViolationException constraintViolationException) {
			final var bindException = new BindException(patch, "jsonPatch");

			constraintViolationException.getConstraintViolations().forEach(constraintViolation -> {
				final var errorCode = constraintViolation.getPropertyPath().toString();
				final var message = constraintViolation.getMessage();
				bindException.reject(errorCode, message);
			});

			throw bindException;
		}
	}

	@PostMapping
	@ResponseStatus(HttpStatus.NO_CONTENT)
	@Operation(summary = "Create a new user")
	public void createUserByEmailAndUserAttributes(@Validated @RequestBody UserCreateModel userCreateModel) 
	{		
		userService.createUser(userModelMapper.toDomain(userCreateModel));
	}
}
